// ─── Skills ─────────────────────────────────────────────────────
// Content now lives in src/content/skills.json (edited via /admin).
// This module is a thin loader that keeps the original SKILL_GROUPS API.
//
// Icons come from react-icons (https://react-icons.github.io/react-icons/);
// import any you need in src/sections/Skills.jsx and reference by `icon` key there.

import data from '../content/skills.json';

export const SKILL_GROUPS = data.groups;
