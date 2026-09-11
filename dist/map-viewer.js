/**
 * Parque Novo Mato Grosso — Visualizador de Mapa Interativo (Three.js 2.5D)
 * Arquitetura modular isolada, compatível com SPA vanilla.
 */
(function () {
  'use strict';

  // CDN URLs for Three.js & OrbitControls
  const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
  const ORBIT_CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/controls/OrbitControls.js';

  function esc(s) {
    return String(s ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  let threeLoaded = false;
  let loadingPromise = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        return resolve();
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = (e) => reject(new Error(`Falha ao carregar ${src}`));
      document.head.appendChild(s);
    });
  }

  async function ensureThree() {
    if (window.THREE && window.THREE.OrbitControls) return;
    if (!loadingPromise) {
      loadingPromise = (async () => {
        if (!window.THREE) await loadScript(THREE_CDN);
        if (!window.THREE.OrbitControls) await loadScript(ORBIT_CDN);
        threeLoaded = true;
      })();
    }
    return loadingPromise;
  }

  // --- Map Viewer Class ---
  class PNMTMapViewer {
    constructor(containerEl, options = {}) {
      this.container = containerEl;
      this.options = options;
      this.points = window.PNMT_MAP_POINTS || [];
      this.activeFilter = 'Todos';
      this.searchQuery = '';
      this.selectedPoint = null;
      this.animatingCamera = false;
      this.disposed = false;
      this.rafId = null;

      // Plane Dimensions (aspect ratio of R81 layout 3090 x 2055 = 1.5036)
      this.planeWidth = 60;
      this.planeHeight = 40;

      this.init();
    }

    async init() {
      this.renderSkeleton();

      try {
        await ensureThree();
        if (this.disposed) return;
        this.setupScene();
        this.setupControls();
        this.setupLights();
        this.loadMasterplan();
        this.createPins();
        this.bindEvents();
        this.startLoop();
        this.renderUI();
      } catch (err) {
        console.warn('[PNMT Map] WebGL / Three.js falhou, ativando modo 2D acessível:', err);
        this.renderFallback2D();
      }
    }

    renderSkeleton() {
      this.container.innerHTML = `
        <div class="map-explorer-wrapper">
          <div class="map-loading-overlay" id="map-loading">
            <div class="map-spinner"></div>
            <p>Carregando mapa do Parque Novo Mato Grosso…</p>
          </div>
          <div class="map-canvas-container" id="map-canvas-container"></div>
          <div class="map-ui-overlay" id="map-ui-overlay"></div>
        </div>
      `;
      this.canvasContainer = this.container.querySelector('#map-canvas-container');
      this.uiOverlay = this.container.querySelector('#map-ui-overlay');
      this.loadingOverlay = this.container.querySelector('#map-loading');
    }

    setupScene() {
      const THREE = window.THREE;
      const width = this.canvasContainer.clientWidth || 1200;
      const height = this.canvasContainer.clientHeight || 700;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x0a1c30);

      this.camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 250);
      // Default viewpoint: gentle isometric angle
      this.defaultCamPos = new THREE.Vector3(0, 36, 42);
      this.defaultTarget = new THREE.Vector3(0, 0, 0);
      this.camera.position.copy(this.defaultCamPos);
      this.camera.lookAt(this.defaultTarget);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.shadowMap.enabled = false;
      this.canvasContainer.appendChild(this.renderer.domElement);
    }

    setupControls() {
      const THREE = window.THREE;
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
      this.controls.screenSpacePanning = true;

      // Restrict camera angles: NEVER go below ground
      this.controls.minPolarAngle = 0.12; // ~7 deg (almost top-down)
      this.controls.maxPolarAngle = Math.PI / 2.35; // ~76 deg (never flips under terrain)
      this.controls.minDistance = 14;
      this.controls.maxDistance = 85;
      this.controls.target.copy(this.defaultTarget);

      // Touch controls: one finger orbits, two fingers zoom and pan
      this.controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      };
    }

    setupLights() {
      const THREE = window.THREE;
      const ambient = new THREE.AmbientLight(0xffffff, 1.15);
      this.scene.add(ambient);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
      dirLight.position.set(20, 40, 20);
      this.scene.add(dirLight);
    }

    loadMasterplan() {
      const THREE = window.THREE;
      const loader = new THREE.TextureLoader();

      loader.load(
        'assets/map-masterplan.webp',
        (texture) => {
          if (this.disposed) return;
          texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy() || 4;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.generateMipmaps = true;

          const geometry = new THREE.PlaneGeometry(this.planeWidth, this.planeHeight, 32, 32);
          const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });

          this.planeMesh = new THREE.Mesh(geometry, material);
          this.planeMesh.rotation.x = -Math.PI / 2; // Flat on X-Z ground
          this.scene.add(this.planeMesh);

          // Subtle glowing border around the masterplan
          const borderGeo = new THREE.EdgesGeometry(geometry);
          const borderMat = new THREE.LineBasicMaterial({ color: 0x1b8f3a, linewidth: 2, transparent: true, opacity: 0.6 });
          const borderLine = new THREE.LineSegments(borderGeo, borderMat);
          borderLine.rotation.x = -Math.PI / 2;
          borderLine.position.y = 0.02;
          this.scene.add(borderLine);

          if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('fade-out');
            setTimeout(() => this.loadingOverlay?.remove(), 400);
          }
        },
        undefined,
        (err) => {
          console.error('[PNMT Map] Erro ao carregar textura do mapa:', err);
          if (this.loadingOverlay) {
            this.loadingOverlay.innerHTML = '<p>Erro ao carregar imagem do mapa. Tente recarregar.</p>';
          }
        }
      );
    }

    createPins() {
      // DOM Pin Layer overlayed on canvas
      this.pinOverlay = document.createElement('div');
      this.pinOverlay.className = 'map-pins-layer';
      this.canvasContainer.appendChild(this.pinOverlay);

      this.pinElements = [];

      this.points.forEach((pt) => {
        // Convert normalized (0-100%) to 3D Plane coordinates
        const x3d = (pt.x / 100 - 0.5) * this.planeWidth;
        const z3d = (pt.y / 100 - 0.5) * this.planeHeight;
        const pos3d = new window.THREE.Vector3(x3d, 0.25, z3d);

        const pinEl = document.createElement('button');
        pinEl.className = `map-pin ${pt.highlight ? 'is-highlight' : ''} cat-${this.slugify(pt.category)}`;
        pinEl.setAttribute('data-id', pt.id);
        pinEl.setAttribute('aria-label', `${pt.name} (${pt.category})`);
        pinEl.innerHTML = `
          <span class="pin-beacon"></span>
          <span class="pin-bubble">
            <span class="pin-icon">${this.getCategoryIcon(pt.category)}</span>
            <span class="pin-label">${esc(pt.name)}</span>
          </span>
        `;

        pinEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectPoint(pt, true);
        });

        this.pinOverlay.appendChild(pinEl);
        this.pinElements.push({ data: pt, element: pinEl, pos3d });
      });
    }

    updatePinsPosition() {
      if (!this.camera || !this.renderer || !this.pinElements) return;

      const width = this.canvasContainer.clientWidth;
      const height = this.canvasContainer.clientHeight;
      const halfW = width / 2;
      const halfH = height / 2;
      const tempVec = new window.THREE.Vector3();

      this.pinElements.forEach(({ data, element, pos3d }) => {
        // Filter check
        const matchesFilter = this.activeFilter === 'Todos' || data.category === this.activeFilter;
        const matchesSearch = !this.searchQuery || data.name.toLowerCase().includes(this.searchQuery);

        if (!matchesFilter || !matchesSearch) {
          element.style.display = 'none';
          return;
        }

        tempVec.copy(pos3d);
        tempVec.project(this.camera);

        // Check if point is in front of camera
        if (tempVec.z > 1) {
          element.style.display = 'none';
          return;
        }

        const screenX = tempVec.x * halfW + halfW;
        const screenY = -(tempVec.y * halfH) + halfH;

        // Check if inside canvas bounds
        if (screenX < -50 || screenX > width + 50 || screenY < -50 || screenY > height + 50) {
          element.style.display = 'none';
          return;
        }

        element.style.display = 'flex';
        element.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;
      });
    }

    bindEvents() {
      this.resizeHandler = () => this.onResize();
      window.addEventListener('resize', this.resizeHandler);

      // Keyboard navigation
      this.keydownHandler = (e) => {
        if (e.key === 'Escape' && this.selectedPoint) {
          this.closeDrawer();
        }
      };
      window.addEventListener('keydown', this.keydownHandler);
    }

    onResize() {
      if (!this.canvasContainer || !this.camera || !this.renderer) return;
      const w = this.canvasContainer.clientWidth;
      const h = this.canvasContainer.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }

    startLoop() {
      const animate = () => {
        if (this.disposed) return;
        this.rafId = requestAnimationFrame(animate);

        this.controls.update();

        // Update Camera Animation if active
        if (this.animatingCamera && this.camTargetPos && this.controlsTargetPos) {
          this.camera.position.lerp(this.camTargetPos, 0.08);
          this.controls.target.lerp(this.controlsTargetPos, 0.08);

          if (this.camera.position.distanceTo(this.camTargetPos) < 0.2) {
            this.animatingCamera = false;
          }
        }

        this.updatePinsPosition();
        this.renderer.render(this.scene, this.camera);
      };

      animate();
    }

    selectPoint(pt, animate = true) {
      this.selectedPoint = pt;

      // Update active pin class
      this.pinElements.forEach(({ data, element }) => {
        element.classList.toggle('is-selected', data.id === pt.id);
      });

      // Camera focus animation
      if (animate && window.THREE) {
        const x3d = (pt.x / 100 - 0.5) * this.planeWidth;
        const z3d = (pt.y / 100 - 0.5) * this.planeHeight;

        this.controlsTargetPos = new window.THREE.Vector3(x3d, 0, z3d);
        // Slightly elevated perspective angle focusing on the attraction
        this.camTargetPos = new window.THREE.Vector3(x3d, 18, z3d + 18);
        this.animatingCamera = true;
      }

      this.openDrawer(pt);
    }

    openDrawer(pt) {
      const drawer = this.uiOverlay.querySelector('#map-drawer');
      if (!drawer) return;

      const spaceData = (window.PNMT_CONTENT?.spaces || []).find((s) => s.id === pt.id) || {};
      const imgName = spaceData.image || 'aerial';
      const imgSrc = window.PNMT_ASSETS?.[imgName] || `assets/${imgName}.webp`;

      drawer.innerHTML = `
        <div class="drawer-header">
          <span class="drawer-cat-badge">${esc(pt.category)}</span>
          ${pt.status === 'conferido' ? '<span class="drawer-status-badge">✓ Validado na Planta R81</span>' : '<span class="drawer-status-badge pending">Demarcação em confirmação</span>'}
          <button class="drawer-close-btn" data-action="close-drawer" aria-label="Fechar ficha">✕</button>
        </div>
        <div class="drawer-body">
          <div class="drawer-image-wrap">
            <img src="${imgSrc}" alt="${esc(pt.name)}" loading="lazy" onerror="this.src='assets/aerial-real.jpg'">
            ${pt.badge ? `<span class="drawer-badge">${esc(pt.badge)}</span>` : ''}
          </div>
          <h3 class="drawer-title">${esc(pt.name)}</h3>
          <p class="drawer-desc">${esc(pt.summary || spaceData.tagline || '')}</p>
          <div class="drawer-actions">
            <a href="#espaco/${esc(pt.id)}" class="button cta-primary drawer-btn">Ver ficha completa <span>↗</span></a>
            <a href="#contato?tipo=evento&espaco=${esc(pt.id)}" class="button cta-secondary drawer-btn-secondary">Realizar evento aqui</a>
          </div>
        </div>
      `;

      drawer.classList.add('is-open');
    }

    closeDrawer() {
      const drawer = this.uiOverlay.querySelector('#map-drawer');
      if (drawer) drawer.classList.remove('is-open');
      this.selectedPoint = null;
      this.pinElements.forEach(({ element }) => element.classList.remove('is-selected'));
    }

    setView(type) {
      if (!window.THREE) return;
      this.animatingCamera = true;

      if (type === 'reset') {
        this.controlsTargetPos = this.defaultTarget.clone();
        this.camTargetPos = this.defaultCamPos.clone();
      } else if (type === 'top') {
        this.controlsTargetPos = new window.THREE.Vector3(0, 0, 0);
        this.camTargetPos = new window.THREE.Vector3(0, 54, 0.05); // Top-Down 2D
      } else if (type === 'perspective') {
        this.controlsTargetPos = new window.THREE.Vector3(0, 0, 0);
        this.camTargetPos = new window.THREE.Vector3(-10, 30, 38);
      }
    }

    zoom(delta) {
      if (!this.camera || !this.controls) return;
      const factor = delta > 0 ? 0.8 : 1.25;
      const newDist = this.camera.position.distanceTo(this.controls.target) * factor;

      if (newDist >= this.controls.minDistance && newDist <= this.controls.maxDistance) {
        this.camera.position.sub(this.controls.target).multiplyScalar(factor).add(this.controls.target);
      }
    }

    renderUI() {
      this.uiOverlay.innerHTML = `
        <!-- Floating Navigation Controls -->
        <div class="map-controls-panel" role="toolbar" aria-label="Controles de visualização do mapa">
          <button class="map-ctrl-btn" data-action="zoom-in" title="Aproximar (+)" aria-label="Aproximar">+</button>
          <button class="map-ctrl-btn" data-action="zoom-out" title="Afastar (-)" aria-label="Afastar">−</button>
          <div class="ctrl-sep"></div>
          <button class="map-ctrl-btn" data-action="view-top" title="Vista Superior 2D" aria-label="Vista superior 2D">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="3" x2="12" y2="7"/></svg> <span>Planta 2D</span>
          </button>
          <button class="map-ctrl-btn" data-action="view-perspective" title="Visão em Perspectiva 3D" aria-label="Visão em perspectiva 3D">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.12 6.4-9-5a2 2 0 0 0-2 0l-9 5A2 2 0 0 0 0 8.14v7.72a2 2 0 0 0 1.12 1.74l9 5a2 2 0 0 0 2 0l9-5a2 2 0 0 0 1.12-1.74V8.14a2 2 0 0 0-1.12-1.74Z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> <span>3D</span>
          </button>
          <button class="map-ctrl-btn" data-action="view-reset" title="Restaurar Visão Inicial" aria-label="Restaurar visão inicial">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg> <span>Reset</span>
          </button>
        </div>

        <!-- Top Search & Filter Bar -->
        <div class="map-top-bar">
          <div class="map-search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="search" id="map-search-input" placeholder="Buscar atração ou espaço no mapa…" aria-label="Buscar atração no mapa">
          </div>
          <div class="map-category-pills">
            ${['Todos', 'Esportes', 'Eventos', 'Família', 'Cultura'].map((cat) => `
              <button class="cat-pill ${cat === 'Todos' ? 'active' : ''}" data-cat="${cat}">${cat}</button>
            `).join('')}
          </div>
        </div>

        <!-- Interactive Space Drawer / Card (Side on Desktop, Bottom on Mobile) -->
        <aside class="map-info-drawer" id="map-drawer" aria-live="polite"></aside>
      `;

      // Event Delegation on UI Overlay
      this.uiOverlay.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const action = btn.dataset.action;
        const cat = btn.dataset.cat;

        if (action === 'zoom-in') this.zoom(1);
        else if (action === 'zoom-out') this.zoom(-1);
        else if (action === 'view-top') this.setView('top');
        else if (action === 'view-perspective') this.setView('perspective');
        else if (action === 'view-reset') this.setView('reset');
        else if (action === 'close-drawer') this.closeDrawer();
        else if (cat) {
          this.activeFilter = cat;
          this.uiOverlay.querySelectorAll('.cat-pill').forEach((p) => p.classList.toggle('active', p.dataset.cat === cat));
          this.updatePinsPosition();
        }
      });

      const searchInput = this.uiOverlay.querySelector('#map-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value.toLowerCase().trim();
          this.updatePinsPosition();
        });
      }
    }

    renderFallback2D() {
      this.container.innerHTML = `
        <div class="map-fallback-wrapper">
          <div class="map-fallback-header">
            <h2>Mapa de Implantação — Parque Novo Mato Grosso</h2>
            <p>Conheça as atrações demarcadas na planta geral do projeto.</p>
          </div>
          <div class="map-fallback-image">
            <img src="assets/map-masterplan.webp" alt="Planta de Implantação Geral do Parque Novo Mato Grosso" loading="lazy">
          </div>
          <div class="map-fallback-list">
            <h3>Espaços e Atrações</h3>
            <div class="map-fallback-grid">
              ${this.points.map((pt) => `
                <a href="#espaco/${pt.id}" class="map-fallback-item">
                  <span class="cat">${pt.category}</span>
                  <strong>${pt.name}</strong>
                  <p>${pt.summary}</p>
                </a>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    destroy() {
      this.disposed = true;
      if (this.rafId) cancelAnimationFrame(this.rafId);
      window.removeEventListener('resize', this.resizeHandler);
      window.removeEventListener('keydown', this.keydownHandler);

      if (this.controls) this.controls.dispose();
      if (this.renderer) {
        this.renderer.dispose();
        this.renderer.forceContextLoss();
      }
      if (this.scene) {
        this.scene.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
            else obj.material.dispose();
          }
        });
      }
      this.container.innerHTML = '';
    }

    slugify(str) {
      return String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-');
    }

    getCategoryIcon(cat) {
      switch (cat) {
        case 'Esportes': return '🏁';
        case 'Eventos': return '🎪';
        case 'Família': return '🎡';
        case 'Cultura': return '🎭';
        default: return '📍';
      }
    }
  }

  // Export to window
  window.PNMTMapViewer = PNMTMapViewer;
})();
