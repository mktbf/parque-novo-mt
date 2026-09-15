import './explore-parque.js?v=cenario-integral-20260914-2';

/* Reutiliza as páginas do roteador do portal e apenas acrescenta o visualizador. */
// O arquivo de rotas explicita os IDs que o mapa sabe localizar.
// Não converte Circo do Futuro em Pérola do Cerrado por semelhança de nomes.
const mapPages = fetch(new URL('./rotas.json?v=portal-ux-20260914-2', import.meta.url))
  .then(response => { if (!response.ok) throw Error('Rotas indisponíveis'); return response.json(); })
  .then(routes => new Set(Object.entries(routes).filter(([id, route]) => route === '#espaco/' + id).map(([id]) => id)))
  .catch(() => new Set());

async function insertMap() {
  const main = document.getElementById('main');
  if (!main || main.querySelector('pnmt-explore')) return;
  const route = (location.hash.slice(1) || 'inicio').split('?')[0];
  let anchor, space;
  if (route === 'espacos') {
    anchor = main.querySelector('.page-intro');
    if (!anchor || !main.querySelector('#space-results')) return;
  } else {
    const match = /^espaco\/([a-z0-9-]+)$/.exec(route);
    if (!match) return;
    space = window.PNMT_CONTENT?.spaces?.find(item => item.id === match[1]);
    const details = main.querySelector('.detail-layout');
    if (!space || !details) return;
    const supported = await mapPages;
    if (!supported.has(space.id) || !details.isConnected || main.querySelector('pnmt-explore') || (location.hash.slice(1).split('?')[0] !== route)) return;
    // Só monta depois de o roteador inserir a página de detalhes.
    anchor = details.previousElementSibling;
    if (!anchor) return;
  }
  const block = document.createElement('pnmt-explore');
  block.id = space ? 'espaco-em-3d' : 'explore-o-parque';
  if (space) {
    block.setAttribute('space-id', space.id);
    block.setAttribute('space-name', space.name);
  }
  anchor.after(block);
}

function start() {
  const main = document.getElementById('main');
  if (!main) return;
  insertMap();
  const observer = new MutationObserver(insertMap);
  observer.observe(main, { childList: true });
  const routeChanged = () => queueMicrotask(insertMap);
  window.addEventListener('hashchange', routeChanged);
  window.addEventListener('pagehide', () => {
    observer.disconnect();
    window.removeEventListener('hashchange', routeChanged);
  }, { once: true });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
// Atalhos locais: não passam pelo roteador e não recriam o WebGL.
document.addEventListener('click', event => {
  const button = event.target.closest('[data-pnmt-jump]');
  if (!button) return;
  const target = document.getElementById(button.dataset.pnmtJump === 'mapa' ? 'explore-o-parque' : 'catalogo-espacos');
  if (!target) return;
  target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  const focus = target.shadowRoot?.querySelector('h2') || target.querySelector('h2') || target;
  const previous = focus.getAttribute('tabindex');
  focus.setAttribute('tabindex', '-1');
  focus.focus({ preventScroll: true });
  focus.addEventListener('blur', () => previous === null ? focus.removeAttribute('tabindex') : focus.setAttribute('tabindex', previous), { once: true });
});

