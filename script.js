(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- skill dots ---------- */
  document.querySelectorAll('.dots').forEach(el => {
    const lvl = parseInt(el.dataset.level, 10) || 0;
    for (let i = 0; i < 5; i++) {
      const d = document.createElement('i');
      if (i >= lvl) d.className = 'off';
      el.appendChild(d);
    }
  });

  /* ---------- stop-motion "boiling" lines ---------- */
  // Only boil what's on screen, at ~8 fps like hand-drawn animation.
  const boilEls = [...document.querySelectorAll('.boil')];
  const visible = new Set();
  if (!reduceMotion && boilEls.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) visible.add(e.target);
        else { visible.delete(e.target); e.target.style.filter = ''; }
      });
    }, { rootMargin: '100px' });
    boilEls.forEach(el => io.observe(el));
    let frame = 0;
    setInterval(() => {
      frame = (frame + 1) % 3;
      visible.forEach(el => { el.style.filter = `url(#boil${frame})`; });
    }, 125);
  }

  /* ---------- reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const rio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach((el, i) => {
    el.style.transitionDelay = (i % 3) * 80 + 'ms';
    rio.observe(el);
  });
  // drop the stagger after reveal so hover feels instant
  revealEls.forEach(el => el.addEventListener('transitionend', () => { el.style.transitionDelay = '0ms'; }, { once: true }));

  const tio = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); tio.unobserve(e.target); } });
  }, { threshold: 0.6 });
  document.querySelectorAll('.tag-section').forEach(t => tio.observe(t));

  /* ---------- lightbox ---------- */
  const lb = document.getElementById('lightbox');
  const stage = lb.querySelector('.lb-stage');
  const caption = lb.querySelector('.lb-caption');
  const prevBtn = lb.querySelector('.lb-prev');
  const nextBtn = lb.querySelector('.lb-next');
  const items = [...document.querySelectorAll('.zoomable, .zoomable-box')];
  let group = [], idx = 0, lastFocus = null;

  function render() {
    const src = group[idx];
    stage.innerHTML = '';
    let node;
    if (src.tagName === 'IMG') {
      node = new Image();
      node.src = src.currentSrc || src.src;
      node.alt = src.alt;
      if (src.dataset.group === 'logo') node.classList.add('transparent');
    } else {
      node = src.cloneNode(true);
      node.classList.remove('zoomable-box');
    }
    stage.appendChild(node);
    caption.textContent = src.dataset.caption || src.alt || '';
    const multi = group.length > 1;
    prevBtn.hidden = nextBtn.hidden = !multi;
    // restart pop animation
    stage.style.animation = 'none'; void stage.offsetWidth; stage.style.animation = '';
  }

  function open(el) {
    const g = el.dataset.group;
    group = g ? items.filter(i => i.dataset.group === g) : [el];
    idx = group.indexOf(el);
    lastFocus = document.activeElement;
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('open'));
    document.body.style.overflow = 'hidden';
    render();
    lb.querySelector('.lb-close').focus();
  }
  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { lb.hidden = true; stage.innerHTML = ''; }, 250);
    if (lastFocus) lastFocus.focus();
  }
  function step(d) { idx = (idx + d + group.length) % group.length; render(); }

  items.forEach(el => {
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.addEventListener('click', () => open(el));
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(el); } });
  });
  lb.querySelector('.lb-close').addEventListener('click', close);
  prevBtn.addEventListener('click', e => { e.stopPropagation(); step(-1); });
  nextBtn.addEventListener('click', e => { e.stopPropagation(); step(1); });
  lb.addEventListener('click', e => { if (e.target === lb || e.target === stage || e.target.classList.contains('lb-figure')) close(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  // swipe on touch screens
  let tx = null;
  lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50 && group.length > 1) step(dx < 0 ? 1 : -1);
    tx = null;
  });
})();
