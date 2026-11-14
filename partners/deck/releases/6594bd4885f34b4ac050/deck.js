(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const stage = $('stage');
  const slides = [...stage.children];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = () => innerWidth < 700 || (innerHeight > innerWidth && innerWidth < 760);
  const hashIndex = () => /^#[1-8]$/.test(location.hash) ? Number(location.hash.slice(1)) - 1 : null;
  let saved = 0;
  try { const value = localStorage.getItem('sg-mkte-slide'); if (/^[0-7]$/.test(value ?? '')) saved = Number(value); } catch {}
  const state = {idx:hashIndex() ?? saved, reading:false, narrow:narrow()};
  let toastTimer, touch, lightboxTrigger, resizeFrame;
  const stacked = () => state.reading || state.narrow;
  const modalOpen = () => $('overview').open || $('lightbox').open;

  function persist() {
    try { localStorage.setItem('sg-mkte-slide', String(state.idx)); } catch {}
    history.replaceState(null, '', `#${state.idx + 1}`);
  }
  function scrollToSlide() {
    stage.scrollTo({top:slides[state.idx].offsetTop, behavior:reduced.matches ? 'instant' : 'smooth'});
  }
  function render() {
    stage.classList.toggle('stacked', stacked());
    stage.setAttribute('aria-roledescription', stacked() ? 'document' : 'carousel');
    slides.forEach((slide, i) => {
      slide.classList.toggle('current', i === state.idx);
      slide.classList.toggle('before', i < state.idx);
      slide.inert = !stacked() && i !== state.idx;
      if (stacked()) slide.removeAttribute('aria-hidden');
      else slide.setAttribute('aria-hidden', String(i !== state.idx));
    });
    $('controls').classList.toggle('dark', !stacked() && [0,3,7].includes(state.idx));
    $('pager').hidden = stacked();
    $('prev').disabled = state.idx === 0;
    $('next').disabled = state.idx === 7;
    $('counter').textContent = `${String(state.idx + 1).padStart(2, '0')} / 08`;
    $('read').hidden = state.narrow;
    $('read').textContent = state.reading ? 'Slide view' : 'Read all';
    $('back').hidden = !state.reading || state.narrow;
  }
  function setMenu(open, restoreFocus = false) {
    $('menu').hidden = !open;
    $('menu-toggle').setAttribute('aria-expanded', String(open));
    if (open) $('show-overview').focus();
    else if (restoreFocus) $('menu-toggle').focus();
  }
  function go(idx) {
    state.idx = Math.max(0, Math.min(7, idx));
    setMenu(false);
    render(); persist();
    if (stacked()) scrollToSlide();
  }
  function toggleRead() {
    state.reading = !state.reading;
    setMenu(false, true); render();
    if (stacked()) scrollToSlide();
  }
  function toast(message) {
    clearTimeout(toastTimer);
    $('toast').textContent = message;
    $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 2400);
  }
  function buildThumbs() {
    const width = stage.clientWidth, height = Math.max(stage.clientHeight, 300);
    $('thumbnails').replaceChildren(...slides.map((slide, i) => {
      const button = document.createElement('button');
      button.className = 'thumbnail-button';
      button.setAttribute('aria-current', String(i === state.idx));
      const frame = document.createElement('div');
      frame.className = 'thumbnail';
      frame.style.aspectRatio = `${width} / ${height}`;
      const clone = slide.cloneNode(true);
      clone.querySelectorAll('[data-enlarge]').forEach(el => el.remove());
      [clone, ...clone.querySelectorAll('[id]')].forEach(el => el.removeAttribute('id'));
      clone.querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
      clone.inert = true;
      clone.setAttribute('aria-hidden', 'true');
      clone.removeAttribute('aria-label');
      Object.assign(clone.style, {position:'absolute', inset:'auto', top:'0', left:'0', width:`${width}px`, height:`${height}px`, minHeight:'0', opacity:'1', visibility:'visible', pointerEvents:'none', overflow:'hidden', transition:'none', transformOrigin:'0 0'});
      frame.append(clone);
      const label = document.createElement('span');
      label.textContent = slide.dataset.screenLabel;
      button.append(frame, label);
      button.addEventListener('click', () => { $('overview').close(); go(i); });
      return button;
    }));
    $('thumbnails').querySelectorAll('.thumbnail').forEach(frame => {
      frame.firstElementChild.style.transform = `scale(${frame.clientWidth / width})`;
    });
  }
  function closeLightbox() { $('lightbox').close(); }
  $('prev').addEventListener('click', () => go(state.idx - 1));
  $('next').addEventListener('click', () => go(state.idx + 1));
  $('read').addEventListener('click', toggleRead);
  $('back').addEventListener('click', toggleRead);
  $('menu-toggle').addEventListener('click', () => setMenu($('menu').hidden));
  $('show-overview').addEventListener('click', () => {
    setMenu(false); $('overview').showModal(); buildThumbs(); $('overview-close').focus();
  });
  $('overview-close').addEventListener('click', () => $('overview').close());
  $('overview').addEventListener('close', () => $('menu-toggle').focus());
  $('lightbox-close').addEventListener('click', closeLightbox);
  $('lightbox').addEventListener('click', event => { if (event.target === $('lightbox')) closeLightbox(); });
  $('lightbox').addEventListener('close', () => {
    if (lightboxTrigger && !lightboxTrigger.closest('[inert]')) lightboxTrigger.focus();
    else $('menu-toggle').focus();
  });
  stage.addEventListener('click', event => {
    const button = event.target.closest('[data-enlarge]');
    if (!button) return;
    lightboxTrigger = button;
    const img = $(button.dataset.enlarge);
    $('lightbox-image').src = img.src;
    $('lightbox-image').alt = button.dataset.label;
    $('lightbox-label').textContent = button.dataset.label;
    $('lightbox').showModal(); $('lightbox-close').focus();
  });
  document.addEventListener('pointerdown', event => {
    if (!$('menu').hidden && !event.target.closest('#menu, #menu-toggle')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (modalOpen()) {
      // Keep Tab inside the dialog, including a lightbox with only one control.
      if (event.key === 'Tab') {
        const dialog = $('lightbox').open ? $('lightbox') : $('overview');
        const controls = [...dialog.querySelectorAll('button, a[href]')].filter(el => !el.closest('[inert]') && !el.disabled);
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      return; // Native dialogs handle Escape.
    }
    if (!$('menu').hidden) {
      if (event.key === 'Escape') { event.preventDefault(); setMenu(false, true); }
      else if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
        event.preventDefault();
        const items = [...$('menu').querySelectorAll('button')].filter(el => !el.hidden);
        const current = items.indexOf(document.activeElement);
        const index = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items[index].focus();
      } else if (event.key === 'Tab') setMenu(false, true);
      return;
    }
    if (stacked() || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.target.closest('input, textarea, select, [contenteditable=true]')) return;
    let next;
    if (['ArrowRight','PageDown'].includes(event.key) || (event.key === ' ' && !event.target.closest('button,a'))) next = state.idx + 1;
    else if (['ArrowLeft','PageUp'].includes(event.key)) next = state.idx - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = 7;
    if (next !== undefined) { event.preventDefault(); go(next); }
  });
  stage.addEventListener('touchstart', event => {
    touch = event.touches.length === 1 && !event.target.closest('button,a') ? {x:event.touches[0].clientX, y:event.touches[0].clientY} : null;
  }, {passive:true});
  stage.addEventListener('touchcancel', () => { touch = null; });
  stage.addEventListener('touchend', event => {
    const start = touch; touch = null;
    if (!start || stacked() || modalOpen() || !$('menu').hidden || !event.changedTouches[0]) return;
    const dx = event.changedTouches[0].clientX - start.x, dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.4) go(state.idx + (dx < 0 ? 1 : -1));
  }, {passive:true});
  $('share').addEventListener('click', async () => {
    setMenu(false, true);
    const url = new URL('/partners/deck/', location.href).href;
    if (navigator.share) {
      try { await navigator.share({title:'Savanna Guides', text:'Trails, parks, campsites, countries and wildlife.', url}); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(url); toast('Link copied'); }
    catch { toast(url); }
  });
  $('fullscreen').hidden = !(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  $('fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else await (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen).call(document.documentElement);
    } catch { toast('Fullscreen isn’t available here'); }
  });
  function fullscreenChange() {
    $('fullscreen').setAttribute('aria-label', document.fullscreenElement || document.webkitFullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen');
  }
  document.addEventListener('fullscreenchange', fullscreenChange);
  document.addEventListener('webkitfullscreenchange', fullscreenChange);
  window.addEventListener('hashchange', () => { const idx = hashIndex(); if (idx !== null) go(idx); });
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      const wasStacked = stacked(); state.narrow = narrow(); render();
      if (wasStacked !== stacked() && stacked()) scrollToSlide();
      if ($('overview').open) buildThumbs();
    });
  });
  const collaboration = stage.querySelector('[data-wrap6]');
  new ResizeObserver(() => collaboration.classList.toggle('wide', collaboration.clientWidth >= 700)).observe(collaboration);
  render(); persist();
  if (stacked()) requestAnimationFrame(scrollToSlide);
  // Font loading can change section heights after the first deep-link scroll.
  document.fonts.ready.then(() => { if (stacked() && stage.scrollTop === 0) scrollToSlide(); });
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/partners/deck/sw.js', {scope:'/partners/deck/', updateViaCache:'none'})
      .then(() => navigator.serviceWorker.ready)
      .then(() => { document.documentElement.dataset.offlineReady = 'true'; })
      .catch(error => console.warn('Deck offline installation failed:', error));
  }
})();
