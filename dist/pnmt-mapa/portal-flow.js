/* Integração de navegação. Não cria modelos nem modifica a câmera/iluminação. */
const params = new URLSearchParams(location.search);
const embedded = window.parent !== window;
export const portalMode = embedded && ['overview', 'space'].includes(params.get('portal')) ? params.get('portal') : null;
export const portalSpaceId = portalMode === 'space' ? params.get('espaco') : null;
const overview = new URL('../#espacos', import.meta.url).href;

export function openPortalPlace(place) {
  // Somente cliques explícitos passam aqui. Carregamento e mudanças de câmera não navegam.
  // Locais sem página (por exemplo, estacionamentos) continuam com seu guia no mapa.
  if (!portalMode || !place?.url || place.id === portalSpaceId) return false;
  try {
    if (new URL(place.url).origin !== location.origin) return false;
  } catch { return false; }
  window.parent.postMessage({ type: 'pnmt:navigate', id: place.id }, location.origin);
  return true;
}

export function portalSelection(place, controls, escape) {
  if (!portalSpaceId || place.id !== portalSpaceId) return null;
  return `<div class="selection-top portal-selection-top"><a class="portal-overview" href="${overview}" target="_top">← Mapa geral do parque</a></div>
    <div class="selection-copy portal-selection-copy">
      <div class="selection-tag">EXPLORE EM 3D</div>
      <h2 tabindex="-1">${escape(place.name)}</h2>
      ${controls}
      <p class="portal-controls-note">Arraste para girar e aproxime para observar os detalhes.</p>
      <button class="portal-details" type="button" data-portal-details>Informações e visita <span aria-hidden="true">↓</span></button>
    </div>`;
}

export function reportPortalFallback() {
  if (portalMode) window.parent.postMessage({ type: 'pnmt:scene-error' }, location.origin);
}

if (portalMode) {
  document.documentElement.dataset.portal = portalMode;
  const details = event => {
    if (!event.target.closest('[data-portal-details]')) return;
    window.parent.postMessage({ type: 'pnmt:details' }, location.origin);
  };
  document.addEventListener('click', details);
  window.addEventListener('pagehide', () => document.removeEventListener('click', details), { once: true });
}
