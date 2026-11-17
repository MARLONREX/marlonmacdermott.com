// Reveal each homepage image in one-CSS-pixel strips over white.
(() => {
  const root = document.documentElement;
  if (!root.classList.contains('reveal-enabled')) return;
  const duration = 1000 + Math.random() * 200;
  document.querySelectorAll('.portfolio-home .reference-tile > img').forEach(image => {
    const tile = image.parentElement;
    const direction = Math.floor(Math.random() * 4);
    const cover = document.createElement('div');
    cover.setAttribute('aria-hidden', 'true');
    Object.assign(cover.style, {
      position: 'absolute', inset: '0', zIndex: '3', pointerEvents: 'none', background: '#fff'
    });
    tile.append(cover);
    let started = false;
    function finish() {
      tile.classList.add('tile-reveal-ready');
      cover.remove();
    }
    async function reveal() {
      if (started) return;
      started = true;
      if (!image.naturalWidth) { finish(); return; }
      try { await image.decode(); } catch {}
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
      const bounds = tile.getBoundingClientRect();
      const pixels = Math.max(1, Math.ceil(direction < 2 ? bounds.width : bounds.height));
      const end = ['inset(0 0 0 100%)', 'inset(0 100% 0 0)',
        'inset(100% 0 0 0)', 'inset(0 0 100% 0)'][direction];
      // The opaque cover is in place before making the decoded image visible.
      tile.classList.add('tile-reveal-ready');
      try {
        await cover.animate([{clipPath: 'inset(0 0 0 0)'}, {clipPath: end}],
          {duration, easing: `steps(${pixels}, end)`, fill: 'forwards'}).finished;
      } finally { finish(); }
    }
    image.addEventListener('load', reveal, {once: true});
    image.addEventListener('error', finish, {once: true});
    if (image.complete) reveal();
    window.addEventListener('pageshow', event => { if (event.persisted) finish(); });
  });
})();
