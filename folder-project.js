const projectParameters = new URLSearchParams(window.location.search);
const requestedProjectName = projectParameters.get('project');
const folderProjectName = requestedProjectName === 'Hazlewood' ? 'Hazelwood' : requestedProjectName;

const titleElement = document.querySelector('[data-folder-title]');
const copyElement = document.querySelector('[data-folder-copy]');
const imagesElement = document.querySelector('[data-folder-images]');

function renderImagePlaceholders() {
  for (let number = 1; number <= 3; number += 1) {
    const placeholder = document.createElement('div');
    placeholder.className = 'folder-image-placeholder';
    placeholder.textContent = `Add images to Image${number}`;
    imagesElement.appendChild(placeholder);
  }
}

async function loadFolderProject() {
  if (!folderProjectName) {
    titleElement.textContent = 'Project not selected';
    copyElement.classList.add('folder-project-error');
    copyElement.textContent = 'Return to the Projects Gallery and select a project square.';
    renderImagePlaceholders();
    return;
  }

  titleElement.textContent = folderProjectName;
  document.title = `${folderProjectName} — Marlon MacDermott`;

  try {
    const response = await fetch(`project-data/${encodeURIComponent(folderProjectName)}.json`, { cache:'no-store' });
    if (!response.ok) throw new Error('Project folder not found');
    const project = await response.json();
    const title = project.title || folderProjectName;
    titleElement.textContent = title;
    document.title = title + ' — Marlon MacDermott';
    if (project.year) {
      const year = document.createElement('p');
      year.dataset.projectYear = '';
      year.textContent = project.year;
      titleElement.after(year);
    }
    copyElement.textContent = project.text.replace(/^Category:[^\r\n]*(?:\r?\n)*/gmi, '').trim();

    if (project.images.length) {
      project.images.forEach(image => {
        const figure = document.createElement('figure');
        const element = document.createElement('img');
        element.src = image.url;
        element.alt = image.name.replaceAll('-', ' ').replaceAll('_', ' ');
        element.loading = 'lazy';
        const link = document.createElement('a');
        link.href = image.url;
        link.appendChild(element);
        figure.appendChild(link);
        imagesElement.appendChild(figure);
      });
    } else {
      renderImagePlaceholders();
    }
  } catch (error) {
    copyElement.classList.add('folder-project-error');
    copyElement.textContent = 'Project content could not be loaded. Open this page through the website preview or hosted site, then refresh.';
    renderImagePlaceholders();
  }
}

function enableProjectGallery() {
  const images = imagesElement;
  const figures = images.querySelectorAll('figure');
  if (!figures.length) return;
  const main = document.querySelector('.folder-project-main');
  const menu = document.querySelector('.project-menu');
  function alignProjectContent() {
    if (!matchMedia('(min-width:821px)').matches) {
      main.style.removeProperty('--title-row');
      return;
    }
    const style = getComputedStyle(main);
    const contentTop = main.getBoundingClientRect().top + parseFloat(style.paddingTop);
    const rowHeight = menu.getBoundingClientRect().top - contentTop - parseFloat(style.rowGap);
    main.style.setProperty('--title-row', `${Math.max(0, rowHeight)}px`);
  }
  new ResizeObserver(alignProjectContent).observe(menu);
  window.addEventListener('resize', alignProjectContent);
  document.fonts.ready.then(alignProjectContent);
  alignProjectContent();
  images.tabIndex = 0;
  images.setAttribute('aria-label', 'Project images — scroll to explore');
  // Leave the next image fully below the initial image viewport.
  const firstFigure = figures[0];
  function spaceNextImage() {
    firstFigure.style.marginBottom = '0px';
    if (!matchMedia('(min-width:821px)').matches) return;
    const gap = parseFloat(getComputedStyle(images).rowGap) || 0;
    const extra = Math.max(64, images.clientHeight - firstFigure.getBoundingClientRect().height - gap + 64);
    firstFigure.style.marginBottom = `${extra}px`;
  }
  new ResizeObserver(spaceNextImage).observe(images);
  firstFigure.querySelector('img').addEventListener('load', spaceNextImage);
  window.addEventListener('resize', spaceNextImage);
  spaceNextImage();
  images.scrollTop = 0;
  window.addEventListener('pageshow', () => { spaceNextImage(); images.scrollTop = 0; });
  // Let the final image reach the text's top edge without scrolling past it.
  function setImageScrollLimit() {
    const last = figures[figures.length - 1];
    if (!matchMedia('(min-width:821px)').matches) {
      images.style.paddingBottom = '0px';
      return;
    }
    images.style.boxSizing = 'border-box';
    images.style.paddingBottom = `${Math.max(0, images.clientHeight - last.getBoundingClientRect().height)}px`;
  }
  new ResizeObserver(setImageScrollLimit).observe(images);
  const imageSizeObserver = new ResizeObserver(setImageScrollLimit);
  imageSizeObserver.observe(figures[figures.length - 1]);
  window.addEventListener('resize', setImageScrollLimit);
  setImageScrollLimit();
  const viewer = document.querySelector('.image-viewer');
  const enlargedImage = viewer.querySelector('img');
  images.addEventListener('click', event => {
    const link = event.target.closest('figure a');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    enlargedImage.src = link.href;
    enlargedImage.alt = link.querySelector('img').alt;
    viewer.showModal();
  });
  viewer.querySelector('button').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
  viewer.addEventListener('cancel', event => { event.preventDefault(); viewer.close(); });
}

loadFolderProject().then(enableProjectGallery);
