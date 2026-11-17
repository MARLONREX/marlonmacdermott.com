(() => {
 try {
  const previous = sessionStorage.getItem('last-portfolio-page');
  if (!history.state?.portfolioPrevious && previous && previous !== location.href) {
   history.replaceState({...history.state, portfolioPrevious:previous}, '', location.href);
  }
  sessionStorage.setItem('last-portfolio-page', location.href);
 } catch {}
})();
(() => {
  let leaving = false;
  document.addEventListener('click', event => {
    const tile = event.target.closest('a.reference-tile, a.project-card');
    if (!tile || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || tile.hasAttribute('download') || (tile.target && tile.target !== '_self')) return;
    const destination = new URL(tile.href, location.href);
    if (destination.protocol !== location.protocol || destination.host !== location.host || !destination.pathname.endsWith('.html')) return;
    event.preventDefault();
    if (leaving) return;
    leaving = true;
    // The body's origin includes the document scroll position.
    const bounds = document.body.getBoundingClientRect();
    document.body.style.transformOrigin = `${event.clientX - bounds.left}px ${event.clientY - bounds.top}px`;
    tile.classList.add('is-opening');
    document.body.classList.add('gallery-leaving');
    const duration = matchMedia('(prefers-reduced-motion:reduce)').matches ? 0 : 300;
    setTimeout(() => location.assign(destination.href), duration);
  });
  window.addEventListener('pageshow', () => {
    leaving = false;
    document.body.classList.remove('gallery-leaving');
    document.querySelectorAll('.is-opening').forEach(tile => tile.classList.remove('is-opening'));
    // Keep the wheel pivot intact while an incoming page is turning.
  });
})();


// Escape dismisses an open image first, otherwise returns one history entry.
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.defaultPrevented) return;
  const dialog = document.querySelector('dialog[open]');
  if (dialog) {
    event.preventDefault();
    dialog.close();
    return;
  }
  if (history.length > 1) {
    event.preventDefault();
    history.back();
  }
});

// Free movement during a gesture; settle only after the gesture becomes still.
(() => {
  const column = document.querySelector('.folder-project-images');
  if (!column) return;
  let idleTimer, frame = 0, lastDirection = 0;
  const desktop = () => matchMedia('(min-width:821px)').matches;
  function cancelSettle() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }
  function settle() {
    if (!desktop() || frame) return;
    const viewport = column.getBoundingClientRect();
    const top = column.scrollTop;
    const ranges = [...column.querySelectorAll('figure')].map(figure => {
      const rect = figure.getBoundingClientRect();
      const start = top + rect.top - viewport.top;
      return { start, end:start + Math.max(0, rect.height - column.clientHeight) };
    });
    if (!ranges.length) return;
    // A tall image can remain at any position that shows its interior.
    const candidates = ranges.map(range => Math.max(range.start, Math.min(top, range.end)));
    const target = Math.max(0, Math.min(column.scrollHeight - column.clientHeight,
      candidates.reduce((best, point) => Math.abs(point-top) < Math.abs(best-top) ? point : best)));
    // Only settle a very near edge, never pull back against the chosen direction.
    if (Math.abs(target-top) < 1 || Math.abs(target-top) > 28) return;
    if (lastDirection && Math.sign(target-top) !== lastDirection) return;
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const startTime = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now-startTime)/320);
      column.scrollTop = top + (target-top) * (1-Math.pow(1-progress,3));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else frame = 0;
    }
    frame = requestAnimationFrame(tick);
  }
  function schedule() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(settle, 180);
  }
  column.addEventListener('scroll', () => { if (!frame) schedule(); }, {passive:true});
  document.addEventListener('wheel', event => {
    if (!desktop() || event.ctrlKey || document.querySelector('dialog[open]')) return;
    if (column.scrollHeight <= column.clientHeight) return;
    // One input path for the image, copy and sidebar: no native/custom speed split.
    event.preventDefault();
    cancelSettle();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? column.clientHeight : 1);
    if (delta) lastDirection = Math.sign(delta);
    column.scrollBy({top:delta, behavior:'instant'});
    schedule();
  }, {passive:false});
  column.addEventListener('touchstart', () => { cancelSettle(); clearTimeout(idleTimer); }, {passive:true});
  column.addEventListener('touchend', schedule, {passive:true});
  column.addEventListener('keydown', () => { cancelSettle(); schedule(); });
})();

