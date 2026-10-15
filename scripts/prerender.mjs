// Post-build step: write a real index.html for every client-side route so
// GitHub Pages answers deep links with HTTP 200 (link previews on LinkedIn and
// friends refuse a 404), and give each project page its own title, description
// and preview image. The React app still renders the page; only the shell and
// its <head> tags differ per route.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://paulcarnegie10.github.io/ProjectSite/';
const DIST = 'dist';
const shell = readFileSync(join(DIST, 'index.html'), 'utf8');

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const abs = (p) => (/^https?:\/\//.test(p) ? p : SITE + p.replace(/^\//, ''));

function setTag(html, pattern, replacement) {
  if (!pattern.test(html)) throw new Error(`prerender: tag not found for ${pattern}`);
  return html.replace(pattern, replacement);
}

function pageFor({ title, description, image, path }) {
  let html = shell;
  html = setTag(html, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  html = setTag(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(description)}" />`);
  html = setTag(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(title)}" />`);
  html = setTag(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(description)}" />`);
  html = setTag(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${esc(SITE + path)}" />`);
  if (image) {
    html = setTag(html, /<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${esc(abs(image))}" />`);
  }
  return html;
}

function write(path, html) {
  const dir = join(DIST, path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  console.log(`prerender: ${path}/index.html`);
}

// Project routes, one per content file.
const projectsDir = join('src', 'content', 'projects');
const projects = readdirSync(projectsDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(projectsDir, f), 'utf8')))
  .filter((p) => p.slug);

const firstCover = projects.find((p) => p.cover)?.cover;

write('projects', pageFor({
  title: 'Projects | Paul Colombo',
  description: 'Here lies everything I have created or accidentally broken.',
  image: firstCover,
  path: 'projects/',
}));

write('news', pageFor({
  title: 'News | Paul Colombo',
  description: 'Updates from Paul Colombo, newest first.',
  image: firstCover,
  path: 'news/',
}));

for (const p of projects) {
  write(`projects/${p.slug}`, pageFor({
    title: `${p.title} | Paul Colombo`,
    description: p.pitch ?? p.tagline ?? '',
    image: p.cover ?? firstCover,
    path: `projects/${p.slug}/`,
  }));
}

// SPA fallback for anything else (unknown slugs still render client-side).
copyFileSync(join(DIST, 'index.html'), join(DIST, '404.html'));
console.log('prerender: 404.html');
