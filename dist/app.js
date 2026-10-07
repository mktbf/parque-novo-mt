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
    const aboutTitle = g.aboutTitle || 'O Novo Começa Aqui';
    const aboutLead = g.aboutLead || 'NO CENTRO GEODÉSICO DA AMÉRICA DO SUL,<br>A NATUREZA E A INOVAÇÃO SE ENCONTRAM.<br><span>AQUI, MATO GROSSO SE APRESENTA PARA O MUNDO.</span>';
    const aboutCopy1 = g.aboutCopy1 || 'O Parque Novo Mato Grosso é um marco onde a grandeza de nossa terra se revela em sua maior escala. Com aproximadamente 500 hectares — sendo 130 hectares de espelho d\'água e 330 hectares de infraestrutura construída — este é o maior parque multieventos da América Latina.';
    const aboutCopy2 = g.aboutCopy2 || 'para celebrar o esporte, a cultura, os negócios e o lazer.<br>O complexo transforma o coração do continente no ponto de encontro do Brasil e do mundo,<br>oferecendo uma experiência monumental à altura da vocação do estado.';

    return `<section class="reference-about">
      <section class="reference-about-title">
        <h1>${esc(aboutTitle)}</h1>
        <p><a href="#inicio">Página Principal</a> / Quem Somos</p>
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
        <img class="reference-map" src="${asset('map')}" alt="Mato Grosso, sua natureza e sua produção">
        <img class="reference-wheel" src="${asset('wheel-cutout')}" alt="Roda-gigante, imagem de referência da proposta">
      </section>
      <figure class="reference-about-aerial">
        <img src="${asset('aerial')}" alt="Vista panorâmica do Parque Novo Mato Grosso">
      </figure>
    </section>`;
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
      `<section class="wrap detail-layout"><article class="prose">${s.id === 'autodromo' ? `<img class="endorsement" src="${asset('autodromo-logo')}" alt="Autódromo Internacional de Mato Grosso — submarca do parque">` : ''}${s.image ? `<h2>${esc(s.tagline)}</h2>` : ''}${s.text.map((p) => `<p>${esc(p)}</p>`).join('')}${s.numbers ? `<div class="detail-numbers">${s.numbers.map((n) => `<div><strong>${esc(n[0])}</strong><p>${esc(n[1])}</p></div>`).join('')}</div>` : ''}</article><aside class="detail-aside"><span class="kicker">SUA PRÓXIMA EXPERIÊNCIA</span><h3>Viva o parque de perto.</h3><p>Visitas mediante agendamento e confirmação das áreas liberadas.</p><a class="button" href="#visitar">Quero visitar <span>↗</span></a><a class="button secondary" href="#evento/${esc(s.id)}">Realize seu evento <span>↗</span></a><a class="text-link" href="#agenda">Confira a agenda ↗</a></aside></section>${s.gallery && s.gallery.length > 0 ? `<section class="wrap detail-gallery"><div class="related-header"><h2>Galeria do Espaço</h2></div><div class="space-photo-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:16px; margin-bottom: 60px;">${s.gallery.map(img => `<img src="${asset(img)}" alt="Foto do espaço" loading="lazy" style="width:100%; height:220px; object-fit:cover; border-radius:12px; transition: transform 0.3s; cursor:pointer;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='none'">`).join('')}</div></section>` : ''}${s.news && s.news.length ? `<section class="wrap detail-news"><div class="related-header"><h2>Na Mídia</h2></div><div class="news-list">${s.news.map(n => `<a href="#noticia/${n.id}" class="news-card-link" style="text-decoration:none;"><article class="news-card"><span class="kicker">${n.source}</span><h4>${n.title}</h4></article></a>`).join('')}</div></section>` : ''}<section class="related"><div class="wrap">${heading('CONTINUE EXPLORANDO', 'Outros espaços.<br>Novas descobertas.')}<div class="catalog-grid">${related.map(catalogCard).join('')}</div></div></section>`
    );
  }

  // === FORM BUILDERS ===
    const field = (name, label, type = 'text', options, isRequired = true, extraAttrs = '') =>
    '<label class="field">' + label + (isRequired ? ' *' : ' <small style="font-weight:400;opacity:0.75">(opcional)</small>') + (options ? '<select name="' + name + '"' + (isRequired ? ' required' : '') + '><option value="">Selecione</option>' + options.map(o => '<option value="' + esc(typeof o === 'string' ? o : o.id) + '" ' + (state.selectedSpace === (o.id || o) ? 'selected' : '') + '>' + (typeof o === 'string' ? o : o.name) + '</option>').join('') + '</select>' : type === 'textarea' ? '<textarea name="' + name + '"' + (isRequired ? ' required' : '') + ' maxlength="4000"></textarea>' : '<input name="' + name + '" type="' + type + '"' + (isRequired ? ' required' : '') + (type === 'date' ? ' min="' + today() + '"' : '') + (type === 'number' ? ' min="1" max="1000000"' : type === 'tel' ? ' autocomplete="tel" minlength="8" maxlength="25"' : type === 'email' ? ' autocomplete="email" maxlength="254"' : type === 'file' ? ' accept="' + extraAttrs + '"' : ' maxlength="200"') + '>') + '</label>';

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
    const introHtml = `
      <section class="page-intro" style="padding: 55px 5% 45px; background: var(--navy); color: white;">
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 20px;">
          <div style="flex: 1 1 500px;">
            ${crumb('Imprensa')}
            <h1>O parque em movimento.</h1>
            <p style="color: #dce5ec; max-width: 620px; margin-top: 20px; font-size: 16px;">Jornalistas, ve&iacute;culos e produtores encontram aqui informa&ccedil;&otilde;es para contar essa hist&oacute;ria com precis&atilde;o.</p>
          </div>
          <div style="margin-bottom: 20px;">
            <a href="#assessoria" class="button" style="background-color: #1B8F3A; color: white; border: none; white-space: nowrap;">Pauta, entrevista e credenciamento &nearr;</a>
          </div>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 30px;">
          <button class="filter" onclick="document.getElementById('noticias').scrollIntoView({behavior:'smooth'})" style="text-decoration:none">Not&iacute;cias e cobertura</button>
          <button class="filter" onclick="document.getElementById('galeria-secao').scrollIntoView({behavior:'smooth'})" style="text-decoration:none">Galeria de fotos</button>
          <button class="filter" onclick="document.getElementById('kit').scrollIntoView({behavior:'smooth'})" style="text-decoration:none">Kit de imprensa</button>
          <button class="filter" onclick="document.getElementById('assessoria').scrollIntoView({behavior:'smooth'})" style="text-decoration:none">Fale com a assessoria</button>
        </div>
      </section>
    `;

    const newsHtml = `
      <section id="noticias" class="wrap" style="padding-top: 60px;">
        ${heading('NOT&Iacute;CIAS E COBERTURA', 'O que acontece<br>ganha o mundo.')}
        <div id="news-filters"></div>
        <div id="news-results" style="margin-top: 30px;"></div>
      </section>
    `;

    const galleryHtml = `
      <section id="galeria-secao" class="wrap" style="background: #f4f7f9; padding-top: 60px; padding-bottom: 60px; border-radius: 12px; margin-bottom: 60px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 20px; margin-bottom: 30px;">
          <div style="flex: 1 1 400px;">
            ${heading('GALERIA DE FOTOS', 'Imagens oficiais do projeto para uso editorial.', 'Cr&eacute;dito obrigat&oacute;rio: Parque Novo Mato Grosso.')}
          </div>
          <div class="filterbar" style="margin-bottom: 0;" id="gallery-tabs"></div>
        </div>
        <div id="gallery-albums"></div>
        <div style="text-align: center; margin-top: 40px;">
          <a href="#galeria" class="button light" style="background: transparent; border: 1px solid #bdcbd6; color: var(--navy); border-radius: 100px;">Ver todas as imagens &nearr;</a>
        </div>
      </section>
    `;

    const footerHtml = `
      <section class="wrap" style="display: flex; flex-wrap: wrap; gap: 30px; margin-bottom: 80px;">
        <div id="kit" style="flex: 1 1 300px; background: var(--navy); color: white; padding: 40px; border-radius: 12px; display: flex; flex-direction: column;">
          <span class="kicker" style="color: #bde5b5;">KIT DE IMPRENSA</span>
          <h3 style="font-size: 32px; margin: 15px 0;">Material para conhecer a marca.</h3>
          <p style="color: #dce5ec; margin-bottom: 30px;">Logos extra&iacute;dos do manual, ficha institucional, cr&eacute;ditos e orienta&ccedil;&otilde;es. Confira o conte&uacute;do e as condi&ccedil;&otilde;es de uso no pacote.</p>
          <ul style="list-style: none; padding: 0; margin: 0 0 40px 0; color: #dce5ec;">
            <li style="margin-bottom: 10px; display:flex; gap:10px;"><svg width="18" height="18" fill="none" stroke="#1B8F3A" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> Logos</li>
            <li style="margin-bottom: 10px; display:flex; gap:10px;"><svg width="18" height="18" fill="none" stroke="#1B8F3A" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> Ficha institucional</li>
            <li style="margin-bottom: 10px; display:flex; gap:10px;"><svg width="18" height="18" fill="none" stroke="#1B8F3A" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> Cr&eacute;ditos e orienta&ccedil;&otilde;es</li>
          </ul>
          <a href="${config.kit}" download class="button" style="background: white; color: var(--navy); text-align: center; margin-top: auto; border: none; border-radius: 100px;">Baixar kit de imprensa &darr;</a>
        </div>

        <div id="assessoria" style="flex: 2 1 500px; border: 1px solid #bdcbd6; padding: 40px; border-radius: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px;">
            <div>
              <span class="kicker">FALE COM A ASSESSORIA</span>
              <h2 style="font-size: 36px; margin: 10px 0 30px 0;">Pauta, entrevista e credenciamento.</h2>
            </div>
            <div style="background: #e8f5e9; color: #1B8F3A; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: bold; max-width: 250px;">
              A equipe responde em at&eacute; dois dias &uacute;teis ap&oacute;s o recebimento.
            </div>
          </div>
          <form data-form="imprensa" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
            <div>${field('nome', 'Nome')}</div>
            <div>${field('veiculo', 'Ve&iacute;culo')}</div>
            <div>${field('email', 'E-mail', 'email')}</div>
            <div>${field('telefone', 'Telefone', 'tel')}</div>
            <div>${field('tipo', 'Tipo de solicita&ccedil;&atilde;o', 'text', ['Entrevista', 'Visita t&eacute;cnica', 'Credenciamento', 'Informa&ccedil;&otilde;es'])}</div>
            <div>${field('editoria', 'Editoria (opcional)', 'text', null, false)}</div>
            
            <div style="grid-column: 1 / -1;">${field('prazo', 'Prazo de fechamento', 'date', null, false)}</div>
            <div style="grid-column: 1 / -1; margin-bottom: 10px;">${field('mensagem', 'Mensagem', 'textarea')}</div>
            
            <div style="grid-column: 1 / -1;">
              <input type="text" name="_gotcha_honey" style="display:none !important; opacity:0; position:absolute; left:-9999px;" tabindex="-1" autocomplete="off" aria-hidden="true">
              <div class="form-actions full" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; flex-direction: row-reverse;">
                <button class="button" type="submit" style="background-color: #1B8F3A !important; color: #fff !important; border: none;">Enviar solicita&ccedil;&atilde;o &nearr;</button>
                <p class="form-note full" style="margin: 0; color: #666; font-size: 14px;">O envio ser&aacute; confirmado nesta p&aacute;gina.</p>
              </div>
              <p class="form-status" role="status"></p>
            </div>
          </form>
        </div>
      </section>
      <style>
        #assessoria .field.full, #assessoria .check.full { grid-column: 1 / -1; }
      </style>
    `;

    return introHtml + newsHtml + galleryHtml + footerHtml;
  }

  function newsArticle(id) {
    const n = data.news?.find(x => x.id === id);
    if (!n) return notFound();

    const hero = `<section class="space-hero news-hero" style="min-height: 60vh; padding-top: 140px;"><img src="${asset(n.image)}" alt="${esc(n.title)}"><div class="space-hero-copy" style="padding-top: 0;">${crumb(`<a href="#imprensa">Imprensa</a> / ${esc(n.title)}`)}<span class="kicker">${esc(n.category)} &middot; ${fmt(n.date)}</span><h1>${esc(n.title)}</h1><p class="image-note">Fonte: ${esc(n.source)}</p></div></section>`;

    return (
      hero +
      `<section class="wrap detail-layout"><article class="prose">${n.fullText ? n.fullText.map(p => `<p>${esc(p)}</p>`).join('') : `<p>${esc(n.description)}</p>`}</article>
      <aside class="detail-aside"><span class="kicker">ASSESSORIA DE IMPRENSA</span><h3>Fale com a equipe.</h3><p>Solicite credenciamento, entrevistas ou informações detalhadas sobre as coberturas e obras do parque.</p><a class="button" href="#imprensa">Acessar portal <span>↗</span></a></aside></section>`
    );
  }

  
  window.toggleMoreNews = function() {
    const el = document.getElementById('more-news-container');
    const btn = document.getElementById('more-news-btn');
    if (el) el.style.display = 'grid';
    if (btn) btn.style.display = 'none';
  };

  window.setImprensaGalleryTab = function(tab) {
    state.imprensaGalleryTab = tab;
    updateImprensaGallery();
  };

  function updateNews() {
    if (!data.news || !data.news.length) return;

    const sortedNews = [...data.news].sort((a, b) => new Date(b.date) - new Date(a.date));

    const validCategories = [...new Set(sortedNews.map(n => n.category))];
    const categories = ['Todos', ...validCategories];
    
    const filtersContainer = document.getElementById('news-filters');
    if (filtersContainer) {
      filtersContainer.innerHTML = filters(categories, state.newsFilter, 'not&iacute;cias');
    }

    const filteredNews = sortedNews.filter((n) => state.newsFilter === 'Todos' || state.newsFilter === n.category);

    const resultsContainer = document.getElementById('news-results');
    if (!resultsContainer) return;

    if (filteredNews.length === 0) {
      resultsContainer.innerHTML = '<p>Nenhuma mat&eacute;ria encontrada.</p>';
      return;
    }

    const featured = filteredNews[0];
    const rest = filteredNews.slice(1);
    const firstFour = rest.slice(0, 4);
    const hidden = rest.slice(4);

    let html = `
      <div class="featured-news" style="display: flex; flex-wrap: wrap; gap: 30px; margin-bottom: 40px; background: #fff; border: 1px solid #bdcbd6; border-radius: 12px; overflow: hidden;">
        <div style="flex: 1 1 400px; min-height: 300px;">
          <img src="${asset(featured.image)}" alt="${esc(featured.title)}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div style="flex: 1 1 400px; padding: 40px; display: flex; flex-direction: column; justify-content: center;">
          <div style="margin-bottom: 15px;">
            <span style="background: #1B8F3A; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-right: 10px;">Mais recente</span>
            <span class="kicker" style="color: #666;">${esc(featured.category)} &middot; ${fmt(featured.date)} &middot; ${esc(featured.source)}</span>
          </div>
          <h3 style="font-size: 28px; margin-bottom: 15px; color: var(--navy);">${esc(featured.title)}</h3>
          <p style="color: #666; margin-bottom: 25px;">${esc(featured.description)}</p>
          <a href="#noticia/${featured.id}" style="color: #1B8F3A; font-weight: bold; text-decoration: none;">Ler mat&eacute;ria completa &rarr;</a>
        </div>
      </div>
    `;

    if (firstFour.length > 0) {
      html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 30px;">`;
      
      const renderCard = (n) => `
        <article style="display: flex; flex-direction: column; gap: 15px;">
          <div style="border-radius: 8px; overflow: hidden; aspect-ratio: 16/9;">
            <img src="${asset(n.image)}" alt="${esc(n.title)}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div>
            <div class="kicker" style="color: #666; margin-bottom: 8px;">${esc(n.category)} &middot; ${fmt(n.date)}</div>
            <h4 style="font-size: 18px; margin-bottom: 15px; color: var(--navy);">${esc(n.title)}</h4>
            <a href="#noticia/${n.id}" style="color: #1B8F3A; font-weight: bold; text-decoration: none; font-size: 14px;">Ler mat&eacute;ria completa &rarr;</a>
          </div>
        </article>
      `;

      html += firstFour.map(renderCard).join('');
      html += `</div>`;

      if (hidden.length > 0) {
        html += `
          <div style="text-align: center; margin-top: 40px;">
            <button id="more-news-btn" class="button light" onclick="toggleMoreNews()" style="background: white; border: 1px solid #bdcbd6; border-radius: 100px; padding: 10px 20px;">Ver mais not&iacute;cias (${hidden.length})</button>
          </div>
          <div id="more-news-container" style="display: none; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 30px; margin-top: 40px;">
            ${hidden.map(renderCard).join('')}
          </div>
        `;
      }
    }

    resultsContainer.innerHTML = html;
  }

  function updateImprensaGallery() {
    const tabsContainer = document.getElementById('gallery-tabs');
    const resultsContainer = document.getElementById('gallery-albums');
    if (!tabsContainer || !resultsContainer || !data.gallery) return;

    // Clear the tabs container completely since we don't need tabs anymore
    tabsContainer.innerHTML = '';

    const imagesWithIndex = data.gallery.map((g, i) => ({...g, originalIndex: i}));

    // Group all images by space (title)
    const albums = {};
    imagesWithIndex.forEach(img => {
      const space = img.title || 'Geral';
      if (!albums[space]) albums[space] = [];
      albums[space].push(img);
    });

    let html = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 30px;">`;

    Object.keys(albums).forEach(space => {
      const imgs = albums[space];
      const mainImg = imgs[0];
      const smallImgs = imgs.slice(1, 3);
      const remaining = imgs.length - 3;

      let mosaicHtml = `
        <div style="display: flex; gap: 4px; height: 200px; border-radius: 8px; overflow: hidden; margin-bottom: 15px; cursor: pointer;" onclick="showPhoto(${mainImg.originalIndex})">
          <div style="flex: 2; height: 100%;">
            <img src="${asset(mainImg.image)}" alt="${esc(mainImg.title)}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
      `;

      if (smallImgs.length > 0) {
        mosaicHtml += `<div style="flex: 1; display: flex; flex-direction: column; gap: 4px; height: 100%;">`;
        smallImgs.forEach((img, idx) => {
          const isLast = idx === 1;
          mosaicHtml += `
            <div style="flex: 1; position: relative; height: ${smallImgs.length === 1 ? '100%' : 'calc(50% - 2px)'};">
              <img src="${asset(img.image)}" alt="${esc(img.title)}" style="width: 100%; height: 100%; object-fit: cover;">
              ${isLast && remaining > 0 ? `<div style="position: absolute; inset: 0; background: rgba(13, 43, 77, 0.7); color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold;">+${remaining}</div>` : ''}
            </div>
          `;
        });
        mosaicHtml += `</div>`;
      }

      mosaicHtml += `</div>`;

      // Fixed the credit string to not be double escaped if it falls back to default
      const creditText = mainImg.credit ? esc(mainImg.credit) : 'Divulgação PNMT';

      html += `
        <article>
          ${mosaicHtml}
          <h4 style="font-size: 18px; color: var(--navy); margin-bottom: 5px;">${esc(space)}</h4>
          <p style="color: #666; font-size: 13px; margin-bottom: 10px;">${imgs.length} imagens &middot; ${creditText}</p>
          <button class="inline-link" onclick="showPhoto(${mainImg.originalIndex})" style="color: #1B8F3A; font-weight: bold; font-size: 14px; background: none; border: none; padding: 0; cursor: pointer;">Ver álbum &nearr;</button>
        </article>
      `;
    });

    html += `</div>`;
    resultsContainer.innerHTML = html;
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
          <button class="button secondary" data-action="photo-prev" aria-label="Foto anterior" style="padding:6px 14px;font-size:14px;">&larr; Anterior</button>
          
          <span style="font-size:13px;opacity:0.8; display:flex; align-items:center; gap: 15px;">
            ${index + 1} de ${total}
            <a href="${asset(g.image)}" download="${g.title.replace(/\s+/g, '-').toLowerCase()}-${index}.jpg" title="Baixar imagem" style="color:var(--navy);"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></a>
          </span>
          
          <button class="button secondary" data-action="photo-next" aria-label="Pr&oacute;xima foto" style="padding:6px 14px;font-size:14px;">Pr&oacute;xima &rarr;</button>
        </div>
        <p>${esc(g.type)} &middot; ${esc(g.credit)}</p>
        ${g.source ? external(g.source, 'Consulte a fonte e os cr&eacute;ditos') : ''}
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
