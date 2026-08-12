// __EDIT_DEV_ONLY__ — plain-DOM toasts.
//
// Deliberately not React: any primitive can raise a toast without a host
// component being mounted, which is what lets Editable work with no EditToolbar
// on the page.

import { ensureStyles } from './styles.js';

export const DEV_ONLY = '__EDIT_DEV_ONLY__';

let host = null;

function ensureHost() {
  ensureStyles();
  if (host && host.isConnected) return host;
  host = document.createElement('div');
  host.className = 'pe-toasts';
  host.setAttribute('data-edit-dev', DEV_ONLY);
  document.body.appendChild(host);
  return host;
}

/**
 * @param {string} message
 * @param {{kind?: 'error'|'info'|'ok', code?: string, ttl?: number}} [opts]
 */
export function toast(message, opts = {}) {
  if (typeof document === 'undefined') return () => {};
  const { kind = 'error', code, ttl = kind === 'error' ? 9000 : 4000 } = opts;
  const el = document.createElement('div');
  el.className = 'pe-toast';
  el.setAttribute('data-pe-kind', kind);
  el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  el.textContent = message;
  if (code) {
    const tag = document.createElement('span');
    tag.className = 'pe-toast-code';
    tag.textContent = code;
    el.appendChild(tag);
  }
  const dismiss = () => {
    el.remove();
    clearTimeout(timer);
  };
  el.addEventListener('click', dismiss);
  const timer = setTimeout(dismiss, ttl);
  ensureHost().appendChild(el);
  return dismiss;
}

/** Turn an API error into a toast the owner can act on. */
export function toastError(err, what) {
  const code = err?.code || 'unknown';
  toast(`${what} failed: ${err?.message || 'unknown error'}`, { kind: 'error', code });
}
