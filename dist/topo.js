(() => {
  'use strict';

  const header = document.querySelector('.site-header.reference-header');
  if (!header) return;

  let ticking = false;

  function updateHeader() {
    ticking = false;
    const y = window.scrollY;
    if (y > 60) {
      header.classList.add('is-scrolled');
    } else if (y < 20) {
      header.classList.remove('is-scrolled');
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateHeader);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
