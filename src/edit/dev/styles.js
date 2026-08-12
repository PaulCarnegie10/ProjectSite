// __EDIT_DEV_ONLY__ — edit chrome CSS, injected from a function (never a CSS
// import) so nothing survives into a production bundle.
//
// Aesthetic: matte, flat, minimal. Hairline outlines and underlines, warm
// neutrals, no glow, no gradients, no shadows beyond a flat 1px edge.

export const DEV_ONLY = '__EDIT_DEV_ONLY__';

const STYLE_ID = `pe-style-${DEV_ONLY}`;

const CSS = `
:root {
  --pe-ink: #e6e1d8;
  --pe-ink-dim: #a49c8f;
  --pe-panel: #171614;
  --pe-panel-2: #201e1b;
  --pe-line: #3a352e;
  --pe-line-soft: rgba(200, 190, 172, 0.35);
  --pe-accent: #c8bda6;
  --pe-bad: #d98a72;
  --pe-good: #93a882;
}

/* ---------- text primitive ---------- */
.pe-editable[data-pe-on='1'] {
  outline: 1px dashed var(--pe-line-soft);
  outline-offset: 2px;
  cursor: text;
  border-radius: 1px;
}
.pe-editable[data-pe-on='1']:hover {
  outline-style: solid;
  outline-color: var(--pe-accent);
}
.pe-editable[data-pe-editing='1'] {
  outline: 1px solid var(--pe-accent);
  outline-offset: 2px;
  background: rgba(200, 189, 166, 0.06);
}
.pe-editable[data-pe-busy='1'] {
  opacity: 0.55;
}
.pe-editable[data-pe-dim='1'] {
  opacity: 0.25;
}

.pe-overlay-editor {
  position: fixed;
  z-index: 2147483000;
  display: flex;
  flex-direction: column;
  background: var(--pe-panel);
  border: 1px solid var(--pe-accent);
  border-radius: 2px;
  padding: 0;
  box-sizing: border-box;
}
.pe-overlay-editor textarea {
  flex: 1 1 auto;
  min-height: 8rem;
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  background: var(--pe-panel);
  color: var(--pe-ink);
  border: 0;
  outline: none;
  padding: 10px 12px;
  font: 400 13px/1.6 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  tab-size: 2;
}
.pe-overlay-hint {
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 10px;
  border-top: 1px solid var(--pe-line);
  color: var(--pe-ink-dim);
  font: 400 11px/1.4 ui-sans-serif, system-ui, sans-serif;
}

/* ---------- asset primitives ---------- */
/* Carries drop handlers, generates no layout box: edit mode must not reflow
   the site's own grid/flex containers. */
.pe-passthrough {
  display: contents;
}

.pe-default-item {
  display: block;
  max-width: 220px;
  border: 1px solid var(--pe-line);
  background: var(--pe-panel-2);
}

.pe-file {
  display: none;
}

.pe-empty {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 12px;
  border: 1px dashed var(--pe-line-soft);
  border-radius: 2px;
  color: var(--pe-ink-dim);
  background: rgba(200, 189, 166, 0.03);
  font: 400 12px/1.4 ui-sans-serif, system-ui, sans-serif;
}
.pe-empty-label {
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 10px;
  color: var(--pe-accent);
}

/* Fixed chrome layer, portalled to <body>. */
.pe-chrome {
  position: fixed;
  z-index: 2147482900;
  pointer-events: none;
}
.pe-chrome-outline {
  position: absolute;
  inset: 0;
  border: 1px dashed var(--pe-line-soft);
  border-radius: 2px;
}
.pe-chrome[data-pe-over='1'] .pe-chrome-outline {
  border-style: solid;
  border-color: var(--pe-accent);
  background: rgba(200, 189, 166, 0.08);
}
.pe-chip {
  position: absolute;
  left: 0;
  top: -22px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 2px 6px;
  pointer-events: auto;
  background: var(--pe-panel);
  border: 1px solid var(--pe-line);
  border-radius: 2px 2px 0 0;
  color: var(--pe-accent);
  font: 400 10px/1.6 ui-sans-serif, system-ui, sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}
.pe-chip-hint {
  color: var(--pe-ink-dim);
  letter-spacing: 0.02em;
  text-transform: none;
}
.pe-x {
  position: absolute;
  z-index: 2;
  width: 20px;
  height: 20px;
  line-height: 1;
  padding: 0;
  pointer-events: auto;
  background: var(--pe-panel);
  color: var(--pe-ink);
  border: 1px solid var(--pe-line);
  border-radius: 2px;
  cursor: pointer;
  font: 400 12px/1 ui-sans-serif, system-ui, sans-serif;
}
.pe-x:hover {
  border-color: var(--pe-bad);
  color: var(--pe-bad);
}

/* ---------- progress ---------- */
.pe-jobs {
  position: absolute;
  left: 0;
  top: 100%;
  min-width: 240px;
  max-width: 420px;
  z-index: 3;
  pointer-events: auto;
  background: var(--pe-panel);
  border: 1px solid var(--pe-line);
  border-radius: 0 0 2px 2px;
  font: 400 11px/1.45 ui-sans-serif, system-ui, sans-serif;
  color: var(--pe-ink);
}
.pe-job-note {
  margin: 4px 0 0;
  color: var(--pe-ink-dim);
}
.pe-link {
  appearance: none;
  background: none;
  border: 0;
  padding: 0;
  color: var(--pe-accent);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}
.pe-job {
  padding: 6px 8px;
  border-bottom: 1px solid var(--pe-line);
}
.pe-job:last-child {
  border-bottom: 0;
}
.pe-job-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}
.pe-job-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pe-job-state {
  flex: 0 0 auto;
  color: var(--pe-ink-dim);
  font-variant-numeric: tabular-nums;
}
.pe-bar {
  position: relative;
  height: 2px;
  margin-top: 5px;
  background: var(--pe-line);
  overflow: hidden;
}
.pe-bar-fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--pe-accent);
}
.pe-bar[data-pe-indeterminate='1'] .pe-bar-fill {
  width: 34%;
  animation: pe-slide 1.15s linear infinite;
}
@keyframes pe-slide {
  0% { transform: translateX(-110%); }
  100% { transform: translateX(320%); }
}
.pe-job[data-pe-phase='error'] .pe-bar-fill {
  background: var(--pe-bad);
}
.pe-job[data-pe-phase='done'] .pe-bar-fill {
  background: var(--pe-good);
}
.pe-job-err {
  margin-top: 4px;
  color: var(--pe-bad);
}

/* ---------- toolbar ---------- */
.pe-toolbar {
  position: fixed;
  left: 16px;
  bottom: 16px;
  z-index: 2147483100;
  width: 264px;
  background: var(--pe-panel);
  border: 1px solid var(--pe-line);
  border-radius: 2px;
  color: var(--pe-ink);
  font: 400 12px/1.5 ui-sans-serif, system-ui, sans-serif;
}
.pe-toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
}
.pe-toolbar-row + .pe-toolbar-row,
.pe-toolbar-body {
  border-top: 1px solid var(--pe-line);
}
.pe-toolbar-title {
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 10px;
  color: var(--pe-ink-dim);
}
.pe-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}
.pe-switch-track {
  width: 30px;
  height: 16px;
  border: 1px solid var(--pe-line);
  border-radius: 2px;
  position: relative;
  background: var(--pe-panel-2);
}
.pe-switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 10px;
  height: 10px;
  background: var(--pe-ink-dim);
  transition: left 90ms linear;
}
.pe-switch[data-pe-on='1'] .pe-switch-track {
  border-color: var(--pe-accent);
}
.pe-switch[data-pe-on='1'] .pe-switch-knob {
  left: 16px;
  background: var(--pe-accent);
}
.pe-toolbar-body {
  padding: 8px 10px 10px;
}
.pe-btnrow {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pe-btn {
  appearance: none;
  background: var(--pe-panel-2);
  color: var(--pe-ink);
  border: 1px solid var(--pe-line);
  border-radius: 2px;
  padding: 4px 8px;
  font: 400 11px/1.4 ui-sans-serif, system-ui, sans-serif;
  cursor: pointer;
}
.pe-btn:hover:not(:disabled) {
  border-color: var(--pe-accent);
}
.pe-btn:disabled {
  opacity: 0.45;
  cursor: default;
}
.pe-btn[data-pe-on='1'] {
  border-color: var(--pe-accent);
  color: var(--pe-accent);
}
.pe-btn-danger:hover:not(:disabled) {
  border-color: var(--pe-bad);
  color: var(--pe-bad);
}
.pe-input {
  width: 100%;
  box-sizing: border-box;
  background: var(--pe-panel-2);
  color: var(--pe-ink);
  border: 1px solid var(--pe-line);
  border-radius: 2px;
  padding: 5px 7px;
  font: 400 12px/1.4 ui-sans-serif, system-ui, sans-serif;
}
.pe-input:focus {
  outline: none;
  border-color: var(--pe-accent);
}
.pe-note {
  color: var(--pe-ink-dim);
  font-size: 11px;
  margin: 6px 0 0;
}
.pe-status {
  color: var(--pe-ink-dim);
  font-size: 10px;
  letter-spacing: 0.04em;
}
.pe-status[data-pe-bad='1'] {
  color: var(--pe-bad);
}
.pe-list {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  max-height: 210px;
  overflow: auto;
}
.pe-list li {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
  border-bottom: 1px solid var(--pe-line);
}
.pe-list li:last-child {
  border-bottom: 0;
}
.pe-list-slug {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font: 400 11px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.pe-ord {
  flex: 0 0 auto;
  width: 16px;
  color: var(--pe-ink-dim);
  font-variant-numeric: tabular-nums;
  font-size: 10px;
}

/* ---------- toasts ---------- */
.pe-toasts {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 2147483200;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: min(380px, calc(100vw - 32px));
}
.pe-toast {
  background: var(--pe-panel);
  border: 1px solid var(--pe-line);
  border-left-width: 2px;
  border-radius: 2px;
  padding: 8px 10px;
  color: var(--pe-ink);
  font: 400 12px/1.45 ui-sans-serif, system-ui, sans-serif;
  cursor: pointer;
}
.pe-toast[data-pe-kind='error'] {
  border-left-color: var(--pe-bad);
}
.pe-toast[data-pe-kind='info'] {
  border-left-color: var(--pe-accent);
}
.pe-toast[data-pe-kind='ok'] {
  border-left-color: var(--pe-good);
}
.pe-toast-code {
  display: block;
  margin-top: 3px;
  color: var(--pe-ink-dim);
  font: 400 10px/1.3 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  letter-spacing: 0.04em;
}

@media (prefers-reduced-motion: reduce) {
  .pe-bar[data-pe-indeterminate='1'] .pe-bar-fill { animation: none; width: 100%; opacity: 0.5; }
  .pe-switch-knob { transition: none; }
}
`;

/** Idempotent. Only ever called from inside a dev-branch effect. */
export function ensureStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.setAttribute('data-edit-dev', DEV_ONLY);
  el.textContent = CSS;
  document.head.appendChild(el);
}
