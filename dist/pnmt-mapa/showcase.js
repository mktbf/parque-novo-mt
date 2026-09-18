/**
 * PNMT Showcase 3D - "The Art of Webdesign / Só Mostrando"
 * Modo de apresentação e tour cinematográfico do Parque Novo Mato Grosso.
 */

export const SHOWCASE_WAYPOINTS = [
  {
    id: 'overview',
    number: '01',
    name: 'Parque Novo Mato Grosso',
    category: 'Complexo Multieventos',
    accent: '#196d53',
    highlight: '⚡ 500 Hectares · América Latina',
    desc: 'O maior complexo multieventos da América Latina, integrando cultura, esportes a motor, preservação ambiental e entretenimento no coração do Brasil.',
    cam: [-1050, 780, 420],
    target: [10, 0, 0]
  },
  {
    id: 'portico-de-entrada',
    number: '02',
    name: 'Pórtico de Entrada',
    category: 'Acesso Monumental',
    accent: '#b87431',
    highlight: '🏛️ Escultura em Concreto Armado',
    desc: 'As grandiosas cascas de concreto acolhem os visitantes no Setor 10, abrindo passagem pela monumental avenida que conecta todas as áreas do complexo.',
    cam: [345, 42, 440],
    target: [305, 10, 398]
  },
  {
    id: 'lago-principal',
    number: '03',
    name: 'Lago Principal & Orla',
    category: 'Lazer & Natureza',
    accent: '#1d9ab5',
    highlight: '🌊 120.000 m² de Espelho d\'Água',
    desc: 'Ampla lâmina d\'água contínua com 9m de pista de caminhada em toda a orla, decks panorâmicos e integração paisagística com a vegetação do cerrado.',
    cam: [-285, 48, -25],
    target: [-185, 6, 25]
  },
  {
    id: 'vila-das-nacoes',
    number: '04',
    name: 'Vila das Nações',
    category: 'Cultura & Gastronomia',
    accent: '#aa703e',
    highlight: '🌍 Fachadas Temáticas & Boulevard',
    desc: 'Boulevard cosmopolita debruçado sobre as águas, reunindo arquiteturas representativas das nações, praças abertas e experiências gastronômicas.',
    cam: [-235, 34, 15],
    target: [-172, 6, 25]
  },
  {
    id: 'casa-cuiabana',
    number: '05',
    name: 'Casa Cuiabana & Anfiteatro',
    category: 'Tradição Regional',
    accent: '#c27838',
    highlight: '🎭 Anfiteatro em Degraus & Casarão',
    desc: 'Celebração da arquitetura histórica cuiabana com o casarão colonial, grande anfiteatro em degraus e esplanada de eventos voltada para o lago.',
    cam: [-210, 22, 65],
    target: [-168, 3.5, 84]
  },
  {
    id: 'arena-show',
    number: '06',
    name: 'Arena Show & Roda-Gigante',
    category: 'Megaeventos',
    accent: '#7754b2',
    highlight: '🎪 Cobertura Acústica · 100 Mil Pessoas',
    desc: 'Estrutura para festivais internacionais com cobertura ondulada contínua, praça de acessos e a Roda-Gigante de 42m como marco visual.',
    cam: [-85, 95, -155],
    target: [-210, 18, -170]
  },
  {
    id: 'autodromo',
    number: '07',
    name: 'Autódromo Internacional',
    category: 'Velocidade & FIA',
    accent: '#246dad',
    highlight: '🏁 Circuito FIA Grau 2 & Arrancada',
    desc: 'Pista oficial com retas de alta velocidade, arquibancada coberta, área de paddock, boxes e dragstrip pronta para categorias nacionais e mundiais.',
    cam: [130, 150, 100],
    target: [255, 10, 115]
  }
];

export class PNMTShowcaseController {
  constructor(options) {
    this.camera = options.camera;
    this.controls = options.controls;
    this.render = options.render;
    this.onSelectPlace = options.onSelectPlace;
    this.onToggleSidebar = options.onToggleSidebar;
    this.T = options.three;

    this.currentIndex = 0;
    this.isPlaying = true;
    this.isFlying = false;
    this.isUserInteracting = false;
    this.isOrbiting = true;
    this.isMobile = matchMedia('(max-width:760px)').matches;

    this.tourDurationMs = 9000;
    this.elapsedInWaypoint = 0;
    this.lastTick = performance.now();

    this.initDOM();
    this.bindEvents();
    this.updateCardContent(SHOWCASE_WAYPOINTS[0]);
    this.startLoop();
  }

