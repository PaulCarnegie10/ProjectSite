// Request body intake. Both readers enforce their cap while the bytes are
// still arriving and tear the socket down on breach, so an oversized upload is
// never buffered in memory or written to disk in full.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import { fail } from './errors.js';

export const JSON_LIMIT = 1 * 1024 * 1024; // 1 MB
export const MULTIPART_LIMIT = 512 * 1024 * 1024; // 512 MB

/** @returns {Promise<object>} parsed JSON body ({} when empty) */
export function readJsonBody(req, limit = JSON_LIMIT) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    let done = false;
    const finish = (fn, arg) => {
      if (done) return;
      done = true;
      fn(arg);
    };
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        // Stop reading but keep the socket alive long enough to answer 413;
        // the middleware closes the connection once the response has flushed.
        chunks.length = 0;
        req.pause();
        finish(reject, fail('too_large', `request body exceeds ${limit} bytes`));
        return;
      }
      chunks.push(chunk);
    });
    req.on('error', (err) => finish(reject, fail('bad_path', `request stream error: ${err.message}`)));
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8').trim();
      if (text === '') return finish(resolve, {});
      try {
        const parsed = JSON.parse(text);
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          return finish(reject, fail('bad_path', 'request body must be a JSON object'));
        }
        return finish(resolve, parsed);
      } catch {
        return finish(reject, fail('bad_path', 'request body is not valid JSON'));
      }
    });
  });
}

/**
 * Stream one multipart upload to a temp file.
 * @returns {Promise<{fields:object, file:{tmpPath,filename,mime,bytes}|null, cleanup:Function}>}
 */
export async function readMultipart(req, limit = MULTIPART_LIMIT) {
  let Busboy;
  try {
    Busboy = (await import('busboy')).default;
  } catch {
    throw fail('encode_failed', 'busboy is not installed; cannot accept uploads');
  }

  const type = req.headers['content-type'] || '';
  if (!/^multipart\/form-data/i.test(type)) {
    throw fail('unsupported_media', 'expected multipart/form-data');
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'edit-upload-'));
  const cleanup = () => fs.rmSync(dir, { recursive: true, force: true });

  return new Promise((resolve, reject) => {
    const fields = {};
    let file = null;
    let settled = false;
    const bb = Busboy({
      headers: req.headers,
      limits: { files: 1, fields: 20, fieldSize: 64 * 1024, fileSize: limit },
    });
    const done = (fn, arg) => {
      if (settled) return;
      settled = true;
      fn(arg);
    };
    // Detach from the parser and stop consuming, but leave the socket usable so
    // the middleware can still send a real JSON error before closing it.
    const abort = (err) => {
      req.unpipe(bb);
      req.pause();
      cleanup();
      done(reject, err);
    };

    bb.on('field', (name, value) => { fields[name] = value; });

    // busboy's 'close' can land before the fs write stream has flushed, so the
    // handler below waits on this promise instead of racing it.
    let written = Promise.resolve();

    bb.on('file', (name, stream, info) => {
      const tmpPath = path.join(dir, 'upload.bin');
      let bytes = 0;
      const out = fs.createWriteStream(tmpPath);
      written = new Promise((resolveWrite) => {
        stream.on('data', (chunk) => { bytes += chunk.length; });
        stream.on('limit', () => {
          out.destroy();
          abort(fail('too_large', `upload exceeds ${limit} bytes`));
        });
        stream.on('error', (err) => abort(fail('encode_failed', `upload stream error: ${err.message}`)));
        out.on('error', (err) => abort(fail('encode_failed', `could not buffer upload: ${err.message}`)));
        out.on('close', () => {
          if (!settled) file = { tmpPath, filename: info.filename, mime: info.mimeType, bytes };
          resolveWrite();
        });
        stream.pipe(out);
      });
    });

    bb.on('filesLimit', () => abort(fail('unsupported_media', 'only one file per request')));
    bb.on('error', (err) => abort(fail('unsupported_media', `malformed multipart body: ${err.message}`)));
    bb.on('close', () => {
      written.then(() => done(resolve, { fields, file, cleanup }));
    });

    req.pipe(bb);
  });
}
