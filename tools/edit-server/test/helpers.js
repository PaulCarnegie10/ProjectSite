// Shared test scaffolding. Every suite runs against a throwaway copy of
// test/fixtures/ addressed through EDIT_CONTENT_ROOT, so no test can touch the
// real content/ tree.

import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createEditMiddleware } from '../lib/middleware.js';

export const FIXTURES = fileURLToPath(new URL('./fixtures/', import.meta.url));

/** Seed a temp content root from fixtures and point EDIT_CONTENT_ROOT at it. */
export function makeContentRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'edit-test-'));
  fs.cpSync(FIXTURES, dir, { recursive: true });
  process.env.EDIT_CONTENT_ROOT = dir;
  return dir;
}

export function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

export const read = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');

/** Line numbers whose text differs between two versions of a file. */
export function changedLines(before, after) {
  const a = before.split('\n');
  const b = after.split('\n');
  const out = [];
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    if (a[i] !== b[i]) out.push({ line: i + 1, before: a[i], after: b[i] });
  }
  return out;
}

/**
 * Boot the middleware on a real loopback HTTP server so requests carry genuine
 * socket peer addresses.
 * @returns {Promise<{origin:string, close:Function, root:string}>}
 */
export async function startServer(contentRoot) {
  const mw = createEditMiddleware({ contentRoot: process.env.EDIT_CONTENT_ROOT || contentRoot });
  const server = http.createServer((req, res) => {
    mw(req, res, () => {
      res.statusCode = 404;
      res.end('not an edit route');
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    origin: `http://127.0.0.1:${port}`,
    root: contentRoot,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

// The E2 edit client sends this on every call; the server's CSRF guard rejects
// requests without it. Tests default to sending it (like the real client) and
// pass { noDevHeader: true } to exercise the guard.
export const EDIT_DEV_HEADER = 'x-edit-dev';
export const EDIT_DEV_TOKEN = '__EDIT_DEV_ONLY__';

/** @returns {Promise<{status:number, body:object}>} */
export async function api(origin, method, route, body, { noDevHeader = false } = {}) {
  const init = { method, headers: {} };
  if (!noDevHeader) init.headers[EDIT_DEV_HEADER] = EDIT_DEV_TOKEN;
  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(origin + route, init);
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text };
  }
  return { status: res.status, body: parsed, contentType: res.headers.get('content-type') };
}