  initDOM() {
    // 1. Injeta Top Bar se não existir
    let topBar = document.querySelector('.showcase-top-bar');
    if (!topBar) {
      topBar = document.createElement('div');
      topBar.className = 'showcase-top-bar';
      topBar.innerHTML = `
        <div class="showcase-mode-pill" role="group" aria-label="Modo de visualização">
          <button type="button" id="btn-showcase-mode" aria-pressed="true" title="Apresentação guiada estilo showcase">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span>Apresentação 3D</span>
          </button>
          <button type="button" id="btn-list-mode" aria-pressed="false" title="Ver catálogo e busca de todos os espaços">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            <span>Lista de Espaços</span>
          </button>
        </div>
      `;
      document.querySelector('#map-stage')?.appendChild(topBar);
    }

    // 2. Injeta o Card Flutuante Glassmorphism
    let card = document.querySelector('.showcase-card');
    if (!card) {
      card = document.createElement('article');
      card.className = 'showcase-card';
      card.setAttribute('aria-live', 'polite');
      card.innerHTML = `
        <div class="showcase-card-header">
          <div class="showcase-header-meta">
            <span class="showcase-step-badge" id="sc-step">01 / 07</span>
            <span class="showcase-category-pill" id="sc-category">Complexo</span>
          </div>
          <div class="showcase-header-actions">
            <div class="showcase-tour-status" id="sc-status">
              <span class="showcase-pulse-dot"></span>
              <span id="sc-status-text">Tour Ativo</span>
            </div>
            <button class="showcase-close-btn" id="sc-btn-close" type="button" aria-label="Fechar card de apresentação" title="Fechar card">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        <div class="showcase-card-body">
          <h3 class="showcase-title" id="sc-title">Parque Novo Mato Grosso</h3>
          <div class="showcase-highlight-badge" id="sc-highlight">500 Hectares</div>
          <p class="showcase-desc" id="sc-desc">Explore os marcos do parque em um sobrevoo cinematográfico.</p>
        </div>

        <div class="showcase-progress-wrap" title="Progresso até o próximo ponto">
          <div class="showcase-progress-bar" id="sc-progress"></div>
        </div>

        <div class="showcase-card-footer">
          <div class="showcase-nav-btns">
            <button class="showcase-icon-btn" id="sc-btn-prev" type="button" aria-label="Ponto anterior" title="Ponto anterior (←)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button class="showcase-icon-btn showcase-play-btn" id="sc-btn-play" type="button" aria-label="Pausar apresentação" title="Pausar / Continuar (Espaço)">
              <svg id="sc-play-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            </button>
            <button class="showcase-icon-btn" id="sc-btn-next" type="button" aria-label="Próximo ponto" title="Próximo ponto (→)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
          <button class="showcase-action-btn" id="sc-btn-explore" type="button">
            <span>Detalhes</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
          </button>
        </div>
      `;
      document.querySelector('#map-stage')?.appendChild(card);
    }

    // 3. Injeta Botão Flutuante para Reabrir o Card (quando minimizado)
    let btnReopen = document.querySelector('#sc-btn-reopen');
    if (!btnReopen) {
      btnReopen = document.createElement('button');
      btnReopen.className = 'showcase-reopen-btn';
      btnReopen.id = 'sc-btn-reopen';
      btnReopen.type = 'button';
      btnReopen.hidden = true;
      btnReopen.setAttribute('aria-label', 'Reabrir card de apresentação');
      btnReopen.title = 'Reabrir card de apresentação';
      btnReopen.innerHTML = `
        <span class="showcase-pulse-dot"></span>
        <span id="sc-reopen-label">Ver Apresentação</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
      `;
      document.querySelector('#map-stage')?.appendChild(btnReopen);
    }

    this.dom = {
      topBar,
      card,
      step: document.querySelector('#sc-step'),
      category: document.querySelector('#sc-category'),
      statusText: document.querySelector('#sc-status-text'),
      pulseDot: document.querySelector('.showcase-pulse-dot'),
      title: document.querySelector('#sc-title'),
      highlight: document.querySelector('#sc-highlight'),
      desc: document.querySelector('#sc-desc'),
      progress: document.querySelector('#sc-progress'),
      btnPrev: document.querySelector('#sc-btn-prev'),
      btnPlay: document.querySelector('#sc-btn-play'),
      playIcon: document.querySelector('#sc-play-icon'),
      btnNext: document.querySelector('#sc-btn-next'),
      btnExplore: document.querySelector('#sc-btn-explore'),
      btnClose: document.querySelector('#sc-btn-close'),
      btnReopen: document.querySelector('#sc-btn-reopen'),
      reopenLabel: document.querySelector('#sc-reopen-label'),
      btnShowcaseMode: document.querySelector('#btn-showcase-mode'),
      btnListMode: document.querySelector('#btn-list-mode')
    };
  }

