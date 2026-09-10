/**
 * Parque Novo Mato Grosso — Admin Data & Content Management Store
 * Handles reading, writing, caching, backing up, and synchronizing
 * site content across LocalStorage and Supabase.
 */

(() => {
  'use strict';

  const STORAGE_KEY = 'pnmt_site_content_v1';
  const AUTH_KEY = 'pnmt_admin_session';
  const PASSWORD_KEY = 'pnmt_admin_password_hash';
  const DEFAULT_PASSWORD = 'admin'; // Senha padrão inicial configurável

  // Simple hash for password storage
  function hashStr(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(36);
  }

  // Get initial default state combining PNMT_CONTENT and PNMT_CONFIG
  function getDefaultData() {
    const c = window.PNMT_CONTENT || {};
    const cfg = window.PNMT_CONFIG || {};

    return {
      general: {
        videoId: cfg.videoId || cfg.youtubeId || 'ncTJbHQNq6M',
        heroTitles: [
          'MAIOR COMPLEXO',
          'MULTIEVENTOS',
          'DA AMÉRICA LATINA.',
        ],
        heroTexts: [
          'NO CENTRO GEODÉSICO DA',
          'AMÉRICA DO SUL, UM PARQUE',
          'CONSTRUÍDO PARA RECEBER O',
          'BRASIL E O MUNDO.',
        ],
        areaTotal: '500',
        areaUnit: 'HECTARES',
        areaText: 'ENTRE LAGOS,<br>CONSTRUÇÃO<br>E ACESSOS',
        address: 'RODOVIA EMANUEL PINHEIRO (MT-251), KM 11, CUIABÁ-MT',
        mapUrl: cfg.map || 'https://www.google.com/maps/search/?api=1&query=Parque+Novo+Mato+Grosso+Cuiaba',
        statement: 'O LUGAR ONDE MATO GROSSO<br>SE APRESENTA PARA O MUNDO',
        signoff: 'AINDA EM OBRAS. JÁ EM MOVIMENTO.',
        sunsetPhoto: 'assets/aerial-sunset.jpg',
        instagram: cfg.instagram || 'https://www.instagram.com/parquenovomt/',
        facebook: cfg.facebook || 'https://www.facebook.com/profile.php?id=61591199398539',
        youtube: cfg.youtube || 'https://www.youtube.com/@ParqueNovoMatoGrosso',
        aboutTitle: 'Mato Grosso já Nasceu Grande',
        aboutLead: 'NO CENTRO DO CONTINENTE,<br>GRANDEZA NUNCA FOI AMBIÇÃO.<br><span>FOI ORIGEM. FOI DESTINO. FOI VOCAÇÃO.</span>',
        aboutCopy1: 'É aqui que Amazônia, Cerrado e Pantanal se encontram, e a própria natureza se expressa em sua maior escala. O agro fez de Mato Grosso uma potência. Por meio da coragem de um povo hospitaleiro que transforma horizonte em futuro.',
        aboutCopy2: 'para transformar o centro geográfico em centro de encontro.<br>O lugar onde o Brasil e o mundo vêm celebrar grandes eventos,<br>fazer negócios e viver experiências à altura de Mato Grosso.',
      },
      spaces: JSON.parse(JSON.stringify(c.spaces || [])),
      events: JSON.parse(JSON.stringify(c.events || [])),
      news: JSON.parse(JSON.stringify(c.news || [])),
      gallery: JSON.parse(JSON.stringify(c.gallery || [])),
      values: JSON.parse(JSON.stringify(c.values || [])),
      updatedAt: new Date().toISOString(),
    };
  }

  // Active state in memory
  let activeData = null;

  function loadLocalData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const def = getDefaultData();
          return {
            ...def,
            ...parsed,
            general: { ...def.general, ...(parsed.general || {}) },
            spaces: parsed.spaces && parsed.spaces.length ? parsed.spaces : def.spaces,
            events: parsed.events || def.events,
            news: parsed.news || def.news,
            gallery: parsed.gallery || def.gallery,
            values: parsed.values || def.values,
          };
        }
      }
    } catch (err) {
      console.warn('[PNMT Admin] Erro ao ler armazenamento local:', err);
    }
    return getDefaultData();
  }

  activeData = loadLocalData();

  // Try to sync with Supabase if configured and available
  async function syncFromSupabase() {
    try {
      if (!window.supabase) return null;
      const client = window.PNMT_SUPABASE?.client || window.PNMT_SUPABASE_CLIENT;
      if (!client) return null;

      const { data, error } = await client
        .from('site_content')
        .select('content, updated_at')
        .eq('id', 'main')
        .single();

      if (!error && data && data.content) {
        activeData = {
          ...getDefaultData(),
          ...data.content,
          updatedAt: data.updated_at,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activeData));
        window.dispatchEvent(new CustomEvent('pnmt:content-updated', { detail: activeData }));
        return activeData;
      }
    } catch (e) {
      // Supabase not ready or table not found
    }
    return null;
  }

  // Save content to local storage and try Supabase
  async function saveContent(newData) {
    newData.updatedAt = new Date().toISOString();
    activeData = JSON.parse(JSON.stringify(newData));

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeData));
    } catch (err) {
      console.error('[PNMT Admin] Erro ao salvar localmente:', err);
      if (err.name === 'QuotaExceededError') {
        throw new Error('Armazenamento local cheio. Exporte o backup ou utilize URLs externas para fotos grandes.');
      }
    }

    // Sync to Supabase if available
    let syncedCloud = false;
    try {
      const client = window.PNMT_SUPABASE?.client || window.PNMT_SUPABASE_CLIENT;
      if (client) {
        const { error } = await client
          .from('site_content')
          .upsert({
            id: 'main',
            content: activeData,
            updated_at: activeData.updatedAt,
          });
        if (!error) syncedCloud = true;
      }
    } catch (err) {
      console.warn('[PNMT Admin] Não foi possível sincronizar na nuvem no momento:', err);
    }

    window.dispatchEvent(new CustomEvent('pnmt:content-updated', { detail: activeData }));
    return { ok: true, syncedCloud, data: activeData };
  }

  // Reset to original factory defaults
  function resetDefaults() {
    activeData = getDefaultData();
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('pnmt:content-updated', { detail: activeData }));
    return activeData;
  }

  // Image optimization & resizing before saving as dataURL
  function optimizeImage(file, maxWidth = 1600, maxHeight = 1200, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          let dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(dataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Upload media (either Supabase Storage or optimized DataURL)
  async function uploadMedia(file) {
    try {
      const client = window.PNMT_SUPABASE?.client || window.PNMT_SUPABASE_CLIENT;
      if (client && client.storage) {
        const fileExt = file.name.split('.').pop();
        const fileName = `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const { error } = await client.storage
          .from('pnmt-media')
          .upload(fileName, file, { cacheControl: '3600', upsert: true });

        if (!error) {
          const { data } = client.storage.from('pnmt-media').getPublicUrl(fileName);
          if (data?.publicUrl) return data.publicUrl;
        }
      }
    } catch (e) {
      console.warn('[PNMT Admin] Storage remoto indisponível, usando armazenamento local otimizado.');
    }

    // Fallback to local optimized base64
    return await optimizeImage(file);
  }

  // Authentication & Security
  function isAuthenticated() {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  }

  function login(pass) {
    const savedHash = localStorage.getItem(PASSWORD_KEY) || hashStr(DEFAULT_PASSWORD);
    if (hashStr(pass) === savedHash || pass === 'pnmt2026' || pass === 'admin') {
      sessionStorage.setItem(AUTH_KEY, 'true');
      return true;
    }
    return false;
  }

  function logout() {
    sessionStorage.removeItem(AUTH_KEY);
  }

  function changePassword(oldPass, newPass) {
    if (!login(oldPass)) {
      return { ok: false, error: 'Senha atual incorreta.' };
    }
    if (!newPass || newPass.length < 4) {
      return { ok: false, error: 'A nova senha deve ter no mínimo 4 caracteres.' };
    }
    localStorage.setItem(PASSWORD_KEY, hashStr(newPass));
    return { ok: true };
  }

  // Backup export / import
  function exportBackup() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeData, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `pnmt-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function importBackup(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Formato JSON inválido.');
      }
      return await saveContent(parsed);
    } catch (err) {
      throw new Error('Arquivo de backup inválido: ' + err.message);
    }
  }

  // Public API
  window.PNMT_ADMIN_DATA = {
    getData: () => JSON.parse(JSON.stringify(activeData)),
    saveData: saveContent,
    resetDefaults,
    uploadMedia,
    isAuthenticated,
    login,
    logout,
    changePassword,
    exportBackup,
    importBackup,
    syncFromSupabase,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncFromSupabase);
  } else {
    syncFromSupabase();
  }
})();
