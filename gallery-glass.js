// Low-resolution image layer creates refracted glass blocks without changing source files.
(() => {
  document.querySelectorAll('.reference-tile').forEach(tile => {
    const source = tile.querySelector('img');
    if (!source) return;
    const glass = document.createElement('canvas');
    glass.className = 'tile-glass';
    glass.setAttribute('aria-hidden', 'true');
    glass.width = 20; glass.height = 20;
    tile.insertBefore(glass, tile.querySelector('.tile-details'));
    function paint() {
      if (!source.naturalWidth || !source.naturalHeight) return;
      const ctx = glass.getContext('2d');
      const edge = Math.min(source.naturalWidth, source.naturalHeight);
      ctx.clearRect(0, 0, 20, 20);
      ctx.drawImage(source, (source.naturalWidth-edge)/2, (source.naturalHeight-edge)/2, edge, edge, 0, 0, 20, 20);
    }
    source.addEventListener('load', paint);
    if (source.complete) paint();
  });
})();
