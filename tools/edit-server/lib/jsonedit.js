// Surgical JSON editing for content/site/*.json.
//
// Dot paths address nested values (§3.1): `heroTitle`, `categories.0.name`.
// A numeric segment indexes an array. The setter locates the byte span of the
// target value and splices it, so editing one string does not reformat the
// whole file; if the locator cannot find the span it falls back to a structural
// set plus a re-stringify with the file's detected indentation.

import { fail } from './errors.js';

const isWs = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\r';

function skipWs(s, i) {
  let j = i;
  while (j < s.length && isWs(s[j])) j += 1;
  return j;
}

function endOfString(s, i) {
  let j = i + 1;
  while (j < s.length) {
    if (s[j] === '\\') { j += 2; continue; }
    if (s[j] === '"') return j + 1;
    j += 1;
  }
  throw fail('bad_path', 'unterminated string in JSON document');
}

/** End offset (exclusive) of the JSON value that starts at i. */
function endOfValue(s, i) {
  const c = s[i];
  if (c === '"') return endOfString(s, i);
  if (c === '{' || c === '[') {
    let depth = 0;
    let j = i;
    while (j < s.length) {
      const ch = s[j];
      if (ch === '"') { j = endOfString(s, j); continue; }
      if (ch === '{' || ch === '[') depth += 1;
      else if (ch === '}' || ch === ']') {
        depth -= 1;
        if (depth === 0) return j + 1;
      }
      j += 1;
    }
    throw fail('bad_path', 'unterminated collection in JSON document');
  }
  let j = i;
  while (j < s.length && !',}] \t\n\r'.includes(s[j])) j += 1;
  return j;
}

/** Byte span of the value at `segments`, or null. */
function locate(s, start, segments) {
  let i = skipWs(s, start);
  if (segments.length === 0) return { start: i, end: endOfValue(s, i) };
  const [seg, ...rest] = segments;

  if (s[i] === '{') {
    i += 1;
    for (;;) {
      i = skipWs(s, i);
      if (s[i] === '}') return null;
      if (s[i] !== '"') return null;
      const keyEnd = endOfString(s, i);
      const key = JSON.parse(s.slice(i, keyEnd));
      i = skipWs(s, keyEnd);
      if (s[i] !== ':') return null;
      i = skipWs(s, i + 1);
      if (key === seg) return locate(s, i, rest);
      i = skipWs(s, endOfValue(s, i));
      if (s[i] !== ',') return null;
      i += 1;
    }
  }
  if (s[i] === '[') {
    const idx = Number(seg);
    if (!Number.isInteger(idx) || idx < 0) return null;
    i += 1;
    for (let n = 0; ; n += 1) {
      i = skipWs(s, i);
      if (s[i] === ']') return null;
      if (n === idx) return locate(s, i, rest);
      i = skipWs(s, endOfValue(s, i));
      if (s[i] !== ',') return null;
      i += 1;
    }
  }
  return null;
}

export function splitDotPath(key) {
  if (typeof key !== 'string' || key.trim() === '') {
    throw fail('bad_path', 'json key is required');
  }
  return key.split('.').map((s) => s.trim()).filter((s) => s !== '');
}

/** Read a dot-path value. @throws not_found */
export function getJsonValue(raw, key) {
  const segments = splitDotPath(key);
  let node = JSON.parse(raw);
  for (const seg of segments) {
    if (node === null || typeof node !== 'object') throw fail('not_found', `no such key: ${key}`);
    node = Array.isArray(node) ? node[Number(seg)] : node[seg];
    if (node === undefined) throw fail('not_found', `no such key: ${key}`);
  }
  return node;
}

function detectIndent(raw) {
  const m = /\n([ \t]+)\S/.exec(raw);
  if (!m) return 2;
  return m[1][0] === '\t' ? '\t' : m[1].length;
}

function structuralSet(raw, segments, value) {
  const root = JSON.parse(raw);
  let node = root;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const seg = segments[i];
    const nxt = Array.isArray(node) ? node[Number(seg)] : node[seg];
    if (nxt === undefined || nxt === null || typeof nxt !== 'object') {
      throw fail('not_found', `no such key: ${segments.join('.')}`);
    }
    node = nxt;
  }
  const last = segments[segments.length - 1];
  if (Array.isArray(node)) {
    const idx = Number(last);
    if (!Number.isInteger(idx) || idx < 0 || idx >= node.length) {
      throw fail('not_found', `no such index: ${segments.join('.')}`);
    }
    node[idx] = value;
  } else {
    if (!(last in node)) throw fail('not_found', `no such key: ${segments.join('.')}`);
    node[last] = value;
  }
  const trailingNewline = raw.endsWith('\n') ? '\n' : '';
  return JSON.stringify(root, null, detectIndent(raw)) + trailingNewline;
}

/**
 * Set a dot-path value, preserving surrounding formatting where possible.
 * @returns {string} the new file contents
 */
export function setJsonValue(raw, key, value) {
  const segments = splitDotPath(key);
  // Prove the path exists (and produce the right not_found otherwise).
  getJsonValue(raw, key);

  let span = null;
  try {
    span = locate(raw, 0, segments);
  } catch {
    span = null;
  }
  if (span) {
    const next = raw.slice(0, span.start) + JSON.stringify(value) + raw.slice(span.end);
    try {
      JSON.parse(next); // never write a file we just broke
      return next;
    } catch {
      /* fall through to the structural path */
    }
  }
  return structuralSet(raw, segments, value);
}
