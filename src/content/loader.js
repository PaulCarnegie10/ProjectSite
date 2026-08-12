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

/** Dev-only diagnostics; stripped from production builds. */
function devWarn(message) {
  if (import.meta.env.DEV) console.warn(message);
}

/** Resolve a frontmatter filename to a servable URL; undefined when absent. */
function resolveMedia(slug, name) {
  if (typeof name !== 'string' || !name) return undefined;
  const url = mediaBySlug[slug]?.[name.replace(/^\.\//, '')];
  if (!url) devWarn(`[content] ${slug}: frontmatter names "${name}", no such file in its folder`);
  return url;
}

function hasScheme(url) {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url) || url.startsWith('//');
}

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

/**
 * Allowlist a url for use as an href: returns it unchanged when it resolves to
 * http/https/mailto, otherwise undefined so the consumer can drop the element.
 *
 * Fails closed - anything unparseable or on any other protocol is rejected,
 * so a scheme the allowlist has never heard of can never reach an href.
 * Relative and root-relative urls resolve against the document base, which is
 * how bundled asset links under /ProjectSite/ stay valid.
 */
export function safeUrl(url) {
  if (typeof url !== 'string') return undefined;
  // The URL parser strips surrounding whitespace, so a blank string would
  // otherwise resolve to the current page and render as a dead link.
  if (url.trim() === '') return undefined;
  let protocol;
  try {
    protocol = new URL(url, document.baseURI).protocol;
  } catch {
    return undefined;
  }
  return ALLOWED_PROTOCOLS.has(protocol) ? url : undefined;
}

/**
 * Split `---` frontmatter from the markdown body and parse the YAML block.
 * gray-matter is deliberately avoided: it needs a Buffer polyfill under Vite.
 */
function parseFrontmatter(raw) {
  let text = String(raw).replace(/\r\n/g, '\n');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  // The newline before the closing fence is optional so an empty block
  // (`---\n---`) parses as empty frontmatter rather than as body text.
  const m = /^---\n([\s\S]*?)\n?---[ \t]*(?:\n|$)/.exec(text);
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

/**
 * Frontmatter filename list -> [{src, name}], dropping files that are not on
 * disk (resolveMedia warns about each in dev).
 *
 * Dropping is safe here, unlike in toLinks: `#gallery` and `#videos` bind the
 * whole array, and per-item removal is keyed by filename, so no edit path
 * addresses an item by index and nothing can shift onto the wrong item.
 */
function toMediaItems(slug, names) {
  if (!Array.isArray(names)) return [];
  return names
    .map((name) => ({ src: resolveMedia(slug, name), name }))
    .filter((item) => Boolean(item.src));
}

/**
 * Relative link urls (e.g. "./poster.pdf") resolve to servable asset URLs.
 *
 * Every frontmatter entry is returned, in source order, so array index equals
 * frontmatter index by construction: `#links.{i}.label` addresses the file by
 * index, and dropping an entry here would silently retarget every later edit
 * onto the wrong link. Unusable entries carry an empty url and the consumer
 * skips rendering them.
 */
function toLinks(slug, links) {
  if (!Array.isArray(links)) return [];
  return links.map((link) => {
    const entry = link && typeof link === 'object' ? link : {};
    const url = typeof entry.url === 'string' ? entry.url : '';
    if (!url || hasScheme(url) || url.startsWith('/')) return { ...entry, url };
    // An unresolved relative filename becomes empty, never the raw text: left
    // as-is it would resolve against the page and render as a dead link.
    return { ...entry, url: resolveMedia(slug, url) ?? '' };
  });
}

/** Frontmatter `order` may be written as a number or a numeric string. */
function toOrder(value) {
  const n =
    typeof value === 'number' ? value
      : typeof value === 'string' && value.trim() !== '' ? Number(value)
        : NaN;
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
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
    order: toOrder(data.order),
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
