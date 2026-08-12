// __EDIT_DEV_ONLY__ — module-level edit-mode store.
//
// Deliberately free of top-level side effects (no localStorage read, no `new
// Set()`, no CSS import) so Rollup can drop this whole module from production
// builds once `import.meta.env.DEV` folds the dev branches away.

import { useSyncExternalStore } from 'react';

export const DEV_ONLY = '__EDIT_DEV_ONLY__';

const LS_KEY = 'portfolio.editMode';

// `null` = not hydrated yet. Hydration happens on first read, never at import.
let mode = null;
let listeners = [];

function hydrate() {
  if (mode === null) {
    let stored = null;
    try {
      stored = globalThis.localStorage?.getItem(LS_KEY) ?? null;
    } catch {
      stored = null;
    }
    mode = stored === '1';
  }
  return mode;
}

function emit() {
  for (const fn of listeners) fn();
}

export function getEditMode() {
  return hydrate();
}

export function setEditMode(next) {
  hydrate();
  const value = Boolean(next);
  if (value === mode) return value;
  mode = value;
  try {
    globalThis.localStorage?.setItem(LS_KEY, value ? '1' : '0');
  } catch {
    // Private mode / disabled storage: the toggle still works for this tab.
  }
  emit();
  return value;
}

export function toggleEditMode() {
  return setEditMode(!getEditMode());
}

export function subscribe(fn) {
  listeners = listeners.concat(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

function serverSnapshot() {
  return false;
}

/** Read edit mode from any primitive. No provider, no EditToolbar required. */
export function useEditMode() {
  return useSyncExternalStore(subscribe, getEditMode, serverSnapshot);
}
