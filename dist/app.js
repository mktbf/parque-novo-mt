(() => {
  'use strict';

  // === DATA & CONFIG ===
  const data = window.PNMT_CONTENT;
  const config = window.PNMT_CONFIG;
  const main = document.getElementById('main');
  const nav = document.getElementById('primary-nav');

  let adminData = window.PNMT_ADMIN_DATA?.getData();

  function syncDataFromAdmin() {
    adminData = window.PNMT_ADMIN_DATA?.getData();
    if (adminData) {
      if (adminData.spaces && adminData.spaces.length) data.spaces = adminData.spaces;
      if (adminData.events) data.events = adminData.events;
      if (adminData.news) data.news = adminData.news;
      if (adminData.gallery) data.gallery = adminData.gallery;
      if (adminData.values) data.values = adminData.values;
      if (adminData.general) {
        const g = adminData.general;
        if (g.videoId) {
          config.videoId = g.videoId;
          config.youtubeId = g.videoId;
        }
        if (g.instagram) config.instagram = g.instagram;
        if (g.facebook) config.facebook = g.facebook;
        if (g.youtube) config.youtube = g.youtube;
        if (g.mapUrl) config.map = g.mapUrl;
      }
    }
  }
  syncDataFromAdmin();

  // === HELPER FUNCTIONS ===
  const supportsWebP = (() => {
    try {
      return document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch {
      return false;
    }
  })();

  const webpAvailable = new Set([
    'aerial', 'arena', 'circus', 'entrance', 'events',
    'footer-left', 'footer-right', 'map', 'skate', 'track',
    'wheel', 'wheel-cutout'
  ]);

  const asset = (name) => {
    if (!name) return '';
    if (typeof name === 'string' && (name.startsWith('data:image/') || name.startsWith('http://') || name.startsWith('https://') || name.startsWith('assets/'))) {
      return name;
    }
    if (window.PNMT_ASSETS?.[name]) return window.PNMT_ASSETS[name];
    if (['autodromo-real', 'corrida-real', 'aerial-real'].includes(name)) return `assets/${name}.jpg`;
    if (supportsWebP && webpAvailable.has(name)) return `assets/${name}.webp`;
    return `assets/${name}.png`;
  };

  const esc = (s) =>
    String(s ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );

  const normal = (s) =>
    String(s)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const fmt = (s) =>
    new Date(s + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const external = (url, label, cls = 'text-link') =>
    `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener">${label} â†—</a>`;

  const byId = (id) => data.spaces.find((s) => s.id === id);

  // === INITIAL DATA ENRICHMENT ===
  byId('autodromo').image = 'autodromo-real';
  byId('autodromo').credit = 'Secom-MT Â· registro de novembro de 2025';

  data.gallery.push(
    {
      image: 'autodromo-real',
      title: 'Circuito e paddock',
      category: 'Vista aÃ©rea',
      credit: 'Secom-MT Â· novembro de 2025',
      type: 'Fotografia',
      source:
        'https://pagina12.com.br/cotidiano/2025/11/13/30040-governo-de-mt-inaugura-pista-iluminada-do-autodromo-internacional-de-mato-grosso-nesta-sexta-feira14',
    },
    {
      image: 'corrida-real',
      title: 'Stock Car: uma noite histÃ³rica',
      category: 'Eventos',
      credit: 'Mayke Toscano / Secom-MT Â· novembro de 2025',
      type: 'Fotografia',
      source:
        'https://pagina12.com.br/esportes/2025/11/16/30074-ja-corri-24h-em-dubai-e-nao-vi-essa-iluminacao-nem-la-e-maravilhosa-afirma-1-campeao-da-stock-car-no-autodromo-internacional-de-mt',
    }
  );

  data.events.push({
    id: 'stock-car-2025',
    name: 'Stock Car â€” etapa de CuiabÃ¡',
    category: 'Automobilismo',
    date: '2025-11-15',
    location: 'AutÃ³dromo Internacional de Mato Grosso',
    ticket: 'Evento encerrado',
    url: 'https://www.band.com.br/esportes/automobilismo/stock-car/noticias/stock-car-etapa-de-cuiaba-202511141533',
  });

  // === APPLICATION STATE ===
  let state = {
    route: 'inicio',
    spaceFilter: 'Todos',
    spaceQuery: '',
    galleryFilter: 'Todas',
    agendaFilter: 'Todos',
    agendaPeriod: 'upcoming',
    newsFilter: 'Todos',
    selectedSpace: '',
  };

  // === UI TEMPLATES & COMPONENTS ===
  const crumb = (label) => `<p class="crumb"><a href="#inicio">PÃ¡gina inicial</a> / ${label}</p>`;

  const intro = (title, subtitle = '', label = title) =>
    `<section class="page-intro">${crumb(label)}<h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</section>`;

  const heading = (label, title, text = '') =>
    `<div class="section-head"><div><span class="kicker">${label}</span><h2>${title}</h2></div>${text ? `<p>${text}</p>` : ''}</div>`;

  const filters = (items, current, type) =>
    `<div class="filterbar" role="group" aria-label="Filtrar ${type}">${items
      .map(
        (v) =>
          `<button class="filter" data-filter="${type}" data-value="${esc(v)}" aria-pressed="${v === current}">${v}</button>`
      )
      .join('')}</div>`;

  function featured(s) {
    return `<a class="space-card" href="#espaco/${esc(s.id)}"><img src="${asset(s.image)}" alt="${esc(s.name)}" loading="lazy"><div><span class="kicker">${esc(s.category)}</span><h3>${esc(s.short || s.name)}</h3><p>${esc(s.tagline)}</p><span class="circle-arrow" aria-hidden="true">â†—</span></div></a>`;
  }

  function catalogCard(s) {
    const media = s.image
      ? `<div class="catalog-image"><img loading="lazy" decoding="async" src="${asset(s.image)}" alt="">${s.kind ? `<span class="image-note">${esc(s.kind)}</span>` : ''}</div>`
      : `<div class="catalog-image catalog-placeholder" aria-hidden="true"><img src="${asset('symbol')}" alt="" loading="lazy"><span>${esc(s.category)}</span><small>Parque Novo Mato Grosso</small></div>`;
    return `<a class="catalog-card catalog-card--portal" href="#espaco/${esc(s.id)}">${media}<div class="catalog-copy"><span class="kicker">${esc(s.category)}</span><h3>${esc(s.name)}</h3><p>${esc(s.tagline)}</p><span class="catalog-cta">Ver detalhes <span aria-hidden="true">â†—</span></span></div></a>`;
  }

  const videoBlock = () =>
    `<div class="video-section"><img src="${asset('entrance')}" alt="PÃ³rtico de entrada do parque" loading="lazy"><button data-action="video"><span class="play" aria-hidden="true">â–¶</span> Assista ao vÃ­deo de apresentaÃ§Ã£o</button></div><div class="video-caption"><p>Um novo olhar sobre Mato Grosso.</p>${external('https://www.youtube.com/watch?v=' + config.videoId, 'Assistir no YouTube', '')}</div>`;

  const visitStrip = () =>
    `<section class="visit-strip"><div><h2>Venha conhecer de perto.</h2><p>Escolas, grupos de turismo, empresas e delegaÃ§Ãµes tÃ©cnicas. Sua prÃ³xima descoberta comeÃ§a aqui.</p></div><a class="button light" href="#visitar">Planeje sua visita <span>â†—</span></a></section>`;

  function referenceCards() {
    const fixed = [
      { id: 'autodromo', image: 'track', label: 'AUTÃ“DROMO', copy: 'INTERNACIONAL<br>DE MATO GROSSO' },
      { id: 'arena-show', image: 'arena', label: 'ARENA SHOW', copy: '45 MIL MÂ² DE<br>ÃREA PARA<br>SHOWS' },
      { id: 'skate-park', image: 'skate', label: 'COMPLEXO DE SKATE', copy: 'MAIOR PISTA<br>DA AMÃ‰RICA<br>LATINA' },
      { id: 'circo-do-futuro', image: 'circus', label: 'CIRCO DO FUTURO', copy: 'TEATRO ARENA' },
      { id: 'roda-gigante', image: 'wheel', label: 'RODA-GIGANTE', copy: 'MAIOR DA<br>AMÃ‰RICA LATINA' },
      { id: 'centro-de-eventos', image: 'events', label: 'CENTRO DE EVENTOS', copy: 'A EXPERIÃŠNCIA<br>DE RECEBER<br>O MUNDO' },
    ];

    const list = [
      ...fixed,
      ...data.spaces
        .filter((s) => !fixed.some((x) => x.id === s.id))
        .map((s) => ({ id: s.id, image: s.image, label: s.name, copy: s.tagline })),
    ];

    return list
      .map(
        (s, i) =>
          `<a class="reference-space-card reference-card-${i % 6} ${s.image ? '' : 'reference-card-type'}" href="#espaco/${s.id}" aria-label="Conhecer ${esc(byId(s.id).name)}">${s.image ? `<img src="${asset(s.image)}" alt="" loading="lazy">` : ''}<div class="reference-space-card-copy"><h3>â€” ${s.label}</h3><p>${s.copy}</p></div></a>`
      )
      .join('');
  }

  // === PAGES & VIEWS ===
  function home() {
    const g = adminData?.general || {};
    const vid = config.videoId || config.youtubeId || 'ncTJbHQNq6M';
    const heroTitles = g.heroTitles || [
      'MAIOR COMPLEXO',
      'MULTIEVENTOS',
      'DA AMÃ‰RICA LATINA.',
    ];
    const heroTexts = g.heroTexts || [
      'NO CENTRO GEODÃ‰SICO DA',
      'AMÃ‰RICA DO SUL, UM PARQUE',
      'CONSTRUÃDO PARA RECEBER O',
      'BRASIL E O MUNDO.',
    ];
    const areaTotal = g.areaTotal || '500';
    const areaUnit = g.areaUnit || 'HECTARES';
    const areaText = g.areaText || 'ENTRE LAGOS,<br>CONSTRUÃ‡ÃƒO<br>E ACESSOS';
    const address = g.address || 'RODOVIA EMANUEL PINHEIRO<br>(MT-251), KM 11, CUIABÃ-MT';
    const statement = g.statement || 'O LUGAR ONDE MATO GROSSO<br>SE APRESENTA PARA O MUNDO';
    const signoff = g.signoff || 'AINDA EM OBRAS. JÃ EM MOVIMENTO.';
    const sunsetPhoto = g.sunsetPhoto || 'assets/aerial-sunset.jpg';

    return `<section class="reference-home">
  <section class="reference-hero" aria-label="ApresentaÃ§Ã£o do parque">
    <img class="hero-fallback" src="${asset('aerial-real')}" alt="Vista aÃ©rea do Parque Novo Mato Grosso">
    <div class="hero-video-wrap">
      <iframe id="hero-video" src="https://www.youtube.com/embed/${vid}?autoplay=1&mute=1&loop=1&playlist=${vid}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&cc_load_policy=3&cc_lang_pref=none&disablekb=1&fs=0&enablejsapi=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen title="VÃ­deo institucional do Parque Novo Mato Grosso"></iframe>
    </div>
    <button class="hero-play-overlay" data-action="video" aria-label="Assistir ao vÃ­deo completo com Ã¡udio">
      <span class="hero-play-circle" title="Clique para assistir ao vÃ­deo completo com Ã¡udio">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="white" aria-hidden="true"><polygon points="6,4 20,12 6,20"/></svg>
      </span>
      <span class="hero-play-badge">
        <span class="play-mini-icon">â–¶</span> Assistir com Ã¡udio
      </span>
    </button>
    <button class="hero-sound-btn" data-action="toggle-sound" aria-label="Ativar som">
      <span class="sound-icon" aria-hidden="true">ðŸ”‡</span> <span class="sound-label">Ativar som</span>
    </button>
    <h1 class="reference-hero-title">
      ${heroTitles.map((t) => `<span>${esc(t)}</span>`).join('\n      ')}
    </h1>
    <p class="reference-hero-text">
      ${heroTexts.map((t) => `<span>${esc(t)}</span>`).join('\n      ')}
    </p>
  </section>
  <section class="reference-facts" aria-label="Ãrea e localizaÃ§Ã£o"><div class="reference-area"><span>ÃREA TOTAL:</span><strong>${esc(areaTotal)}</strong><small>${esc(areaUnit)}</small></div><p class="reference-area-text">${areaText}</p><div class="reference-address"><svg viewBox="0 0 30 38" width="34" height="43" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 35S3 21 3 13a12 12 0 0 1 24 0c0 8-12 22-12 22Z"/><circle cx="15" cy="13" r="4"/></svg><p>${address}</p></div></section>
  <section class="reference-spaces" aria-label="EspaÃ§os do parque"><h2><strong>Cada espaÃ§o</strong> nasce com <strong>um propÃ³sito.</strong></h2><p>ConheÃ§a o que estÃ¡ sendo construÃ­do</p><div class="reference-carousel" role="region" aria-roledescription="carousel" aria-label="Carrossel de espaÃ§os do complexo"><button class="reference-carousel-arrow" data-action="spaces-previous" aria-label="EspaÃ§os anteriores">â€¹</button><div class="reference-carousel-window" id="reference-space-window" tabindex="0" aria-label="Navegue pelos espaÃ§os com as setas do teclado ou deslizando"><div class="reference-space-track">${referenceCards()}</div></div><button class="reference-carousel-arrow" data-action="spaces-next" aria-label="PrÃ³ximos espaÃ§os">â€º</button></div></section>
  <div class="reference-statement"><p>${statement}</p></div>
  <div class="reference-closing">
    <p class="reference-signoff">${signoff}</p>
    <figure class="reference-aerial-panoramic"><img src="${asset(sunsetPhoto)}" alt="Vista aÃ©rea do Parque Novo Mato Grosso ao pÃ´r do sol" loading="lazy"></figure>
  </div>
</section>
`;
  }

  function about() {
    const g = adminData?.general || {};
    const aboutTitle = g.aboutTitle || 'O Novo ComeÃ§a Aqui';
    const aboutLead = g.aboutLead || 'NO CENTRO GEODÃ‰SICO DA AMÃ‰RICA DO SUL,<br>A NATUREZA E A INOVAÃ‡ÃƒO SE ENCONTRAM.<br><span>AQUI, MATO GROSSO SE APRESENTA PARA O MUNDO.</span>';
    const aboutCopy1 = g.aboutCopy1 || 'O Parque Novo Mato Grosso Ã© um marco onde a grandeza de nossa terra se revela em sua maior escala. Com aproximadamente 500 hectares â€” sendo 130 hectares de espelho d\'Ã¡gua e 330 hectares de infraestrutura construÃ­da â€” este Ã© o maior parque multieventos da AmÃ©rica Latina.';
    const aboutCopy2 = g.aboutCopy2 || 'para celebrar o esporte, a cultura, os negÃ³cios e o lazer.<br>O complexo transforma o coraÃ§Ã£o do continente no ponto de encontro do Brasil e do mundo,<br>oferecendo uma experiÃªncia monumental Ã  altura da vocaÃ§Ã£o do estado.';

    return `<section class="reference-about">
      <section class="reference-about-title">
        <h1>${esc(aboutTitle)}</h1>
        <p><a href="#inicio">PÃ¡gina Principal</a> / Quem Somos</p>
      </section>
      <section class="reference-origin">
        <div class="reference-origin-heading">
          <h2>${aboutLead}</h2>
        </div>
        <div class="reference-origin-copy">
          <p>${aboutCopy1}</p>
          <p><strong>FOI DESSA GRANDEZA QUE NASCEU O PARQUE NOVO MATO GROSSO:</strong></p>
          <p>${aboutCopy2}</p>
        </div>
        <img class="reference-map" src="${asset('map')}" alt="Mato Grosso, sua natureza e sua produÃ§Ã£o">
        <img class="reference-wheel" src="${asset('wheel-cutout')}" alt="Roda-gigante, imagem de referÃªncia da proposta">
      </section>
      <figure class="reference-about-aerial">
        <img src="${asset('aerial')}" alt="Vista panorÃ¢mica do Parque Novo Mato Grosso">
      </figure>
    </section>`;
  }

  function spacesPage() {
    return `<section class="page-intro spaces-intro">${crumb('ConheÃ§a os espaÃ§os')}<div class="spaces-intro-row"><div><h1>ConheÃ§a os espaÃ§os</h1><p>Explore o mapa e descubra o que vocÃª pode viver no parque.</p></div><div class="spaces-shortcuts" role="group" aria-label="Explorar os espaÃ§os"><button type="button" data-pnmt-jump="mapa">Explorar o mapa <span aria-hidden="true">â†“</span></button><button type="button" data-pnmt-jump="catalogo">Ver todos os espaÃ§os <span aria-hidden="true">â†“</span></button></div></div></section>
      <section class="wrap spaces-catalog" id="catalogo-espacos" aria-labelledby="catalog-title"><div class="catalog-tools"><div><span class="kicker">ENCONTRE SUA PRÃ“XIMA EXPERIÃŠNCIA</span><h2 id="catalog-title">Qual espaÃ§o vocÃª quer conhecer?</h2><p>Escolha uma categoria ou busque pelo nome.</p></div><div class="catalog-search"><label for="space-search">Buscar um espaÃ§o</label><input id="space-search" type="search" placeholder="Ex.: autÃ³dromo, arena, skateâ€¦" value="${esc(state.spaceQuery)}" aria-controls="space-results" autocomplete="off"></div></div>${filters(['Todos', 'Esportes', 'Eventos', 'Cultura', 'FamÃ­lia', 'ExperiÃªncias', 'ConvivÃªncia'], state.spaceFilter, 'espaÃ§os')}<div class="catalog-results-bar"><p class="result-count" id="space-count" aria-live="polite" aria-atomic="true"></p><button type="button" id="clear-space-filters" data-action="reset-spaces" hidden>Limpar busca e filtros</button></div><div class="catalog-grid" id="space-results"></div></section>${visitStrip()}`;
  }

  function updateSpaces() {
    const list = data.spaces.filter(
      (s) =>
        (state.spaceFilter === 'Todos' || s.category === state.spaceFilter) &&
        normal(s.name + ' ' + s.tagline).includes(normal(state.spaceQuery))
    );

    document.getElementById('space-count').textContent = `${list.length} ${
      list.length === 1 ? 'espaÃ§o encontrado' : 'espaÃ§os encontrados'
    }`;

    const clearFilters = document.getElementById('clear-space-filters');
    if (clearFilters) clearFilters.hidden = !state.spaceQuery && state.spaceFilter === 'Todos';

    document.getElementById('space-results').innerHTML = list.length
      ? list.map(catalogCard).join('')
      : `<div class="empty-state"><h3>Vamos encontrar outro caminho?</h3><p>Nenhum espaÃ§o corresponde Ã  busca. Tente outro nome ou categoria.</p><button class="button secondary" data-action="reset-spaces">Limpar filtros</button></div>`;
  }

  function detail(id) {
    const s = byId(id);
    if (!s) return notFound();

    const hero = s.image
      ? `<section class="space-hero"><img src="${asset(s.image)}" alt="${esc(s.name)}"><div class="space-hero-copy">${crumb(`<a href="#espacos">EspaÃ§os</a> / ${esc(s.name)}`)}<span class="kicker">${esc(s.category)}</span><h1>${esc(s.name)}</h1><p class="image-note">${esc(s.credit || s.kind || 'Imagem da proposta do parque')}</p></div></section>`
      : intro(esc(s.name), esc(s.tagline), `<a href="#espacos">EspaÃ§os</a> / ${esc(s.name)}`);

    let related = data.spaces.filter((x) => x.category === s.category && x.id !== s.id).slice(0, 3);
    if (!related.length) related = data.spaces.filter((x) => x.id !== s.id).slice(0, 3);

    return (
      hero +
      `<section class="wrap detail-layout"><article class="prose">${s.id === 'autodromo' ? `<img class="endorsement" src="${asset('autodromo-logo')}" alt="AutÃ³dromo Internacional de Mato Grosso â€” submarca do parque">` : ''}${s.image ? `<h2>${esc(s.tagline)}</h2>` : ''}${s.text.map((p) => `<p>${esc(p)}</p>`).join('')}${s.numbers ? `<div class="detail-numbers">${s.numbers.map((n) => `<div><strong>${esc(n[0])}</strong><p>${esc(n[1])}</p></div>`).join('')}</div>` : ''}</article><aside class="detail-aside"><span class="kicker">SUA PRÃ“XIMA EXPERIÃŠNCIA</span><h3>Viva o parque de perto.</h3><p>Visitas mediante agendamento e confirmaÃ§Ã£o das Ã¡reas liberadas.</p><a class="button" href="#visitar">Quero visitar <span>â†—</span></a><a class="button secondary" href="#evento/${esc(s.id)}">Realize seu evento <span>â†—</span></a><a class="text-link" href="#agenda">Confira a agenda â†—</a></aside></section><section class="related"><div class="wrap">${heading('CONTINUE EXPLORANDO', 'Outros espaÃ§os.<br>Novas descobertas.')}<div class="catalog-grid">${related.map(catalogCard).join('')}</div></div></section>`
    );
  }

  // === FORM BUILDERS ===
  const field = (name, label, type = 'text', options, isRequired = true) =>
    `<label class="field">${label}${isRequired ? ' *' : ' <small style="font-weight:400;opacity:0.75">(opcional)</small>'}${options ? `<select name="${name}" ${isRequired ? 'required' : ''}><option value="">Selecione</option>${options.map((o) => `<option value="${esc(typeof o === 'string' ? o : o.id)}" ${state.selectedSpace === (o.id || o) ? 'selected' : ''}>${typeof o === 'string' ? o : o.name}</option>`).join('')}</select>` : type === 'textarea' ? `<textarea name="${name}" ${isRequired ? 'required' : ''} maxlength="4000"></textarea>` : `<input name="${name}" type="${type}" ${isRequired ? 'required' : ''} ${type === 'date' ? `min="${today()}"` : ''} ${type === 'number' ? 'min="1" max="1000000"' : type === 'tel' ? 'autocomplete="tel" minlength="8" maxlength="25"' : type === 'email' ? 'autocomplete="email" maxlength="254"' : 'maxlength="200"'}>`}</label>`;

  const formEnd = (kind, label) =>
    `<input type="text" name="_gotcha_honey" style="display:none !important; opacity:0; position:absolute; left:-9999px;" tabindex="-1" autocomplete="off" aria-hidden="true"><label class="check full"><input type="checkbox" name="consentimento" required><span>Autorizo o uso dos dados informados para atendimento desta solicitaÃ§Ã£o conforme as diretrizes de privacidade.</span></label><p class="form-note full">${(kind === 'newsletter' ? config.newsletterEndpoint : config.formsEndpoint) ? 'O envio serÃ¡ confirmado nesta pÃ¡gina.' : 'Nesta versÃ£o de apresentaÃ§Ã£o, vocÃª pode preencher e gerar uma cÃ³pia da solicitaÃ§Ã£o. Os dados nÃ£o sÃ£o enviados ao parque.'}</p><div class="form-actions full"><button class="button" type="submit">${(kind === 'newsletter' ? config.newsletterEndpoint : config.formsEndpoint) ? label : 'Preparar solicitaÃ§Ã£o'} <span>â†—</span></button><p class="form-status" role="status"></p></div>`;

  function newsletter(topic) {
    return `<section class="newsletter"><div><span class="kicker">FIQUE POR PERTO</span><h3>${topic === 'galeria' ? 'NÃ£o perca o prÃ³ximo capÃ­tulo.' : 'NÃ£o encontrou o que procura?'}</h3><p>${topic === 'galeria' ? 'Acompanhe os novos registros do parque.' : 'Escolha o que vocÃª quer viver e deixe seu interesse registrado.'}</p></div><form data-form="newsletter"><input type="hidden" name="origem" value="${topic}">${field('nome', 'Seu nome')}${field('email', 'Seu e-mail', 'email')}${field('interesse', 'Tenho interesse em', 'text', ['Todos', 'Shows e MÃºsica', 'Automobilismo', 'Esporte', 'Cultura e FamÃ­lia', 'Corporativo', 'AgroPlace', 'Galeria'])}${formEnd('newsletter', 'Quero ser avisado')}</form></section>`;
  }

  // === AGENDA ===
  function agenda() {
    return (
      intro(
        'O que estÃ¡ por vir.',
        'Shows, corridas, campeonatos, feiras e eventos culturais. Escolha o que vocÃª quer viver.',
        'Agenda'
      ) +
      `<section class="wrap">${filters(['Todos', 'Shows e MÃºsica', 'Automobilismo', 'Esporte', 'Cultura e FamÃ­lia', 'Corporativo', 'AgroPlace'], state.agendaFilter, 'agenda')}<div class="filterbar" role="group" aria-label="PerÃ­odo dos eventos"><button class="filter" data-period="upcoming" aria-pressed="${state.agendaPeriod === 'upcoming'}">PrÃ³ximos eventos</button><button class="filter" data-period="past" aria-pressed="${state.agendaPeriod === 'past'}">JÃ¡ aconteceu</button></div><div id="event-results" aria-live="polite"></div>${newsletter('agenda')}</section>`
    );
  }

  function updateAgenda() {
    const list = data.events.filter(
      (e) =>
        (state.agendaFilter === 'Todos' || e.category === state.agendaFilter) &&
        (state.agendaPeriod === 'past' ? e.date < today() : e.date >= today())
    );

    document.getElementById('event-results').innerHTML = list.length
      ? list
          .map(
            (e) =>
              `<article class="event-card"><div class="event-date">${fmt(e.date)}</div><div><span class="kicker">${esc(e.category)}</span><h3>${esc(e.name)}</h3><p>${esc(e.location)}</p><p>${esc(e.ticket)}</p>${external(e.url, 'Ver informaÃ§Ãµes na fonte')}${e.date >= today() ? `<button class="button secondary" data-calendar="${esc(e.id)}">Salvar no calendÃ¡rio</button>` : ''}</div></article>`
          )
          .join('')
      : `<div class="empty-state"><span class="kicker">${state.agendaPeriod === 'past' ? 'MEMÃ“RIAS DO PARQUE' : 'NOVOS ENCONTROS VÃŠM AÃ'}</span><h3>${state.agendaPeriod === 'past' ? 'Nenhum registro nesta categoria.' : 'A prÃ³xima experiÃªncia estÃ¡ a caminho.'}</h3><p>${state.agendaPeriod === 'past' ? 'Escolha outra categoria para explorar os eventos registrados.' : 'Ainda nÃ£o hÃ¡ datas cadastradas nesta seleÃ§Ã£o. Acompanhe os canais oficiais para a programaÃ§Ã£o confirmada.'}</p>${external(config.instagram, 'Acompanhe o parque', 'button secondary')}</div>`;
  }

  // === IMPRENSA / NEWS ===
  function press() {
    return (
      intro(
        'O parque em movimento.',
        'Jornalistas, veÃ­culos e produtores encontram aqui informaÃ§Ãµes para contar essa histÃ³ria com precisÃ£o.',
        'Imprensa'
      ) +
      `<section class="wrap">${heading('NOTÃCIAS E COBERTURA', 'O que acontece<br>ganha o mundo.', 'Obras, eventos, automobilismo, esporte, cultura e institucional. Explore as coberturas publicadas.')}${filters(['Todos', 'Obras', 'Automobilismo'], state.newsFilter, 'notÃ­cias')}<div class="article-grid" id="news-results"></div><div class="kit"><div><span class="kicker">KIT DE IMPRENSA</span><h3>Material para conhecer a marca.</h3><p>Logos extraÃ­dos do manual, ficha institucional, crÃ©ditos e orientaÃ§Ãµes. Confira o conteÃºdo e as condiÃ§Ãµes de uso no pacote.</p></div><a class="button light" href="${config.kit}" download>Baixar kit de imprensa <span>â†“</span></a></div></section><section class="related"><div class="wrap service-layout"><div class="service-copy"><span class="kicker">FALE COM A ASSESSORIA</span><h2>Pauta, entrevista<br>e credenciamento.</h2><p>SolicitaÃ§Ãµes de entrevista, agendamento de visita tÃ©cnica e credenciamento para eventos passam por aqui.</p><p>A equipe responde em atÃ© dois dias Ãºteis apÃ³s o recebimento.</p></div><div class="service-form"><h3>Qual Ã© a sua pauta?</h3><form data-form="imprensa">${field('nome', 'Nome')}${field('veiculo', 'VeÃ­culo')}${field('editoria', 'Editoria', 'text', null, false)}${field('telefone', 'Telefone', 'tel')}${field('email', 'E-mail', 'email')}${field('tipo', 'Tipo de solicitaÃ§Ã£o', 'text', ['Entrevista', 'Visita tÃ©cnica', 'Credenciamento', 'InformaÃ§Ãµes'])}${field('prazo', 'Prazo de fechamento', 'date', null, false)}<div class="full">${field('mensagem', 'Mensagem', 'textarea')}</div>${formEnd('imprensa', 'Enviar solicitaÃ§Ã£o')}</form></div></div></section>`
    );
  }

  function updateNews() {
    document.getElementById('news-results').innerHTML = data.news
      .filter((n) => state.newsFilter === 'Todos' || state.newsFilter === n.category)
      .map(
        (n) =>
          `<article class="news-item"><small>${n.category} Â· ${fmt(n.date)} Â· ${n.source}</small><h3>${n.title}</h3><p>${n.description}</p>${external(n.url, 'Leia a cobertura')}</article>`
      )
      .join('');
  }

  // === GALERIA ===
  function gallery() {
    return (
      intro(
        'O parque que estÃ¡ nascendo.',
        'Cada imagem Ã© um capÃ­tulo em construÃ§Ã£o. Acompanhe de perto o que estÃ¡ sendo erguido para Mato Grosso e para o mundo.',
        'Galeria de fotos'
      ) +
      `<section class="wrap">${filters(['Todas', 'Obras e estrutura', 'Vista aÃ©rea', 'Eventos', 'EspaÃ§os', 'Gente'], state.galleryFilter, 'galeria')}<div class="gallery-grid" id="gallery-results" aria-live="polite"></div><div class="section-bottom"><p>Fotografias e perspectivas identificadas. CrÃ©ditos e fontes acompanham cada imagem.</p><a class="text-link" href="#imprensa">Acesse o kit de imprensa â†—</a></div>${newsletter('galeria')}</section>`
    );
  }

  function updateGallery() {
    const entries = data.gallery
      .map((g, i) => ({ ...g, index: i }))
      .filter((g) => state.galleryFilter === 'Todas' || g.category === state.galleryFilter);

    document.getElementById('gallery-results').innerHTML = entries.length
      ? entries
          .map(
            (g) =>
              `<button class="gallery-item" data-photo="${g.index}" aria-label="Ampliar ${g.title}"><img loading="lazy" src="${asset(g.image)}" alt="${g.title}"><strong>${g.title} â†—</strong><small>${g.type} Â· ${g.credit}</small></button>`
          )
          .join('')
      : `<div class="empty-state"><h3>Novos capÃ­tulos em breve.</h3><p>Ainda nÃ£o hÃ¡ fotos publicadas nesta coleÃ§Ã£o. Explore as outras categorias.</p><button class="button secondary" data-filter="galeria" data-value="Todas">Ver todas as imagens</button></div>`;
  }

  // === VISITAS ===
  function visits() {
    return (
      intro(
        'Venha conhecer de perto.',
        'O parque abre as portas para grupos que querem ver, entender e viver o que estÃ¡ sendo construÃ­do no centro geodÃ©sico da AmÃ©rica do Sul.',
        'Quero visitar'
      ) +
      `<section class="wrap">${heading('VISITAS GUIADAS', 'Um roteiro.<br>Muitas descobertas.', 'Acompanhamento da nossa equipe do comeÃ§o ao fim, pelas principais estruturas e Ã¡reas liberadas.')}<div class="service-cards"><article class="service-card"><span class="kicker">GRUPOS ESCOLARES</span><h3>Uma aula a cÃ©u aberto.</h3><p>Estudantes do ensino fundamental, mÃ©dio e tÃ©cnico percorrem o parque com foco em arquitetura, sustentabilidade, agro, esporte e cultura.</p><p>AgroPlace, museus e grandes estruturas compÃµem a proposta de roteiro, conforme liberaÃ§Ã£o das Ã¡reas e faixa etÃ¡ria.</p></article><article class="service-card"><span class="kicker">GRUPOS DE TURISMO</span><h3>Mato Grosso em um sÃ³ lugar.</h3><p>Operadoras, agÃªncias e caravanas encontram um roteiro que reÃºne atraÃ§Ãµes do estado dentro do mesmo complexo.</p><p>Mirantes, Vila das NaÃ§Ãµes, Casa Cuiabana e arenas, com paradas para foto e alimentaÃ§Ã£o, conforme disponibilidade.</p></article><article class="service-card"><span class="kicker">GRUPOS CORPORATIVOS E TÃ‰CNICOS</span><h3>Por dentro da operaÃ§Ã£o.</h3><p>Empresas, entidades e delegaÃ§Ãµes tÃ©cnicas conhecem arenas, backstage, acessos, estacionamento e capacidade operacional.</p><p>A visita indicada para quem avalia realizar um evento no parque.</p></article></div></section><section class="related"><div class="wrap service-layout"><div class="service-copy"><span class="kicker">COMO FUNCIONA</span><h2>Simples de organizar.</h2><div class="service-steps"><p>Conte sobre o grupo e indique a data pretendida.</p><p>A equipe verifica disponibilidade, roteiro e grupo mÃ­nimo.</p><p>Com a confirmaÃ§Ã£o, vocÃª recebe as orientaÃ§Ãµes de acesso.</p></div><div class="faq"><details open><summary>O que levar?</summary><p>CalÃ§ado confortÃ¡vel, protetor solar e Ã¡gua. Boa parte do roteiro Ã© ao ar livre.</p></details><details><summary>Quais Ã¡reas fazem parte da visita?</summary><p>O parque estÃ¡ em obras em vÃ¡rios setores. O percurso segue sempre as Ã¡reas liberadas com seguranÃ§a e Ã© confirmado pela equipe.</p></details><details><summary>Como chegam Ã´nibus e vans?</summary><p>Estacionamento sinalizado para Ã´nibus e vans, com acesso direto pela rodovia.</p></details></div></div><div class="service-form"><h3>Planeje sua visita.</h3><p>A solicitaÃ§Ã£o estÃ¡ sujeita Ã  confirmaÃ§Ã£o de data e roteiro pela equipe.</p><form data-form="visita">${field('nome', 'Nome do responsÃ¡vel')}${field('instituicao', 'InstituiÃ§Ã£o ou empresa', 'text', null, false)}${field('grupo', 'Tipo de grupo', 'text', ['Escolar', 'Turismo', 'Corporativo ou tÃ©cnico'])}${field('quantidade', 'Quantidade de pessoas', 'number')}${field('faixaEtaria', 'Faixa etÃ¡ria', 'text', null, false)}${field('data', 'Data pretendida', 'date')}${field('telefone', 'Telefone', 'tel')}${field('email', 'E-mail', 'email')}<div class="full">${field('observacoes', 'ObservaÃ§Ãµes', 'textarea', null, false)}</div>${formEnd('visita', 'Agendar minha visita')}</form></div></div></section>`
    );
  }

  // === EVENTOS & CONTATO ===
  function eventForm() {
    const eventSpaces = [
      { id: 'orientacao', name: 'â€” Preciso de orientaÃ§Ã£o da equipe â€”' },
      { id: 'arena-show', name: 'Arena Show (AtÃ© 120 mil pessoas)' },
      { id: 'centro-de-eventos', name: 'Centro de Eventos (5 pavilhÃµes, atÃ© 26 mil pessoas)' },
      { id: 'autodromo', name: 'AutÃ³dromo Internacional' },
      { id: 'circo-do-futuro', name: 'Teatro de Arena / Circo do Futuro' },
      { id: 'agroplace', name: 'Agroplace' },
      { id: 'arenas-beach', name: 'Quadras de Areia' },
      { id: 'skate-park', name: 'Complexo de Skate' },
      { id: 'kartodromo', name: 'CartÃ³dromo' },
      { id: 'outro', name: 'Outro espaÃ§o do parque' },
    ];
    return `<div class="service-form"><h3>Vamos construir seu evento.</h3><form data-form="evento">${field('nome', 'Nome')}${field('empresa', 'Empresa ou instituiÃ§Ã£o', 'text', null, false)}${field('telefone', 'Telefone', 'tel')}${field('email', 'E-mail', 'email')}${field('tipo', 'Tipo de evento', 'text', ['Show', 'Feira', 'Congresso ou convenÃ§Ã£o', 'CompetiÃ§Ã£o esportiva', 'Encontro corporativo', 'Outro'])}${field('espaco', 'EspaÃ§o desejado', 'text', eventSpaces)}${field('publico', 'PÃºblico estimado', 'number')}${field('data', 'Data pretendida', 'date')}<div class="full">${field('mensagem', 'Conte sobre o evento', 'textarea', null, false)}</div>${formEnd('evento', 'Enviar solicitaÃ§Ã£o')}</form></div>`;
  }

  // === MAPA INTERATIVO (PÃGINA DEDICADA) ===
  function mapPage() {
    return `<section class="map-page-section">
      <div class="map-page-header">
        ${crumb('Mapa Interativo')}
        <div class="map-page-title-row">
          <div>
            <h1>Explore o Parque em Perspectiva</h1>
            <p>Visualizador interativo em 2.5D baseado na Planta de ImplantaÃ§Ã£o Oficial R81 Â· 500 Hectares em CuiabÃ¡-MT</p>
          </div>
          <div class="map-page-top-actions">
            <a href="#espacos" class="button secondary">CatÃ¡logo de EspaÃ§os</a>
            <a href="#contato?tipo=evento" class="button cta-primary">Realize seu evento</a>
          </div>
        </div>
      </div>
      <div class="map-interactive-container" id="map-interactive-container"></div>
    </section>`;
  }

  function eventMapCard() {
    return `
      <div class="event-map-card">
        <div class="event-map-header">
          <div class="event-map-kicker-row">
            <span class="event-map-badge">EXPLORE O PARQUE</span>
            <span class="event-map-live-tag"><span class="event-map-live-dot"></span> 21 ESPAÃ‡OS</span>
          </div>
          <h3>Mapa Geral do Complexo</h3>
          <p>ConheÃ§a a distribuiÃ§Ã£o dos polos de eventos, shows, convenÃ§Ãµes e competiÃ§Ãµes.</p>
        </div>

        <a href="#mapa" class="event-map-preview" title="Abrir visualizador interativo em perspectiva 3D" aria-label="Abrir mapa interativo do Parque Novo Mato Grosso">
          <img src="assets/aerial-real.jpg" alt="Fotografia aÃ©rea do Parque Novo Mato Grosso" loading="lazy" width="600" height="400">
          
          <div class="event-map-overlay">
            <span class="event-map-overlay-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              Explorar Mapa Interativo 3D
            </span>
          </div>
        </a>

        <div class="event-venues-pills">
          <div class="venue-pill">
            <span class="venue-pill-icon">ðŸŸï¸</span>
            <div class="venue-pill-info">
              <span class="venue-pill-name">Arena Show</span>
              <span class="venue-pill-cap">AtÃ© 120 mil pessoas</span>
            </div>
          </div>
          <div class="venue-pill">
            <span class="venue-pill-icon">ðŸ›ï¸</span>
            <div class="venue-pill-info">
              <span class="venue-pill-name">Centro de Eventos</span>
              <span class="venue-pill-cap">5 pavilhÃµes Â· 26 mil</span>
            </div>
          </div>
          <div class="venue-pill">
            <span class="venue-pill-icon">ðŸŽï¸</span>
            <div class="venue-pill-info">
              <span class="venue-pill-name">AutÃ³dromo</span>
              <span class="venue-pill-cap">3.500m padrÃ£o FIA</span>
            </div>
          </div>
        </div>

        <div class="event-map-footer">
          <a href="#mapa" class="event-map-cta-btn">
            <span>Explorar no Mapa 3D</span>
            <span class="arrow">â†’</span>
          </a>
          <a href="${config.map}" target="_blank" rel="noopener" class="event-map-geo-link" title="Abrir localizaÃ§Ã£o no Google Maps">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>MT-251, km 11 Â· Como chegar</span>
          </a>
        </div>
      </div>
    `;
  }

  function contact(event = false) {
    return (
      intro(
        event ? 'Seu prÃ³ximo grande evento.' : 'Fale com o parque.',
        'Cada assunto tem um caminho direto. Escolha o que vocÃª precisa.',
        'Contato'
      ) +
      `<section class="wrap service-layout"><div class="service-copy"><span class="kicker">QUERO REALIZAR MEU EVENTO</span><h2>Shows, feiras,<br>competiÃ§Ãµes e<br>grandes encontros.</h2><p>Conte o que vocÃª quer fazer. A nossa equipe retorna com a melhor estrutura para o seu formato, do espaÃ§o Ã  operaÃ§Ã£o.</p><p>Retorno previsto em atÃ© dois dias Ãºteis apÃ³s o recebimento.</p>${eventMapCard()}</div>${eventForm()}</section><section class="wrap" style="padding-top:0"><h2>Outros caminhos.</h2><div class="contact-paths"><a href="#visitar"><h3>Quero visitar o parque.</h3><p>Visitas guiadas para grupos escolares, de turismo e corporativos.</p><span>Ir para visitas â†—</span></a><a href="#imprensa"><h3>Pauta e entrevista.</h3><p>SolicitaÃ§Ãµes da imprensa e acesso ao material oficial.</p><span>Ir para imprensa â†—</span></a><a href="#outros-assuntos"><h3>Vamos conversar.</h3><p>Fornecedores, propostas comerciais, parcerias e assuntos institucionais.</p><span>Outros assuntos â†—</span></a></div></section>`
    );
  }

  function otherContact() {
    return (
      intro('Vamos conversar.', 'Fornecedores, parcerias e institucional.', 'Outros assuntos') +
      `<section class="wrap service-layout"><div class="service-copy"><h2>Novas conexÃµes<br>comeÃ§am aqui.</h2><p>Propostas comerciais, parcerias e assuntos institucionais tambÃ©m chegam por este canal.</p>${external(config.instagram, 'Acompanhe o parque')}</div><div class="service-form"><h3>Como podemos ajudar?</h3><form data-form="contato">${field('nome', 'Nome')}${field('empresa', 'Empresa ou instituiÃ§Ã£o', 'text', null, false)}${field('telefone', 'Telefone', 'tel')}${field('email', 'E-mail', 'email')}${field('assunto', 'Assunto', 'text', ['Fornecedor', 'Parceria', 'Institucional', 'Outro'])}<div class="full">${field('mensagem', 'Mensagem', 'textarea')}</div>${formEnd('contato', 'Enviar solicitaÃ§Ã£o')}</form></div></section>`
    );
  }

  // === TRABALHE CONOSCO / VAGAS ===
  function careers() {
    const areas = [
      {
        icon: 'ðŸŸï¸',
        title: 'OperaÃ§Ãµes & Eventos',
        desc: 'ProduÃ§Ã£o tÃ©cnica, logÃ­stica de grandes pÃºblicos, controle de acessos, coordenaÃ§Ã£o de arenas e montagem de megaeventos.',
        tag: 'Ãrea Operacional',
      },
      {
        icon: 'ðŸ—ï¸',
        title: 'Engenharia & ManutenÃ§Ã£o',
        desc: 'ManutenÃ§Ã£o da pista do AutÃ³dromo, sistemas elÃ©tricos e iluminaÃ§Ã£o, climatizaÃ§Ã£o dos pavilhÃµes e infraestrutura geral.',
        tag: 'Engenharia & Obras',
      },
      {
        icon: 'ðŸ¤',
        title: 'Hospitalidade & Atendimento',
        desc: 'RecepÃ§Ã£o a delegaÃ§Ãµes e turistas, guias de turismo e visitas escolares, operaÃ§Ã£o de bilheteria e atendimento ao pÃºblico.',
        tag: 'Atendimento',
      },
      {
        icon: 'ðŸ“¢',
        title: 'ComunicaÃ§Ã£o & Marketing',
        desc: 'ProduÃ§Ã£o de conteÃºdo audiovisual, mÃ­dias sociais, assessoria de imprensa, relacionamento com marcas e parceiros.',
        tag: 'ComunicaÃ§Ã£o & MÃ­dia',
      },
      {
        icon: 'ðŸ’¼',
        title: 'Administrativo & FinanÃ§as',
        desc: 'GestÃ£o de contratos, controladoria financeira, suprimentos, recursos humanos e suporte executivo ao parque.',
        tag: 'GestÃ£o & NegÃ³cios',
      },
      {
        icon: 'ðŸŒ¿',
        title: 'Sustentabilidade & Paisagismo',
        desc: 'PreservaÃ§Ã£o das Ã¡reas verdes do Cerrado, gestÃ£o dos lagos, manejo ambiental, reciclagem e sustentabilidade operacional.',
        tag: 'Meio Ambiente',
      },
    ];

    const areaOptions = [
      'OperaÃ§Ãµes e ProduÃ§Ã£o de Eventos',
      'Engenharia, ElÃ©trica e ManutenÃ§Ã£o Predial',
      'Hospitalidade, RecepÃ§Ã£o e Atendimento',
      'ComunicaÃ§Ã£o, MÃ­dia e Marketing',
      'Administrativo, Suprimentos e Financeiro',
      'Sustentabilidade e Paisagismo',
      'SeguranÃ§a Operacional e Patrimonial',
      'Outra Ã¡rea de atuaÃ§Ã£o',
    ];

    return (
      intro(
        'Construa o futuro com a gente.',
        'FaÃ§a parte da equipe que estÃ¡ construindo e operando o maior complexo multieventos da AmÃ©rica Latina no coraÃ§Ã£o de Mato Grosso.',
        'Trabalhe Conosco'
      ) +
      `<section class="wrap">
        ${heading(
          'OPORTUNIDADES',
          'Talentos que movem<br>grandes experiÃªncias.',
          'Buscamos profissionais dedicados e com paixÃ£o por fazer histÃ³ria. ConheÃ§a as principais Ã¡reas do parque e candidate-se Ã s oportunidades ou envie seu currÃ­culo para nosso banco de talentos.'
        )}

        <!-- Grid de Vagas -->
        <div class="jobs-board">
          ${(window.PNMT_CONTENT.jobs && window.PNMT_CONTENT.jobs.length > 0) ? `
            <div class="jobs-grid">
              ${window.PNMT_CONTENT.jobs.map(job => `
                <article class="job-card">
                  ${job.image ? `<img src="${job.image}" alt="Arte da vaga ${job.title}" class="job-image">` : ''}
                  <div class="job-content">
                    <span class="job-badge">${job.type || 'Tempo Integral'}</span>
                    <h3 class="job-title">${job.title}</h3>
                    <p class="job-desc">${job.description}</p>
                    <a href="#cadastro-vagas" class="button light" onclick="document.querySelector('[name=area]').value='${job.title}'">Candidatar-se</a>
                  </div>
                </article>
              `).join('')}
            </div>
          ` : `
            <div class="careers-linkedin-banner">
              <div class="careers-linkedin-copy">
                <span class="careers-linkedin-badge">ðŸ“¢ VAGAS & PROCESSOS SELETIVOS</span>
                <h3>Acompanhe as vagas abertas no LinkedIn Oficial</h3>
                <p>Nenhuma vaga cadastrada diretamente no site no momento. Confira as oportunidades ativas na nossa pÃ¡gina corporativa.</p>
              </div>
              <a class="button light" href="https://www.linkedin.com/company/parque-novo-mato-grosso/" target="_blank" rel="noopener">
                Ver Vagas no LinkedIn <span>â†—</span>
              </a>
            </div>
          `}
        </div>


        
      </section>

      <!-- FormulÃ¡rio de Cadastro de CurrÃ­culo -->
      <section class="related" id="cadastro-vagas">
        <div class="wrap service-layout">
          <div class="service-copy">
            <span class="kicker">BANCO DE TALENTOS</span>
            <h2>Cadastre seu currÃ­culo<br>para novas oportunidades.</h2>
            <p>Mesmo que vocÃª nÃ£o encontre uma vaga imediata para o seu perfil hoje, nosso banco de talentos Ã© consultado continuamente Ã  medida que novas fases e atraÃ§Ãµes entram em operaÃ§Ã£o.</p>
            <div class="service-steps">
              <p>Preencha seus dados de contato e trajetÃ³ria profissional.</p>
              <p>Indique sua Ã¡rea de interesse e adicione o link do seu LinkedIn ou currÃ­culo online.</p>
              <p>Nosso time de Gente & GestÃ£o entrarÃ¡ em contato quando surgirem vagas compatÃ­veis com seu perfil.</p>
            </div>
            <div class="careers-note-box">
              <strong>ðŸ“ Oportunidades presenciais e operacionais em CuiabÃ¡-MT.</strong>
              <p>Todas as vagas do Parque Novo Mato Grosso seguem critÃ©rios de igualdade de oportunidades e respeito Ã  diversidade.</p>
            </div>
          </div>

          <div class="service-form">
            <h3>Envie sua candidatura espontÃ¢nea</h3>
            <form data-form="trabalhe-conosco">
              ${field('nome', 'Nome completo')}
              ${field('email', 'Seu melhor e-mail', 'email')}
              ${field('telefone', 'Telefone / WhatsApp', 'tel')}
              ${field('cidade', 'Cidade onde reside (ex: CuiabÃ¡-MT)')}
              ${field('area', 'Ãrea de maior interesse', 'text', areaOptions)}
              ${field('linkedin', 'Link do LinkedIn ou CurrÃ­culo online (opcional)', 'url', null, false)}
              <div class="full">
                ${field('mensagem', 'Conte brevemente sobre sua trajetÃ³ria e por que quer fazer parte do Parque Novo MT', 'textarea')}
              </div>
              ${formEnd('trabalhe-conosco', 'Cadastrar no Banco de Talentos')}
            </form>
          </div>
        </div>
      </section>`
    );
  }

  function credits() {
    return (
      intro('CrÃ©ditos e informaÃ§Ãµes.', 'As referÃªncias que dÃ£o forma a este site.', 'CrÃ©ditos') +
      `<section class="wrap credits-list"><article><h3>Identidade e conteÃºdo</h3><p>Manual de AplicaÃ§Ã£o da Marca PNMT, PNMT_Textos_Site_Completo e proposta de layout fornecidos pelo parque. Logos preservados a partir do manual. InformaÃ§Ãµes sinalizadas para confirmaÃ§Ã£o no documento original foram retiradas do texto pÃºblico atÃ© validaÃ§Ã£o.</p></article><article><h3>Fotografias do autÃ³dromo</h3><p>Vista do circuito: Secom-MT. Corrida noturna: Mayke Toscano / Secom-MT. Registros de novembro de 2025.</p>${data.gallery.filter((g) => g.source).map((g) => `<p>${external(g.source, g.title)}</p>`).join('')}<p>O crÃ©dito nÃ£o substitui autorizaÃ§Ã£o de uso. Consulte os responsÃ¡veis pelos arquivos para republicaÃ§Ã£o.</p></article><article><h3>Imagens da proposta</h3><p>Vista aÃ©rea, pÃ³rtico e demais imagens foram fornecidos na proposta PNMT. Perspectivas e referÃªncias estÃ£o identificadas e nÃ£o representam necessariamente o estÃ¡gio atual das obras.</p></article><article><h3>VÃ­deo de apresentaÃ§Ã£o</h3><p>Parque Novo Mato Grosso, canal oficial no YouTube.</p>${external('https://www.youtube.com/watch?v=' + config.videoId, 'Assistir ao vÃ­deo')}</article><article><h3>FormulÃ¡rios nesta versÃ£o</h3><p>As solicitaÃ§Ãµes podem ser preenchidas e preparadas para envio. Enquanto nÃ£o houver conexÃ£o com o atendimento do parque, nenhum dado Ã© transmitido e nenhum agendamento ou cadastro de avisos Ã© confirmado.</p></article></section>`
    );
  }

  function notFound() {
    return (
      intro('Vamos voltar ao parque?', '', 'PÃ¡gina nÃ£o encontrada') +
      `<section class="wrap"><div class="empty-state"><h3>Este caminho nÃ£o foi encontrado.</h3><p>Explore os espaÃ§os e encontre sua prÃ³xima experiÃªncia.</p><a class="button" href="#espacos">ConheÃ§a os espaÃ§os â†—</a></div></section>`
    );
  }

  // === ROUTER & NAVIGATION ===
  function render() {
    let rawRoute;
    try {
      rawRoute = decodeURIComponent(location.hash.slice(1) || 'inicio');
    } catch {
      rawRoute = '404';
    }

    const [routePart, queryPart] = rawRoute.split('?');
    let route = routePart || 'inicio';
    const params = new URLSearchParams(queryPart || '');

    if (route === 'main') {
      route = 'inicio';
      requestAnimationFrame(() => {
        main.focus();
        main.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Clean up active 3D map if leaving map page
    if (state.activeMapViewer) {
      state.activeMapViewer.destroy();
      state.activeMapViewer = null;
    }

    state.route = route;
    state.selectedSpace = params.get('espaco') || (route.startsWith('evento/') ? route.split('/')[1] : '');

    const titles = {
      'inicio': 'InÃ­cio',
      'quem-somos': 'O parque',
      'espacos': 'EspaÃ§os',
      'mapa': 'Mapa Interativo',
      'agenda': 'Agenda',
      'imprensa': 'Imprensa',
      'galeria': 'Galeria',
      'visitar': 'Quero visitar',
      'trabalhe-conosco': 'Trabalhe Conosco',
      'contato': 'Contato',
      'evento': 'Realize seu evento',
      'outros-assuntos': 'Outros assuntos',
      'creditos': 'CrÃ©ditos',
    };

    if (route === 'admin') {
      window.location.href = 'admin.html';
      return;
    }

    let html;
    if (route === 'inicio') {
      html = home();
    } else if (route === 'mapa') {
      html = mapPage();
    } else if (route === 'quem-somos') {
      html = about();
    } else if (route === 'espacos') {
      html = spacesPage();
    } else if (route.startsWith('espaco/')) {
      html = detail(route.split('/')[1]);
    } else if (route === 'agenda') {
      html = agenda();
    } else if (route === 'imprensa') {
      html = press();
    } else if (route === 'galeria') {
      html = gallery();
    } else if (route === 'visitar') {
      html = visits();
    } else if (route === 'trabalhe-conosco') {
      html = careers();
    } else if (route === 'contato' || route === 'evento' || route.startsWith('evento/')) {
      html = contact(route === 'evento' || route.startsWith('evento/') || params.get('tipo') === 'evento');
    } else if (route === 'outros-assuntos') {
      html = otherContact();
    } else if (route === 'creditos') {
      html = credits();
    } else {
      html = notFound();
    }

    main.innerHTML = html;
    document.body.dataset.route = route;
    document.title = `${titles[route] || byId(route.split('/')[1])?.name || 'Parque'} | Parque Novo Mato Grosso`;

    nav.querySelectorAll('a').forEach((a) => {
      a.removeAttribute('aria-current');
      const r = a.hash.slice(1).split('?')[0];
      if (
        r === route ||
        (r === 'espacos' && route.startsWith('espaco/')) ||
        (r === 'contato' && (route === 'evento' || route.startsWith('evento/') || params.get('tipo') === 'evento'))
      ) {
        a.setAttribute('aria-current', 'page');
      }
    });

    closeMenu();

    if (route === 'mapa') {
      const root = document.getElementById('map-interactive-container');
      if (root && window.PNMTMapViewer) {
        state.activeMapViewer = new window.PNMTMapViewer(root);
      }
    }

    if (route === 'espacos') updateSpaces();
    if (route === 'agenda') updateAgenda();
    if (route === 'imprensa') updateNews();
    if (route === 'galeria') updateGallery();

  function disableCaptionsOnIframe(iframe) {
    if (!iframe || !iframe.contentWindow) return;
    const send = (func, args) => {
      try {
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
      } catch (e) {}
    };
    send('unloadModule', ['captions']);
    send('unloadModule', ['cc']);
    send('setOption', ['captions', 'track', {}]);
    send('setOption', ['captions', 'reload', false]);
    send('setOption', ['cc', 'track', {}]);
  }

    // Disable YouTube auto-captions via postMessage after player loads
    if (route === 'inicio') {
      const heroIframe = document.getElementById('hero-video');
      if (heroIframe) {
        [300, 800, 1500, 2500, 4000].forEach((ms) => {
          setTimeout(() => disableCaptionsOnIframe(heroIframe), ms);
        });
      }
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function closeMenu() {
    nav.classList.remove('open');
    document.body.classList.remove('nav-open');
    const t = document.querySelector('[data-action=menu]');
    if (t) {
      t.setAttribute('aria-expanded', 'false');
      t.setAttribute('aria-label', 'Abrir menu');
      t.textContent = 'â˜°';
    }
  }

  // === FILTERS ===
  function setFilter(type, value) {
    const key = {
      'espaÃ§os': 'spaceFilter',
      'agenda': 'agendaFilter',
      'galeria': 'galleryFilter',
      'notÃ­cias': 'newsFilter',
    }[type];
    if (!key) return;

    state[key] = value;

    document.querySelectorAll(`[data-filter="${type}"]`).forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.value === value));
    });

    if (type === 'espaÃ§os') updateSpaces();
    if (type === 'agenda') updateAgenda();
    if (type === 'galeria') updateGallery();
    if (type === 'notÃ­cias') updateNews();
  }

  // === MEDIA MODALS ===
  function showVideo() {
    const dlg = document.getElementById('media-dialog');
    if (!dlg) return;

    // Pause hero background video while modal is open
    const heroIframe = document.getElementById('hero-video');
    if (heroIframe) {
      try {
        heroIframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
      } catch (e) {}
    }

    const rawVid = String(config.videoId || config.youtubeId || 'ncTJbHQNq6M').trim();
    const vid = /^[\w-]{11}$/.test(rawVid) ? rawVid : 'ncTJbHQNq6M';
    document.getElementById('media-title').textContent = 'VÃ­deo de apresentaÃ§Ã£o â€” Parque Novo Mato Grosso';
    document.getElementById('media-content').innerHTML =
      `<div class="modal-video-wrap"><iframe id="modal-video-iframe" src="https://www.youtube.com/embed/${vid}?autoplay=1&rel=0&cc_load_policy=3&iv_load_policy=3&hl=pt-BR&enablejsapi=1" title="VÃ­deo de apresentaÃ§Ã£o â€” Parque Novo Mato Grosso" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><p style="margin-top:14px;color:#52687a;font-size:14px;">VÃ­deo institucional do canal Parque Novo Mato Grosso.</p>${external('https://www.youtube.com/watch?v=' + vid, 'Abrir diretamente no YouTube')}`;

    if (!dlg.open) {
      if (typeof dlg.showModal === 'function') {
        dlg.showModal();
      } else {
        dlg.setAttribute('open', '');
      }
    }

    const modalIframe = document.getElementById('modal-video-iframe');
    if (modalIframe) {
      [400, 1000, 2200].forEach((ms) => {
        setTimeout(() => disableCaptionsOnIframe(modalIframe), ms);
      });
    }
  }

  function showPhoto(index) {
    state.currentPhotoIndex = index;
    const g = data.gallery[index];
    if (!g) return;

    const total = data.gallery.length;
    document.getElementById('media-title').textContent = g.title;
    document.getElementById('media-content').innerHTML = `
      <div class="lightbox-viewer">
        <img src="${asset(g.image)}" alt="${esc(g.title)}" style="width:100%;border-radius:6px;max-height:70vh;object-fit:contain;background:#000;">
        <div class="lightbox-controls" style="display:flex;justify-content:space-between;align-items:center;margin:12px 0 6px;">
          <button class="button secondary" data-action="photo-prev" aria-label="Foto anterior" style="padding:6px 14px;font-size:14px;">â€¹ Anterior</button>
          <span style="font-size:13px;opacity:0.8;">${index + 1} de ${total}</span>
          <button class="button secondary" data-action="photo-next" aria-label="PrÃ³xima foto" style="padding:6px 14px;font-size:14px;">PrÃ³xima â€º</button>
        </div>
        <p>${esc(g.type)} Â· ${esc(g.credit)}</p>
        ${g.source ? external(g.source, 'Consulte a fonte e os crÃ©ditos') : ''}
      </div>`;
    const dlg = document.getElementById('media-dialog');
    if (!dlg.open) dlg.showModal();
  }

  // === SEARCH ===
  function updateSearch() {
    const rawVal = document.getElementById('search-input').value.trim();
    if (!rawVal) {
      document.getElementById('search-results').innerHTML =
        '<p class="search-hint" style="color:var(--muted);padding:14px 0;">Digite uma palavra-chave para buscar atraÃ§Ãµes, espaÃ§os, notÃ­cias e pÃ¡ginas.</p>';
      return;
    }

    const q = normal(rawVal);
    const pages = [
      ['O parque', 'quem-somos', 'institucional histÃ³ria valores'],
      ['ConheÃ§a os espaÃ§os', 'espacos', 'catÃ¡logo todos os espaÃ§os atraÃ§Ãµes'],
      ['Agenda', 'agenda', 'programaÃ§Ã£o eventos corridas shows datas'],
      ['Galeria de fotos', 'galeria', 'fotos imagens perspectivas registros'],
      ['Imprensa', 'imprensa', 'notÃ­cias assessoria kit pauta'],
      ['Quero visitar', 'visitar', 'visitas turismo escolas grupos agendamento'],
      ['Contato e eventos', 'contato', 'shows eventos realizaÃ§Ã£o orÃ§amento'],
      ['Trabalhe Conosco', 'trabalhe-conosco', 'vagas empregos carreiras currÃ­culo oportunidades banco talentos processo seletivo'],
      ['Outros assuntos', 'outros-assuntos', 'comercial fornecedores parcerias'],
    ].map(([name, id, extra]) => ({ name, id, category: 'PÃ¡gina', searchContent: extra }));

    const spaceItems = data.spaces.map((s) => ({
      name: s.name,
      id: 'espaco/' + s.id,
      category: s.category,
      tagline: s.tagline,
      searchContent: (s.text || []).join(' '),
    }));

    const eventItems = data.events.map((e) => ({
      name: e.name,
      id: 'agenda',
      category: 'Evento',
      tagline: `${e.category} Â· ${fmt(e.date)}`,
      searchContent: `${e.location} ${e.ticket}`,
    }));

    const newsItems = data.news.map((n) => ({
      name: n.title,
      id: 'imprensa',
      category: 'NotÃ­cia',
      tagline: `${n.category} Â· ${fmt(n.date)}`,
      searchContent: n.description,
    }));

    const found = [
      ...pages,
      ...spaceItems,
      ...eventItems,
      ...newsItems,
    ].filter((x) => normal(`${x.name} ${x.tagline || ''} ${x.searchContent || ''}`).includes(q));

    document.getElementById('search-results').innerHTML = found.length
      ? found.map((x) => `<a href="#${esc(x.id)}">${esc(x.name)} â†—<small>${esc(x.category)}${x.tagline ? ' Â· ' + esc(x.tagline) : ''}</small></a>`).join('')
      : '<p>Nenhum resultado. Tente outro nome ou assunto.</p>';
  }

  // === CALENDAR & DOWNLOADS ===
  function download(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function makeCalendar(id) {
    const e = data.events.find((x) => x.id === id);
    if (!e) return;

    const date = e.date.replaceAll('-', '');
    const next = new Date(e.date + 'T12:00:00');
    next.setDate(next.getDate() + 1);
    const end = next.toISOString().slice(0, 10).replaceAll('-', '');
    const safe = (s) =>
      s
        .replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;');

    download(
      'evento-pnmt.ics',
      `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//PNMT//Agenda//PT\r\nBEGIN:VEVENT\r\nUID:${e.id}@pnmt.local\r\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}\r\nDTSTART;VALUE=DATE:${date}\r\nDTEND;VALUE=DATE:${end}\r\nSUMMARY:${safe(e.name)}\r\nLOCATION:${safe(e.location)}\r\nURL:${e.url}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`,
      'text/calendar;charset=utf-8'
    );
  }

  // === FORM HANDLING ===
  async function handleForm(form) {
    form.classList.add('was-validated');
    if (!form.reportValidity()) return;

    const kind = form.dataset.form;
    const fields = Object.fromEntries(new FormData(form).entries());

    // Intercept automated bots via honeypot
    if (fields._gotcha_honey) {
      console.warn('[PNMT] Bot interceptado silenciosamente via honeypot.');
      form.reset();
      const st = form.querySelector('.form-status');
      if (st) {
        st.style.color = '#1b8f3a';
        st.textContent = 'SolicitaÃ§Ã£o recebida. Obrigado.';
      }
      return;
    }
    delete fields._gotcha_honey;

    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === 'string') fields[key] = value.trim().slice(0, 4000);
    }

    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === 'string' && !value) {
        const el = form.elements.namedItem(key);
        if (el && el.required) {
          el.setCustomValidity('Preencha este campo.');
          el.reportValidity();
          el.addEventListener('input', () => el.setCustomValidity(''), { once: true });
          return;
        }
      }
    }

    const endpoint = kind === 'newsletter' ? config.newsletterEndpoint : config.formsEndpoint;
    const status = form.querySelector('.form-status');
    status.textContent = '';

    const payload = {
      kind,
      submittedAt: new Date().toISOString(),
      fields,
    };

    if (endpoint) {
      const button = form.querySelector('[type=submit]');
      button.disabled = true;
      const original = button.innerHTML;
      button.textContent = 'Enviandoâ€¦';

      try {
        let result;

        // Supabase integration
        if (endpoint === '__supabase__' && window.PNMT_SUPABASE) {
          result = kind === 'newsletter'
            ? await window.PNMT_SUPABASE.submitNewsletter(payload)
            : await window.PNMT_SUPABASE.submitForm(payload);
          if (!result.ok) throw new Error(result.error || 'Envio nÃ£o confirmado');
        } else {
          // Generic REST endpoint
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          result = await response.json();
          if (!response.ok || result.ok !== true) throw new Error('Envio nÃ£o confirmado');
        }

        status.style.color = '#1b8f3a';
        status.textContent =
          kind === 'visita'
            ? 'SolicitaÃ§Ã£o recebida. Aguarde a confirmaÃ§Ã£o da data pela equipe.'
            : kind === 'newsletter'
              ? 'Cadastro realizado! VocÃª receberÃ¡ novidades em breve.'
              : kind === 'trabalhe-conosco'
                ? 'âœ“ Candidatura cadastrada com sucesso no Banco de Talentos! Nossa equipe de Gente & GestÃ£o entrarÃ¡ em contato.'
                : 'SolicitaÃ§Ã£o recebida. Obrigado pelo contato.';
        form.reset();
      } catch {
        status.style.color = '#a33022';
        status.textContent =
          'NÃ£o foi possÃ­vel confirmar o envio. Seus dados continuam no formulÃ¡rio. Tente novamente.';
      } finally {
        button.disabled = false;
        button.innerHTML = original;
      }
      return;
    }

    const text =
      'PARQUE NOVO MATO GROSSO\nSolicitaÃ§Ã£o: ' +
      kind +
      '\n\n' +
      Object.entries(fields)
        .filter(([k]) => k !== 'consentimento')
        .map(([k, v]) => `${k}: ${k === 'espaco' ? byId(v)?.name || v : v}`)
        .join('\n') +
      '\n\nPreparada localmente. Ainda nÃ£o enviada ao parque.';

    document.getElementById('request-title').textContent = 'SolicitaÃ§Ã£o preparada';
    document.getElementById('request-content').innerHTML =
      '<p>Confira os dados abaixo. Nenhuma solicitaÃ§Ã£o foi enviada ao parque e nenhum agendamento ou aviso foi ativado.</p><label class="sr-only" for="request-text">ConteÃºdo da solicitaÃ§Ã£o</label><textarea id="request-text" readonly></textarea><div class="form-actions"><button class="button" data-action="copy-request">Copiar solicitaÃ§Ã£o</button><button class="button secondary" data-action="download-request">Baixar cÃ³pia</button></div><p id="copy-status" role="status"></p>';
    document.getElementById('request-text').value = text;
    document.getElementById('request-dialog').showModal();
  }

  // === EVENT LISTENERS ===
  document.addEventListener('click', async (e) => {
    const close = e.target.closest('[data-close]');
    if (close) {
      close.closest('dialog').close();
      return;
    }

    // Hero video click: allow clicking the play button OR anywhere on the hero card (except sound button)
    const heroCard = e.target.closest('.reference-hero');
    if (heroCard && !e.target.closest('.hero-sound-btn')) {
      e.preventDefault();
      showVideo();
      return;
    }

    const b = e.target.closest('button');
    if (b) {
      if (b.dataset.filter) {
        setFilter(b.dataset.filter, b.dataset.value);
        return;
      }

      if (b.dataset.period) {
        state.agendaPeriod = b.dataset.period;
        document.querySelectorAll('[data-period]').forEach((x) =>
          x.setAttribute('aria-pressed', String(x.dataset.period === state.agendaPeriod))
        );
        updateAgenda();
        return;
      }

      if (b.dataset.photo !== undefined) {
        showPhoto(Number(b.dataset.photo));
        return;
      }

      if (b.dataset.calendar) {
        makeCalendar(b.dataset.calendar);
        return;
      }

      const action = b.dataset.action;
      if (action === 'menu') {
        const open = nav.classList.toggle('open');
        b.setAttribute('aria-expanded', String(open));
        b.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        b.textContent = open ? 'âœ•' : 'â˜°';
        document.body.classList.toggle('nav-open', open);
      } else if (action === 'close-menu') {
        closeMenu();
        return;
      } else if (action === 'search') {
        document.getElementById('search-input').value =
          document.getElementById('header-search')?.value || '';
        updateSearch();
        document.getElementById('search-dialog').showModal();
        document.getElementById('search-input').focus();
      } else if (action === 'video') {
        showVideo();
      } else if (action === 'toggle-sound') {
        const iframe = document.getElementById('hero-video');
        if (!iframe) return;
        state.heroMuted = state.heroMuted === undefined ? false : !state.heroMuted;
        const cmd = state.heroMuted ? 'mute' : 'unMute';
        iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: cmd, args: [] }), '*');
        const icon = b.querySelector('.sound-icon');
        const label = b.querySelector('.sound-label');
        if (icon) icon.textContent = state.heroMuted ? 'ðŸ”‡' : 'ðŸ”Š';
        if (label) label.textContent = state.heroMuted ? 'Ativar som' : 'Desativar som';
        b.setAttribute('aria-label', state.heroMuted ? 'Ativar som' : 'Desativar som');
      } else if (action === 'spaces-next' || action === 'spaces-previous') {
        const viewport = document.getElementById('reference-space-window');
        viewport.scrollBy({
          left: (action === 'spaces-next' ? 1 : -1) * (viewport.clientWidth * 0.8),
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        });
      } else if (action === 'photo-prev') {
        const total = data.gallery.length;
        const prev = ((state.currentPhotoIndex ?? 0) - 1 + total) % total;
        showPhoto(prev);
      } else if (action === 'photo-next') {
        const total = data.gallery.length;
        const next = ((state.currentPhotoIndex ?? 0) + 1) % total;
        showPhoto(next);
      } else if (action === 'reset-spaces') {
        state.spaceQuery = '';
        document.getElementById('space-search').value = '';
        setFilter('espaÃ§os', 'Todos');
        document.getElementById('space-search').focus({ preventScroll: true });
      } else if (action === 'copy-request') {
        const t = document.getElementById('request-text');
        try {
          await navigator.clipboard.writeText(t.value);
          document.getElementById('copy-status').textContent = 'SolicitaÃ§Ã£o copiada.';
        } catch {
          t.select();
          document.getElementById('copy-status').textContent = 'Selecione e copie o texto acima.';
        }
      } else if (action === 'download-request') {
        download(
          'solicitacao-pnmt.txt',
          document.getElementById('request-text').value,
          'text/plain;charset=utf-8'
        );
      }
    }

    if (nav.classList.contains('open') && !e.target.closest('#primary-nav') && !e.target.closest('[data-action=menu]')) {
      closeMenu();
    }

    const link = e.target.closest('a');
    if (link && link.getAttribute('href')?.startsWith('#')) {
      const dlg = link.closest('dialog');
      if (dlg) dlg.close();
      if (link.getAttribute('href') === location.hash) {
        closeMenu();
        main.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'space-search') {
      state.spaceQuery = e.target.value;
      updateSpaces();
    }
    if (e.target.id === 'search-input') {
      updateSearch();
    }
    if (e.target.id === 'header-search') {
      document.getElementById('search-input').value = e.target.value;
    }
    if (e.target.type === 'tel') {
      const v = e.target.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 10) {
        e.target.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
      } else if (v.length > 6) {
        e.target.value = `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
      } else if (v.length > 2) {
        e.target.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
      } else if (v.length > 0) {
        e.target.value = `(${v}`;
      }
    }
  });

  document.addEventListener('submit', (e) => {
    if (e.target.matches('form[data-form]')) {
      e.preventDefault();
      handleForm(e.target);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
    }
    if (e.key === 'Enter' && e.target.id === 'header-search') {
      e.preventDefault();
      document.querySelector('[data-action=search]').click();
    }
    const mediaDlg = document.getElementById('media-dialog');
    if (mediaDlg && mediaDlg.open && state.currentPhotoIndex !== undefined) {
      const total = data.gallery.length;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        showPhoto((state.currentPhotoIndex - 1 + total) % total);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        showPhoto((state.currentPhotoIndex + 1) % total);
      }
    }
  });

  document.querySelectorAll('dialog').forEach((d) => {
    d.addEventListener('click', (e) => {
      if (e.target === d) {
        const r = d.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        ) {
          d.close();
        }
      }
    });

    d.addEventListener('close', () => {
      if (d.id === 'media-dialog') {
        document.getElementById('media-content').innerHTML = '';
        const heroIframe = document.getElementById('hero-video');
        if (heroIframe) {
          try {
            heroIframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
          } catch (e) {}
        }
      }
    });
  });

  // === INITIALIZATION ===
  window.addEventListener('pnmt:content-updated', () => {
    syncDataFromAdmin();
    render();
  });

  window.addEventListener('hashchange', () => {
    render();
    main.focus({ preventScroll: true });
  });

  render();

  // === SCROLL REVEAL ANIMATIONS ===
  function initReveal() {
    const sections = main.querySelectorAll(
      '.reference-hero, .reference-facts, .reference-spaces, .reference-statement, ' +
      '.reference-film, .reference-signoff, .reference-about-title, .reference-origin, ' +
      '.reference-values, .reference-about-aerial, .split, .catalog-grid, ' +
      '.space-hero, .newsletter, .contact-grid, .gallery-grid, .steps, .faq'
    );

    const staggerContainers = main.querySelectorAll(
      '.reference-values-grid, .reference-space-track'
    );

    sections.forEach((el) => el.classList.add('reveal'));
    staggerContainers.forEach((el) => el.classList.add('reveal-stagger'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );

    sections.forEach((el) => observer.observe(el));
    staggerContainers.forEach((el) => observer.observe(el));
  }

  // === BACK TO TOP ===
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('show', window.scrollY > 500);
    }, { passive: true });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Init reveal on first render and after route changes
  window.addEventListener('hashchange', () => {
    requestAnimationFrame(() => initReveal());
  });
  requestAnimationFrame(() => initReveal());
})();

