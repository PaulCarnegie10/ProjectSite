// ─── News ───────────────────────────────────────────────────────
// Content now lives in src/content/news/*.json (edited via /admin).
// This module is a thin loader that keeps the original NEWS API.
//
// The home page shows the first three, /news shows everything.
// date: ISO string (YYYY-MM-DD). tag: short category chip.
// link (optional): { label, href } for an external pointer.

const modules = import.meta.glob('../content/news/*.json', { eager: true });

export const NEWS = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
