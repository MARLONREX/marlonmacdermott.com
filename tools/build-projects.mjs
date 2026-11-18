import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const categories = new Map([
  ['Professional', 'freelance'],
  ['Concepts', 'imaginary'],
  ['Photography', 'photography'],
  ['Newcastle University', 'uni'],
  ['Weston University', 'weston'],
]);
const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = value => value.replace(/[&<>"']/g, character => entities[character]);
const imageExtension = /\.(jpe?g|png|webp|gif|avif)$/i;

async function readProject(directory) {
  const folder = join('WorkPages', directory);
  const files = await readdir(folder, { withFileTypes: true });
  if (!files.some(file => file.isFile() && file.name === 'project.txt')) return null;

  const config = (await readFile(join(folder, 'project.txt'), 'utf8')).replace(/^\uFEFF/, '');
  const [heading, ...paragraphs] = config.trim().split(/\r?\n[ \t]*\r?\n/);
  const fields = new Map(heading.split(/\r?\n/).map(line => {
    const separator = line.indexOf(':');
    if (separator < 0) throw new Error(directory + '/project.txt has an invalid field: ' + line);
    return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
  }));
  const title = fields.get('Title');
  const year = fields.get('Year');
  const category = fields.get('Category');
  const coverFile = fields.get('Cover');
  const description = paragraphs.join('\n\n').trim();
  const photos = files.filter(file => file.isFile() && !file.name.startsWith('.') && imageExtension.test(file.name))
    .map(file => file.name).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

  if (!title || !/^\d{4}$/.test(year ?? '') || !categories.has(category) || !description || !photos.includes(coverFile)) {
    throw new Error('Check Title, Year, Category, Cover and description in WorkPages/' + directory + '/project.txt');
  }

  const url = file => ['WorkPages', directory, file].map(encodeURIComponent).join('/');
  const images = photos.map(file => ({
    url: url(file),
    name: title + ' — ' + file.replace(imageExtension, '').replace(/^\d+[- _]*/, '').replace(/[-_]/g, ' '),
  }));
  return { directory, title, year, category, description, images, cover: url(coverFile) };
}

async function insertCards(file, cards) {
  const html = await readFile(file, 'utf8');
  const start = '<!-- Drop-in projects start -->';
  const end = '<!-- Drop-in projects end -->';
  const from = html.indexOf(start);
  const to = html.indexOf(end);
  if (from < 0 || to < from) throw new Error('Missing drop-in project markers in ' + file);
  const newline = html.includes('\r\n') ? '\r\n' : '\n';
  await writeFile(file, html.slice(0, from + start.length) + newline +
    cards.map(card => '        ' + card + newline).join('') + '        ' + html.slice(to));
}

const directories = (await readdir('WorkPages', { withFileTypes: true })).filter(entry => entry.isDirectory());
const projects = (await Promise.all(directories.map(entry => readProject(entry.name)))).filter(Boolean)
  .sort((a, b) => b.year.localeCompare(a.year) || a.title.localeCompare(b.title, 'en'));
const tiles = [];
const cards = [];
await mkdir('project-data', { recursive: true });
for (const project of projects) {
  const { directory, title, year, category, description, images, cover } = project;
  const href = 'project.html?project=' + encodeURIComponent(directory);
  const label = escapeHtml(title);
  const image = '<img src="' + escapeHtml(cover) + '" alt="' + label + ' cover">';
  tiles.push('<a class="reference-tile" data-category="' + categories.get(category) +
    '" href="' + escapeHtml(href) + '">' + image + '<span class="tile-details"><span class="tile-title">' + label +
    '</span><span class="tile-institution">+ ' + escapeHtml(category) +
    '</span><span class="tile-year">' + year + '</span></span></a>');
  cards.push('<a class="project-card" href="' + escapeHtml(href) + '">' + image +
    '<span class="card-label"><strong>' + label + '</strong></span></a>');
  await writeFile(join('project-data', directory + '.json'), JSON.stringify({ title, year, text: description, cover, images }, null, 2) + '\n');
}
await insertCards('index.html', tiles);
await insertCards('work.html', cards);
console.log('Built ' + projects.length + ' drop-in project(s).');