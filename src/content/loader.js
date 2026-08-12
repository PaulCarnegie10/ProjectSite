// Content engine (contract: docs/CONTENT_SCHEMA.md §2).
//
// Everything is glob-driven off the repo-root `content/` directory, so adding a
// new project folder requires zero code changes here or in any page.

import yaml from 'js-yaml';

const projectFiles = import.meta.glob('/content/projects/*/index.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const mediaFiles = import.meta.glob('/content/projects/*/*.{png,jpg,jpeg,webp,gif,mp4,pdf}', {
  query: '?url',
  import: 'default',
  eager: true,
});

const siteFiles = import.meta.glob('/content/site/*.json', { eager: true });

// slug -> { filename: servableUrl }
const mediaBySlug = {};
for (const [path, url] of Object.entries(mediaFiles)) {
  const m = /^\/content\/projects\/([^/]+)\/(.+)$/.exec(path);
  if (!m) continue;
  (mediaBySlug[m[1]] ??= {})[m[2]] = url;
}

/** Resolve a frontmatter filename to a servable URL; undefined when absent. */
function resolveMedia(slug, name) {
  if (typeof name !== 'string' || !name) return undefined;
  return mediaBySlug[slug]?.[name.replace(/^\.\//, '')];
}

function hasScheme(url) {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url) || url.startsWith('//');
}

/**
 * Split `---` frontmatter from the markdown body and parse the YAML block.
 * gray-matter is deliberately avoided: it needs a Buffer polyfill under Vite.
 */
function parseFrontmatter(raw) {
  let text = String(raw).replace(/\r\n/g, '\n');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const m = /^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/.exec(text);
  if (!m) return { data: {}, body: text };
  let data = {};
  try {
    data = yaml.load(m[1]) ?? {};
  } catch {
    data = {};
  }
  if (typeof data !== 'object' || Array.isArray(data)) data = {};
  return { data, body: text.slice(m[0].length) };
}

/** Frontmatter filename list -> [{src, name}], silently dropping missing files. */
function toMediaItems(slug, names) {
  if (!Array.isArray(names)) return [];
  return names
    .map((name) => ({ src: resolveMedia(slug, name), name }))
    .filter((item) => Boolean(item.src));
}

/** Relative link urls (e.g. "./poster.pdf") resolve to servable asset URLs. */
function toLinks(slug, links) {
  if (!Array.isArray(links)) return [];
  return links
    .filter((link) => link && typeof link === 'object')
    .map((link) => {
      const url = typeof link.url === 'string' ? link.url : '';
      if (!url || hasScheme(url) || url.startsWith('/')) return { ...link, url };
      return { ...link, url: resolveMedia(slug, url) ?? url };
    });
}

function buildProject(path, raw) {
  const slug = /^\/content\/projects\/([^/]+)\//.exec(path)?.[1] ?? '';
  const { data, body } = parseFrontmatter(raw);
  return {
    slug,
    title: data.title ?? slug,
    blurb: data.blurb ?? '',
    date: data.date ?? '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    order: Number.isFinite(data.order) ? data.order : Number.MAX_SAFE_INTEGER,
    draft: data.draft === true,
    heroUrl: resolveMedia(slug, data.hero),
    gallery: toMediaItems(slug, data.gallery),
    videos: toMediaItems(slug, data.videos),
    links: toLinks(slug, data.links),
    body,
  };
}

const allProjects = Object.entries(projectFiles)
  .map(([path, raw]) => buildProject(path, raw))
  .filter((project) => project.slug)
  .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));

/** Project[], order-sorted ascending, drafts excluded. */
export function getProjects() {
  return allProjects.filter((project) => !project.draft);
}

/** Project | undefined. Drafts are visible in dev only. */
export function getProject(slug) {
  const project = allProjects.find((p) => p.slug === slug);
  if (!project) return undefined;
  if (project.draft && !import.meta.env.DEV) return undefined;
  return project;
}

/** Parsed object for content/site/<name>.json ("home" or "home.json"). */
export function getSiteText(name) {
  const file = String(name).replace(/\.json$/, '');
  const mod = siteFiles[`/content/site/${file}.json`];
  return mod?.default ?? {};
}
