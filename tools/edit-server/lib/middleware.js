// Connect middleware wiring the §4 routes.
//
// Order matters: the loopback gate runs before any body is read, so a hostile
// peer cannot make the server buffer or spool bytes for it.

import fs from 'node:fs';
import path from 'node:path';
import { sendError, sendOk, fail } from './errors.js';
import { isLoopbackRequest } from './loopback.js';
import { readJsonBody, readMultipart } from './body.js';
import * as h from './handlers.js';

const EDIT_PREFIX = '/__edit/';

/**
 * Extract the action from a URL that may be bare (`/__edit/ping`) or carry the
 * Vite base (`/ProjectSite/__edit/ping`).
 * @returns {string|null}
 */
export function matchAction(url) {
  if (typeof url !== 'string') return null;
  const pathname = url.split('?')[0].split('#')[0];
  const i = pathname.indexOf(EDIT_PREFIX);
  if (i === -1) return null;
  const prefix = pathname.slice(0, i);
  if (prefix !== '' && !/^\/[A-Za-z0-9._~-]+$/.test(prefix)) return null;
  const action = pathname.slice(i + EDIT_PREFIX.length).replace(/\/+$/, '');
  return /^[a-z]+$/.test(action) ? action : null;
}

async function dispatch(action, method, req, ctx) {
  if (action === 'ping' && method === 'GET') return h.ping(ctx);
  if (action === 'text' && method === 'POST') return h.setText(ctx, await readJsonBody(req));
  if (action === 'project' && method === 'POST') return h.createProject(ctx, await readJsonBody(req));
  if (action === 'project' && method === 'DELETE') return h.deleteProject(ctx, await readJsonBody(req));
  if (action === 'reorder' && method === 'POST') return h.reorder(ctx, await readJsonBody(req));
  if (action === 'asset' && method === 'DELETE') return h.deleteAsset(ctx, await readJsonBody(req));
  if (action === 'asset' && method === 'POST') {
    const upload = await readMultipart(req);
    try {
      return await h.putAsset(ctx, upload);
    } finally {
      upload.cleanup();
    }
  }
  throw fail('not_found', `no ${method} handler for /__edit/${action}`);
}

/**
 * Answer with a JSON error, then hang up. Used when there is no point reading
 * the rest of the request: a rejected peer, or a body that blew its cap.
 */
function closeAfter(req, res, err) {
  res.setHeader('Connection', 'close');
  res.on('finish', () => req.destroy());
  sendError(res, err);
}

/**
 * @param {{contentRoot: string}} options
 * @returns {(req, res, next) => void} connect-style middleware
 */
export function createEditMiddleware(options) {
  const contentRoot = path.resolve(options.contentRoot);
  const ctx = { contentRoot };

  return function editMiddleware(req, res, next) {
    const action = matchAction(req.url);
    if (action === null) return next();

    // Socket peer address only. Host / Origin / X-Forwarded-For are all
    // attacker-supplied and are never consulted.
    if (!isLoopbackRequest(req)) {
      return closeAfter(req, res, fail('not_loopback', 'edit API is restricted to loopback clients'));
    }

    if (!fs.existsSync(contentRoot)) {
      return sendError(res, fail('not_found', `content root does not exist: ${contentRoot}`));
    }

    return dispatch(action, req.method, req, ctx)
      .then((payload) => sendOk(res, payload))
      .catch((err) => {
        // A capped body left unread bytes in flight; answer, then hang up.
        if (err && err.code === 'too_large') return closeAfter(req, res, err);
        return sendError(res, err);
      });
  };
}
