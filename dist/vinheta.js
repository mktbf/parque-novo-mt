/* Vinheta de abertura: a logo animada toca uma vez por visita, só na página inicial.
   Fundo transparente no início (WebM com alfa); no Safari, que não mostra o alfa do WebM,
   toca a versão MP4 sobre fundo branco. Clique ou "Pular" encerram na hora. */
(function () {
  try {
    var rota = (location.hash || '').replace('#', '').split('?')[0];
    if (rota && rota !== 'inicio') return;
    if (sessionStorage.getItem('pnmt_vinheta')) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    sessionStorage.setItem('pnmt_vinheta', '1');
  } catch (e) { return; }

  var ua = navigator.userAgent;
  var safari = /Safari\//.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg|Android/.test(ua);
  var base = 'assets/vinheta/';

  var o = document.createElement('div');
  o.id = 'pnmt-vinheta';
  o.setAttribute('aria-hidden', 'true');
  o.style.cssText = 'position:fixed;inset:0;z-index:2147483000;cursor:pointer;transition:opacity .6s ease;' +
    'background:' + (safari ? '#fff' : 'transparent');

  var v = document.createElement('video');
  v.muted = true; v.defaultMuted = true; v.playsInline = true; v.autoplay = true; v.preload = 'auto';
  v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
  v.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;pointer-events:none';
  v.src = base + (safari ? 'vinheta.mp4' : 'vinheta.webm') + '?v=20261120-1';

  var pular = document.createElement('button');
  pular.type = 'button';
  pular.textContent = 'Pular';
  pular.style.cssText = 'position:absolute;right:24px;bottom:24px;padding:10px 18px;border-radius:999px;border:1px solid rgba(13,43,77,.25);' +
    'background:rgba(255,255,255,.85);color:#0D2B4D;font:600 14px/1 Barlow,Arial,sans-serif;letter-spacing:.5px;cursor:pointer';

  var html = document.documentElement, overflow = html.style.overflow;
  var acabou = false;
  function fim() {
    if (acabou) return;
    acabou = true;
    o.style.opacity = '0';
    html.style.overflow = overflow;
    setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 700);
  }

  v.addEventListener('ended', fim);
  v.addEventListener('error', fim);
  o.addEventListener('click', fim);
  pular.addEventListener('click', function (e) { e.stopPropagation(); fim(); });
  // Se o vídeo não começar logo (rede lenta), o site aparece sem esperar.
  setTimeout(function () { if (v.readyState < 2 || v.paused) fim(); }, 2500);
  setTimeout(fim, 9000);

  o.appendChild(v);
  o.appendChild(pular);
  html.style.overflow = 'hidden';
  (document.body || html).appendChild(o);
  var p = v.play();
  if (p && p.catch) p.catch(fim);
})();
