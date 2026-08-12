// Upload filename sanitizing and extension policy.
// Uploaded names are attacker-controlled, so nothing from the client survives
// except the characters in [a-z0-9._-]. The stored extension is decided by us
// (.webp for images, .mp4 for videos), never copied from the upload.

import fs from 'node:fs';
import path from 'node:path';
import { fail } from './errors.js';

export const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
export const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm', '.m4v']);
export const REJECTED_EXT = new Set(['.pdf']); // v1: owners copy PDFs in by hand

const MAX_NAME = 64;

// U+0300..U+036F combining diacritics, stripped after NFKD normalization.
const COMBINING_MARKS = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g');

/** Reduce any string to the safe alphabet; never returns ''. */
export function sanitizeName(input) {
  const base = String(input ?? '')
    .replace(/^.*[\\/]/, '') // drop any directory part the client sent
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '') // "café.png" -> "cafe.png", not "caf-.png"
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/\.{2,}/g, '.')
    .replace(/^[-.]+/, '')
    .replace(/[-.]+$/, '');
  const trimmed = base.slice(0, MAX_NAME);
  return trimmed === '' ? 'file' : trimmed;
}

/**
 * Classify an upload by its extension.
 * @returns {{kind:'image'|'video', ext:string, stem:string}}
 * @throws {EditError} unsupported_media
 */
export function classifyUpload(originalName) {
  const safe = sanitizeName(originalName);
  const ext = path.extname(safe).toLowerCase();
  const stem = sanitizeName(safe.slice(0, safe.length - ext.length)) || 'file';
  if (REJECTED_EXT.has(ext)) {
    throw fail('unsupported_media', `${ext} uploads are not supported; copy the file into the project folder manually`);
  }
  if (IMAGE_EXT.has(ext)) return { kind: 'image', ext, stem };
  if (VIDEO_EXT.has(ext)) return { kind: 'video', ext, stem };
  throw fail('unsupported_media', `unsupported file type: ${ext || '(none)'}`);
}

/** stem + ext, bumped to stem-2 / stem-3 ... until it does not collide. */
export function uniqueName(dir, stem, ext) {
  let candidate = `${stem}${ext}`.slice(0, MAX_NAME);
  if (!fs.existsSync(path.join(dir, candidate))) return candidate;
  for (let n = 2; n < 1000; n += 1) {
    const suffix = `-${n}${ext}`;
    const room = Math.max(1, MAX_NAME - suffix.length);
    candidate = `${stem.slice(0, room)}${suffix}`;
    if (!fs.existsSync(path.join(dir, candidate))) return candidate;
  }
  throw fail('bad_path', 'could not find a free filename');
}

/** Title -> kebab-case slug used as the project folder name and route. */
export function slugify(title) {
  const slug = String(title ?? '')
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, MAX_NAME)
    .replace(/-+$/, '');
  if (slug === '') throw fail('bad_path', 'title does not contain any usable characters');
  return slug;
}
