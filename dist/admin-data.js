/**
 * Parque Novo Mato Grosso — Admin Data & Content Management Store
 * Handles reading, writing, caching, backing up, and synchronizing
 * site content across LocalStorage and Supabase.
 */

(() => {
  'use strict';

  const STORAGE_KEY = 'pnmt_site_content_v1';
  const AUTH_KEY = 'pnmt_admin_session_v2';
  const PASSWORD_KEY = 'pnmt_admin_password_hash_v2';
  const ATTEMPTS_KEY = 'pnmt_admin_attempts_v2';
  const SALT = 'PNMT_SEC_2026_V2$';
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutos
  const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 horas

  async function sha256(str) {
    if (window.crypto && window.crypto.subtle) {
      const buffer = new TextEncoder().encode(SALT + str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    let h1 = 0xdeadbeef, h2 = 0x41c64e6d;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    return 'fb_' + (Math.abs(h1).toString(16) + Math.abs(h2).toString(16));
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

  // Upload media (either Supabase Storage or optimized DataURL) with strict security validation
  const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
  const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  async function uploadMedia(file) {
    if (!file) throw new Error('Nenhum arquivo informado.');

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('O arquivo excede o limite máximo de 10 MB.');
    }

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new Error(`Extensão de arquivo não permitida (.${ext}). Envie apenas imagens JPG, PNG, WEBP ou GIF.`);
    }

    if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
      throw new Error(`Tipo de mídia não permitido (${file.type}). Envie apenas imagens.`);
    }

    try {
      const client = window.PNMT_SUPABASE?.client || window.PNMT_SUPABASE_CLIENT;
      if (client && client.storage) {
        const cleanName = `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const { error } = await client.storage
          .from('pnmt-media')
          .upload(cleanName, file, { cacheControl: '3600', contentType: file.type || 'image/jpeg', upsert: true });

        if (!error) {
          const { data } = client.storage.from('pnmt-media').getPublicUrl(cleanName);
          if (data?.publicUrl) return data.publicUrl;
        }
      }
    } catch (e) {
      console.warn('[PNMT Admin] Storage remoto indisponível, usando armazenamento local otimizado.');
    }

    // Fallback to local optimized base64
    return await optimizeImage(file);
  }

  // Authentication & Security with SHA-256 and brute-force lockout
  async function getStoredHash() {
    let saved = localStorage.getItem(PASSWORD_KEY);
    if (!saved) {
      saved = await sha256('pnmt2026');
      localStorage.setItem(PASSWORD_KEY, saved);
    }
    return saved;
  }

  function getAttemptsInfo() {
    try {
      const raw = localStorage.getItem(ATTEMPTS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { count: 0, lockedUntil: 0 };
  }

  function recordFailedAttempt() {
    const info = getAttemptsInfo();
    info.count = (info.count || 0) + 1;
    if (info.count >= MAX_ATTEMPTS) {
      info.lockedUntil = Date.now() + LOCKOUT_MS;
    }
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(info));
    return info;
  }

  function resetAttempts() {
    localStorage.removeItem(ATTEMPTS_KEY);
  }

  function isLocked() {
    const info = getAttemptsInfo();
    if (info.lockedUntil && info.lockedUntil > Date.now()) {
      const remainingMin = Math.ceil((info.lockedUntil - Date.now()) / 60000);
      return { locked: true, remainingMin };
    }
    if (info.lockedUntil && info.lockedUntil <= Date.now()) {
      resetAttempts();
    }
    return { locked: false };
  }

  function isAuthenticated() {
    try {
      const raw = sessionStorage.getItem(AUTH_KEY);
      if (!raw) return false;
      const session = JSON.parse(raw);
      if (session && session.auth && (Date.now() - session.timestamp < SESSION_TTL_MS)) {
        session.timestamp = Date.now();
        sessionStorage.setItem(AUTH_KEY, JSON.stringify(session));
        return true;
      }
    } catch (e) {}
    sessionStorage.removeItem(AUTH_KEY);
    return false;
  }

  async function login(pass) {
    const lock = isLocked();
    if (lock.locked) {
      return { ok: false, locked: true, message: `Muitas tentativas incorretas. Bloqueado por mais ${lock.remainingMin} minuto(s).` };
    }

    const inputHash = await sha256(pass);
    const expectedHash = await getStoredHash();

    if (inputHash === expectedHash) {
      resetAttempts();
      const session = { auth: true, timestamp: Date.now() };
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(session));
      return { ok: true };
    }

    const info = recordFailedAttempt();
    if (info.count >= MAX_ATTEMPTS) {
      return { ok: false, locked: true, message: 'Limite de 5 tentativas excedido. Painel bloqueado por 15 minutos.' };
    }

    const remaining = MAX_ATTEMPTS - info.count;
    return { ok: false, remaining, message: `Senha incorreta. Você tem mais ${remaining} tentativa(s).` };
  }

  function logout() {
    sessionStorage.removeItem(AUTH_KEY);
  }

  async function changePassword(oldPass, newPass) {
    const expectedHash = await getStoredHash();
    const oldHash = await sha256(oldPass);
    if (oldHash !== expectedHash) {
      return { ok: false, error: 'Senha atual incorreta.' };
    }
    if (!newPass || newPass.length < 8) {
      return { ok: false, error: 'A nova senha deve ter no mínimo 8 caracteres.' };
    }
    const newHash = await sha256(newPass);
    localStorage.setItem(PASSWORD_KEY, newHash);
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
      if (typeof jsonString !== 'string' || jsonString.length > 25 * 1024 * 1024) {
        throw new Error('Arquivo de backup inválido ou muito grande.');
      }
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Formato JSON inválido.');
      }
      if (!parsed.general && !parsed.spaces && !parsed.events) {
        throw new Error('O arquivo JSON não possui a estrutura esperada do PNMT.');
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
