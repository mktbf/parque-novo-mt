/* Vinheta da logo: na primeira página da visita, a logo do topo se monta animada
   no próprio lugar e depois dá lugar à imagem fixa. Discreta: nada cobre o site.
   WebM com transparência; no Safari, MP4 sobre branco (o topo é branco). */
(function () {
  function inicia() {
    try {
      if (sessionStorage.getItem('pnmt_vinheta')) return;
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      sessionStorage.setItem('pnmt_vinheta', '1');
    } catch (e) { return; }

    var header = document.querySelector('.site-header');
    var brand = header && header.querySelector('.brand');
    var logo = brand && brand.querySelector('.logo-claro');
    if (!logo || header.classList.contains('is-scrolled') || window.scrollY > 40) return;

    var ua = navigator.userAgent;
    var safari = /Safari\//.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg|Android/.test(ua);

    var v = document.createElement('video');
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.autoplay = true; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
    v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;' +
      'opacity:1;transition:opacity .6s ease';
    v.src = 'assets/vinheta/logo.' + (safari ? 'mp4' : 'webm') + '?v=20261120-2';

    var acabou = false;
    function fim() {
      if (acabou) return;
      acabou = true;
      logo.style.removeProperty('opacity');
      v.style.opacity = '0';
      setTimeout(function () { if (v.parentNode) v.parentNode.removeChild(v); }, 700);
      window.removeEventListener('scroll', rolou);
    }
    function rolou() { if (header.classList.contains('is-scrolled') || window.scrollY > 40) fim(); }

    v.addEventListener('ended', fim);
    v.addEventListener('error', fim);
    window.addEventListener('scroll', rolou, { passive: true });
    // Se o vídeo não começar logo, a logo fixa volta na hora.
    setTimeout(function () { if (v.readyState < 2 || v.paused) fim(); }, 2000);
    setTimeout(fim, 7000);

    logo.style.setProperty('opacity', '0', 'important');
    brand.appendChild(v);
    var p = v.play();
    if (p && p.catch) p.catch(fim);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicia);
  else inicia();
})();
