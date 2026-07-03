// ─── Projects ───────────────────────────────────────────────────
// Content now lives in src/content/projects/*.json (edited via /admin).
// This module is a thin loader that keeps the original PROJECTS API.
//
// Home slab uses: index, slug, title, pitch, tags, side, accent.
// Deep dive adds: tagline, meta, sections, media, links.
// `media[].src` is relative to public/ — components prefix BASE_URL.

const modules = import.meta.glob('../content/projects/*.json', { eager: true });

export const PROJECTS = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.index - b.index);
