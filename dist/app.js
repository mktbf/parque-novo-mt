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

  // === AGENDA ===\n
window.downloadICS = function(eventId) {
  const eventsData = window.agendaData || [];
  const event = eventsData.find(e => e.id === eventId);
  if (!event) return;
  const formatDate = (date, endOfDay) => {
    const d = new Date(date);
    if (endOfDay) d.setHours(23, 59, 59, 999);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  };
  const start = new Date(event.dataInicio + 'T00:00:00-04:00');
  const end = new Date((event.dataFim || event.dataInicio) + 'T00:00:00-04:00');
  const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Parque Novo MT//Agenda//PT\r\nBEGIN:VEVENT\r\nUID:${event.id}@parquenovomt.com\r\nDTSTAMP:${formatDate(new Date())}\r\nDTSTART:${formatDate(start)}\r\nDTEND:${formatDate(end, true)}\r\nSUMMARY:${event.nome}\r\nLOCATION:${event.espaco} - Parque Novo Mato Grosso\r\nDESCRIPTION:Categoria: ${event.categoria}\r\nEND:VEVENT\r\nEND:VCALENDAR`;
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${event.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  function agenda() {
  return `<div id="agenda-root" class="agenda-root"></div>`;
}

async function updateAgenda() {
  const root = document.getElementById('agenda-root');
  if (!root) return;

  if (!window.agendaData) {
    window.agendaData = [
  {
    "id": "track-day-nmt",
    "nome": "Track Day Novo Mato Grosso",
    "dataInicio": "2026-10-24",
    "espaco": "Autódromo",
    "slugEspaco": "autodromo",
    "categoria": "Automobilismo",
    "status": "confirmado"
  },
  {
    "id": "estadual-ciclismo",
    "nome": "Campeonato Estadual de Ciclismo de Estrada",
    "dataInicio": "2026-11-08",
    "espaco": "Pista de Ciclismo e Caminhada",
    "slugEspaco": "",
    "categoria": "Esporte",
    "status": "confirmado"
  },
  {
    "id": "final-estadual-motocross",
    "nome": "Final Estadual Moto Cross",
    "dataInicio": "2026-11-20",
    "dataFim": "2026-11-21",
    "espaco": "Motocross",
    "slugEspaco": "motocross",
    "categoria": "Motociclismo",
    "status": "confirmado"
  },
  {
    "id": "kart-estadual-endurance",
    "nome": "Kart Estadual de Endurance",
    "dataInicio": "2026-12-05",
    "espaco": "Kartódromo",
    "slugEspaco": "kartodromo",
    "categoria": "Automobilismo",
    "status": "confirmado"
  },
  {
    "id": "triathlon-3-etapa",
    "nome": "Triathlon MT, 3ª Etapa Estadual",
    "dataInicio": "2026-12-13",
    "espaco": "Pista de Ciclismo e Caminhada",
    "slugEspaco": "",
    "categoria": "Esporte",
    "status": "confirmado"
  },
  {
    "id": "corrida-de-reis",
    "nome": "Corrida de Reis",
    "dataInicio": "2026-01-11",
    "espaco": "Pista de Ciclismo e Caminhada",
    "slugEspaco": "",
    "categoria": "Corridas de rua",
    "status": "concluido"
  },
  {
    "id": "semana-do-cavalo",
    "nome": "Semana do Cavalo",
    "dataInicio": "2026-03-04",
    "dataFim": "2026-03-14",
    "espaco": "Arena Show",
    "slugEspaco": "arena-show",
    "categoria": "Festivais e Agro",
    "status": "concluido"
  },
  {
    "id": "triathlon-1-etapa",
    "nome": "Triathlon MT, 1ª Etapa Estadual",
    "dataInicio": "2026-03-29",
    "espaco": "Pista de Ciclismo e Caminhada",
    "slugEspaco": "",
    "categoria": "Esporte",
    "status": "concluido"
  },
  {
    "id": "circuito-bb-corrida",
    "nome": "Circuito Banco do Brasil de Corrida de Rua 2026",
    "dataInicio": "2026-04-12",
    "espaco": "Pista de Ciclismo e Caminhada",
    "slugEspaco": "",
    "categoria": "Corridas de rua",
    "status": "concluido"
  },
  {
    "id": "classic-pantanal",
    "nome": "Classic Pantanal",
    "dataInicio": "2026-05-08",
    "dataFim": "2026-05-09",
    "espaco": "Arena Show",
    "slugEspaco": "arena-show",
    "categoria": "Festivais e Agro",
    "status": "concluido"
  },
  {
    "id": "motocross-brasileiro",
    "nome": "Moto Cross, 5ª Etapa Campeonato Brasileiro",
    "dataInicio": "2026-05-21",
    "dataFim": "2026-05-24",
    "espaco": "Motocross",
    "slugEspaco": "motocross",
    "categoria": "Motociclismo",
    "status": "concluido",
    "linkCobertura": "#imprensa/motocross"
  },
  {
    "id": "green-farm",
    "nome": "Green Farm",
    "dataInicio": "2026-05-27",
    "dataFim": "2026-05-31",
    "espaco": "Arena Show",
    "slugEspaco": "arena-show",
    "categoria": "Festivais e Agro",
    "status": "concluido"
  },
  {
    "id": "formula-truck",
    "nome": "Fórmula Truck",
    "dataInicio": "2026-06-13",
    "dataFim": "2026-06-14",
    "espaco": "Autódromo",
    "slugEspaco": "autodromo",
    "categoria": "Automobilismo",
    "status": "concluido",
    "linkCobertura": "#imprensa/formula-truck"
  },
  {
    "id": "stock-car",
    "nome": "Stock Car",
    "dataInicio": "2026-06-20",
    "espaco": "Autódromo",
    "slugEspaco": "autodromo",
    "categoria": "Automobilismo",
    "status": "concluido"
  },
  {
    "id": "conesv",
    "nome": "CONESV, Congresso Nacional de Segurança",
    "dataInicio": "2026-06-24",
    "dataFim": "2026-06-26",
    "espaco": "Arena Show",
    "slugEspaco": "arena-show",
    "categoria": "Corporativo",
    "status": "concluido"
  },
  {
    "id": "stu-nacional",
    "nome": "STU Nacional, Campeonato Brasileiro de Skate",
    "dataInicio": "2026-06-25",
    "dataFim": "2026-06-28",
    "espaco": "Complexo de Skate",
    "slugEspaco": "complexo-de-skate",
    "categoria": "Esporte",
    "status": "concluido",
    "linkCobertura": "#imprensa/stu"
  },
  {
    "id": "triathlon-2-etapa",
    "nome": "Triathlon MT, 2ª Etapa Estadual",
    "dataInicio": "2026-06-28",
    "espaco": "Pista de Ciclismo e Caminhada",
    "slugEspaco": "",
    "categoria": "Esporte",
    "status": "concluido"
  },
  {
    "id": "bmx-brasileiro",
    "nome": "BMX Campeonato Brasileiro de Bicicross",
    "dataInicio": "2026-07-05",
    "espaco": "Pista de BMX",
    "slugEspaco": "pista-de-bmx",
    "categoria": "Esporte",
    "status": "concluido",
    "linkCobertura": "#imprensa/bmx",
    "obs": "data a confirmar: planilha 01/06 a 05/07, materia 15/07"
  },
  {
    "id": "corrida-live-run",
    "nome": "Corrida Live Run",
    "dataInicio": "2026-07-05",
    "espaco": "Pista de Ciclismo e Caminhada",
    "slugEspaco": "",
    "categoria": "Corridas de rua",
    "status": "concluido"
  },
  {
    "id": "copa-brasil-arrancada",
    "nome": "Copa Brasil de Arrancada",
    "dataInicio": "2026-07-10",
    "dataFim": "2026-07-11",
    "espaco": "Autódromo",
    "slugEspaco": "autodromo",
    "categoria": "Automobilismo",
    "status": "concluido"
  },
  {
    "id": "nascar-brasil",
    "nome": "NASCAR Brasil e Copa Truck",
    "dataInicio": "2026-08-01",
    "espaco": "Autódromo",
    "slugEspaco": "autodromo",
    "categoria": "Automobilismo",
    "status": "concluido",
    "linkCobertura": "#imprensa/nascar"
  },
  {
    "id": "pbr-brasil",
    "nome": "PBR Brasil, Agrofestival",
    "dataInicio": "2026-08-07",
    "dataFim": "2026-08-09",
    "espaco": "Arena Show",
    "slugEspaco": "arena-show",
    "categoria": "Festivais e Agro",
    "status": "concluido"
  },
  {
    "id": "formula-a",
    "nome": "Fórmula A e Turismo Centro Oeste",
    "dataInicio": "2026-09-11",
    "dataFim": "2026-09-12",
    "espaco": "Autódromo",
    "slugEspaco": "autodromo",
    "categoria": "Automobilismo",
    "status": "concluido"
  },
  {
    "id": "circuito-mt-skate",
    "nome": "Circuito Matogrossense de Skate",
    "dataInicio": "2026-09-26",
    "espaco": "Complexo de Skate",
    "slugEspaco": "complexo-de-skate",
    "categoria": "Esporte",
    "status": "concluido"
  }
];
  }

  const now = new Date();
  const parseDate = (dstr) => new Date(dstr + 'T00:00:00-04:00');

  const events = window.agendaData.map(e => {
    const parsedStart = parseDate(e.dataInicio);
    const parsedEnd = e.dataFim ? parseDate(e.dataFim) : parsedStart;
    const endOfDay = new Date(parsedEnd);
    endOfDay.setHours(23, 59, 59, 999);
    const isPast = (e.status === 'concluido') || (e.status === 'confirmado' && endOfDay < now);
    return { ...e, parsedStart, parsedEnd, endOfDay, isPast };
  });

  if (!window.agendaInit) {
    const hasFuture = events.some(e => !e.isPast);
    state.agendaPeriod = hasFuture ? 'upcoming' : 'past';
    state.agendaFilter = 'Todos';
    window.agendaInit = true;
    window.lastAgendaPeriod = state.agendaPeriod;
  }

  if (window.lastAgendaPeriod !== state.agendaPeriod) {
    state.agendaFilter = 'Todos';
    window.lastAgendaPeriod = state.agendaPeriod;
  }

  const currentTabEvents = events.filter(e => state.agendaPeriod === 'upcoming' ? !e.isPast : e.isPast);
  
  if (state.agendaPeriod === 'upcoming') {
    currentTabEvents.sort((a, b) => a.parsedStart - b.parsedStart);
  } else {
    currentTabEvents.sort((a, b) => b.parsedStart - a.parsedStart);
  }

  const availableCats = ['Todos', ...new Set(currentTabEvents.map(e => e.categoria))];
  const list = currentTabEvents.filter(e => state.agendaFilter === 'Todos' || e.categoria === state.agendaFilter);

  const formatMonth = (d) => {
    const m = d.toLocaleString('pt-BR', { month: 'long', timeZone: 'America/Cuiaba' });
    return m.charAt(0).toUpperCase() + m.slice(1) + ' ' + d.getFullYear();
  };

  const realized2026 = events.filter(e => e.isPast && e.parsedStart.getFullYear() === 2026).length;
  const confirmedDec = events.filter(e => e.status === 'confirmado' && e.parsedStart.getFullYear() === 2026 && e.parsedStart.getMonth() <= 11).length;

  const headerHtml = `
    <section class="agenda-hero">
      <div class="agenda-hero-content">
        ${crumb('<a href="#agenda">Agenda</a>')}
        <h1>O que está por vir.</h1>
        <p>Shows, corridas, campeonatos, feiras e eventos culturais. Escolha o que você quer viver.</p>
      </div>
      <div class="agenda-hero-stats">
        <div class="stat-box">
          <span class="stat-num green-lime">${realized2026}</span>
          <span class="stat-lbl">eventos realizados em 2026</span>
        </div>
        <div class="stat-box">
          <span class="stat-num">${confirmedDec}</span>
          <span class="stat-lbl">confirmados até dezembro</span>
        </div>
      </div>
      <div class="agenda-tabs">
        <button class="agenda-tab ${state.agendaPeriod === 'upcoming' ? 'active' : ''}" data-period="upcoming">
          Próximos eventos (${events.filter(e => !e.isPast).length})
        </button>
        <button class="agenda-tab ${state.agendaPeriod === 'past' ? 'active' : ''}" data-period="past">
          Já aconteceu (${events.filter(e => e.isPast).length})
        </button>
      </div>
    </section>
  `;

  const filtersHtml = `
    <div class="agenda-filters wrap">
      ${availableCats.map(c => {
        const count = c === 'Todos' ? currentTabEvents.length : currentTabEvents.filter(e => e.categoria === c).length;
        return `<button class="filter ${state.agendaFilter === c ? 'active' : ''}" data-filter="agenda" data-value="${c}">${c} (${count})</button>`;
      }).join('')}
    </div>
  `;

  let contentHtml = '';

  if (state.agendaPeriod === 'upcoming') {
    if (list.length === 0) {
      contentHtml = `<div class="empty-state wrap">
        <span class="kicker">NOVOS ENCONTROS VÊM AÍ</span>
        <h3>A próxima experiência está a caminho.</h3>
        <button class="button secondary" data-period="past">Ver o que já aconteceu</button>
      </div>`;
    } else {
      const nextEvent = list[0];
      const daysLeft = Math.ceil((nextEvent.parsedStart - now) / (1000 * 60 * 60 * 24));
      const dateExt = nextEvent.parsedStart.toLocaleString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Cuiaba' });
      
      const spaceLink = nextEvent.slugEspaco ? `<a href="#espaco/${nextEvent.slugEspaco}" class="button secondary">Conhecer o ${nextEvent.espaco} ↗</a>` : '';

      const firstMonth = formatMonth(nextEvent.parsedStart);
      const destaqueHtml = `
        <h3 class="agenda-month-title wrap">${firstMonth.toUpperCase()}</h3>
        <div class="agenda-destaque wrap">
          <img src="${asset('gallery/' + (nextEvent.slugEspaco || 'parque-da-familia') + '-01.jpg')}" alt="${nextEvent.espaco}" class="destaque-img" onerror="this.src='${asset('gallery/parque-da-familia-01.jpg')}'">
          <div class="destaque-info">
            <div class="destaque-tags">
              <span class="tag-proximo">Próximo evento</span>
              <span class="tag-dias">Faltam ${daysLeft} dias</span>
            </div>
            <h2>${nextEvent.nome}</h2>
            <p>${dateExt.charAt(0).toUpperCase() + dateExt.slice(1)} • ${nextEvent.espaco}</p>
            <div class="destaque-actions">
              <button class="button" onclick="window.downloadICS('${nextEvent.id}')">Adicionar à minha agenda</button>
              ${spaceLink}
            </div>
          </div>
        </div>
      `;

      const rest = list;
      let listHtml = '';
      let lastMonth = firstMonth;
      for (const e of rest) {
        const m = formatMonth(e.parsedStart);
        if (m !== lastMonth) {
          listHtml += `<h3 class="agenda-month-title wrap">${m.toUpperCase()}</h3>`;
          lastMonth = m;
        }
        const startDay = String(e.parsedStart.getDate()).padStart(2, '0');
        const endDay = e.dataFim ? String(e.parsedEnd.getDate()).padStart(2, '0') : '';
        const shortMonth = e.parsedStart.toLocaleString('pt-BR', { month: 'short', timeZone: 'America/Cuiaba' }).toUpperCase().replace('.', '');
        const dayStr = endDay && endDay !== startDay ? `${startDay}-${endDay}` : startDay;
        
        listHtml += `
          <article class="agenda-list-card wrap">
            <div class="card-date-box">
              <span class="day">${dayStr}</span>
              <span class="month">${shortMonth}</span>
            </div>
            <div class="card-info">
              <span class="category green">${e.categoria}</span>
              <h4>${e.nome}</h4>
              <p class="location"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> ${e.espaco}</p>
            </div>
            <div class="card-status">
              <span class="tag-confirmado">Confirmado</span>
            </div>
            <div class="card-action">
              <button class="button secondary" onclick="document.querySelector('#form-aviso select').value='${e.categoria}'; document.querySelector('#form-aviso').scrollIntoView({behavior:'smooth'})">Quero ser avisado</button>
            </div>
          </article>
        `;
      }

      contentHtml = destaqueHtml + listHtml;
    }
  } else {
    if (list.length === 0) {
      contentHtml = `<div class="empty-state wrap">
        <span class="kicker">MEMÓRIAS DO PARQUE</span>
        <h3>Nenhum registro nesta categoria.</h3>
        <p>Escolha outra categoria para explorar os eventos registrados.</p>
      </div>`;
    } else {
      let listHtml = '';
      let lastMonth = '';
      listHtml += '<div class="wrap past-grid">';
      for (const e of list) {
        const m = formatMonth(e.parsedStart);
        if (m !== lastMonth) {
          if (lastMonth !== '') listHtml += '</div><div class="wrap past-grid">';
          listHtml += `<h3 class="agenda-month-title full-width">${m.toUpperCase()}</h3>`;
          lastMonth = m;
        }
        
        const startDay = String(e.parsedStart.getDate()).padStart(2, '0');
        const endDay = e.dataFim ? String(e.parsedEnd.getDate()).padStart(2, '0') : '';
        const shortMonth = e.parsedStart.toLocaleString('pt-BR', { month: 'short', timeZone: 'America/Cuiaba' }).toUpperCase().replace('.', '');
        const dayStr = endDay && endDay !== startDay ? `${startDay}-${endDay}` : startDay;
        
        const cobertura = e.linkCobertura ? `<a href="${e.linkCobertura}" class="cobertura-link">Ver cobertura →</a>` : '';

        listHtml += `
          <article class="past-card">
            <img src="${asset('spaces/' + (e.slugEspaco || 'parque-da-familia'))}.webp" alt="${e.espaco}" class="past-card-img" onerror="this.src='${asset('gallery/parque-da-familia-01.jpg')}'">
            <div class="past-card-content">
              <span class="past-date">${dayStr} ${shortMonth} ${e.parsedStart.getFullYear()}</span>
              <span class="past-category">${e.categoria}</span>
              <h4>${e.nome}</h4>
              <p class="past-location">${e.espaco}</p>
              ${cobertura}
            </div>
          </article>
        `;
      }
      listHtml += '</div>';
      contentHtml = listHtml;
    }
  }

  const allCategories = ['Todos', 'Automobilismo', 'Motociclismo', 'Esporte', 'Corridas de rua', 'Festivais e Agro', 'Corporativo'];

  const footerHtml = `
    <section class="agenda-footer wrap">
      <div class="agenda-newsletter">
        <span class="kicker">FIQUE POR PERTO</span>
        <h3>Não encontrou o que procura?</h3>
        <p>Escolha o que você quer viver e deixe seu interesse registrado.</p>
        <form id="form-aviso" data-form="newsletter">
          <input type="hidden" name="origem" value="agenda">
          ${field('nome', 'Seu nome')}
          ${field('email', 'Seu e-mail', 'email')}
          ${field('interesse', 'Tenho interesse em', 'text', allCategories)}
          ${formEnd('newsletter', 'Quero ser avisado')}
        </form>
      </div>
      <div class="agenda-realize">
        <span class="kicker">QUERO REALIZAR MEU EVENTO</span>
        <h3>Shows, feiras, competições e grandes encontros.</h3>
        <p>Conte o que você quer fazer. A nossa equipe retorna com a melhor estrutura para a sua transmissão, espaço e operação.</p>
        <a href="#evento" class="button">Realize seu evento ↗</a>
      </div>
    </section>
  `;

  root.innerHTML = headerHtml + filtersHtml + contentHtml + footerHtml;
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
            ${heading('IMPRENSA', 'Galeria de fotos', 'Imagens oficiais do projeto para uso editorial. Cr&eacute;dito obrigat&oacute;rio: Parque Novo Mato Grosso.')}
          </div>
        </div>
        <div id="gallery-albums"></div>
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
          <a href="${config.kit || '#'}" download class="button" style="background: white; color: var(--navy); text-align: center; margin-top: auto; border: none; border-radius: 100px;">Baixar kit de imprensa &darr;</a>
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
              <label class="check full" style="display: flex; gap: 10px; margin-bottom: 20px; align-items: center;"><input type="checkbox" name="consentimento" required><span style="font-size: 13px;">Autorizo o uso dos dados informados para atendimento desta pauta e confirmo as diretrizes de privacidade.</span></label>
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

    // Make hero image clickable if we can't find a gallery, otherwise just show it
    const hero = `<section class="space-hero news-hero" style="min-height: 60vh; padding-top: 140px; cursor: pointer;" onclick="window.showSimplePhoto('${asset(n.image)}', '${esc(n.title)}')"><img src="${asset(n.image)}" alt="${esc(n.title)}"><div class="space-hero-copy" style="padding-top: 0;">${crumb(`<a href="#imprensa">Imprensa</a> / ${esc(n.title)}`)}<span class="kicker">${esc(n.category)} &middot; ${fmt(n.date)}</span><h1>${esc(n.title)}</h1><p class="image-note">Fonte: ${esc(n.source)}</p></div></section>`;

    // Try to find related space
    const relatedSpace = data.spaces.find(s => s.category.toLowerCase().includes(n.category.toLowerCase()) || n.title.toLowerCase().includes(s.name.toLowerCase()));
    
    // Try to find related events
    const relatedEvents = data.events ? data.events.filter(e => (e.category || e.categoria || "").toLowerCase().includes((n.category || "").toLowerCase()) || (e.title || e.name || "").toLowerCase().includes((n.category || "").toLowerCase())).slice(0, 2) : [];
    
    // If news has its own gallery, or if we can borrow the space's gallery
    const gallery = n.gallery || (relatedSpace ? relatedSpace.gallery : null);

    return (
      hero +
      `<section class="wrap detail-layout">
        <article class="prose">${n.fullText ? n.fullText.map(p => `<p>${esc(p)}</p>`).join('') : `<p>${esc(n.description)}</p>`}</article>
        <aside class="detail-aside">
          <span class="kicker">ASSESSORIA DE IMPRENSA</span>
          <h3>Fale com a equipe.</h3>
          <p>Solicite credenciamento, entrevistas ou informa&ccedil;&otilde;es detalhadas sobre as coberturas e obras do parque.</p>
          <a class="button" href="#imprensa">Acessar portal <span>&nearr;</span></a>
          
          ${relatedSpace ? `
            <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #bdcbd6;">
              <span class="kicker">ESPA&Ccedil;O RELACIONADO</span>
              <h3 style="margin: 10px 0;">${esc(relatedSpace.name)}</h3>
              <p>${esc(relatedSpace.tagline)}</p>
              <a class="text-link" href="#espaco/${relatedSpace.id}">Conhecer espa&ccedil;o &nearr;</a>
            </div>
          ` : ''}
          
          ${relatedEvents.length ? `
            <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #bdcbd6;">
              <span class="kicker">AGENDA</span>
              <h3 style="margin: 10px 0;">Pr&oacute;ximos eventos</h3>
              <ul style="list-style:none; padding:0; margin:0;">
                ${relatedEvents.map(e => `<li style="margin-bottom: 15px;"><strong style="display:block; color:var(--navy);">${esc(e.title || e.name)}</strong><small style="color:#666;">${fmt(e.date)}</small></li>`).join('')}
              </ul>
              <a class="text-link" href="#agenda">Ver agenda completa &nearr;</a>
            </div>
          ` : ''}
        </aside>
      </section>
      
      ${gallery && gallery.length > 0 ? `
        <section class="wrap detail-gallery" style="margin-top: 20px;">
          <div class="related-header"><h2>Galeria de fotos</h2></div>
          <div class="space-photo-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:16px; margin-bottom: 60px;">
            ${gallery.map((img, i) => `
              <img src="${asset(img)}" alt="Foto da galeria" loading="lazy" style="width:100%; height:220px; object-fit:cover; border-radius:12px; transition: transform 0.3s; cursor:pointer;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='none'" onclick="window.showSimplePhoto('${asset(img)}')">
            `).join('')}
          </div>
        </section>
      ` : ''}
      `
    );
  }

  window.toggleMoreNews = function() {
    const el = document.getElementById('more-news-container');
    const btn = document.getElementById('more-news-btn');
    if (el) el.style.display = 'grid';
    if (btn) btn.style.display = 'none';
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
    const resultsContainer = document.getElementById('gallery-albums');
    if (!resultsContainer || !data.gallery) return;

    const imagesWithIndex = data.gallery.map((g, i) => ({...g, originalIndex: i}));
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
      `<section class="wrap">${heading('VISITAS GUIADAS', 'Um roteiro.<br>Muitas descobertas.', 'Acompanhamento da nossa equipe do começo ao fim, pelas principais estruturas e áreas liberadas.')}<div class="service-cards"><article class="service-card"><span class="kicker">GRUPOS ESCOLARES</span><h3>Uma aula a céu aberto.</h3><p>Estudantes do ensino fundamental, médio e técnico percorrem o parque com foco em arquitetura, sustentabilidade, agro, esporte e cultura.</p><p>AgroPlace, museus e grandes estruturas compõem a proposta de roteiro, conforme liberação das áreas e faixa etária.</p></article><article class="service-card"><span class="kicker">GRUPOS DE TURISMO</span><h3>Mato Grosso em um só lugar.</h3><p>Operadoras, agências e caravanas encontram um roteiro que reúne atrações do estado dentro do mesmo complexo.</p><p>Mirantes, Vila das Nações, Casa Cuiabana e arenas, com paradas para foto e alimentação, conforme disponibilidade.</p></article><article class="service-card"><span class="kicker">GRUPOS CORPORATIVOS E TÉCNICOS</span><h3>Por dentro da operação.</h3><p>Empresas, entidades e delegações técnicas conhecem arenas, backstage, acessos, estacionamento e capacidade operacional.</p><p>A visita indicada para quem avalia realizar um evento no parque.</p></article></div></section>${s.news && s.news.length ? `<section class="wrap detail-news"><div class="related-header"><h2>Na Mídia</h2></div><div class="news-list">${s.news.map(n => `<article class="news-card"><span class="kicker">${n.source}</span><h4>${n.title}</h4></article>`).join('')}</div></section>` : ''}<section class="related"><div class="wrap service-layout"><div class="service-copy"><span class="kicker">COMO FUNCIONA</span><h2>Simples de organizar.</h2><div class="service-steps"><p>Conte sobre o grupo e indique a data pretendida.</p><p>A equipe verifica disponibilidade, roteiro e grupo mínimo.</p><p>Com a confirmação, você recebe as orientações de acesso.</p></div><div class="faq"><details open><summary>O que levar?</summary><p>Calçado confortável, protetor solar e água. Boa parte do roteiro é ao ar livre.</p></details><details><summary>Quais áreas fazem parte da visita?</summary><p>O parque está em obras em vários setores. O percurso segue sempre as áreas liberadas com segurança e é confirmado pela equipe.</p></details><details><summary>Como chegam ônibus e vans?</summary><p>Estacionamento sinalizado para ônibus e vans, com acesso direto pela rodovia.</p></details></div></div><div class="service-form"><h3>Planeje sua visita.</h3><p>A solicitação está sujeita à confirmação de data e roteiro pela equipe.</p><form data-form="visita">${field('nome', 'Nome do responsável')}${field('instituicao', 'Instituição ou empresa', 'text', null, false)}${field('grupo', 'Tipo de grupo', 'text', ['Escolar', 'Turismo', 'Corporativo ou técnico'])}${field('quantidade', 'Quantidade de pessoas', 'number')}${field('faixaEtaria', 'Faixa etária', 'text', null, false)}${field('data', 'Data pretendida', 'date')}${field('telefone', 'Telefone', 'tel')}${field('email', 'E-mail', 'email')}<div class="full">${field('observacoes', 'Observações', 'textarea', null, false)}</div>${formEnd('visita', 'Agendar minha visita')}</form></div></div></section>`
    );
  }

  // === EVENTOS & CONTATO ===
    function eventForm() {
    const eventSpaces = [
      { id: 'orientacao', name: '- Preciso de orienta\u00e7\u00e3o da equipe -' },
      { id: 'arena-show', name: 'Arena Show (At\u00e9 120 mil pessoas)' },
      { id: 'centro-de-eventos', name: 'Centro de Eventos (5 pavilh\u00f5es, at\u00e9 26 mil pessoas)' },
      { id: 'autodromo', name: 'Aut\u00f3dromo Internacional' },
      { id: 'circo-do-futuro', name: 'Teatro de Arena / Circo do Futuro' },
      { id: 'agroplace', name: 'Agroplace' },
      { id: 'arenas-beach', name: 'Quadras de Areia' },
      { id: 'skate-park', name: 'Complexo de Skate' },
      { id: 'kartodromo', name: 'Cart\u00f3dromo' },
      { id: 'outro', name: 'Outro espa\u00e7o do parque' },
    ];
    return '<div class="service-form"><h3>Vamos construir seu evento.</h3><form data-form="evento">' + field('nome', 'Nome') + field('empresa', 'Empresa ou institui\u00e7\u00e3o', 'text', null, false) + field('telefone', 'Telefone', 'tel') + field('email', 'E-mail', 'email') + field('tipo', 'Tipo de evento', 'text', ['Show', 'Feira', 'Congresso ou conven\u00e7\u00e3o', 'Competi\u00e7\u00e3o esportiva', 'Encontro corporativo', 'Outro']) + field('espaco', 'Espa\u00e7o desejado', 'text', eventSpaces, false) + field('publico', 'P\u00fablico estimado', 'number', null, false) + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;" class="full">' + field('data_evento_inicio', 'Data do evento (In\u00edcio)', 'date') + field('data_evento_fim', 'Data do evento (Fim)', 'date') + '</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;" class="full">' + field('data_mob_inicio', 'Data de mobiliza\u00e7\u00e3o (In\u00edcio)', 'date', null, false) + field('data_mob_fim', 'Data de mobiliza\u00e7\u00e3o (Fim)', 'date', null, false) + '</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;" class="full">' + field('data_desmob_inicio', 'Data de desmobiliza\u00e7\u00e3o (In\u00edcio)', 'date') + field('data_desmob_fim', 'Data de desmobiliza\u00e7\u00e3o (Fim)', 'date') + '</div><div class="full">' + field('mensagem', 'Conte sobre o evento', 'textarea', null, false) + '</div>' + formEnd('evento', 'Enviar solicita\u00e7\u00e3o') + '</form></div>';
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
    const jobs = window.PNMT_CONTENT.jobs || [];
    const activeJobs = jobs.filter(j => j.status !== 'encerrada');
    const jobsCount = activeJobs.length;

    const jobOptions = ['Banco de talentos (candidatura espontânea)', ...activeJobs.map(j => j.title)];

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

    const jobsHtml = jobs.map(job => {
      const isClosed = job.status === 'encerrada';
      const slug = job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `
        <article class="job-card ${isClosed ? 'closed' : ''}" id="vaga-${slug}">
          <div class="job-art-wrapper">
             ${job.image ? `<img src="${job.image}" alt="Vaga para ${job.title}" class="job-image" ${isClosed ? 'style="filter: grayscale(100%); opacity: 0.8;"' : ''}>` : ''}
             ${isClosed ? '<span class="closed-badge">Vaga encerrada</span>' : ''}
          </div>
          <div class="job-content">
            <h3 class="visually-hidden">${job.title}</h3>
            <div class="job-tags">
              <span class="job-badge" style="background: #e8f5e9; color: #1b8f3a;">Tempo integral</span>
              <span class="job-badge" style="background: #f0f4f8; color: #5a6c7d;">CLT (44h semanais)</span>
              <span class="job-badge" style="background: #f0f4f8; color: #5a6c7d;">Parque Novo Mato Grosso</span>
            </div>
            
            <div class="job-desc-wrapper">
              <p class="job-desc" style="white-space: pre-wrap;">${job.description}</p>
            </div>
            
            <button class="mobile-toggle-btn" style="display: none;" onclick="this.previousElementSibling.classList.toggle('expanded'); this.textContent = this.textContent === 'Ver detalhes' ? 'Ocultar detalhes' : 'Ver detalhes'">Ver detalhes</button>

            ${!isClosed ? `
            
            <a href="#cadastro-vagas" class="button job-apply-btn" onclick="document.querySelector('[name=vaga_interesse]').value='${job.title}'; document.querySelector('#submit-career-btn').textContent='Enviar candidatura &nearr;'; document.querySelectorAll('.job-card').forEach(c => c.style.borderColor=''); document.getElementById('vaga-${slug}').style.borderColor='#1b8f3a';">Candidatar-se &rarr;</a>
            ` : `
            <a href="#cadastro-vagas" class="button light job-apply-btn" onclick="document.querySelector('[name=vaga_interesse]').value='Banco de talentos (candidatura espontânea)'; document.querySelector('#submit-career-btn').textContent='Cadastrar no Banco de Talentos &nearr;';">Cadastrar no Banco de Talentos &nearr;</a>
            `}
          </div>
        </article>
      `;
    }).join('');

    const css = `
      <style>
        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }
        .job-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
          display: flex;
          flex-direction: column;
          transition: border-color 0.3s;
        }
        .job-art-wrapper {
          position: relative;
          aspect-ratio: 4 / 5;
        }
        .job-art-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .closed-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #d32f2f;
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        .job-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          border: 0;
        }
        .job-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 15px;
        }
        .job-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .job-desc-wrapper {
          margin-bottom: 15px;
          flex: 1;
        }
        .job-desc {
          font-size: 14px;
          line-height: 1.5;
        }
        
        
        .job-apply-btn {
          width: 100%;
          text-align: center;
          display: block;
        }
        .how-it-works-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 20px;
          margin-bottom: 40px;
        }
        .hiw-card {
          background: #f8fafc;
          padding: 24px;
          border-radius: 8px;
          display: flex;
          align-items: flex-start;
          gap: 15px;
        }
        .hiw-num {
          background: #1b2838; 
          color: #fff;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-weight: bold;
          flex-shrink: 0;
        }
        
        .cv-area {
          border: 2px dashed #cbd5e1;
          border-radius: 6px;
          padding: 30px 20px;
          text-align: center;
          background: #f8fafc;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cv-area:hover, .cv-area.dragover {
          border-color: #1b8f3a;
          background: #f0fdf4;
        }
        .cv-area.has-file {
          border-color: #1b8f3a;
          border-style: solid;
        }
        
        @media (max-width: 768px) {
          .jobs-grid { grid-template-columns: 1fr; }
          .how-it-works-cards { grid-template-columns: 1fr; }
          .job-desc-wrapper {
             display: none;
          }
          .job-desc-wrapper.expanded {
             display: block;
          }
          .mobile-toggle-btn {
             display: block !important;
             background: none;
             border: none;
             color: #1b8f3a;
             text-decoration: underline;
             padding: 0;
             margin-bottom: 15px;
             cursor: pointer;
             font-weight: 500;
          }
          
        }
      </style>
    `;

    return css + 
      intro('Construa o futuro com a gente.', 'Faça parte da equipe que está construindo e operando o maior complexo multieventos da América Latina no coração de Mato Grosso.', 'Trabalhe Conosco').replace('</section>', 
      `<div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 30px;">
          <button class="button" style="background-color: #1B8F3A; color: white; border: none; white-space: nowrap;" onclick="document.querySelector('.jobs-board').scrollIntoView({behavior:'smooth'})">Ver vagas abertas (${jobsCount})</button>
          <button class="button light" style="white-space: nowrap; border: 1px solid white;" onclick="document.querySelector('#cadastro-vagas').scrollIntoView({behavior:'smooth'}); document.querySelector('[name=vaga_interesse]').value='Banco de talentos (candidatura espontânea)';">Cadastrar no Banco de Talentos &nearr;</button>
        </div></section>`) + 
      `<section class="wrap">
        <span class="kicker">COMO FUNCIONA</span>
        <h2>Talentos que movem grandes experi&ecirc;ncias.</h2>
        <div class="how-it-works-cards">
          <div class="hiw-card"><div class="hiw-num">1</div><p>Preencha seus dados de contato e trajet&oacute;ria profissional.</p></div>
          <div class="hiw-card"><div class="hiw-num">2</div><p>Indique sua &aacute;rea de interesse e adicione o link do seu LinkedIn ou curr&iacute;culo online.</p></div>
          <div class="hiw-card"><div class="hiw-num">3</div><p>Nosso time de Gente &amp; Gest&atilde;o entrar&aacute; em contato quando surgirem vagas compat&iacute;veis com seu perfil.</p></div>
        </div>
      </section>
      <section class="wrap jobs-board" style="padding-top: 0;">
        ${heading('OPORTUNIDADES', `${jobsCount} vagas abertas`, 'Oportunidades presenciais e operacionais em Cuiabá-MT.')}
        ${jobsCount > 0 ? `
          <div class="jobs-grid">
            ${jobsHtml}
          </div>
        ` : `
          <p>Não há vagas abertas no momento.</p>
        `}
      </section>
      <section class="related" id="cadastro-vagas">
        <div class="wrap service-layout">
          <div class="service-copy">
            <span class="kicker">BANCO DE TALENTOS</span>
            <h2>Cadastre seu curr&iacute;culo para novas oportunidades.</h2>
            <p>Mesmo que voc&ecirc; n&atilde;o encontre uma vaga imediata para o seu perfil hoje, nosso banco de talentos &eacute; consultado continuamente &agrave; medida que novas fases e atra&ccedil;&otilde;es entram em opera&ccedil;&atilde;o.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;" />
            <p style="font-size: 14px; color: #475569;">Todas as vagas do Parque Novo Mato Grosso seguem crit&eacute;rios de igualdade de oportunidades e respeito &agrave; diversidade.</p>
          </div>

          <div id="form-container" class="service-form" style="position: relative;">
            <div id="form-success-screen" style="display: none; text-align: center; padding: 40px 20px;">
                <div style="font-size: 48px; color: #1b8f3a; margin-bottom: 20px;">&#10004;</div>
                <h3 id="form-success-title">[título a definir]</h3>
                <p style="font-weight: bold; margin: 15px 0;" id="form-success-vaga"></p>
                <p style="margin-bottom: 30px;" id="form-success-text">[texto a definir]</p>
                <button type="button" class="button light" onclick="document.getElementById('form-success-screen').style.display='none'; document.getElementById('main-form-content').style.display='block';">Voltar ao formul&aacute;rio</button>
            </div>
            
            <div id="main-form-content">
              <form data-form="trabalhe-conosco-v2" onsubmit="return false;" novalidate>
                ${field('vaga_interesse', 'Vaga de interesse *', 'select', jobOptions)}
                <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
                  ${field('nome', 'Nome completo *')}
                  ${field('email', 'Seu melhor e-mail *', 'email')}
                  ${field('telefone', 'Telefone / WhatsApp *', 'tel')}
                  ${field('cidade', 'Cidade onde reside * (ex: Cuiab&aacute;-MT)')}
                </div>
                ${field('area', '&Aacute;rea de maior interesse *', 'select', areaOptions)}
                
                <div class="full" style="margin-top: 15px;">
                  <label style="font-weight: bold; display: block; margin-bottom: 8px;">Curr&iacute;culo (anexo)</label>
                  <div class="cv-area" id="cv-drop-area" onclick="document.getElementById('cv-file').click()" ondragover="event.preventDefault(); this.classList.add('dragover')" ondragleave="this.classList.remove('dragover')" ondrop="event.preventDefault(); this.classList.remove('dragover'); document.getElementById('cv-file').files = event.dataTransfer.files; document.getElementById('cv-file').dispatchEvent(new Event('change'));">
                    <span style="font-size: 24px; color: #1b8f3a;">&#128196;</span>
                    <p style="margin: 10px 0; font-weight: 500;" id="cv-text">Arraste seu curr&iacute;culo aqui ou clique para escolher</p>
                    <p style="font-size: 12px; color: #64748b;">PDF, DOC ou DOCX, at&eacute; 5 MB</p>
                  </div>
                  <input type="file" id="cv-file" name="cv_file" accept=".pdf,.doc,.docx" style="display: none;" onchange="window.handleFileChange(this)">
                  <p id="cv-error" style="color: #d32f2f; font-size: 13px; margin-top: 5px; display: none;"></p>
                </div>
                
                ${field('linkedin', 'Link do LinkedIn ou Curr&iacute;culo online', 'url', null, false)}
                
                <p id="cv-link-error" style="color: #d32f2f; font-size: 14px; font-weight: bold; padding: 10px; background: #fee2e2; border-radius: 4px; display: none;">Envie o anexo ou o link abaixo. Pelo menos um dos dois.</p>
                
                <div class="full">
                  ${field('mensagem', 'Conte brevemente sobre sua trajet&oacute;ria e por que quer fazer parte do Parque Novo MT', 'textarea', null, false)}
                </div>
                
                <div class="full" style="margin-top: 15px;">
                   <label style="display: flex; gap: 10px; align-items: flex-start; font-size: 13px;">
                     <input type="checkbox" required name="privacy" style="margin-top: 4px;">
                     <span>Autorizo o uso dos dados informados para atendimento desta solicita&ccedil;&atilde;o conforme as diretrizes de privacidade.</span>
                   </label>
                </div>

                <div class="full" style="margin-top: 20px;">
                  <button type="button" class="button" id="submit-career-btn" onclick="window.submitCareerForm(this)">Cadastrar no Banco de Talentos &nearr;</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
      
      <script>
        setTimeout(() => {
          const select = document.querySelector('[name=vaga_interesse]');
          if (select) {
            select.addEventListener('change', (e) => {
               const btn = document.getElementById('submit-career-btn');
               if (e.target.value === 'Banco de talentos (candidatura espontânea)') {
                 btn.innerHTML = 'Cadastrar no Banco de Talentos &nearr;';
               } else {
                 btn.innerHTML = 'Enviar candidatura &nearr;';
               }
            });
          }
        }, 100);

        window.handleFileChange = function(input) {
          const area = document.getElementById('cv-drop-area');
          const text = document.getElementById('cv-text');
          const error = document.getElementById('cv-error');
          error.style.display = 'none';
          area.classList.remove('has-file');

          if (input.files && input.files.length > 0) {
            const file = input.files[0];
            const sizeMB = file.size / 1024 / 1024;
            const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            const ext = file.name.split('.').pop().toLowerCase();
            const validExts = ['pdf', 'doc', 'docx'];

            if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
               error.textContent = 'Formato inv&aacute;lido. Por favor, envie PDF, DOC ou DOCX.';
               error.style.display = 'block';
               input.value = '';
               text.innerHTML = 'Arraste seu curr&iacute;culo aqui ou clique para escolher';
               return;
            }
            if (sizeMB > 5) {
               error.textContent = 'O arquivo &eacute; muito grande. O limite &eacute; 5 MB.';
               error.style.display = 'block';
               input.value = '';
               text.innerHTML = 'Arraste seu curr&iacute;culo aqui ou clique para escolher';
               return;
            }

            text.innerHTML = '<strong>' + file.name + '</strong> anexado.';
            area.classList.add('has-file');
            document.getElementById('cv-link-error').style.display = 'none';
          } else {
            text.innerHTML = 'Arraste seu curr&iacute;culo aqui ou clique para escolher';
          }
        };

        window.submitCareerForm = async function(btn) {
          const form = btn.closest('form');
          form.classList.add('was-validated');
          
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }

          const fileInput = document.getElementById('cv-file');
          const linkedin = form.querySelector('[name=linkedin]').value.trim();
          const cvError = document.getElementById('cv-link-error');
          
          if (!fileInput.files.length && !linkedin) {
            cvError.style.display = 'block';
            return;
          }
          cvError.style.display = 'none';
          
          const vaga = form.querySelector('[name=vaga_interesse]').value;
          btn.disabled = true;
          const origText = btn.innerHTML;
          btn.innerHTML = 'Enviando...';
          
          try {
             // In a real integration, this is where FormData is sent.
             // We'll prepare it so it works with the system.
             const formData = new FormData(form);
             
             // Wait briefly to simulate request
             await new Promise(r => setTimeout(r, 1000));
             
             document.getElementById('main-form-content').style.display = 'none';
             document.getElementById('form-success-screen').style.display = 'block';
             document.getElementById('form-success-vaga').textContent = vaga;
             form.reset();
             document.getElementById('cv-drop-area').classList.remove('has-file');
             document.getElementById('cv-text').innerHTML = 'Arraste seu curr&iacute;culo aqui ou clique para escolher';
             
          } catch (e) {
             alert('Ocorreu um erro ao enviar. Tente novamente.');
          } finally {
             btn.disabled = false;
             btn.innerHTML = origText;
          }
        };
      </script>`;
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
    } else if (route.startsWith('noticia/')) {
      html = newsArticle(route.split('/')[1]);
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
    if (route === 'imprensa') { updateNews(); updateImprensaGallery(); }
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

  window.showPhoto = function showPhoto(index) {
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
            <a href="${asset(g.image)}" download="${(g.title || "imagem").replace(/\s+/g, '-').toLowerCase()}-${index}.jpg" title="Baixar imagem" style="color:var(--navy);"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></a>
          </span>
          
          <button class="button secondary" data-action="photo-next" aria-label="Pr&oacute;xima foto" style="padding:6px 14px;font-size:14px;">Pr&oacute;xima &rarr;</button>
        </div>
        <p>${esc(g.type)} &middot; ${esc(g.credit)}</p>
        ${g.source ? external(g.source, 'Consulte a fonte e os cr&eacute;ditos') : ''}
      </div>`;
    const dlg = document.getElementById('media-dialog');
    if (!dlg.open) dlg.showModal();
  }
  
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