  closeCard() {
    this.dom.card?.classList.add('minimized');
    if (this.dom.btnReopen) {
      this.dom.btnReopen.hidden = false;
      const wp = SHOWCASE_WAYPOINTS[this.currentIndex];
      if (this.dom.reopenLabel) {
        this.dom.reopenLabel.textContent = wp?.name ? `Ver ${wp.name}` : 'Ver Apresentação';
      }
    }
  }

  openCard() {
    this.dom.card?.classList.remove('minimized');
    if (this.dom.btnReopen) {
      this.dom.btnReopen.hidden = true;
    }
  }

  bindEvents() {
    this.dom.btnClose?.addEventListener('click', () => {
      this.closeCard();
    });

    this.dom.btnReopen?.addEventListener('click', () => {
      this.openCard();
    });

    this.dom.btnNext?.addEventListener('click', () => {
      this.next();
      this.resetTimer();
    });

    this.dom.btnPrev?.addEventListener('click', () => {
      this.prev();
      this.resetTimer();
    });

    this.dom.btnPlay?.addEventListener('click', () => {
      this.togglePlay();
    });

    this.dom.btnExplore?.addEventListener('click', () => {
      const wp = SHOWCASE_WAYPOINTS[this.currentIndex];
      if (wp && wp.id !== 'overview') {
        this.onSelectPlace?.(wp.id);
      } else {
        this.setMode('list');
      }
    });

    this.dom.btnShowcaseMode?.addEventListener('click', () => {
      this.setMode('showcase');
    });

    this.dom.btnListMode?.addEventListener('click', () => {
      this.setMode('list');
    });

    // Pausa o tour quando o usuário interage manualmente (girar, zoom)
    this.controls.addEventListener('start', () => {
      this.isUserInteracting = true;
      this.isOrbiting = false;
    });

    this.controls.addEventListener('end', () => {
      this.isUserInteracting = false;
      this.resetTimer();
      // Retoma o gentle orbit após 3 segundos sem toque
      setTimeout(() => {
        if (!this.isUserInteracting) this.isOrbiting = true;
      }, 3000);
    });

    // Teclas de atalho (Esquerda / Direita / Espaço / Escape)
    window.addEventListener('keydown', (e) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') {
        this.next();
        this.resetTimer();
      } else if (e.key === 'ArrowLeft') {
        this.prev();
        this.resetTimer();
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlay();
      } else if (e.key === 'Escape') {
        this.closeCard();
      }
    });
  }

  setMode(mode) {
    const explorer = document.querySelector('.explorer');
    const isShowcase = mode === 'showcase';

    this.dom.btnShowcaseMode?.setAttribute('aria-pressed', String(isShowcase));
    this.dom.btnListMode?.setAttribute('aria-pressed', String(!isShowcase));

    if (isShowcase) {
      explorer?.classList.add('showcase-active', 'sidebar-collapsed');
      this.openCard();
      this.resume();
    } else {
      explorer?.classList.remove('showcase-active', 'sidebar-collapsed');
      this.closeCard();
      if (this.dom.btnReopen) this.dom.btnReopen.hidden = true;
      this.pause();
    }

    this.onToggleSidebar?.(!isShowcase);
    this.render();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
  }

  pause() {
    this.isPlaying = false;
    this.isOrbiting = false;
    if (this.dom.statusText) this.dom.statusText.textContent = 'Pausado';
    if (this.dom.pulseDot) this.dom.pulseDot.style.animationPlayState = 'paused';
    if (this.dom.playIcon) {
      // Ícone de Play
      this.dom.playIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"></polygon>`;
    }
    this.dom.btnPlay?.setAttribute('aria-label', 'Continuar apresentação');
  }

  resume() {
    this.isPlaying = true;
    this.isOrbiting = true;
    this.lastTick = performance.now();
    if (this.dom.statusText) this.dom.statusText.textContent = 'Tour Ativo';
    if (this.dom.pulseDot) this.dom.pulseDot.style.animationPlayState = 'running';
    if (this.dom.playIcon) {
      // Ícone de Pause
      this.dom.playIcon.innerHTML = `<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>`;
    }
    this.dom.btnPlay?.setAttribute('aria-label', 'Pausar apresentação');
  }

  resetTimer() {
    this.elapsedInWaypoint = 0;
    if (this.dom.progress) this.dom.progress.style.width = '0%';
    this.lastTick = performance.now();
  }

  next() {
    this.goToIndex((this.currentIndex + 1) % SHOWCASE_WAYPOINTS.length);
  }

  prev() {
    this.goToIndex((this.currentIndex - 1 + SHOWCASE_WAYPOINTS.length) % SHOWCASE_WAYPOINTS.length);
  }

  goToPlace(placeId) {
    const idx = SHOWCASE_WAYPOINTS.findIndex(w => w.id === placeId);
    if (idx !== -1) {
      this.openCard();
      this.goToIndex(idx);
    }
  }

  goToIndex(index) {
    this.currentIndex = index;
    const wp = SHOWCASE_WAYPOINTS[index];
    this.updateCardContent(wp);
    this.flyToWaypoint(wp);
    this.resetTimer();
    if (this.dom.reopenLabel && wp) {
      this.dom.reopenLabel.textContent = `Ver ${wp.name}`;
    }
  }

  updateCardContent(wp) {
    if (!this.dom.card) return;
    this.dom.card.style.setProperty('--accent-color', wp.accent);

    if (this.dom.step) this.dom.step.textContent = `${wp.number} / 07`;
    if (this.dom.category) this.dom.category.textContent = wp.category;
    if (this.dom.title) this.dom.title.textContent = wp.name;
    if (this.dom.highlight) this.dom.highlight.textContent = wp.highlight;
    if (this.dom.desc) this.dom.desc.textContent = wp.desc;

    // Atualiza botão de detalhes conforme o ponto
    if (this.dom.btnExplore) {
      this.dom.btnExplore.style.display = wp.id === 'overview' ? 'none' : 'inline-flex';
    }

    // Destaque visual temporário no card
    this.dom.card.style.transform = 'translateY(-4px)';
    setTimeout(() => {
      this.dom.card.style.transform = 'translateY(0)';
    }, 280);
  }

  flyToWaypoint(wp) {
    this.isFlying = true;
    this.isOrbiting = false;

    const T = this.T;
    const fromCam = this.camera.position.clone();
    const toCam = new T.Vector3(...wp.cam);
    const fromTarget = this.controls.target.clone();
    const toTarget = new T.Vector3(...wp.target);

    const startTime = performance.now();
    const duration = 2000; // 2 segundos com interpolação suave cúbica

    const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const step = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = easeInOutCubic(t);

      this.camera.position.lerpVectors(fromCam, toCam, ease);
      this.controls.target.lerpVectors(fromTarget, toTarget, ease);
      this.camera.updateProjectionMatrix();
      this.controls.update();
      this.render();

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        this.isFlying = false;
        this.isOrbiting = true;
        this.render();
      }
    };

    requestAnimationFrame(step);
  }

  startLoop() {
    const loop = (now) => {
      const dt = now - this.lastTick;
      this.lastTick = now;

      // 1. Atualiza o contador de autoplay
      if (this.isPlaying && !this.isFlying && !this.isUserInteracting) {
        this.elapsedInWaypoint += dt;
        const progressPct = Math.min((this.elapsedInWaypoint / this.tourDurationMs) * 100, 100);
        if (this.dom.progress) {
          this.dom.progress.style.width = `${progressPct.toFixed(1)}%`;
        }

        if (this.elapsedInWaypoint >= this.tourDurationMs) {
          this.next();
        }
      }

      // 2. Gentle Orbit (Suave rotação lenta para efeito diorama vivo)
      if (this.isOrbiting && !this.isFlying && !this.isUserInteracting) {
        const dTheta = 0.00045; // rotação ultra-suave
        const offset = this.camera.position.clone().sub(this.controls.target);
        offset.applyAxisAngle(new this.T.Vector3(0, 1, 0), dTheta);
        this.camera.position.copy(this.controls.target).add(offset);
        this.controls.update();
        this.render();
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}
