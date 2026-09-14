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
    `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener">${label} ↗</a>`;

  const byId = (id) => data.spaces.find((s) => s.id === id);

  // === INITIAL DATA ENRICHMENT ===
  byId('autodromo').image = 'autodromo-real';
  byId('autodromo').credit = 'Secom-MT · registro de novembro de 2025';

  data.gallery.push(
    {
      image: 'autodromo-real',
      title: 'Circuito e paddock',
      category: 'Vista aérea',
      credit: 'Secom-MT · novembro de 2025',
      type: 'Fotografia',
      source:
        'https://pagina12.com.br/cotidiano/2025/11/13/30040-governo-de-mt-inaugura-pista-iluminada-do-autodromo-internacional-de-mato-grosso-nesta-sexta-feira14',
    },
    {
      image: 'corrida-real',
      title: 'Stock Car: uma noite histórica',
      category: 'Eventos',
      credit: 'Mayke Toscano / Secom-MT · novembro de 2025',
      type: 'Fotografia',
      source:
        'https://pagina12.com.br/esportes/2025/11/16/30074-ja-corri-24h-em-dubai-e-nao-vi-essa-iluminacao-nem-la-e-maravilhosa-afirma-1-campeao-da-stock-car-no-autodromo-internacional-de-mt',
    }
  );

  data.events.push({
    id: 'stock-car-2025',
    name: 'Stock Car — etapa de Cuiabá',
    category: 'Automobilismo',
    date: '2025-11-15',
    location: 'Autódromo Internacional de Mato Grosso',
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
  const crumb = (label) => `<p class="crumb"><a href="#inicio">Página inicial</a> / ${label}</p>`;

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
    return `<a class="space-card" href="#espaco/${esc(s.id)}"><img src="${asset(s.image)}" alt="${esc(s.name)}" loading="lazy"><div><span class="kicker">${esc(s.category)}</span><h3>${esc(s.short || s.name)}</h3><p>${esc(s.tagline)}</p><span class="circle-arrow" aria-hidden="true">↗</span></div></a>`;
  }

  function catalogCard(s) {
    const media = s.image
      ? `<div class="catalog-image"><img loading="lazy" decoding="async" src="${asset(s.image)}" alt="">${s.kind ? `<span class="image-note">${esc(s.kind)}</span>` : ''}</div>`
      : `<div class="catalog-image catalog-placeholder" aria-hidden="true"><img src="${asset('symbol')}" alt="" loading="lazy"><span>${esc(s.category)}</span><small>Parque Novo Mato Grosso</small></div>`;
    return `<a class="catalog-card catalog-card--portal" href="#espaco/${esc(s.id)}">${media}<div class="catalog-copy"><span class="kicker">${esc(s.category)}</span><h3>${esc(s.name)}</h3><p>${esc(s.tagline)}</p><span class="catalog-cta">Ver detalhes <span aria-hidden="true">↗</span></span></div></a>`;
  }

  const videoBlock = () =>
    `<div class="video-section"><img src="${asset('entrance')}" alt="Pórtico de entrada do parque" loading="lazy"><button data-action="video"><span class="play" aria-hidden="true">▶</span> Assista ao vídeo de apresentação</button></div><div class="video-caption"><p>Um novo olhar sobre Mato Grosso.</p>${external('https://www.youtube.com/watch?v=' + config.videoId, 'Assistir no YouTube', '')}</div>`;

  const visitStrip = () =>
    `<section class="visit-strip"><div><h2>Venha conhecer de perto.</h2><p>Escolas, grupos de turismo, empresas e delegações técnicas. Sua próxima descoberta começa aqui.</p></div><a class="button light" href="#visitar">Planeje sua visita <span>↗</span></a></section>`;

  function referenceCards() {
    const fixed = [
      { id: 'autodromo', image: 'track', label: 'AUTÓDROMO', copy: 'INTERNACIONAL<br>DE MATO GROSSO' },
      { id: 'arena-show', image: 'arena', label: 'ARENA SHOW', copy: '45 MIL M² DE<br>ÁREA PARA<br>SHOWS' },
      { id: 'skate-park', image: 'skate', label: 'COMPLEXO DE SKATE', copy: 'MAIOR PISTA<br>DA AMÉRICA<br>LATINA' },
      { id: 'circo-do-futuro', image: 'circus', label: 'CIRCO DO FUTURO', copy: 'TEATRO ARENA' },
      { id: 'roda-gigante', image: 'wheel', label: 'RODA-GIGANTE', copy: 'MAIOR DA<br>AMÉRICA LATINA' },
      { id: 'centro-de-eventos', image: 'events', label: 'CENTRO DE EVENTOS', copy: 'A EXPERIÊNCIA<br>DE RECEBER<br>O MUNDO' },
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
          `<a class="reference-space-card reference-card-${i % 6} ${s.image ? '' : 'reference-card-type'}" href="#espaco/${s.id}" aria-label="Conhecer ${esc(byId(s.id).name)}">${s.image ? `<img src="${asset(s.image)}" alt="" loading="lazy">` : ''}<div class="reference-space-card-copy"><h3>— ${s.label}</h3><p>${s.copy}</p></div></a>`
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
      'DA AMÉRICA LATINA.',
    ];
    const heroTexts = g.heroTexts || [
      'NO CENTRO GEODÉSICO DA',
      'AMÉRICA DO SUL, UM PARQUE',
      'CONSTRUÍDO PARA RECEBER O',
      'BRASIL E O MUNDO.',
    ];
    const areaTotal = g.areaTotal || '500';
    const areaUnit = g.areaUnit || 'HECTARES';
    const areaText = g.areaText || 'ENTRE LAGOS,<br>CONSTRUÇÃO<br>E ACESSOS';
    const address = g.address || 'RODOVIA EMANUEL PINHEIRO<br>(MT-251), KM 11, CUIABÁ-MT';
    const statement = g.statement || 'O LUGAR ONDE MATO GROSSO<br>SE APRESENTA PARA O MUNDO';
    const signoff = g.signoff || 'AINDA EM OBRAS. JÁ EM MOVIMENTO.';
    const sunsetPhoto = g.sunsetPhoto || 'assets/aerial-sunset.jpg';

    return `<section class="reference-home">
  <section class="reference-hero" aria-label="Apresentação do parque">
    <img class="hero-fallback" src="${asset('aerial-real')}" alt="Vista aérea do Parque Novo Mato Grosso">
    <div class="hero-video-wrap">
      <iframe id="hero-video" src="https://www.youtube.com/embed/${vid}?autoplay=1&mute=1&loop=1&playlist=${vid}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&cc_load_policy=3&cc_lang_pref=none&disablekb=1&fs=0&enablejsapi=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen title="Vídeo institucional do Parque Novo Mato Grosso"></iframe>
    </div>
    <button class="hero-play-overlay" data-action="video" aria-label="Assistir ao vídeo completo com áudio">
      <span class="hero-play-circle" title="Clique para assistir ao vídeo completo com áudio">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="white" aria-hidden="true"><polygon points="6,4 20,12 6,20"/></svg>
      </span>
      <span class="hero-play-badge">
        <span class="play-mini-icon">▶</span> Assistir com áudio
      </span>
    </button>
    <button class="hero-sound-btn" data-action="toggle-sound" aria-label="Ativar som">
      <span class="sound-icon" aria-hidden="true">🔇</span> <span class="sound-label">Ativar som</span>
    </button>
    <h1 class="reference-hero-title">
      ${heroTitles.map((t) => `<span>${esc(t)}</span>`).join('\n      ')}
    </h1>
    <p class="reference-hero-text">
      ${heroTexts.map((t) => `<span>${esc(t)}</span>`).join('\n      ')}
    </p>
  </section>
  <section class="reference-facts" aria-label="Área e localização"><div class="reference-area"><span>ÁREA TOTAL:</span><strong>${esc(areaTotal)}</strong><small>${esc(areaUnit)}</small></div><p class="reference-area-text">${areaText}</p><div class="reference-address"><svg viewBox="0 0 30 38" width="34" height="43" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 35S3 21 3 13a12 12 0 0 1 24 0c0 8-12 22-12 22Z"/><circle cx="15" cy="13" r="4"/></svg><p>${address}</p></div></section>
  <section class="reference-spaces" aria-label="Espaços do parque"><h2><strong>Cada espaço</strong> nasce com <strong>um propósito.</strong></h2><p>Conheça o que está sendo construído</p><div class="reference-carousel" role="region" aria-roledescription="carousel" aria-label="Carrossel de espaços do complexo"><button class="reference-carousel-arrow" data-action="spaces-previous" aria-label="Espaços anteriores">‹</button><div class="reference-carousel-window" id="reference-space-window" tabindex="0" aria-label="Navegue pelos espaços com as setas do teclado ou deslizando"><div class="reference-space-track">${referenceCards()}</div></div><button class="reference-carousel-arrow" data-action="spaces-next" aria-label="Próximos espaços">›</button></div></section>
  <div class="reference-statement"><p>${statement}</p></div>
  <div class="reference-closing">
    <p class="reference-signoff">${signoff}</p>
    <figure class="reference-aerial-panoramic"><img src="${asset(sunsetPhoto)}" alt="Vista aérea do Parque Novo Mato Grosso ao pôr do sol" loading="lazy"></figure>
  </div>
</section>
`;
  }

  function about() {
    const g = adminData?.general || {};
    const aboutTitle = g.aboutTitle || 'Mato Grosso já Nasceu Grande';
    const aboutLead = g.aboutLead || 'NO CENTRO DO CONTINENTE,<br>GRANDEZA NUNCA FOI AMBIÇÃO.<br><span>FOI ORIGEM. FOI DESTINO. FOI VOCAÇÃO.</span>';
    const aboutCopy1 = g.aboutCopy1 || 'É aqui que Amazônia, Cerrado e Pantanal se encontram, e a própria natureza<br class="desktop-break"> se expressa em sua maior escala. O agro fez de Mato Grosso uma potência.<br class="desktop-break"> Por meio da coragem de um povo hospitaleiro que transforma horizonte em futuro.';
    const aboutCopy2 = g.aboutCopy2 || 'para transformar o centro geográfico em centro de encontro.<br>O lugar onde o Brasil e o mundo vêm celebrar grandes eventos,<br>fazer negócios e viver experiências à altura de Mato Grosso.';

    return `<section class="reference-about"><section class="reference-about-title"><h1>${esc(aboutTitle)}</h1><p><a href="#inicio">Página Principal</a> / Quem Somos</p></section><section class="reference-origin"><div class="reference-origin-heading"><h2>${aboutLead}</h2></div><div class="reference-origin-copy"><p>${aboutCopy1}</p><p><strong>FOI DESSA GRANDEZA QUE NASCEU O PARQUE NOVO MATO GROSSO:</strong></p><p>${aboutCopy2}</p></div><img class="reference-map" src="${asset('map')}" alt="Mato Grosso, sua natureza e sua produção"><img class="reference-wheel" src="${asset('wheel-cutout')}" alt="Roda-gigante, imagem de referência da proposta"></section><section class="reference-values"><h2><span aria-hidden="true">—</span> NOSSOS VALORES</h2><div class="reference-values-grid">${data.values.map((v, i) => `<article class="reference-value value-${i}"><h3>${esc(v[0])}</h3><p>${esc(v[1])}</p></article>`).join('')}</div></section><figure class="reference-about-aerial"><img src="${asset('aerial')}" alt="Vista panorâmica do Parque Novo Mato Grosso"></figure></section>
`;
  }

  function spacesPage() {
    return `<section class="page-intro spaces-intro">${crumb('Conheça os espaços')}<div class="spaces-intro-row"><div><h1>Conheça os espaços</h1><p>Explore o mapa e descubra o que você pode viver no parque.</p></div><div class="spaces-shortcuts" role="group" aria-label="Explorar os espaços"><button type="button" data-pnmt-jump="mapa">Explorar o mapa <span aria-hidden="true">↓</span></button><button type="button" data-pnmt-jump="catalogo">Ver todos os espaços <span aria-hidden="true">↓</span></button></div></div></section>
      <section class="wrap spaces-catalog" id="catalogo-espacos" aria-labelledby="catalog-title"><div class="catalog-tools"><div><span class="kicker">ENCONTRE SUA PRÓXIMA EXPERIÊNCIA</span><h2 id="catalog-title">Qual espaço você quer conhecer?</h2><p>Escolha uma categoria ou busque pelo nome.</p></div><div class="catalog-search"><label for="space-search">Buscar um espaço</label><input id="space-search" type="search" placeholder="Ex.: autódromo, arena, skate…" value="${esc(state.spaceQuery)}" aria-controls="space-results" autocomplete="off"></div></div>${filters(['Todos', 'Esportes', 'Eventos', 'Cultura', 'Família', 'Experiências', 'Convivência'], state.spaceFilter, 'espaços')}<div class="catalog-results-bar"><p class="result-count" id="space-count" aria-live="polite" aria-atomic="true"></p><button type="button" id="clear-space-filters" data-action="reset-spaces" hidden>Limpar busca e filtros</button></div><div class="catalog-grid" id="space-results"></div></section>${visitStrip()}`;
  }

  function updateSpaces() {
    const list = data.spaces.filter(
      (s) =>
        (state.spaceFilter === 'Todos' || s.category === state.spaceFilter) &&
        normal(s.name + ' ' + s.tagline).includes(normal(state.spaceQuery))
    );

    document.getElementById('space-count').textContent = `${list.length} ${
      list.length === 1 ? 'espaço encontrado' : 'espaços encontrados'
    }`;

    const clearFilters = document.getElementById('clear-space-filters');
    if (clearFilters) clearFilters.hidden = !state.spaceQuery && state.spaceFilter === 'Todos';

    document.getElementById('space-results').innerHTML = list.length
      ? list.map(catalogCard).join('')
      : `<div class="empty-state"><h3>Vamos encontrar outro caminho?</h3><p>Nenhum espaço corresponde à busca. Tente outro nome ou categoria.</p><button class="button secondary" data-action="reset-spaces">Limpar filtros</button></div>`;
  }

  function detail(id) {
    const s = byId(id);
    if (!s) return notFound();

    const hero = s.image
      ? `<section class="space-hero"><img src="${asset(s.image)}" alt="${esc(s.name)}"><div class="space-hero-copy">${crumb(`<a href="#espacos">Espaços</a> / ${esc(s.name)}`)}<span class="kicker">${esc(s.category)}</span><h1>${esc(s.name)}</h1><p class="image-note">${esc(s.credit || s.kind || 'Imagem da proposta do parque')}</p></div></section>`
      : intro(esc(s.name), esc(s.tagline), `<a href="#espacos">Espaços</a> / ${esc(s.name)}`);

    let related = data.spaces.filter((x) => x.category === s.category && x.id !== s.id).slice(0, 3);
    if (!related.length) related = data.spaces.filter((x) => x.id !== s.id).slice(0, 3);

    return (
      hero +
      `<section class="wrap detail-layout"><article class="prose">${s.id === 'autodromo' ? `<img class="endorsement" src="${asset('autodromo-logo')}" alt="Autódromo Internacional de Mato Grosso — submarca do parque">` : ''}${s.image ? `<h2>${esc(s.tagline)}</h2>` : ''}${s.text.map((p) => `<p>${esc(p)}</p>`).join('')}${s.numbers ? `<div class="detail-numbers">${s.numbers.map((n) => `<div><strong>${esc(n[0])}</strong><p>${esc(n[1])}</p></div>`).join('')}</div>` : ''}</article><aside class="detail-aside"><span class="kicker">SUA PRÓXIMA EXPERIÊNCIA</span><h3>Viva o parque de perto.</h3><p>Visitas mediante agendamento e confirmação das áreas liberadas.</p><a class="button" href="#visitar">Quero visitar <span>↗</span></a><a class="button secondary" href="#evento/${esc(s.id)}">Realize seu evento <span>↗</span></a><a class="text-link" href="#agenda">Confira a agenda ↗</a></aside></section><section class="related"><div class="wrap">${heading('CONTINUE EXPLORANDO', 'Outros espaços.<br>Novas descobertas.')}<div class="catalog-grid">${related.map(catalogCard).join('')}</div></div></section>`
    );
  }

  // === FORM BUILDERS ===
  const field = (name, label, type = 'text', options, isRequired = true) =>
    `<label class="field">${label}${isRequired ? ' *' : ' <small style="font-weight:400;opacity:0.75">(opcional)</small>'}${options ? `<select name="${name}" ${isRequired ? 'required' : ''}><option value="">Selecione</option>${options.map((o) => `<option value="${esc(typeof o === 'string' ? o : o.id)}" ${state.selectedSpace === (o.id || o) ? 'selected' : ''}>${typeof o === 'string' ? o : o.name}</option>`).join('')}</select>` : type === 'textarea' ? `<textarea name="${name}" ${isRequired ? 'required' : ''} maxlength="4000"></textarea>` : `<input name="${name}" type="${type}" ${isRequired ? 'required' : ''} ${type === 'date' ? `min="${today()}"` : ''} ${type === 'number' ? 'min="1" max="1000000"' : type === 'tel' ? 'autocomplete="tel" minlength="8" maxlength="25"' : type === 'email' ? 'autocomplete="email" maxlength="254"' : 'maxlength="200"'}>`}</label>`;

  const formEnd = (kind, label) =>
    `<input type="text" name="_gotcha_honey" style="display:none !important; opacity:0; position:absolute; left:-9999px;" tabindex="-1" autocomplete="off" aria-hidden="true"><label class="check full"><input type="checkbox" name="consentimento" required><span>Autorizo o uso dos dados informados para atendimento desta solicitação conforme as diretrizes de privacidade.</span></label><p class="form-note full">${(kind === 'newsletter' ? config.newsletterEndpoint : config.formsEndpoint) ? 'O envio será confirmado nesta página.' : 'Nesta versão de apresentação, você pode preencher e gerar uma cópia da solicitação. Os dados não são enviados ao parque.'}</p><div class="form-actions full"><button class="button" type="submit">${(kind === 'newsletter' ? config.newsletterEndpoint : config.formsEndpoint) ? label : 'Preparar solicitação'} <span>↗</span></button><p class="form-status" role="status"></p></div>`;

  function newsletter(topic) {
    return `<section class="newsletter"><div><span class="kicker">FIQUE POR PERTO</span><h3>${topic === 'galeria' ? 'Não perca o próximo capítulo.' : 'Não encontrou o que procura?'}</h3><p>${topic === 'galeria' ? 'Acompanhe os novos registros do parque.' : 'Escolha o que você quer viver e deixe seu interesse registrado.'}</p></div><form data-form="newsletter"><input type="hidden" name="origem" value="${topic}">${field('nome', 'Seu nome')}${field('email', 'Seu e-mail', 'email')}${field('interesse', 'Tenho interesse em', 'text', ['Todos', 'Shows e Música', 'Automobilismo', 'Esporte', 'Cultura e Família', 'Corporativo', 'AgroPlace', 'Galeria'])}${formEnd('newsletter', 'Quero ser avisado')}</form></section>`;
  }

  // === AGENDA ===
  function agenda() {
    return (
      intro(
        'O que está por vir.',
        'Shows, corridas, campeonatos, feiras e eventos culturais. Escolha o que você quer viver.',
        'Agenda'
      ) +
      `<section class="wrap">${filters(['Todos', 'Shows e Música', 'Automobilismo', 'Esporte', 'Cultura e Família', 'Corporativo', 'AgroPlace'], state.agendaFilter, 'agenda')}<div class="filterbar" role="group" aria-label="Período dos eventos"><button class="filter" data-period="upcoming" aria-pressed="${state.agendaPeriod === 'upcoming'}">Próximos eventos</button><button class="filter" data-period="past" aria-pressed="${state.agendaPeriod === 'past'}">Já aconteceu</button></div><div id="event-results" aria-live="polite"></div>${newsletter('agenda')}</section>`
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
              `<article class="event-card"><div class="event-date">${fmt(e.date)}</div><div><span class="kicker">${esc(e.category)}</span><h3>${esc(e.name)}</h3><p>${esc(e.location)}</p><p>${esc(e.ticket)}</p>${external(e.url, 'Ver informações na fonte')}${e.date >= today() ? `<button class="button secondary" data-calendar="${esc(e.id)}">Salvar no calendário</button>` : ''}</div></article>`
          )
          .join('')
      : `<div class="empty-state"><span class="kicker">${state.agendaPeriod === 'past' ? 'MEMÓRIAS DO PARQUE' : 'NOVOS ENCONTROS VÊM AÍ'}</span><h3>${state.agendaPeriod === 'past' ? 'Nenhum registro nesta categoria.' : 'A próxima experiência está a caminho.'}</h3><p>${state.agendaPeriod === 'past' ? 'Escolha outra categoria para explorar os eventos registrados.' : 'Ainda não há datas cadastradas nesta seleção. Acompanhe os canais oficiais para a programação confirmada.'}</p>${external(config.instagram, 'Acompanhe o parque', 'button secondary')}</div>`;
  }

  // === IMPRENSA / NEWS ===
  function press() {
    return (
      intro(
        'O parque em movimento.',
        'Jornalistas, veículos e produtores encontram aqui informações para contar essa história com precisão.',
        'Imprensa'
      ) +
      `<section class="wrap">${heading('NOTÍCIAS E COBERTURA', 'O que acontece<br>ganha o mundo.', 'Obras, eventos, automobilismo, esporte, cultura e institucional. Explore as coberturas publicadas.')}${filters(['Todos', 'Obras', 'Automobilismo'], state.newsFilter, 'notícias')}<div class="article-grid" id="news-results"></div><div class="kit"><div><span class="kicker">KIT DE IMPRENSA</span><h3>Material para conhecer a marca.</h3><p>Logos extraídos do manual, ficha institucional, créditos e orientações. Confira o conteúdo e as condições de uso no pacote.</p></div><a class="button light" href="${config.kit}" download>Baixar kit de imprensa <span>↓</span></a></div></section><section class="related"><div class="wrap service-layout"><div class="service-copy"><span class="kicker">FALE COM A ASSESSORIA</span><h2>Pauta, entrevista<br>e credenciamento.</h2><p>Solicitações de entrevista, agendamento de visita técnica e credenciamento para eventos passam por aqui.</p><p>A equipe responde em até dois dias úteis após o recebimento.</p></div><div class="service-form"><h3>Qual é a sua pauta?</h3><form data-form="imprensa">${field('nome', 'Nome')}${field('veiculo', 'Veículo')}${field('editoria', 'Editoria', 'text', null, false)}${field('telefone', 'Telefone', 'tel')}${field('email', 'E-mail', 'email')}${field('tipo', 'Tipo de solicitação', 'text', ['Entrevista', 'Visita técnica', 'Credenciamento', 'Informações'])}${field('prazo', 'Prazo de fechamento', 'date', null, false)}<div class="full">${field('mensagem', 'Mensagem', 'textarea')}</div>${formEnd('imprensa', 'Enviar solicitação')}</form></div></div></section>`
    );
  }

  function updateNews() {
    document.getElementById('news-results').innerHTML = data.news
      .filter((n) => state.newsFilter === 'Todos' || state.newsFilter === n.category)
      .map(
        (n) =>
          `<article class="news-item"><small>${n.category} · ${fmt(n.date)} · ${n.source}</small><h3>${n.title}</h3><p>${n.description}</p>${external(n.url, 'Leia a cobertura')}</article>`
      )
      .join('');
  }

  // === GALERIA ===
  function gallery() {
    return (
      intro(
        'O parque que está nascendo.',
        'Cada imagem é um capítulo em construção. Acompanhe de perto o que está sendo erguido para Mato Grosso e para o mundo.',
        'Galeria de fotos'
      ) +
      `<section class="wrap">${filters(['Todas', 'Obras e estrutura', 'Vista aérea', 'Eventos', 'Espaços', 'Gente'], state.galleryFilter, 'galeria')}<div class="gallery-grid" id="gallery-results" aria-live="polite"></div><div class="section-bottom"><p>Fotografias e perspectivas identificadas. Créditos e fontes acompanham cada imagem.</p><a class="text-link" href="#imprensa">Acesse o kit de imprensa ↗</a></div>${newsletter('galeria')}</section>`
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
              `<button class="gallery-item" data-photo="${g.index}" aria-label="Ampliar ${g.title}"><img loading="lazy" src="${asset(g.image)}" alt="${g.title}"><strong>${g.title} ↗</strong><small>${g.type} · ${g.credit}</small></button>`
          )
          .join('')
      : `<div class="empty-state"><h3>Novos capítulos em breve.</h3><p>Ainda não há fotos publicadas nesta coleção. Explore as outras categorias.</p><button class="button secondary" data-filter="galeria" data-value="Todas">Ver todas as imagens</button></div>`;
  }

  // === VISITAS ===
  function visits() {
    return (
      intro(
        'Venha conhecer de perto.',
        'O parque abre as portas para grupos que querem ver, entender e viver o que está sendo construído no centro geodésico da América do Sul.',
        'Quero visitar'
      ) +
      `<section class="wrap">${heading('VISITAS GUIADAS', 'Um roteiro.<br>Muitas descobertas.', 'Acompanhamento da nossa equipe do começo ao fim, pelas principais estruturas e áreas liberadas.')}<div class="service-cards"><article class="service-card"><span class="kicker">GRUPOS ESCOLARES</span><h3>Uma aula a céu aberto.</h3><p>Estudantes do ensino fundamental, médio e técnico percorrem o parque com foco em arquitetura, sustentabilidade, agro, esporte e cultura.</p><p>AgroPlace, museus e grandes estruturas compõem a proposta de roteiro, conforme liberação das áreas e faixa etária.</p></article><article class="service-card"><span class="kicker">GRUPOS DE TURISMO</span><h3>Mato Grosso em um só lugar.</h3><p>Operadoras, agências e caravanas encontram um roteiro que reúne atrações do estado dentro do mesmo complexo.</p><p>Mirantes, Vila das Nações, Casa Cuiabana e arenas, com paradas para foto e alimentação, conforme disponibilidade.</p></article><article class="service-card"><span class="kicker">GRUPOS CORPORATIVOS E TÉCNICOS</span><h3>Por dentro da operação.</h3><p>Empresas, entidades e delegações técnicas conhecem arenas, backstage, acessos, estacionamento e capacidade operacional.</p><p>A visita indicada para quem avalia realizar um evento no parque.</p></article></div></section><section class="related"><div class="wrap service-layout"><div class="service-copy"><span class="kicker">COMO FUNCIONA</span><h2>Simples de organizar.</h2><div class="service-steps"><p>Conte sobre o grupo e indique a data pretendida.</p><p>A equipe verifica disponibilidade, roteiro e grupo mínimo.</p><p>Com a confirmação, você recebe as orientações de acesso.</p></div><div class="faq"><details open><summary>O que levar?</summary><p>Calçado confortável, protetor solar e água. Boa parte do roteiro é ao ar livre.</p></details><details><summary>Quais áreas fazem parte da visita?</summary><p>O parque está em obras em vários setores. O percurso segue sempre as áreas liberadas com segurança e é confirmado pela equipe.</p></details><details><summary>Como chegam ônibus e vans?</summary><p>Estacionamento sinalizado para ônibus e vans, com acesso direto pela rodovia.</p></details></div></div><div class="service-form"><h3>Planeje sua visita.</h3><p>A solicitação está sujeita à confirmação de data e roteiro pela equipe.</p><form data-form="visita">${field('nome', 'Nome do responsável')}${field('instituicao', 'Instituição ou empresa', 'text', null, false)}${field('grupo', 'Tipo de grupo', 'text', ['Escolar', 'Turismo', 'Corporativo ou técnico'])}${field('quantidade', 'Quantidade de pessoas', 'number')}${field('faixaEtaria', 'Faixa etária', 'text', null, false)}${field('data', 'Data pretendida', 'date')}${field('telefone', 'Telefone', 'tel')}${field('email', 'E-mail', 'email')}<div class="full">${field('observacoes', 'Observações', 'textarea', null, false)}</div>${formEnd('visita', 'Agendar minha visita')}</form></div></div></section>`
    );
  }

  // === EVENTOS & CONTATO ===
  function eventForm() {
    const eventSpaces = [
      { id: 'orientacao', name: '— Preciso de orientação da equipe —' },
      { id: 'arena-show', name: 'Arena Show (Até 120 mil pessoas)' },
      { id: 'centro-de-eventos', name: 'Centro de Eventos (5 pavilhões, até 26 mil pessoas)' },
      { id: 'autodromo', name: 'Autódromo Internacional' },
      { id: 'circo-do-futuro', name: 'Teatro de Arena / Circo do Futuro' },
      { id: 'agroplace', name: 'Agroplace' },
      { id: 'arenas-beach', name: 'Quadras de Areia' },
      { id: 'skate-park', name: 'Complexo de Skate' },
      { id: 'kartodromo', name: 'Cartódromo' },
      { id: 'outro', name: 'Outro espaço do parque' },
    ];
    return `<div class="service-form"><h3>Vamos construir seu evento.</h3><form data-form="evento">${field('nome', 'Nome')}${field('empresa', 'Empresa ou instituição', 'text', null, false)}${field('telefone', 'Telefone', 'tel')}${field('email', 'E-mail', 'email')}${field('tipo', 'Tipo de evento', 'text', ['Show', 'Feira', 'Congresso ou convenção', 'Competição esportiva', 'Encontro corporativo', 'Outro'])}${field('espaco', 'Espaço desejado', 'text', eventSpaces)}${field('publico', 'Público estimado', 'number')}${field('data', 'Data pretendida', 'date')}<div class="full">${field('mensagem', 'Conte sobre o evento', 'textarea', null, false)}</div>${formEnd('evento', 'Enviar solicitação')}</form></div>`;
  }

  // === MAPA INTERATIVO (PÁGINA DEDICADA) ===
  function mapPage() {
    return `<section class="map-page-section">
      <div class="map-page-header">
        ${crumb('Mapa Interativo')}
        <div class="map-page-title-row">
          <div>
            <h1>Explore o Parque em Perspectiva</h1>
            <p>Visualizador interativo em 2.5D baseado na Planta de Implantação Oficial R81 · 500 Hectares em Cuiabá-MT</p>
          </div>
          <div class="map-page-top-actions">
            <a href="#espacos" class="button secondary">Catálogo de Espaços</a>
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
            <span class="event-map-live-tag"><span class="event-map-live-dot"></span> 21 ESPAÇOS</span>
          </div>
          <h3>Mapa Geral do Complexo</h3>
          <p>Conheça a distribuição dos polos de eventos, shows, convenções e competições.</p>
        </div>

        <a href="#mapa" class="event-map-preview" title="Abrir visualizador interativo em perspectiva 3D" aria-label="Abrir mapa interativo do Parque Novo Mato Grosso">
          <img src="assets/aerial-real.jpg" alt="Fotografia aérea do Parque Novo Mato Grosso" loading="lazy" width="600" height="400">
          
          <div class="event-map-overlay">
            <span class="event-map-overlay-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              Explorar Mapa Interativo 3D
            </span>
          </div>
        </a>

        <div class="event-venues-pills">
          <div class="venue-pill">
            <span class="venue-pill-icon">🏟️</span>
            <div class="venue-pill-info">
              <span class="venue-pill-name">Arena Show</span>
              <span class="venue-pill-cap">Até 120 mil pessoas</span>
            </div>
          </div>
          <div class="venue-pill">
            <span class="venue-pill-icon">🏛️</span>
            <div class="venue-pill-info">
              <span class="venue-pill-name">Centro de Eventos</span>
              <span class="venue-pill-cap">5 pavilhões · 26 mil</span>
            </div>
          </div>
          <div class="venue-pill">
            <span class="venue-pill-icon">🏎️</span>
            <div class="venue-pill-info">
              <span class="venue-pill-name">Autódromo</span>
              <span class="venue-pill-cap">3.500m padrão FIA</span>
            </div>
          </div>
        </div>

        <div class="event-map-footer">
          <a href="#mapa" class="event-map-cta-btn">
            <span>Explorar no Mapa 3D</span>
            <span class="arrow">→</span>
          </a>
          <a href="${config.map}" target="_blank" rel="noopener" class="event-map-geo-link" title="Abrir localização no Google Maps">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>MT-251, km 11 · Como chegar</span>
          </a>
        </div>
      </div>
    `;
  }

  function contact(event = false) {
    return (
      intro(
        event ? 'Seu próximo grande evento.' : 'Fale com o parque.',
        'Cada assunto tem um caminho direto. Escolha o que você precisa.',
        'Contato'
      ) +
      `<section class="wrap service-layout"><div class="service-copy"><span class="kicker">QUERO REALIZAR MEU EVENTO</span><h2>Shows, feiras,<br>competições e<br>grandes encontros.</h2><p>Conte o que você quer fazer. A nossa equipe retorna com a melhor estrutura para o seu formato, do espaço à operação.</p><p>Retorno previsto em até dois dias úteis após o recebimento.</p>${eventMapCard()}</div>${eventForm()}</section><section class="wrap" style="padding-top:0"><h2>Outros caminhos.</h2><div class="contact-paths"><a href="#visitar"><h3>Quero visitar o parque.</h3><p>Visitas guiadas para grupos escolares, de turismo e corporativos.</p><span>Ir para visitas ↗</span></a><a href="#imprensa"><h3>Pauta e entrevista.</h3><p>Solicitações da imprensa e acesso ao material oficial.</p><span>Ir para imprensa ↗</span></a><a href="#outros-assuntos"><h3>Vamos conversar.</h3><p>Fornecedores, propostas comerciais, parcerias e assuntos institucionais.</p><span>Outros assuntos ↗</span></a></div></section>`
    );
  }

  function otherContact() {
    return (
      intro('Vamos conversar.', 'Fornecedores, parcerias e institucional.', 'Outros assuntos') +
      `<section class="wrap service-layout"><div class="service-copy"><h2>Novas conexões<br>começam aqui.</h2><p>Propostas comerciais, parcerias e assuntos institucionais também chegam por este canal.</p>${external(config.instagram, 'Acompanhe o parque')}</div><div class="service-form"><h3>Como podemos ajudar?</h3><form data-form="contato">${field('nome', 'Nome')}${field('empresa', 'Empresa ou instituição', 'text', null, false)}${field('telefone', 'Telefone', 'tel')}${field('email', 'E-mail', 'email')}${field('assunto', 'Assunto', 'text', ['Fornecedor', 'Parceria', 'Institucional', 'Outro'])}<div class="full">${field('mensagem', 'Mensagem', 'textarea')}</div>${formEnd('contato', 'Enviar solicitação')}</form></div></section>`
    );
  }

  // === TRABALHE CONOSCO / VAGAS ===
  function careers() {
    const areas = [
      {
        icon: '🏟️',
        title: 'Operações & Eventos',
        desc: 'Produção técnica, logística de grandes públicos, controle de acessos, coordenação de arenas e montagem de megaeventos.',
        tag: 'Área Operacional',
      },
      {
        icon: '🏗️',
        title: 'Engenharia & Manutenção',
        desc: 'Manutenção da pista do Autódromo, sistemas elétricos e iluminação, climatização dos pavilhões e infraestrutura geral.',
        tag: 'Engenharia & Obras',
      },
      {
        icon: '🤝',
        title: 'Hospitalidade & Atendimento',
        desc: 'Recepção a delegações e turistas, guias de turismo e visitas escolares, operação de bilheteria e atendimento ao público.',
        tag: 'Atendimento',
      },
      {
        icon: '📢',
        title: 'Comunicação & Marketing',
        desc: 'Produção de conteúdo audiovisual, mídias sociais, assessoria de imprensa, relacionamento com marcas e parceiros.',
        tag: 'Comunicação & Mídia',
      },
      {
        icon: '💼',
        title: 'Administrativo & Finanças',
        desc: 'Gestão de contratos, controladoria financeira, suprimentos, recursos humanos e suporte executivo ao parque.',
        tag: 'Gestão & Negócios',
      },
      {
        icon: '🌿',
        title: 'Sustentabilidade & Paisagismo',
        desc: 'Preservação das áreas verdes do Cerrado, gestão dos lagos, manejo ambiental, reciclagem e sustentabilidade operacional.',
        tag: 'Meio Ambiente',
      },
    ];

    const areaOptions = [
      'Operações e Produção de Eventos',
      'Engenharia, Elétrica e Manutenção Predial',
      'Hospitalidade, Recepção e Atendimento',
      'Comunicação, Mídia e Marketing',
      'Administrativo, Suprimentos e Financeiro',
      'Sustentabilidade e Paisagismo',
      'Segurança Operacional e Patrimonial',
      'Outra área de atuação',
    ];

    return (
      intro(
        'Construa o futuro com a gente.',
        'Faça parte da equipe que está construindo e operando o maior complexo multieventos da América Latina no coração de Mato Grosso.',
        'Trabalhe Conosco'
      ) +
      `<section class="wrap">
        ${heading(
          'OPORTUNIDADES',
          'Talentos que movem<br>grandes experiências.',
          'Buscamos profissionais dedicados e com paixão por fazer história. Conheça as principais áreas do parque e candidate-se às oportunidades ou envie seu currículo para nosso banco de talentos.'
        )}

        <!-- Banner de Vagas Oficiais no LinkedIn -->
        <div class="careers-linkedin-banner">
          <div class="careers-linkedin-copy">
            <span class="careers-linkedin-badge">📢 VAGAS & PROCESSOS SELETIVOS</span>
            <h3>Acompanhe as vagas abertas no LinkedIn Oficial</h3>
            <p>Confira os requisitos, atribuições e etapas dos processos seletivos ativos do Parque Novo Mato Grosso em nossa página corporativa.</p>
          </div>
          <a class="button light" href="https://www.linkedin.com/company/parque-novo-mato-grosso/" target="_blank" rel="noopener">
            Ver Vagas no LinkedIn <span>↗</span>
          </a>
        </div>

        <!-- Cards das Áreas -->
        <div class="service-cards">
          ${areas
            .map(
              (a) =>
                `<article class="service-card career-card"><span class="career-icon" aria-hidden="true">${a.icon}</span><span class="kicker">${a.tag}</span><h3>${a.title}</h3><p>${a.desc}</p></article>`
            )
            .join('')}
        </div>
      </section>

      <!-- Formulário de Cadastro de Currículo -->
      <section class="related">
        <div class="wrap service-layout">
          <div class="service-copy">
            <span class="kicker">BANCO DE TALENTOS</span>
            <h2>Cadastre seu currículo<br>para novas oportunidades.</h2>
            <p>Mesmo que você não encontre uma vaga imediata para o seu perfil hoje, nosso banco de talentos é consultado continuamente à medida que novas fases e atrações entram em operação.</p>
            <div class="service-steps">
              <p>Preencha seus dados de contato e trajetória profissional.</p>
              <p>Indique sua área de interesse e adicione o link do seu LinkedIn ou currículo online.</p>
              <p>Nosso time de Gente & Gestão entrará em contato quando surgirem vagas compatíveis com seu perfil.</p>
            </div>
            <div class="careers-note-box">
              <strong>📍 Oportunidades presenciais e operacionais em Cuiabá-MT.</strong>
              <p>Todas as vagas do Parque Novo Mato Grosso seguem critérios de igualdade de oportunidades e respeito à diversidade.</p>
            </div>
          </div>

          <div class="service-form">
            <h3>Envie sua candidatura espontânea</h3>
            <form data-form="trabalhe-conosco">
              ${field('nome', 'Nome completo')}
              ${field('email', 'Seu melhor e-mail', 'email')}
              ${field('telefone', 'Telefone / WhatsApp', 'tel')}
              ${field('cidade', 'Cidade onde reside (ex: Cuiabá-MT)')}
              ${field('area', 'Área de maior interesse', 'text', areaOptions)}
              ${field('linkedin', 'Link do LinkedIn ou Currículo online (opcional)', 'url', null, false)}
              <div class="full">
                ${field('mensagem', 'Conte brevemente sobre sua trajetória e por que quer fazer parte do Parque Novo MT', 'textarea')}
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
      intro('Créditos e informações.', 'As referências que dão forma a este site.', 'Créditos') +
      `<section class="wrap credits-list"><article><h3>Identidade e conteúdo</h3><p>Manual de Aplicação da Marca PNMT, PNMT_Textos_Site_Completo e proposta de layout fornecidos pelo parque. Logos preservados a partir do manual. Informações sinalizadas para confirmação no documento original foram retiradas do texto público até validação.</p></article><article><h3>Fotografias do autódromo</h3><p>Vista do circuito: Secom-MT. Corrida noturna: Mayke Toscano / Secom-MT. Registros de novembro de 2025.</p>${data.gallery.filter((g) => g.source).map((g) => `<p>${external(g.source, g.title)}</p>`).join('')}<p>O crédito não substitui autorização de uso. Consulte os responsáveis pelos arquivos para republicação.</p></article><article><h3>Imagens da proposta</h3><p>Vista aérea, pórtico e demais imagens foram fornecidos na proposta PNMT. Perspectivas e referências estão identificadas e não representam necessariamente o estágio atual das obras.</p></article><article><h3>Vídeo de apresentação</h3><p>Parque Novo Mato Grosso, canal oficial no YouTube.</p>${external('https://www.youtube.com/watch?v=' + config.videoId, 'Assistir ao vídeo')}</article><article><h3>Formulários nesta versão</h3><p>As solicitações podem ser preenchidas e preparadas para envio. Enquanto não houver conexão com o atendimento do parque, nenhum dado é transmitido e nenhum agendamento ou cadastro de avisos é confirmado.</p></article></section>`
    );
  }

  function notFound() {
    return (
      intro('Vamos voltar ao parque?', '', 'Página não encontrada') +
      `<section class="wrap"><div class="empty-state"><h3>Este caminho não foi encontrado.</h3><p>Explore os espaços e encontre sua próxima experiência.</p><a class="button" href="#espacos">Conheça os espaços ↗</a></div></section>`
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
      'inicio': 'Início',
      'quem-somos': 'O parque',
      'espacos': 'Espaços',
      'mapa': 'Mapa Interativo',
      'agenda': 'Agenda',
      'imprensa': 'Imprensa',
      'galeria': 'Galeria',
      'visitar': 'Quero visitar',
      'trabalhe-conosco': 'Trabalhe Conosco',
      'contato': 'Contato',
      'evento': 'Realize seu evento',
      'outros-assuntos': 'Outros assuntos',
      'creditos': 'Créditos',
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
      t.textContent = '☰';
    }
  }

  // === FILTERS ===
  function setFilter(type, value) {
    const key = {
      'espaços': 'spaceFilter',
      'agenda': 'agendaFilter',
      'galeria': 'galleryFilter',
      'notícias': 'newsFilter',
    }[type];
    if (!key) return;

    state[key] = value;

    document.querySelectorAll(`[data-filter="${type}"]`).forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.value === value));
    });

    if (type === 'espaços') updateSpaces();
    if (type === 'agenda') updateAgenda();
    if (type === 'galeria') updateGallery();
    if (type === 'notícias') updateNews();
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
    document.getElementById('media-title').textContent = 'Vídeo de apresentação — Parque Novo Mato Grosso';
    document.getElementById('media-content').innerHTML =
      `<div class="modal-video-wrap"><iframe id="modal-video-iframe" src="https://www.youtube.com/embed/${vid}?autoplay=1&rel=0&cc_load_policy=3&iv_load_policy=3&hl=pt-BR&enablejsapi=1" title="Vídeo de apresentação — Parque Novo Mato Grosso" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><p style="margin-top:14px;color:#52687a;font-size:14px;">Vídeo institucional do canal Parque Novo Mato Grosso.</p>${external('https://www.youtube.com/watch?v=' + vid, 'Abrir diretamente no YouTube')}`;

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
          <button class="button secondary" data-action="photo-prev" aria-label="Foto anterior" style="padding:6px 14px;font-size:14px;">‹ Anterior</button>
          <span style="font-size:13px;opacity:0.8;">${index + 1} de ${total}</span>
          <button class="button secondary" data-action="photo-next" aria-label="Próxima foto" style="padding:6px 14px;font-size:14px;">Próxima ›</button>
        </div>
        <p>${esc(g.type)} · ${esc(g.credit)}</p>
        ${g.source ? external(g.source, 'Consulte a fonte e os créditos') : ''}
      </div>`;
    const dlg = document.getElementById('media-dialog');
    if (!dlg.open) dlg.showModal();
  }

  // === SEARCH ===
  function updateSearch() {
    const rawVal = document.getElementById('search-input').value.trim();
    if (!rawVal) {
      document.getElementById('search-results').innerHTML =
        '<p class="search-hint" style="color:var(--muted);padding:14px 0;">Digite uma palavra-chave para buscar atrações, espaços, notícias e páginas.</p>';
      return;
    }

    const q = normal(rawVal);
    const pages = [
      ['O parque', 'quem-somos', 'institucional história valores'],
      ['Conheça os espaços', 'espacos', 'catálogo todos os espaços atrações'],
      ['Agenda', 'agenda', 'programação eventos corridas shows datas'],
      ['Galeria de fotos', 'galeria', 'fotos imagens perspectivas registros'],
      ['Imprensa', 'imprensa', 'notícias assessoria kit pauta'],
      ['Quero visitar', 'visitar', 'visitas turismo escolas grupos agendamento'],
      ['Contato e eventos', 'contato', 'shows eventos realização orçamento'],
      ['Trabalhe Conosco', 'trabalhe-conosco', 'vagas empregos carreiras currículo oportunidades banco talentos processo seletivo'],
      ['Outros assuntos', 'outros-assuntos', 'comercial fornecedores parcerias'],
    ].map(([name, id, extra]) => ({ name, id, category: 'Página', searchContent: extra }));

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
      tagline: `${e.category} · ${fmt(e.date)}`,
      searchContent: `${e.location} ${e.ticket}`,
    }));

    const newsItems = data.news.map((n) => ({
      name: n.title,
      id: 'imprensa',
      category: 'Notícia',
      tagline: `${n.category} · ${fmt(n.date)}`,
      searchContent: n.description,
    }));

    const found = [
      ...pages,
      ...spaceItems,
      ...eventItems,
      ...newsItems,
    ].filter((x) => normal(`${x.name} ${x.tagline || ''} ${x.searchContent || ''}`).includes(q));

    document.getElementById('search-results').innerHTML = found.length
      ? found.map((x) => `<a href="#${esc(x.id)}">${esc(x.name)} ↗<small>${esc(x.category)}${x.tagline ? ' · ' + esc(x.tagline) : ''}</small></a>`).join('')
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
        st.textContent = 'Solicitação recebida. Obrigado.';
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
      button.textContent = 'Enviando…';

      try {
        let result;

        // Supabase integration
        if (endpoint === '__supabase__' && window.PNMT_SUPABASE) {
          result = kind === 'newsletter'
            ? await window.PNMT_SUPABASE.submitNewsletter(payload)
            : await window.PNMT_SUPABASE.submitForm(payload);
          if (!result.ok) throw new Error(result.error || 'Envio não confirmado');
        } else {
          // Generic REST endpoint
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          result = await response.json();
          if (!response.ok || result.ok !== true) throw new Error('Envio não confirmado');
        }

        status.style.color = '#1b8f3a';
        status.textContent =
          kind === 'visita'
            ? 'Solicitação recebida. Aguarde a confirmação da data pela equipe.'
            : kind === 'newsletter'
              ? 'Cadastro realizado! Você receberá novidades em breve.'
              : kind === 'trabalhe-conosco'
                ? '✓ Candidatura cadastrada com sucesso no Banco de Talentos! Nossa equipe de Gente & Gestão entrará em contato.'
                : 'Solicitação recebida. Obrigado pelo contato.';
        form.reset();
      } catch {
        status.style.color = '#a33022';
        status.textContent =
          'Não foi possível confirmar o envio. Seus dados continuam no formulário. Tente novamente.';
      } finally {
        button.disabled = false;
        button.innerHTML = original;
      }
      return;
    }

    const text =
      'PARQUE NOVO MATO GROSSO\nSolicitação: ' +
      kind +
      '\n\n' +
      Object.entries(fields)
        .filter(([k]) => k !== 'consentimento')
        .map(([k, v]) => `${k}: ${k === 'espaco' ? byId(v)?.name || v : v}`)
        .join('\n') +
      '\n\nPreparada localmente. Ainda não enviada ao parque.';

    document.getElementById('request-title').textContent = 'Solicitação preparada';
    document.getElementById('request-content').innerHTML =
      '<p>Confira os dados abaixo. Nenhuma solicitação foi enviada ao parque e nenhum agendamento ou aviso foi ativado.</p><label class="sr-only" for="request-text">Conteúdo da solicitação</label><textarea id="request-text" readonly></textarea><div class="form-actions"><button class="button" data-action="copy-request">Copiar solicitação</button><button class="button secondary" data-action="download-request">Baixar cópia</button></div><p id="copy-status" role="status"></p>';
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
        b.textContent = open ? '✕' : '☰';
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
        if (icon) icon.textContent = state.heroMuted ? '🔇' : '🔊';
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
        setFilter('espaços', 'Todos');
        document.getElementById('space-search').focus({ preventScroll: true });
      } else if (action === 'copy-request') {
        const t = document.getElementById('request-text');
        try {
          await navigator.clipboard.writeText(t.value);
          document.getElementById('copy-status').textContent = 'Solicitação copiada.';
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
