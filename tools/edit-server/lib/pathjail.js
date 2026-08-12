// Path jail. Every filesystem target the edit server touches goes through
// resolveInRoot(). The rule is deny-by-default: a long list of shapes is
// rejected *before* any path.resolve() runs, and then the resolved absolute
// path must still prove containment inside the content root.

import path from 'node:path';
import process from 'node:process';
import { fail } from './errors.js';

const MAX_PATH_LEN = 1024;
const MAX_SEGMENT_LEN = 255;

// Windows device names are resolved by the OS regardless of the directory they
// appear in, so `content/projects/NUL` is not a file inside the jail.
const RESERVED_DEVICE = new Set([
  'CON', 'PRN', 'AUX', 'NUL', 'CONIN$', 'CONOUT$', 'CLOCK$',
  ...Array.from({ length: 10 }, (_, i) => `COM${i}`),
  ...Array.from({ length: 10 }, (_, i) => `LPT${i}`),
]);

const bad = (msg) => fail('bad_path', msg);

/** Decode a single layer of percent-encoding; malformed input is itself hostile. */
function decodeOnce(input) {
  if (!input.includes('%')) return input;
  try {
    return decodeURIComponent(input);
  } catch {
    throw bad('malformed percent-encoding in path');
  }
}

/** Shape checks that must pass for BOTH the raw and the once-decoded string. */
function screen(candidate, label) {
  if (candidate.length === 0) throw bad(`empty path (${label})`);
  if (candidate.length > MAX_PATH_LEN) throw bad('path too long');
  if (candidate.includes('\0')) throw bad('NUL byte in path');
  for (const ch of candidate) {
    const c = ch.codePointAt(0);
    if (c < 0x20 || c === 0x7f) throw bad('control character in path');
  }
  if (candidate.startsWith('/') || candidate.startsWith('\\')) {
    throw bad('absolute path rejected');
  }
  // \\?\ and \\.\ device namespaces, and UNC \\server\share.
  if (candidate.startsWith('\\\\') || candidate.startsWith('//')) {
    throw bad('UNC or device-namespace path rejected');
  }
  // Drive letters and NTFS alternate data streams both hinge on ':'.
  if (candidate.includes(':')) throw bad('drive letter or stream separator rejected');

  const segments = candidate.split(/[/\\]+/);
  if (candidate.split(/[/\\]/).some((s) => s === '')) {
    throw bad('empty path segment rejected');
  }
  for (const seg of segments) {
    if (seg === '.' || seg === '..') throw bad('relative path segment rejected');
    if (seg.length > MAX_SEGMENT_LEN) throw bad('path segment too long');
    // Windows silently strips these, so "evil " and "evil" name the same file.
    if (/^[ \t]/.test(seg)) throw bad('leading whitespace in path segment');
    if (/[ \t.]$/.test(seg)) throw bad('trailing dot or space in path segment');
    const stem = seg.split('.')[0].toUpperCase();
    if (RESERVED_DEVICE.has(stem)) throw bad(`reserved device name: ${seg}`);
    if (/["*<>?|]/.test(seg)) throw bad('illegal character in path segment');
  }
}

/** Case-fold on win32 so containment can't be defeated by casing. */
const forCompare = (p) => (process.platform === 'win32' ? p.toLowerCase() : p);

/**
 * Validate a caller-supplied relative content path.
 * @returns {string} the vetted relative path (decoded form, POSIX separators)
 * @throws {EditError} bad_path
 */
export function validateRelPath(rel) {
  if (typeof rel !== 'string') throw bad('path must be a string');
  // Deliberately NOT trimmed: a trailing space is exactly the Windows trick
  // this jail has to catch, and trimming here would hide it from screen().
  const raw = rel;
  screen(raw, 'raw');
  const decoded = decodeOnce(raw);
  if (decoded !== raw) screen(decoded, 'decoded');
  return decoded.split(/[/\\]+/).join('/');
}

/**
 * Resolve a relative content path to an absolute path proven to live inside
 * contentRoot.
 * @param {string} contentRoot absolute, already resolved
 * @param {string} rel caller-supplied
 * @returns {string} absolute path
 * @throws {EditError} bad_path
 */
export function resolveInRoot(contentRoot, rel) {
  const root = path.resolve(contentRoot);
  const safeRel = validateRelPath(rel);
  const resolved = path.resolve(root, safeRel);
  const r = forCompare(resolved);
  const base = forCompare(root);
  if (r !== base && !r.startsWith(base + path.sep)) {
    throw bad('path escapes content root');
  }
  return resolved;
}

/**
 * Split a content path "<file relative to content/>#<key>" (§3.1).
 * @returns {{rel: string, key: string}}
 */
export function splitContentPath(contentPath) {
  if (typeof contentPath !== 'string' || contentPath.trim() === '') {
    throw bad('path is required');
  }
  const hash = contentPath.indexOf('#');
  // The file part is passed through untrimmed so the jail sees it verbatim.
  if (hash === -1) return { rel: contentPath, key: '' };
  return {
    rel: contentPath.slice(0, hash),
    key: contentPath.slice(hash + 1).trim(),
  };
}
