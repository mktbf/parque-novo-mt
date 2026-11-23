/**
 * Parque Novo Mato Grosso — Admin Data & Content Management Store
 * Handles reading, writing, caching, backing up, and synchronizing
 * site content across LocalStorage and Supabase.
 */

(() => {
  'use strict';

  const STORAGE_KEY = 'pnmt_site_content_v1';
  function getDefaultData() {
    const c = window.PNMT_CONTENT || {};
    const cfg = window.PNMT_CONFIG || {};

    return {
      general: {
        videoId: cfg.videoId || cfg.youtubeId || 'ZAVSkNOk-bY',
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
        address: 'ESTRADA PARQUE NOVO MATO GROSSO, S/N, CUIABÁ-MT',
        mapUrl: cfg.map || 'https://www.google.com/maps/dir/?api=1&destination=-15.4578,-56.0767',
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

    // Grava no banco. Se não gravar, avisa: o que fica só no navegador ninguém vê.
    const client = getClient();
    if (!client) {
      throw new Error('Sem conexão com o banco de dados. Nada foi publicado no site.');
    }
    const { error } = await client
      .from('site_content')
      .upsert({
        id: 'main',
        content: activeData,
        updated_at: activeData.updatedAt,
        updated_by: currentEmail(),
      });
    if (error) {
      throw new Error('Não foi possível publicar no site (' + error.message + '). Entre de novo e tente outra vez.');
    }
    const syncedCloud = true;

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

  // ==========================================================================
  // LOGIN DE VERDADE (Supabase Auth). Só entra quem tem usuário no Supabase E
  // está na tabela site_admins. A senha nunca fica no código do site.
  // ==========================================================================
  let session = null;
  let isAdmin = false;
  const authListeners = [];

  function getClient() {
    return window.PNMT_SUPABASE?.client || window.PNMT_SUPABASE_CLIENT || null;
  }

  async function checkAdmin() {
    const client = getClient();
    if (!client || !session) return false;
    const { data, error } = await client.rpc('is_site_admin');
    return !error && data === true;
  }

  const ready = (async () => {
    const client = getClient();
    if (!client) return;
    const { data } = await client.auth.getSession();
    session = data?.session || null;
    isAdmin = session ? await checkAdmin() : false;
    client.auth.onAuthStateChange((event, s) => {
      // Não chamar o Supabase direto aqui dentro (trava); espera o callback terminar.
      setTimeout(async () => {
        session = s || null;
        isAdmin = session ? await checkAdmin() : false;
        authListeners.forEach((fn) => { try { fn(event); } catch (e) {} });
      }, 0);
    });
  })().catch(() => {});

  function onAuthChange(fn) {
    authListeners.push(fn);
  }

  function isAuthenticated() {
    return !!session && isAdmin;
  }

  function currentEmail() {
    return session?.user?.email || '';
  }

  async function login(email, pass) {
    const client = getClient();
    if (!client) return { ok: false, message: 'Sem conexão com o banco de dados. Tente de novo em instantes.' };
    const { data, error } = await client.auth.signInWithPassword({ email: String(email || '').trim(), password: pass });
    if (error) {
      const msg = /invalid/i.test(error.message) ? 'E-mail ou senha incorretos.' : error.message;
      return { ok: false, message: msg };
    }
    session = data.session;
    isAdmin = await checkAdmin();
    if (!isAdmin) {
      await client.auth.signOut();
      session = null;
      return { ok: false, message: 'Este e-mail não tem permissão para editar o site.' };
    }
    return { ok: true };
  }

  async function logout() {
    const client = getClient();
    if (client) await client.auth.signOut();
    session = null;
    isAdmin = false;
  }

  async function resetPassword(email) {
    const client = getClient();
    if (!client) return { ok: false, error: 'Sem conexão com o banco de dados.' };
    const { error } = await client.auth.resetPasswordForEmail(String(email || '').trim(), {
      redirectTo: location.origin + location.pathname,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  async function setNewPassword(newPass) {
    const client = getClient();
    if (!newPass || newPass.length < 8) return { ok: false, error: 'A nova senha deve ter no mínimo 8 caracteres.' };
    const { error } = await client.auth.updateUser({ password: newPass });
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  async function changePassword(oldPass, newPass) {
    const client = getClient();
    if (!client || !session) return { ok: false, error: 'Sessão expirada. Entre de novo.' };
    const { error } = await client.auth.signInWithPassword({ email: currentEmail(), password: oldPass });
    if (error) return { ok: false, error: 'Senha atual incorreta.' };
    return setNewPassword(newPass);
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
    resetPassword,
    setNewPassword,
    onAuthChange,
    currentEmail,
    ready,
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
