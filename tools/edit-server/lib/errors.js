// Frozen error taxonomy from docs/CONTENT_SCHEMA.md §4.
import { Buffer } from 'node:buffer';

export const ERROR_STATUS = {
  not_loopback: 403,
  bad_path: 400,
  not_found: 404,
  too_large: 413,
  unsupported_media: 415,
  encode_failed: 500,
};

/** Error carrying one of the frozen wire codes. */
export class EditError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'EditError';
    this.code = code;
    this.status = ERROR_STATUS[code] ?? 500;
  }
}

export const fail = (code, message) => new EditError(code, message);

/** Always application/json, never a stack trace on the wire. */
export function sendJson(res, status, payload) {
  const buf = Buffer.from(JSON.stringify(payload), 'utf8');
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', String(buf.length));
  res.setHeader('Cache-Control', 'no-store');
  res.end(buf);
}

export const sendOk = (res, payload = {}) => sendJson(res, 200, { ok: true, ...payload });

export function sendError(res, err) {
  const code = err instanceof EditError ? err.code : 'encode_failed';
  const status = err instanceof EditError ? err.status : 500;
  const message = err && err.message ? String(err.message) : 'edit server error';
  sendJson(res, status, { ok: false, error: code, message });
}
