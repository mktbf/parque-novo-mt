/* Bloco independente: não altera estilos, roteador ou dados do site principal. */
const assets = new URL('./', import.meta.url);
const siteRoot = new URL('../', import.meta.url);

const safeHref = (value) => {
  try {
    const url = new URL(value, siteRoot);
    return url.origin === location.origin && ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

class ParqueExplorer extends HTMLElement {
  connectedCallback() {
    if (this._mounted) return;
    this._mounted = true;
    this._active = true;
    this._routes = null;

    const shadow = this.shadowRoot || this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          color: #0d2b4d;
          font-family: 'Barlow', Arial, sans-serif;
          scroll-margin-top: 32px;
        }
        * { box-sizing: border-box; }
        [hidden] { display: none !important; }

        section {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px 32px 16px;
        }

        header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 20px;
        }

        .header-content {
          max-width: 680px;
        }

        .kicker-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #1b8f3a;
          background: rgba(27, 143, 58, 0.08);
          padding: 4px 10px;
          border-radius: 999px;
          margin-bottom: 8px;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #1b8f3a;
          box-shadow: 0 0 0 0 rgba(27, 143, 58, 0.7);
          animation: pulse-ring 1.8s infinite;
        }

        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(27, 143, 58, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(27, 143, 58, 0); }
          100% { box-shadow: 0 0 0 0 rgba(27, 143, 58, 0); }
        }

        h2 {
          font-size: clamp(1.85rem, 2.8vw, 2.75rem);
          line-height: 1.1;
          letter-spacing: -0.035em;
          margin: 0 0 8px;
          font-weight: 700;
          color: #0d2b4d;
        }

        p {
          font-size: 1.05rem;
          line-height: 1.45;
          color: #536471;
          margin: 0;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          flex-wrap: wrap;
        }

        button, a {
          font: inherit;
          font-size: 0.875rem;
          font-weight: 600;
          line-height: 1.3;
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .jump-btn {
          padding: 8px 16px;
          border: 1px solid #d4dfd6;
          background: #f1f6f2;
          color: #164323;
        }

        .jump-btn:hover {
          background: #e2ede4;
          border-color: #1b8f3a;
          color: #0d2b4d;
        }

        .expand {
          color: #0d2b4d;
          padding: 8px 16px;
          border: 1px solid #bfcbd5;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(13, 43, 77, 0.05);
        }

        .expand:hover {
          background: #f7fafc;
          border-color: #0d2b4d;
        }

        a:focus-visible, button:focus-visible {
          outline: 3px solid #58b947;
          outline-offset: 3px;
        }

        .viewport {
          height: clamp(560px, 72svh, 780px);
          min-height: 0;
          position: relative;
          overflow: hidden;
          border-radius: 16px;
          border: 1px solid #d7e0e3;
          background: #c8d8c0;
          box-shadow: 0 16px 48px rgba(13, 43, 77, 0.08);
        }

        iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
          background: #c8d8c0;
          pointer-events: auto;
        }

        .note-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 12px;
          padding: 0 4px;
        }

        .note {
          font-size: 0.875rem;
          color: #627586;
          line-height: 1.4;
          margin: 0;
        }

        .note strong {
          color: #1b8f3a;
        }

        .sr {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip-path: inset(50%);
        }

        @media (max-width: 760px) {
          section {
            padding: 20px 16px 8px;
          }
          header {
            align-items: flex-start;
            gap: 14px;
            flex-direction: column;
            margin-bottom: 14px;
          }
          h2 {
            font-size: 1.85rem;
            margin-bottom: 6px;
          }
          p {
            font-size: 0.95rem;
          }
          .actions {
            width: 100%;
            justify-content: space-between;
          }
          .viewport {
            height: clamp(480px, calc(100svh - 130px), 620px);
            border-radius: 12px;
          }
          .note-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
          .note {
            font-size: 0.8125rem;
          }
        }
      </style>

      <section aria-labelledby="explore-title">
        <header>
          <div class="header-content">
            <span class="kicker-badge"><span class="pulse-dot"></span>EXPERIÊNCIA 3D</span>
            <h2 id="explore-title">Explore o Parque</h2>
            <p>Navegue em perspectiva pelas atrações do complexo. Toque ou clique em qualquer ponto do mapa para ver detalhes ou use a lista lateral.</p>
          </div>
          <div class="actions">
            <button class="jump-btn" type="button" aria-label="Rolar para os filtros e cards de espaços">
              <span>Ver lista e cards</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path d="M12 5v14M19 12l-7 7-7-7"/>
              </svg>
            </button>
            <a class="expand" target="_blank" rel="noopener">
              <span>Tela cheia</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </header>

        <div class="viewport"></div>

        <div class="note-bar">
          <p class="note">
            💡 <strong>Interação direta:</strong> Arraste para girar em 3D, role o mouse para aproximar ou selecione qualquer atração. Os cards continuam logo abaixo.
          </p>
        </div>

        <p class="sr" role="status" aria-live="polite">Mapa 3D interativo carregado e pronto para navegação.</p>
      </section>
    `;

    shadow.querySelector('.expand').href = new URL('index.html', assets).href;

    // Smooth scroll down to space catalog
    shadow.querySelector('.jump-btn')?.addEventListener('click', () => {
      const target = document.querySelector('.catalog-tools') || document.getElementById('space-results');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    this._message = (event) => {
      if (!this._frame || event.source !== this._frame.contentWindow || event.origin !== location.origin) return;
      if (event.data?.type === 'pnmt:bridge-ready') this._configureFrame();
      else if (event.data?.type === 'pnmt:navigate') this._navigate(event.data.id);
    };
    window.addEventListener('message', this._message);

    fetch(new URL('rotas.json', assets))
      .then((r) => {
        if (!r.ok) throw Error('Rotas indisponíveis');
        return r.json();
      })
      .then((routes) => {
        if (!this.isConnected) return;
        const current = window.PNMT_CONTENT?.spaces;
        if (Array.isArray(current)) {
          const ids = new Set(current.map((p) => p.id));
          routes = Object.fromEntries(Object.keys(routes).map((id) => [id, ids.has(id) ? '#espaco/' + id : null]));
        }
        this.configure({ routes });
      })
      .catch(() => {});

    // Inicia imediatamente sem barreira ou atraso de interseção
    this._start();
  }

  configure({ routes }) {
    this._routes = Object.fromEntries(
      Object.entries(routes || {}).map(([id, value]) => [id, value ? safeHref(value) : null])
    );
    this._configureFrame();
  }

  _configureFrame() {
    if (this._frame && this._routes) {
      this._frame.contentWindow?.postMessage({ type: 'pnmt:configure', routes: this._routes }, location.origin);
    }
  }

  _start() {
    if (this._frame || !this.isConnected) return;
    const frame = document.createElement('iframe');
    frame.title = 'Mapa interativo 3D do Parque Novo Mato Grosso';
    frame.tabIndex = 0;
    frame.inert = false;
    frame.setAttribute('aria-hidden', 'false');
    frame.style.pointerEvents = 'auto';
    frame.referrerPolicy = 'same-origin';
    frame.addEventListener('load', () => this._configureFrame());
    frame.src = new URL('index.html?embed=1&v=espacos-acabamento-20260914-3', assets).href;
    this._frame = frame;
    this.shadowRoot.querySelector('.viewport').appendChild(frame);
  }

  activate() {
    if (!this._frame) this._start();
    if (this._frame) {
      this._frame.inert = false;
      this._frame.tabIndex = 0;
      this._frame.style.pointerEvents = 'auto';
    }
  }

  release() {
    // Compatibilidade no-op caso algum evento externo tente liberar foco
  }

  _navigate(id) {
    if (!this._routes || typeof id !== 'string' || !Object.hasOwn(this._routes, id)) return;
    const href = this._routes[id];
    if (!href) return;
    const event = new CustomEvent('pnmt-navigate', { detail: { id, href }, bubbles: true, composed: true, cancelable: true });
    if (this.dispatchEvent(event)) window.location.assign(href);
  }

  disconnectedCallback() {
    window.removeEventListener('message', this._message);
    if (this._frame) {
      this._frame.src = 'about:blank';
      this._frame.remove();
      this._frame = null;
    }
    this._mounted = false;
  }
}

if (!customElements.get('pnmt-explore')) customElements.define('pnmt-explore', ParqueExplorer);
