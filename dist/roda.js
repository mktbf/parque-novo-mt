(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const CX = 393;
  const CY = 163;
  const R = 150;
  const PERIOD_SEC = 48;

  let rafId = null;
  let observer = null;
  let currentAro = null;
  let cabins = [];
  let isVisible = false;

  function renderWheel(t) {
    if (!currentAro) return;
    currentAro.setAttribute('transform', 'rotate(' + t + ' ' + CX + ' ' + CY + ')');
    for (let i = 0; i < cabins.length; i++) {
      const angleDeg = i * 30;
      const a = ((angleDeg - t) * Math.PI) / 180;
      const x = CX + R * Math.cos(a);
      const y = CY - R * Math.sin(a);
      cabins[i].setAttribute('transform', 'translate(' + x + ', ' + y + ')');
    }
  }

  function tick(now) {
    if (!isVisible) {
      rafId = null;
      return;
    }
    const t = ((now / 1000) / PERIOD_SEC) * 360;
    renderWheel(t);
    rafId = window.requestAnimationFrame(tick);
  }

  function stopAnimation() {
    isVisible = false;
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function startAnimation() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    isVisible = true;
    if (rafId === null) {
      rafId = window.requestAnimationFrame(tick);
    }
  }

  function initRoda() {
    stopAnimation();
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    const aro = document.getElementById('pnmt-roda-aro');
    const cabinesGroup = document.getElementById('pnmt-roda-cabines');
    if (!aro || !cabinesGroup) return;

    currentAro = aro;
    cabinesGroup.innerHTML = '';
    cabins = [];

    for (let deg = 0; deg < 360; deg += 30) {
      const g = document.createElementNS(SVG_NS, 'g');
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', '-12');
      rect.setAttribute('y', '-11');
      rect.setAttribute('width', '24');
      rect.setAttribute('height', '22');
      rect.setAttribute('rx', '5');
      g.appendChild(rect);
      cabinesGroup.appendChild(g);
      cabins.push(g);
    }

    renderWheel(0);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const target = aro.closest('.reference-brand-wheel') || aro.closest('svg') || aro;
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            startAnimation();
          } else {
            stopAnimation();
          }
        }
      },
      { threshold: 0 }
    );
    observer.observe(target);
  }

  initRoda();
  window.addEventListener('hashchange', () => window.requestAnimationFrame(initRoda));
  window.addEventListener('pnmt:content-updated', () => window.requestAnimationFrame(initRoda));
})();
