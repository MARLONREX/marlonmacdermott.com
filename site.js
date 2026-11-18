const projectSidebar = document.querySelector('.project-sidebar');
const filters = document.querySelectorAll('.project-filter');
const projectTiles = document.querySelectorAll('.reference-tile');
const projectGrid = document.querySelector('.reference-grid');
const originalProjectOrder = [...projectTiles];
let rearrangeTimer;
let alignmentFrame;

function animateProjectOrder(orderedTiles, focusTile = null) {
  if (!projectGrid) return;

  const previousPositions = new Map(
    [...projectGrid.children].map(tile => [tile, tile.getBoundingClientRect()])
  );

  orderedTiles.forEach(tile => projectGrid.appendChild(tile));

  requestAnimationFrame(() => {
    const focusScrollTop = focusTile
      ? focusTile.getBoundingClientRect().top + window.scrollY - 12
      : null;

    orderedTiles.forEach(tile => {
      tile.getAnimations().forEach(animation => animation.cancel());
      const previous = previousPositions.get(tile);
      const next = tile.getBoundingClientRect();
      if (!previous) return;
      const deltaX = previous.left - next.left;
      const deltaY = previous.top - next.top;
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

      tile.animate(
        [
          { transform:`translate(${deltaX}px, ${deltaY}px)` },
          { transform:'translate(0, 0)' }
        ],
        { duration:500, easing:'cubic-bezier(.4,0,.2,1)', fill:'backwards' }
      );
    });

    if (focusTile) {
      alignmentFrame = requestAnimationFrame(() => {
        window.scrollTo({ top:focusScrollTop, behavior:'smooth' });
      });
    }
  });
}

function gatherCategoryIntoView(category) {
  const matching = originalProjectOrder.filter(tile => tile.dataset.category === category);
  const remaining = originalProjectOrder.filter(tile => tile.dataset.category !== category);
  if (!matching.length) return;
  animateProjectOrder([...matching, ...remaining]);
  window.scrollTo({top:0, behavior:'smooth'});
}

filters.forEach(button => {
  button.addEventListener('click', () => {
    const selected = button.dataset.filter;
    clearTimeout(rearrangeTimer);
    cancelAnimationFrame(alignmentFrame);
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    projectTiles.forEach(tile => tile.classList.toggle('is-dimmed', selected !== 'all' && tile.dataset.category !== selected));

    rearrangeTimer = setTimeout(() => {
      if (selected === 'all') animateProjectOrder(originalProjectOrder);
      else gatherCategoryIntoView(selected);
    }, 500);
  });
});

const requestedFilter = new URLSearchParams(window.location.search).get('filter');
if (requestedFilter) {
  const requestedButton = [...filters].find(button => button.dataset.filter === requestedFilter);
  if (requestedButton) requestedButton.click();
}

async function loadFolderCover(tile) {
  const destination = new URL(tile.href, window.location.href);
  if (!destination.pathname.endsWith('/project.html')) return;
  const projectName = destination.searchParams.get('project');
  if (!projectName) return;

  try {
    const response = await fetch(`project-data/${encodeURIComponent(projectName)}.json`, { cache:'no-store' });
    if (!response.ok) return;
    const project = await response.json();
    const cover = project.cover || project.images[0]?.url;
    if (!cover) return;

    let image = tile.querySelector('img');
    if (!image) {
      image = document.createElement('img');
      tile.insertBefore(image, tile.firstChild);
    }
    image.src = cover;
    image.alt = `${project.title || projectName} project cover`;
    tile.classList.remove('concept-placeholder');
  } catch (error) {
    // Keep the existing cover or placeholder if the private folder reader is unavailable.
  }
}

projectTiles.forEach(tile => loadFolderCover(tile));
