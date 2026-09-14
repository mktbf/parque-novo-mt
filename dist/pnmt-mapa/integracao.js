import './explore-parque.js?v=portal-espacos-20260914-1';

/* Reutiliza as páginas do roteador do portal e apenas acrescenta o visualizador. */
function insertMap() {
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
