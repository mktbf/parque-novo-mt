/**
 * Parque Novo Mato Grosso — Admin Panel Controller
 * Powers the CMS dashboard: authentication, tabs, forms, file uploads,
 * CRUD operations for spaces, events, news, gallery, and site settings.
 */

(() => {
  'use strict';

  const adminStore = window.PNMT_ADMIN_DATA;
  if (!adminStore) {
    console.error('[PNMT Admin] Módulo admin-data.js não encontrado.');
    return;
  }

  // DOM Elements
  const loginScreen = document.getElementById('admin-login-screen');
  const loginForm = document.getElementById('login-form');
  const loginPass = document.getElementById('login-pass');
  const loginError = document.getElementById('login-error');
  const adminApp = document.getElementById('admin-app');
  const btnLogout = document.getElementById('btn-logout');
  const syncStatus = document.getElementById('sync-status');
  const toast = document.getElementById('admin-toast');

  // Modals
  const modalSpace = document.getElementById('modal-space');
  const modalEvent = document.getElementById('modal-event');
  const modalNews = document.getElementById('modal-news');
  const modalPhoto = document.getElementById('modal-photo');

  // Helper: Toast alerts
  let toastTimer = null;
  function showToast(msg, type = 'success') {
    if (!toast) return;
    toast.textContent = (type === 'success' ? '✓ ' : '✕ ') + msg;
    toast.className = `admin-toast ${type}`;
    toast.style.display = 'flex';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.style.display = 'none';
    }, 4000);
  }

  // Helper: Extract YouTube ID from link or plain ID
  function extractYouTubeId(urlOrId) {
    if (!urlOrId) return '';
    const clean = urlOrId.trim();
    if (clean.length === 11 && !clean.includes('/') && !clean.includes('?')) {
      return clean;
    }
    const match = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : clean;
  }

  // Helper: Resolve asset/image preview URL
  function resolveImgUrl(val) {
    if (!val) return '';
    if (val.startsWith('data:') || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('assets/')) {
      return val;
    }
    return `assets/${val}.jpg`;
  }

  // Helper: Format Date
  function formatDateBR(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  // ==========================================================================
  // AUTHENTICATION
  // ==========================================================================
  function checkAuth() {
    if (adminStore.isAuthenticated()) {
      loginScreen.style.display = 'none';
      adminApp.style.display = 'block';
      initDashboard();
    } else {
      loginScreen.style.display = 'flex';
      adminApp.style.display = 'none';
      loginPass.focus();
    }
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    const pass = loginPass.value.trim();
    if (adminStore.login(pass)) {
      loginPass.value = '';
      checkAuth();
      showToast('Bem-vindo ao Painel de Controle!', 'success');
    } else {
      loginError.textContent = 'Senha incorreta. Tente novamente.';
      loginError.style.display = 'block';
      loginPass.select();
    }
  });

  btnLogout.addEventListener('click', () => {
    if (confirm('Deseja realmente encerrar a sessão do painel?')) {
      adminStore.logout();
      checkAuth();
      showToast('Sessão encerrada com sucesso.');
    }
  });

  // ==========================================================================
  // TAB NAVIGATION
  // ==========================================================================
  function initTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    const panes = document.querySelectorAll('.tab-pane');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        panes.forEach((p) => p.classList.remove('active'));

        tab.classList.add('active');
        const targetId = tab.dataset.tab;
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');
      });
    });
  }

  // ==========================================================================
  // DASHBOARD INITIALIZATION & POPULATION
  // ==========================================================================
  function initDashboard() {
    updateStatusIndicator();
    populateGeneral();
    populateSpaces();
    populateEvents();
    populateNews();
    populateGallery();
    populateAbout();
    initEventListeners();
  }

  function updateStatusIndicator() {
    if (!syncStatus) return;
    const client = window.PNMT_SUPABASE_CLIENT;
    if (client) {
      syncStatus.className = 'status-indicator synced';
      syncStatus.innerHTML = '<span class="status-dot"></span><span class="status-text">🟢 Sincronizado na Nuvem</span>';
    } else {
      syncStatus.className = 'status-indicator local';
      syncStatus.innerHTML = '<span class="status-dot"></span><span class="status-text">🔵 Modo Local Seguro (Navegador)</span>';
    }
  }

  // ==========================================================================
  // 1. GENERAL & HOME
  // ==========================================================================
  function populateGeneral() {
    const data = adminStore.getData();
    const g = data.general || {};

    const videoIdInput = document.getElementById('gen-video-id');
    if (videoIdInput) videoIdInput.value = g.videoId || 'ncTJbHQNq6M';
    updateVideoPreview(g.videoId || 'ncTJbHQNq6M');

    // Hero Titles
    const titles = g.heroTitles || ['MAIOR COMPLEXO', 'MULTIEVENTOS', 'DA AMÉRICA LATINA.'];
    document.getElementById('gen-hero-title-1').value = titles[0] || '';
    document.getElementById('gen-hero-title-2').value = titles[1] || '';
    document.getElementById('gen-hero-title-3').value = titles[2] || '';

    // Hero Texts
    const texts = g.heroTexts || ['NO CENTRO GEODÉSICO DA', 'AMÉRICA DO SUL, UM PARQUE', 'CONSTRUÍDO PARA RECEBER O', 'BRASIL E O MUNDO.'];
    document.getElementById('gen-hero-text-1').value = texts[0] || '';
    document.getElementById('gen-hero-text-2').value = texts[1] || '';
    document.getElementById('gen-hero-text-3').value = texts[2] || '';
    document.getElementById('gen-hero-text-4').value = texts[3] || '';

    // Area & Facts
    document.getElementById('gen-area-total').value = g.areaTotal || '500';
    document.getElementById('gen-area-unit').value = g.areaUnit || 'HECTARES';
    document.getElementById('gen-area-text').value = (g.areaText || 'ENTRE LAGOS,<br>CONSTRUÇÃO<br>E ACESSOS').replace(/<br\s*\/?>/gi, '\n');
    document.getElementById('gen-address').value = (g.address || 'RODOVIA EMANUEL PINHEIRO (MT-251), KM 11, CUIABÁ-MT').replace(/<br\s*\/?>/gi, '\n');
    document.getElementById('gen-map-url').value = g.mapUrl || '';

    // Statement & Signoff
    document.getElementById('gen-statement').value = (g.statement || 'O LUGAR ONDE MATO GROSSO<br>SE APRESENTA PARA O MUNDO').replace(/<br\s*\/?>/gi, '\n');
    document.getElementById('gen-signoff').value = g.signoff || 'AINDA EM OBRAS. JÁ EM MOVIMENTO.';

    // Sunset photo
    const sunsetInput = document.getElementById('gen-sunset-photo');
    if (sunsetInput) {
      sunsetInput.value = g.sunsetPhoto || 'assets/aerial-sunset.jpg';
      updateMediaPreview('preview-sunset-photo', g.sunsetPhoto || 'assets/aerial-sunset.jpg');
    }

    // Social
    document.getElementById('gen-instagram').value = g.instagram || '';
    document.getElementById('gen-facebook').value = g.facebook || '';
    document.getElementById('gen-youtube').value = g.youtube || '';
  }

  function updateVideoPreview(vid) {
    const box = document.getElementById('video-preview-box');
    if (!box) return;
    const cleanId = extractYouTubeId(vid);
    if (cleanId) {
      box.style.display = 'block';
      box.innerHTML = `<iframe src="https://www.youtube.com/embed/${cleanId}?controls=1" allowfullscreen></iframe>`;
    } else {
      box.style.display = 'none';
      box.innerHTML = '';
    }
  }

  function updateMediaPreview(previewId, src) {
    const el = document.getElementById(previewId);
    if (!el) return;
    const resolved = resolveImgUrl(src);
    if (resolved) {
      el.innerHTML = `<img src="${resolved}" alt="Pré-visualização" onerror="this.parentElement.innerHTML='<span class=\\'no-img\\'>Erro ao carregar imagem</span>'">`;
    } else {
      el.innerHTML = '<span class="no-img">Nenhuma foto selecionada</span>';
    }
  }

  async function saveGeneral() {
    const data = adminStore.getData();
    const g = data.general || {};

    g.videoId = extractYouTubeId(document.getElementById('gen-video-id').value);
    g.heroTitles = [
      document.getElementById('gen-hero-title-1').value.trim(),
      document.getElementById('gen-hero-title-2').value.trim(),
      document.getElementById('gen-hero-title-3').value.trim(),
    ].filter(Boolean);

    g.heroTexts = [
      document.getElementById('gen-hero-text-1').value.trim(),
      document.getElementById('gen-hero-text-2').value.trim(),
      document.getElementById('gen-hero-text-3').value.trim(),
      document.getElementById('gen-hero-text-4').value.trim(),
    ].filter(Boolean);

    g.areaTotal = document.getElementById('gen-area-total').value.trim();
    g.areaUnit = document.getElementById('gen-area-unit').value.trim();
    g.areaText = document.getElementById('gen-area-text').value.trim().replace(/\n/g, '<br>');
    g.address = document.getElementById('gen-address').value.trim().replace(/\n/g, '<br>');
    g.mapUrl = document.getElementById('gen-map-url').value.trim();

    g.statement = document.getElementById('gen-statement').value.trim().replace(/\n/g, '<br>');
    g.signoff = document.getElementById('gen-signoff').value.trim();
    g.sunsetPhoto = document.getElementById('gen-sunset-photo').value.trim();

    g.instagram = document.getElementById('gen-instagram').value.trim();
    g.facebook = document.getElementById('gen-facebook').value.trim();
    g.youtube = document.getElementById('gen-youtube').value.trim();

    data.general = g;

    try {
      await adminStore.saveData(data);
      showToast('Informações gerais salvas com sucesso!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // ==========================================================================
  // 2. ESPAÇOS (SPACES CRUD)
  // ==========================================================================
  function populateSpaces(filterQuery = '') {
    const data = adminStore.getData();
    const list = data.spaces || [];
    const countBadge = document.getElementById('badge-spaces-count');
    if (countBadge) countBadge.textContent = list.length;

    const container = document.getElementById('spaces-list');
    if (!container) return;

    const q = filterQuery.toLowerCase().trim();
    const filtered = list.filter((s) => {
      if (!q) return true;
      return (
        (s.name || '').toLowerCase().includes(q) ||
        (s.category || '').toLowerCase().includes(q) ||
        (s.tagline || '').toLowerCase().includes(q)
      );
    });

    if (!filtered.length) {
      container.innerHTML = '<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--admin-text-muted);">Nenhum espaço encontrado para a busca informada.</div>';
      return;
    }

    container.innerHTML = filtered.map((s) => `
      <div class="space-admin-card" data-id="${s.id}">
        <div class="space-card-thumb">
          <img src="${resolveImgUrl(s.image)}" alt="${s.name}" onerror="this.src='assets/aerial.png'">
          <span class="space-category-badge">${s.category || 'Atração'}</span>
        </div>
        <div class="space-card-info">
          <h4>${s.name}</h4>
          <p class="space-card-tagline">${s.tagline || 'Sem descrição resumida'}</p>
        </div>
        <div class="space-card-footer">
          <button class="btn btn-secondary btn-xs" data-action="edit-space" data-id="${s.id}">✏️ Editar</button>
          <button class="btn btn-danger-outline btn-xs" data-action="delete-space" data-id="${s.id}">🗑️ Excluir</button>
        </div>
      </div>
    `).join('');
  }

  function openSpaceModal(spaceId = null) {
    const data = adminStore.getData();
    const form = document.getElementById('form-space');
    form.reset();

    const titleEl = document.getElementById('modal-space-title');
    const origIdEl = document.getElementById('space-orig-id');
    const numbersList = document.getElementById('space-numbers-list');
    numbersList.innerHTML = '';

    if (spaceId) {
      const s = data.spaces.find((x) => x.id === spaceId);
      if (!s) return;

      titleEl.textContent = `Editar Espaço: ${s.name}`;
      origIdEl.value = s.id;
      document.getElementById('space-name').value = s.name || '';
      document.getElementById('space-id').value = s.id || '';
      document.getElementById('space-category').value = s.category || 'Esportes';
      document.getElementById('space-short').value = s.short || '';
      document.getElementById('space-tagline').value = s.tagline || '';
      document.getElementById('space-image').value = s.image || '';
      document.getElementById('space-credit').value = s.credit || '';
      document.getElementById('space-kind').value = s.kind || '';
      document.getElementById('space-texts').value = (s.text || []).join('\n\n');

      updateMediaPreview('space-image-preview', s.image);

      if (s.numbers && s.numbers.length) {
        s.numbers.forEach(([num, label]) => addSpaceNumberRow(num, label));
      }
    } else {
      titleEl.textContent = 'Adicionar Novo Espaço';
      origIdEl.value = '';
      updateMediaPreview('space-image-preview', '');
    }

    modalSpace.showModal();
  }

  function addSpaceNumberRow(num = '', label = '') {
    const list = document.getElementById('space-numbers-list');
    const row = document.createElement('div');
    row.className = 'dynamic-number-row';
    row.innerHTML = `
      <input type="text" class="space-num-val" placeholder="Ex: 90 hectares" value="${num}">
      <input type="text" class="space-num-lbl" placeholder="Ex: de circuito misto" value="${label}">
      <button type="button" class="btn btn-secondary btn-xs" onclick="this.parentElement.remove()">✕</button>
    `;
    list.appendChild(row);
  }

  async function handleSpaceSubmit(e) {
    e.preventDefault();
    const data = adminStore.getData();
    const origId = document.getElementById('space-orig-id').value;

    const id = document.getElementById('space-id').value.trim();
    const name = document.getElementById('space-name').value.trim();
    const category = document.getElementById('space-category').value;
    const short = document.getElementById('space-short').value.trim();
    const tagline = document.getElementById('space-tagline').value.trim();
    const image = document.getElementById('space-image').value.trim() || null;
    const credit = document.getElementById('space-credit').value.trim() || null;
    const kind = document.getElementById('space-kind').value.trim() || null;

    const textRaw = document.getElementById('space-texts').value.trim();
    const text = textRaw ? textRaw.split(/\n+/).map((t) => t.trim()).filter(Boolean) : [];

    // Collect numbers
    const numRows = document.querySelectorAll('#space-numbers-list .dynamic-number-row');
    const numbers = [];
    numRows.forEach((row) => {
      const v = row.querySelector('.space-num-val').value.trim();
      const l = row.querySelector('.space-num-lbl').value.trim();
      if (v || l) numbers.push([v, l]);
    });

    const spaceObj = {
      id,
      name,
      category,
      tagline,
      text,
      image,
    };
    if (short) spaceObj.short = short;
    if (credit) spaceObj.credit = credit;
    if (kind) spaceObj.kind = kind;
    if (numbers.length) spaceObj.numbers = numbers;

    if (origId) {
      const idx = data.spaces.findIndex((x) => x.id === origId);
      if (idx >= 0) {
        data.spaces[idx] = spaceObj;
      } else {
        data.spaces.push(spaceObj);
      }
    } else {
      if (data.spaces.some((x) => x.id === id)) {
        alert('Já existe um espaço com esse identificador (slug). Escolha outro.');
        return;
      }
      data.spaces.push(spaceObj);
    }

    try {
      await adminStore.saveData(data);
      modalSpace.close();
      populateSpaces();
      showToast('Espaço salvo com sucesso!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function deleteSpace(spaceId) {
    const data = adminStore.getData();
    const space = data.spaces.find((x) => x.id === spaceId);
    if (!space) return;

    if (confirm(`Tem certeza que deseja excluir o espaço "${space.name}"?`)) {
      data.spaces = data.spaces.filter((x) => x.id !== spaceId);
      try {
        await adminStore.saveData(data);
        populateSpaces();
        showToast('Espaço excluído com sucesso.');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  }

  // ==========================================================================
  // 3. AGENDA & EVENTOS (CRUD)
  // ==========================================================================
  function populateEvents() {
    const data = adminStore.getData();
    const list = data.events || [];
    const countBadge = document.getElementById('badge-events-count');
    if (countBadge) countBadge.textContent = list.length;

    const container = document.getElementById('events-table-container');
    if (!container) return;

    if (!list.length) {
      container.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--admin-text-muted);">Nenhum evento cadastrado na agenda no momento.</div>';
      return;
    }

    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Nome do Evento</th>
            <th>Categoria</th>
            <th>Local</th>
            <th>Ingressos</th>
            <th style="text-align: right;">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((e, idx) => `
            <tr>
              <td><strong>${formatDateBR(e.date)}</strong></td>
              <td><strong>${e.name}</strong></td>
              <td><span class="count-badge">${e.category}</span></td>
              <td>${e.location || '—'}</td>
              <td>${e.ticket || '—'}</td>
              <td style="text-align: right;">
                <button class="btn btn-secondary btn-xs" data-action="edit-event" data-idx="${idx}">Editar</button>
                <button class="btn btn-danger-outline btn-xs" data-action="delete-event" data-idx="${idx}">Excluir</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function openEventModal(eventIdx = null) {
    const data = adminStore.getData();
    const form = document.getElementById('form-event');
    form.reset();

    const titleEl = document.getElementById('modal-event-title');
    const origIdEl = document.getElementById('event-orig-id');

    if (eventIdx !== null && data.events[eventIdx]) {
      const e = data.events[eventIdx];
      titleEl.textContent = 'Editar Evento';
      origIdEl.value = eventIdx;
      document.getElementById('event-name').value = e.name || '';
      document.getElementById('event-category').value = e.category || '';
      document.getElementById('event-date').value = e.date || '';
      document.getElementById('event-location').value = e.location || '';
      document.getElementById('event-ticket').value = e.ticket || '';
      document.getElementById('event-url').value = e.url || '';
    } else {
      titleEl.textContent = 'Cadastrar Novo Evento';
      origIdEl.value = '';
    }
    modalEvent.showModal();
  }

  async function handleEventSubmit(e) {
    e.preventDefault();
    const data = adminStore.getData();
    data.events = data.events || [];
    const origIdx = document.getElementById('event-orig-id').value;

    const eventObj = {
      id: 'evt-' + Date.now(),
      name: document.getElementById('event-name').value.trim(),
      category: document.getElementById('event-category').value.trim(),
      date: document.getElementById('event-date').value,
      location: document.getElementById('event-location').value.trim(),
      ticket: document.getElementById('event-ticket').value.trim(),
      url: document.getElementById('event-url').value.trim() || '',
    };

    if (origIdx !== '') {
      eventObj.id = data.events[origIdx]?.id || eventObj.id;
      data.events[origIdx] = eventObj;
    } else {
      data.events.push(eventObj);
    }

    try {
      await adminStore.saveData(data);
      modalEvent.close();
      populateEvents();
      showToast('Evento salvo com sucesso!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function deleteEvent(idx) {
    const data = adminStore.getData();
    if (!data.events || !data.events[idx]) return;
    if (confirm(`Deseja excluir o evento "${data.events[idx].name}"?`)) {
      data.events.splice(idx, 1);
      try {
        await adminStore.saveData(data);
        populateEvents();
        showToast('Evento excluído com sucesso.');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  }

  // ==========================================================================
  // 4. NOTÍCIAS & IMPRENSA (CRUD)
  // ==========================================================================
  function populateNews() {
    const data = adminStore.getData();
    const list = data.news || [];
    const countBadge = document.getElementById('badge-news-count');
    if (countBadge) countBadge.textContent = list.length;

    const container = document.getElementById('news-table-container');
    if (!container) return;

    if (!list.length) {
      container.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--admin-text-muted);">Nenhuma notícia cadastrada no momento.</div>';
      return;
    }

    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Título da Notícia</th>
            <th>Veículo</th>
            <th>Categoria</th>
            <th style="text-align: right;">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((n, idx) => `
            <tr>
              <td><strong>${formatDateBR(n.date)}</strong></td>
              <td><strong>${n.title}</strong></td>
              <td>${n.source || '—'}</td>
              <td><span class="count-badge">${n.category}</span></td>
              <td style="text-align: right;">
                <button class="btn btn-secondary btn-xs" data-action="edit-news" data-idx="${idx}">Editar</button>
                <button class="btn btn-danger-outline btn-xs" data-action="delete-news" data-idx="${idx}">Excluir</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function openNewsModal(newsIdx = null) {
    const data = adminStore.getData();
    const form = document.getElementById('form-news');
    form.reset();

    const titleEl = document.getElementById('modal-news-title');
    const origIdEl = document.getElementById('news-index');

    if (newsIdx !== null && data.news[newsIdx]) {
      const n = data.news[newsIdx];
      titleEl.textContent = 'Editar Notícia';
      origIdEl.value = newsIdx;
      document.getElementById('news-title').value = n.title || '';
      document.getElementById('news-category').value = n.category || '';
      document.getElementById('news-date').value = n.date || '';
      document.getElementById('news-source').value = n.source || '';
      document.getElementById('news-url').value = n.url || '';
      document.getElementById('news-desc').value = n.description || '';
    } else {
      titleEl.textContent = 'Cadastrar Nova Notícia';
      origIdEl.value = '';
    }
    modalNews.showModal();
  }

  async function handleNewsSubmit(e) {
    e.preventDefault();
    const data = adminStore.getData();
    data.news = data.news || [];
    const origIdx = document.getElementById('news-index').value;

    const newsObj = {
      title: document.getElementById('news-title').value.trim(),
      category: document.getElementById('news-category').value.trim(),
      date: document.getElementById('news-date').value,
      source: document.getElementById('news-source').value.trim(),
      url: document.getElementById('news-url').value.trim(),
      description: document.getElementById('news-desc').value.trim(),
    };

    if (origIdx !== '') {
      data.news[origIdx] = newsObj;
    } else {
      data.news.unshift(newsObj);
    }

    try {
      await adminStore.saveData(data);
      modalNews.close();
      populateNews();
      showToast('Notícia salva com sucesso!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function deleteNews(idx) {
    const data = adminStore.getData();
    if (!data.news || !data.news[idx]) return;
    if (confirm(`Deseja excluir a matéria "${data.news[idx].title}"?`)) {
      data.news.splice(idx, 1);
      try {
        await adminStore.saveData(data);
        populateNews();
        showToast('Notícia excluída com sucesso.');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  }

  // ==========================================================================
  // 5. GALERIA DE FOTOS (CRUD)
  // ==========================================================================
  function populateGallery() {
    const data = adminStore.getData();
    const list = data.gallery || [];
    const countBadge = document.getElementById('badge-gallery-count');
    if (countBadge) countBadge.textContent = list.length;

    const container = document.getElementById('gallery-grid-container');
    if (!container) return;

    if (!list.length) {
      container.innerHTML = '<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--admin-text-muted);">Nenhuma foto cadastrada na galeria no momento.</div>';
      return;
    }

    container.innerHTML = list.map((g, idx) => `
      <div class="gallery-admin-card">
        <div class="gallery-thumb">
          <img src="${resolveImgUrl(g.image)}" alt="${g.title}" onerror="this.src='assets/aerial.png'">
        </div>
        <div class="gallery-info">
          <h5>${g.title}</h5>
          <p>${g.category} · ${g.type || 'Foto'}</p>
          <div class="gallery-actions">
            <button class="btn btn-secondary btn-xs" data-action="edit-photo" data-idx="${idx}">Editar</button>
            <button class="btn btn-danger-outline btn-xs" data-action="delete-photo" data-idx="${idx}">Excluir</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function openPhotoModal(photoIdx = null) {
    const data = adminStore.getData();
    const form = document.getElementById('form-photo');
    form.reset();

    const titleEl = document.getElementById('modal-photo-title');
    const origIdEl = document.getElementById('photo-index');

    if (photoIdx !== null && data.gallery[photoIdx]) {
      const g = data.gallery[photoIdx];
      titleEl.textContent = 'Editar Foto';
      origIdEl.value = photoIdx;
      document.getElementById('photo-image').value = g.image || '';
      document.getElementById('photo-title').value = g.title || '';
      document.getElementById('photo-category').value = g.category || 'Espaços';
      document.getElementById('photo-type').value = g.type || 'Fotografia';
      document.getElementById('photo-credit').value = g.credit || '';
      document.getElementById('photo-source').value = g.source || '';
      updateMediaPreview('photo-preview-box', g.image);
    } else {
      titleEl.textContent = 'Adicionar Nova Foto';
      origIdEl.value = '';
      updateMediaPreview('photo-preview-box', '');
    }
    modalPhoto.showModal();
  }

  async function handlePhotoSubmit(e) {
    e.preventDefault();
    const data = adminStore.getData();
    data.gallery = data.gallery || [];
    const origIdx = document.getElementById('photo-index').value;

    const photoObj = {
      image: document.getElementById('photo-image').value.trim(),
      title: document.getElementById('photo-title').value.trim(),
      category: document.getElementById('photo-category').value,
      type: document.getElementById('photo-type').value.trim(),
      credit: document.getElementById('photo-credit').value.trim(),
      source: document.getElementById('photo-source').value.trim() || undefined,
    };

    if (origIdx !== '') {
      data.gallery[origIdx] = photoObj;
    } else {
      data.gallery.push(photoObj);
    }

    try {
      await adminStore.saveData(data);
      modalPhoto.close();
      populateGallery();
      showToast('Foto salva na galeria!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function deletePhoto(idx) {
    const data = adminStore.getData();
    if (!data.gallery || !data.gallery[idx]) return;
    if (confirm(`Deseja excluir a foto "${data.gallery[idx].title}" da galeria?`)) {
      data.gallery.splice(idx, 1);
      try {
        await adminStore.saveData(data);
        populateGallery();
        showToast('Foto excluída da galeria.');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  }

  // ==========================================================================
  // 6. QUEM SOMOS & VALORES
  // ==========================================================================
  function populateAbout() {
    const data = adminStore.getData();
    const g = data.general || {};

    document.getElementById('about-title').value = g.aboutTitle || 'Mato Grosso já Nasceu Grande';
    document.getElementById('about-lead').value = (g.aboutLead || 'NO CENTRO DO CONTINENTE,\nGRANDEZA NUNCA FOI AMBIÇÃO.\nFOI ORIGEM. FOI DESTINO. FOI VOCAÇÃO.').replace(/<br\s*\/?>/gi, '\n');
    document.getElementById('about-copy-1').value = g.aboutCopy1 || '';
    document.getElementById('about-copy-2').value = (g.aboutCopy2 || '').replace(/<br\s*\/?>/gi, '\n');

    // Values
    const valuesContainer = document.getElementById('values-editor-container');
    if (!valuesContainer) return;
    const values = data.values || [];

    valuesContainer.innerHTML = values.map(([title, desc], i) => `
      <div class="value-edit-item" data-idx="${i}">
        <div class="form-group">
          <label>Valor #${i + 1} — Nome</label>
          <input type="text" class="value-title-input" value="${title}">
        </div>
        <div class="form-group">
          <label>Descrição do Valor</label>
          <textarea class="value-desc-input" rows="2">${desc}</textarea>
        </div>
      </div>
    `).join('');
  }

  async function saveAbout() {
    const data = adminStore.getData();
    data.general = data.general || {};

    data.general.aboutTitle = document.getElementById('about-title').value.trim();
    data.general.aboutLead = document.getElementById('about-lead').value.trim().replace(/\n/g, '<br>');
    data.general.aboutCopy1 = document.getElementById('about-copy-1').value.trim();
    data.general.aboutCopy2 = document.getElementById('about-copy-2').value.trim().replace(/\n/g, '<br>');

    // Collect values
    const valueItems = document.querySelectorAll('#values-editor-container .value-edit-item');
    const newValues = [];
    valueItems.forEach((item) => {
      const t = item.querySelector('.value-title-input').value.trim();
      const d = item.querySelector('.value-desc-input').value.trim();
      if (t || d) newValues.push([t, d]);
    });
    data.values = newValues;

    try {
      await adminStore.saveData(data);
      showToast('Textos institucionais e valores salvos com sucesso!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // ==========================================================================
  // EVENT LISTENERS & DELEGATION
  // ==========================================================================
  function initEventListeners() {
    initTabs();

    // General save button
    document.querySelector('[data-action="save-general"]')?.addEventListener('click', saveGeneral);
    document.querySelector('[data-action="save-about"]')?.addEventListener('click', saveAbout);

    // Video preview button
    document.getElementById('btn-preview-video')?.addEventListener('click', () => {
      const val = document.getElementById('gen-video-id').value;
      updateVideoPreview(val);
    });

    // Space modal open & add number
    document.getElementById('btn-add-space')?.addEventListener('click', () => openSpaceModal(null));
    document.getElementById('btn-add-space-number')?.addEventListener('click', () => addSpaceNumberRow());
    document.getElementById('form-space')?.addEventListener('submit', handleSpaceSubmit);

    // Event modal open & submit
    document.getElementById('btn-add-event')?.addEventListener('click', () => openEventModal(null));
    document.getElementById('form-event')?.addEventListener('submit', handleEventSubmit);

    // News modal open & submit
    document.getElementById('btn-add-news')?.addEventListener('click', () => openNewsModal(null));
    document.getElementById('form-news')?.addEventListener('submit', handleNewsSubmit);

    // Gallery modal open & submit
    document.getElementById('btn-add-photo')?.addEventListener('click', () => openPhotoModal(null));
    document.getElementById('form-photo')?.addEventListener('submit', handlePhotoSubmit);

    // Search spaces filter
    document.getElementById('search-spaces-input')?.addEventListener('input', (e) => {
      populateSpaces(e.target.value);
    });

    // File Uploads
    initFileUploads();

    // Modals close button handlers
    document.querySelectorAll('dialog [data-close]').forEach((btn) => {
      btn.addEventListener('click', () => {
        btn.closest('dialog')?.close();
      });
    });

    // Delegated actions (edit / delete)
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;

      if (action === 'edit-space') {
        openSpaceModal(btn.dataset.id);
      } else if (action === 'delete-space') {
        deleteSpace(btn.dataset.id);
      } else if (action === 'edit-event') {
        openEventModal(Number(btn.dataset.idx));
      } else if (action === 'delete-event') {
        deleteEvent(Number(btn.dataset.idx));
      } else if (action === 'edit-news') {
        openNewsModal(Number(btn.dataset.idx));
      } else if (action === 'delete-news') {
        deleteNews(Number(btn.dataset.idx));
      } else if (action === 'edit-photo') {
        openPhotoModal(Number(btn.dataset.idx));
      } else if (action === 'delete-photo') {
        deletePhoto(Number(btn.dataset.idx));
      }
    });

    // Settings: Password Change
    document.getElementById('form-change-password')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const oldP = document.getElementById('old-pass').value;
      const newP = document.getElementById('new-pass').value;
      const res = adminStore.changePassword(oldP, newP);
      if (res.ok) {
        showToast('Senha alterada com sucesso!');
        e.target.reset();
      } else {
        showToast(res.error || 'Erro ao alterar senha.', 'error');
      }
    });

    // Settings: Export Backup
    document.getElementById('btn-export-backup')?.addEventListener('click', () => {
      adminStore.exportBackup();
      showToast('Backup baixado com sucesso!');
    });

    // Settings: Import Backup
    document.getElementById('input-import-backup')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          await adminStore.importBackup(event.target.result);
          initDashboard();
          showToast('Backup restaurado com sucesso!');
        } catch (err) {
          showToast(err.message, 'error');
        }
      };
      reader.readAsText(file);
    });

    // Settings: Reset Defaults
    document.getElementById('btn-reset-defaults')?.addEventListener('click', () => {
      if (confirm('ATENÇÃO: Deseja restaurar todos os textos e espaços para os valores originais de fábrica? Todas as edições locais serão descartadas.')) {
        adminStore.resetDefaults();
        initDashboard();
        showToast('Conteúdo original de fábrica restaurado!');
      }
    });
  }

  // Setup file upload inputs with automatic preview and optimization
  function initFileUploads() {
    // Sunset photo file upload
    const sunsetFile = document.querySelector('.file-input[data-target="gen-sunset-photo"]');
    sunsetFile?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        showToast('Otimizando e enviando foto...');
        const url = await adminStore.uploadMedia(file);
        document.getElementById('gen-sunset-photo').value = url;
        updateMediaPreview('preview-sunset-photo', url);
        showToast('Foto carregada com sucesso!');
      } catch (err) {
        showToast('Erro ao carregar foto: ' + err.message, 'error');
      }
    });

    // Space photo file upload
    const spaceFile = document.getElementById('space-file-input');
    spaceFile?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        showToast('Otimizando foto do espaço...');
        const url = await adminStore.uploadMedia(file);
        document.getElementById('space-image').value = url;
        updateMediaPreview('space-image-preview', url);
        showToast('Foto carregada com sucesso!');
      } catch (err) {
        showToast('Erro ao carregar foto: ' + err.message, 'error');
      }
    });

    // Space image input manual change
    document.getElementById('space-image')?.addEventListener('input', (e) => {
      updateMediaPreview('space-image-preview', e.target.value);
    });

    // Gallery photo file upload
    const galleryFile = document.getElementById('gallery-file-input');
    galleryFile?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        showToast('Otimizando foto para a galeria...');
        const url = await adminStore.uploadMedia(file);
        document.getElementById('photo-image').value = url;
        updateMediaPreview('photo-preview-box', url);
        showToast('Foto carregada com sucesso!');
      } catch (err) {
        showToast('Erro ao carregar foto: ' + err.message, 'error');
      }
    });

    // Gallery image input manual change
    document.getElementById('photo-image')?.addEventListener('input', (e) => {
      updateMediaPreview('photo-preview-box', e.target.value);
    });
  }

  // Start on load
  document.addEventListener('DOMContentLoaded', checkAuth);
})();