// Gallery, Me and Contact occupy three positions on a turning page wheel.
(() => {
  const positions = { 'index.html':0, 'about.html':90, 'contact.html':-90 };
  const current = location.pathname.split('/').pop() || 'index.html';
  let rotating = false;
  const reduced = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
  function setWheelPivot() {
    const bounds = document.body.getBoundingClientRect();
    document.body.style.transformOrigin = (-innerWidth*.08 - bounds.left) + 'px ' + (innerHeight*1.08 - bounds.top) + 'px';
  }
  try {
    const arrival = JSON.parse(sessionStorage.getItem('page-turn') || 'null');
    sessionStorage.removeItem('page-turn');
    if (arrival && arrival.page === current && !reduced()) {
      document.body.style.animation = 'none';
      setWheelPivot();
      const pivot = document.body.style.transformOrigin;
      document.body.animate([
        { transformOrigin:pivot, transform:`rotate(${-arrival.angle/2}deg)`, opacity:1 },
        { transformOrigin:pivot, transform:'rotate(0deg)', opacity:1 }
      ], { duration:500, easing:'cubic-bezier(0,0,.2,1)' });
    }
  } catch {}
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
    const destination = new URL(link.href, location.href);
    const next = destination.pathname.split('/').pop();
    if (!(next in positions) || (!(current in positions) && next === 'index.html') || destination.host !== location.host || destination.protocol !== location.protocol || current === next) return;
    if (!link.closest('.project-sidebar')) return;
    event.preventDefault();
    if (rotating) return;
    rotating = true;
    const difference = positions[next] - (positions[current] ?? 0);
    const fromWorkPage = !(current in positions);
    const angle = fromWorkPage
      ? (next === 'about.html' ? 90 : -90)
      : next === 'index.html'
        ? -((((-difference) % 360) + 360) % 360 || 360)
        : (((difference % 360) + 360) % 360 || 360);
    if (reduced()) { location.assign(destination.href); return; }
    try { sessionStorage.setItem('page-turn', JSON.stringify({page:next,angle})); } catch {}
    setWheelPivot();
    document.body.style.pointerEvents = 'none';
    const pivot = document.body.style.transformOrigin;
    const animation = document.body.animate([
      { transformOrigin:pivot, transform:'rotate(0deg)', opacity:1 },
      { transformOrigin:pivot, transform:`rotate(${angle/2}deg)`, opacity:1 }
    ], { duration:500, easing:'cubic-bezier(.4,0,1,1)', fill:'forwards' });
    animation.finished.then(() => location.assign(destination.href));
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      document.body.getAnimations().forEach(animation => animation.cancel());
      document.body.style.pointerEvents = '';
      rotating = false;
    }
  });
})();




// Single-image pages need no trailing scroll space or settling.
(() => {
  const column = document.querySelector('.folder-project-images');
  if (!column) return;
  function updateSingleImage() {
    const single = column.querySelectorAll('figure').length === 1;
    column.classList.toggle('single-image', single);
  }
  new MutationObserver(updateSingleImage).observe(column, {childList:true});
  updateSingleImage();
})();


// Hold Back briefly on Me/Contact so departure can animate before history navigation.
(() => {
 const current = location.pathname.split('/').pop();
 if (!['about.html','contact.html'].includes(current)) return;
 let turningBack = false;
 function installBackGuard() {
  if (turningBack || history.state?.portfolioBackGuard) return;
  const previous = history.state?.portfolioPrevious;
  if (!previous) return;
  history.pushState({...history.state, portfolioBackGuard:true}, '', location.href);
 }
 installBackGuard();
 window.addEventListener('pageshow', installBackGuard);
 window.addEventListener('popstate', () => {
  if (turningBack || history.state?.portfolioBackGuard) return;
  const previous = history.state?.portfolioPrevious;
  if (!previous) return;
  turningBack = true;
  const target = new URL(previous).pathname.split('/').pop();
  const positions = {'index.html':0,'about.html':90,'contact.html':-90};
  const difference = (positions[target] ?? 0) - positions[current];
  const angle = target === 'index.html' || !(target in positions)
   ? -((((-difference)%360)+360)%360 || 90)
   : (((difference%360)+360)%360 || 90);
  try { sessionStorage.setItem('page-turn',JSON.stringify({page:target,angle})); } catch {}
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) { history.back(); return; }
  const bounds = document.body.getBoundingClientRect();
  const pivot = (-innerWidth*.08-bounds.left)+'px '+(innerHeight*1.08-bounds.top)+'px';
  document.body.style.pointerEvents='none';
  const animation = document.body.animate([
   {transformOrigin:pivot,transform:'rotate(0deg)',opacity:1},
   {transformOrigin:pivot,transform:'rotate('+angle/2+'deg)',opacity:1}
  ],{duration:500,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
  animation.finished.then(()=>history.back());
 });
 window.addEventListener('pageshow',event=>{if(event.persisted){turningBack=false;document.body.style.pointerEvents='';installBackGuard();}});
})();

window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  try {
    const arrival=JSON.parse(sessionStorage.getItem('page-turn')||'null');
    if (!arrival || arrival.page!==location.pathname.split('/').pop()) return;
    sessionStorage.removeItem('page-turn');
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const rect=document.body.getBoundingClientRect();
    const pivot=(-innerWidth*.08-rect.left)+'px '+(innerHeight*1.08-rect.top)+'px';
    document.body.animate([
      {transformOrigin:pivot,transform:'rotate('+(-arrival.angle/2)+'deg)',opacity:1},
      {transformOrigin:pivot,transform:'rotate(0deg)',opacity:1}
    ],{duration:500,easing:'cubic-bezier(0,0,.2,1)'});
  } catch {}
});
