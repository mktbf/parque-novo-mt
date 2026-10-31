(() => {
  'use strict';

  const header = document.querySelector('.site-header.reference-header');
  if (!header || !header.parentNode) return;

  const spacer = document.createElement('div');
  spacer.className = 'site-header-spacer';
  spacer.setAttribute('aria-hidden', 'true');
  spacer.style.display = 'none';
  spacer.style.pointerEvents = 'none';
  header.parentNode.insertBefore(spacer, header);

  let measuredLeft = 0;
  let measuredWidth = 0;
  let measuredHeight = 0;

  function applyFixedStyles() {
    spacer.style.height = measuredHeight + 'px';
    spacer.style.display = 'block';
    header.style.position = 'fixed';
    header.style.top = '0';
    header.style.left = measuredLeft + 'px';
    header.style.width = measuredWidth + 'px';
    header.style.zIndex = '1000';
  }

  function clearFixedStyles() {
    spacer.style.display = 'none';
    header.style.position = '';
    header.style.top = '';
    header.style.left = '';
    header.style.width = '';
    header.style.zIndex = '';
  }

  function measureHeader() {
    const wasScrolled = header.classList.contains('is-scrolled');
    if (wasScrolled) {
      clearFixedStyles();
    }
    const rect = header.getBoundingClientRect();
    measuredLeft = rect.left;
    measuredWidth = rect.width;
    measuredHeight = rect.height;
    spacer.style.height = measuredHeight + 'px';
    if (wasScrolled) {
      applyFixedStyles();
    }
  }

  function onScroll() {
    const shouldScroll = window.scrollY > 40;
    const isScrolled = header.classList.contains('is-scrolled');

    if (shouldScroll && !isScrolled) {
      const rect = header.getBoundingClientRect();
      measuredLeft = rect.left;
      measuredWidth = rect.width;
      measuredHeight = rect.height;
      header.classList.add('is-scrolled');
      applyFixedStyles();
    } else if (!shouldScroll && isScrolled) {
      header.classList.remove('is-scrolled');
      clearFixedStyles();
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    measureHeader();
    onScroll();
  }, { passive: true });
  window.addEventListener('load', () => {
    measureHeader();
    onScroll();
  });

  measureHeader();
  onScroll();
})();
