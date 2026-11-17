// Reveal loaded homepage images in twelve directional bars.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const duration = 1000 + Math.random() * 200;
  const count = 12;
  const barDuration = duration * 0.24;
  const stagger = (duration - barDuration) / (count - 1);

  document.querySelectorAll('.portfolio-home .reference-tile > img').forEach(image => {
    const tile = image.parentElement;
    const direction = Math.floor(Math.random() * 4);
    const horizontal = direction < 2;
    const reverse = direction === 1 || direction === 3;
    const cover = document.createElement('div');
    cover.setAttribute('aria-hidden', 'true');
    Object.assign(cover.style, {
      position: 'absolute', inset: '0', zIndex: '3', pointerEvents: 'none',
      display: 'flex', flexDirection: horizontal ? 'row' : 'column'
    });
    const bars = Array.from({length: count}, () => {
      const bar = document.createElement('div');
      Object.assign(bar.style, {
        flex: '1 1 0', background: '#fff',
        transformOrigin: horizontal ? (reverse ? 'left' : 'right') : (reverse ? 'top' : 'bottom')
      });
      cover.append(bar);
      return bar;
    });
    tile.append(cover);
    let started = false;
    async function reveal() {
      if (started) return;
      started = true;
      if (!image.naturalWidth) { cover.remove(); return; }
      try { await image.decode(); } catch { /* A loaded image can still be painted. */ }
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { cover.remove(); return; }
      try {
        await Promise.all(bars.map((bar, index) => bar.animate(
          [{transform: horizontal ? 'scaleX(1)' : 'scaleY(1)'},
           {transform: horizontal ? 'scaleX(0)' : 'scaleY(0)'}],
          {duration: barDuration, delay: (reverse ? count - 1 - index : index) * stagger,
            easing: 'linear', fill: 'forwards'}
        ).finished));
      } finally { cover.remove(); }
    }
    image.addEventListener('load', reveal, {once: true});
    image.addEventListener('error', () => cover.remove(), {once: true});
    if (image.complete) reveal();
    // Never leave an image covered when returning through the back/forward cache.
    window.addEventListener('pageshow', event => {
      if (event.persisted) cover.remove();
    });
  });
})();
