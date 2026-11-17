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
    copyElement.textContent = project.text.replace(/^Category:[^\r\n]*(?:\r?\n)*/gmi, '').trim();

    if (project.images.length) {
      project.images.forEach(image => {
        const figure = document.createElement('figure');
        const element = document.createElement('img');
        element.src = image.url;
        element.alt = image.name.replaceAll('-', ' ').replaceAll('_', ' ');
        element.loading = 'lazy';
        figure.appendChild(element);
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

loadFolderProject();


