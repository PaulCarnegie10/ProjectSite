// Line-preserving YAML frontmatter parser/serializer.
//
// This deliberately does NOT use a general YAML library. Round-tripping a doc
// through js-yaml re-emits it in the library's own style: key order survives but
// comments, blank lines, quote style and indentation do not. The owner's
// index.md files are hand-written, so the edit server must behave like a
// surgeon: change the bytes of exactly one value and leave every other byte
// alone.
//
// Model: the document is a list of line records, each holding its ORIGINAL text
// and its ORIGINAL end-of-line bytes. serialize() concatenates them back. Any
// line the tokenizer did not understand is still carried verbatim, so an
// unedited parse->serialize is byte-identical by construction. An edit splices
// a substring inside a single line record's text.

import { fail } from './errors.js';

const BOM = String.fromCharCode(0xfeff);
const DELIM = /^(---|\.\.\.)[ \t]*$/;
const KEY_LINE = /^([ \t]*)([A-Za-z_][A-Za-z0-9_.-]*)[ \t]*:(?=[ \t]|$)/;
const ITEM_LINE = /^([ \t]*)-(?=[ \t]|$)/;

/* ------------------------------------------------------------------ lines */

function splitLines(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    const nl = s.indexOf('\n', i);
    if (nl === -1) {
      out.push({ text: s.slice(i), eol: '' });
      break;
    }
    let end = nl;
    let eol = '\n';
    if (end > i && s[end - 1] === '\r') {
      end -= 1;
      eol = '\r\n';
    }
    out.push({ text: s.slice(i, end), eol });
    i = nl + 1;
  }
  return out;
}

const joinLines = (lines) => lines.map((l) => l.text + l.eol).join('');

/* ------------------------------------------------------------- value scan */

/** Index of the `#` that opens a trailing comment, or -1. */
function commentIndex(text, from) {
  for (let i = from; i < text.length; i += 1) {
    if (text[i] === '#' && (i === 0 || /[ \t]/.test(text[i - 1]))) return i;
  }
  return -1;
}

function trimEndIndex(text, from, to) {
  let e = to;
  while (e > from && /[ \t]/.test(text[e - 1])) e -= 1;
  return e;
}

/**
 * Find the end offset of the value starting at `start`.
 * @returns {{end:number, kind:'dquote'|'squote'|'flow-seq'|'flow-map'|'plain'}}
 */
function scanValue(text, start) {
  const c = text[start];
  if (c === '"' || c === "'") {
    const kind = c === '"' ? 'dquote' : 'squote';
    let i = start + 1;
    while (i < text.length) {
      if (c === '"') {
        if (text[i] === '\\') { i += 2; continue; }
        if (text[i] === '"') return { end: i + 1, kind };
      } else {
        if (text[i] === "'") {
          if (text[i + 1] === "'") { i += 2; continue; }
          return { end: i + 1, kind };
        }
      }
      i += 1;
    }
    return { end: trimEndIndex(text, start, text.length), kind }; // unterminated
  }
  if (c === '[' || c === '{') {
    const kind = c === '[' ? 'flow-seq' : 'flow-map';
    let depth = 0;
    let i = start;
    let quote = null;
    while (i < text.length) {
      const ch = text[i];
      if (quote) {
        if (quote === '"' && ch === '\\') { i += 2; continue; }
        if (ch === quote) {
          if (quote === "'" && text[i + 1] === "'") { i += 2; continue; }
          quote = null;
        }
      } else if (ch === '"' || ch === "'") {
        quote = ch;
      } else if (ch === '[' || ch === '{') {
        depth += 1;
      } else if (ch === ']' || ch === '}') {
        depth -= 1;
        if (depth === 0) return { end: i + 1, kind };
      }
      i += 1;
    }
    return { end: trimEndIndex(text, start, text.length), kind };
  }
  const cmt = commentIndex(text, start);
  const hardEnd = cmt === -1 ? text.length : cmt;
  return { end: trimEndIndex(text, start, hardEnd), kind: 'plain' };
}

/**
 * Locate the value region on a line, given the index just past the ':' or '-'.
 * Note the property is `valueKind`, not `kind`: these fields get merged into a
 * line record whose own `kind` describes the LINE, not the value.
 */
function valueRegion(text, afterMarker) {
  let i = afterMarker;
  while (i < text.length && /[ \t]/.test(text[i])) i += 1;
  if (i >= text.length || text[i] === '#') {
    return { valueStart: afterMarker, valueEnd: afterMarker, valueKind: 'empty' };
  }
  const { end, kind } = scanValue(text, i);
  return { valueStart: i, valueEnd: end, valueKind: kind };
}

/* ------------------------------------------------------------- tokenizing */

function classify(line) {
  const { text } = line;
  const rec = { ...line, kind: 'other' };
  if (text.trim() === '') { rec.kind = 'blank'; return rec; }
  if (/^[ \t]*#/.test(text)) { rec.kind = 'comment'; return rec; }

  const item = ITEM_LINE.exec(text);
  if (item) {
    Object.assign(rec, valueRegion(text, item[0].length));
    rec.kind = 'item';
    rec.indent = item[1].length;
    return rec;
  }
  const key = KEY_LINE.exec(text);
  if (key) {
    Object.assign(rec, valueRegion(text, key[0].length));
    rec.kind = 'key';
    rec.indent = key[1].length;
    rec.key = key[2];
    return rec;
  }
  return rec;
}

/**
 * @typedef {object} Doc
 * @property {string} bom
 * @property {boolean} hasFrontmatter
 * @property {object|null} open   opening `---` line record
 * @property {object[]} fm        frontmatter line records
 * @property {object|null} close  closing `---` line record
 * @property {string} body        everything after the closing delimiter, verbatim
 * @property {string} eol         dominant line ending
 */

/** @returns {Doc} */
export function parseDocument(raw) {
  if (typeof raw !== 'string') throw fail('bad_path', 'document must be a string');
  const bom = raw.startsWith(BOM) ? BOM : '';
  const rest = bom ? raw.slice(BOM.length) : raw;
  const lines = splitLines(rest);

  const doc = {
    bom,
    hasFrontmatter: false,
    open: null,
    fm: [],
    close: null,
    body: rest,
    eol: rest.includes('\r\n') ? '\r\n' : '\n',
  };

  if (lines.length === 0 || !/^---[ \t]*$/.test(lines[0].text)) return doc;

  let closeIdx = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (DELIM.test(lines[i].text)) { closeIdx = i; break; }
  }
  if (closeIdx === -1) return doc; // no closing delimiter: not frontmatter

  doc.hasFrontmatter = true;
  doc.open = lines[0];
  doc.fm = lines.slice(1, closeIdx).map(classify);
  doc.close = lines[closeIdx];
  doc.body = joinLines(lines.slice(closeIdx + 1));
  doc.eol = doc.open.eol || '\n';
  return doc;
}

/** Byte-exact inverse of parseDocument when nothing was edited. */
export function serialize(doc) {
  if (!doc.hasFrontmatter) return doc.bom + doc.body;
  return (
    doc.bom +
    doc.open.text + doc.open.eol +
    joinLines(doc.fm) +
    doc.close.text + doc.close.eol +
    doc.body
  );
}

/* ---------------------------------------------------------------- decoding */

function unescapeDouble(s) {
  return s.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (m, g) => {
    if (g[0] === 'u') return String.fromCharCode(parseInt(g.slice(1), 16));
    if (g[0] === 'x') return String.fromCharCode(parseInt(g.slice(1), 16));
    const map = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', 0: '\0', '\\': '\\', '"': '"', '/': '/' };
    return g in map ? map[g] : g;
  });
}

const PLAIN_NUM = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/;

/** Split the inside of a flow collection on top-level commas. */
function splitFlow(inner) {
  const out = [];
  let depth = 0;
  let quote = null;
  let start = 0;
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
    if (quote) {
      if (quote === '"' && ch === '\\') { i += 1; continue; }
      if (ch === quote) {
        if (quote === "'" && inner[i + 1] === "'") { i += 1; continue; }
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '[' || ch === '{') depth += 1;
    else if (ch === ']' || ch === '}') depth -= 1;
    else if (ch === ',' && depth === 0) {
      out.push(inner.slice(start, i));
      start = i + 1;
    }
  }
  const tail = inner.slice(start);
  if (tail.trim() !== '' || out.length > 0) out.push(tail);
  return out;
}

/** Decode one scalar token to a JS value. Flow collections decode shallowly. */
export function decodeScalar(text) {
  const t = text.trim();
  if (t === '') return null;
  if (t[0] === '"') return unescapeDouble(t.slice(1, t.endsWith('"') && t.length > 1 ? -1 : undefined));
  if (t[0] === "'") return t.slice(1, t.endsWith("'") && t.length > 1 ? -1 : undefined).replace(/''/g, "'");
  if (t[0] === '[') return splitFlow(t.slice(1, -1)).map(decodeScalar).filter((v) => v !== null);
  if (t[0] === '{') {
    const obj = {};
    for (const part of splitFlow(t.slice(1, -1))) {
      const m = /^[ \t]*([A-Za-z_][A-Za-z0-9_.-]*)[ \t]*:([\s\S]*)$/.exec(part);
      if (m) obj[m[1]] = decodeScalar(m[2]);
    }
    return obj;
  }
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'null' || t === '~') return null;
  if (PLAIN_NUM.test(t)) return Number(t);
  return t;
}

/* ---------------------------------------------------------------- encoding */

const PLAIN_UNSAFE_HEAD = new Set(['-', '?', ':', ',', '[', ']', '{', '}', '#', '&', '*', '!', '|', '>', "'", '"', '%', '@', '`']);

function plainSafe(s) {
  if (s === '' || s !== s.trim()) return false;
  if (/[\n\r\t\0]/.test(s)) return false;
  if (PLAIN_UNSAFE_HEAD.has(s[0])) return false;
  if (s.includes(': ') || s.endsWith(':')) return false;
  if (s.includes(' #')) return false;
  // Would re-parse as a non-string type.
  if (PLAIN_NUM.test(s)) return false;
  if (/^(true|false|null|~|yes|no|on|off)$/i.test(s)) return false;
  if (/^0[xob]/i.test(s)) return false;
  if (/^\d{4}-\d{2}/.test(s)) return false;
  return true;
}

const dquote = (s) => `"${s
  .replace(/\\/g, '\\\\')
  .replace(/"/g, '\\"')
  .replace(/\n/g, '\\n')
  .replace(/\r/g, '\\r')
  .replace(/\t/g, '\\t')}"`;

/**
 * Encode a JS value as a YAML scalar, honouring the style the file already used.
 * @param {*} value
 * @param {'dquote'|'squote'|'plain'|'empty'|undefined} style
 */
export function encodeScalar(value, style) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean' || typeof value === 'number') {
    const lit = String(value);
    if (style === 'dquote') return dquote(lit);
    if (style === 'squote') return `'${lit}'`;
    return lit;
  }
  const s = String(value);
  if (style === 'dquote') return dquote(s);
  if (style === 'squote') {
    if (/[\n\r]/.test(s)) return dquote(s);
    return `'${s.replace(/'/g, "''")}'`;
  }
  return plainSafe(s) ? s : dquote(s);
}

/* ---------------------------------------------------------------- entries */

/** Index of the top-level key line, or -1. */
function findKeyIndex(doc, key) {
  const base = topIndent(doc);
  for (let i = 0; i < doc.fm.length; i += 1) {
    const l = doc.fm[i];
    if (l.kind === 'key' && l.indent === base && l.key === key) return i;
  }
  return -1;
}

function topIndent(doc) {
  for (const l of doc.fm) if (l.kind === 'key') return l.indent;
  return 0;
}

/** Item line indices belonging to the block array headed at keyIdx. */
function blockItemIndices(doc, keyIdx) {
  const base = doc.fm[keyIdx].indent;
  const out = [];
  for (let i = keyIdx + 1; i < doc.fm.length; i += 1) {
    const l = doc.fm[i];
    if (l.kind === 'blank' || l.kind === 'comment') continue;
    if (l.kind === 'item' && l.indent >= base) { out.push(i); continue; }
    if (l.kind === 'key' && l.indent <= base) break;
    if (l.kind === 'other' && (l.indent ?? 0) <= base) break;
    if (l.kind === 'key' && l.indent > base) continue; // nested map inside an item
    if (l.kind === 'other') continue;
    break;
  }
  return out;
}

function assertEditable(line) {
  if (line.kind === 'key' && line.valueStart !== line.valueEnd) {
    const head = line.text[line.valueStart];
    if (head === '|' || head === '>') {
      throw fail('bad_path', `block scalar value for "${line.key}" is not editable`);
    }
  }
}

/** Replace [start,end) inside a line record's text and re-classify it. */
function spliceLine(doc, idx, start, end, replacement) {
  const l = doc.fm[idx];
  const text = l.text.slice(0, start) + replacement + l.text.slice(end);
  doc.fm[idx] = classify({ text, eol: l.eol });
}

/* ------------------------------------------------------------------ public */

/** @returns {*} decoded value, or undefined when the key is absent. */
export function getValue(doc, key) {
  const idx = findKeyIndex(doc, key);
  if (idx === -1) return undefined;
  const l = doc.fm[idx];
  if (l.kind === 'key' && l.valueStart !== l.valueEnd) {
    return decodeScalar(l.text.slice(l.valueStart, l.valueEnd));
  }
  const items = blockItemIndices(doc, idx);
  if (items.length > 0) {
    return items.map((i) => {
      const it = doc.fm[i];
      return decodeScalar(it.text.slice(it.valueStart, it.valueEnd));
    });
  }
  return null;
}

/** @returns {string[]} array-valued key as a list of strings (missing -> []). */
export function getArray(doc, key) {
  const v = getValue(doc, key);
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v.map(String) : [String(v)];
}

/** Append `key: <value>` at the end of the frontmatter block. */
function appendKey(doc, key, encoded) {
  const indent = ' '.repeat(topIndent(doc));
  const eol = doc.fm.length > 0 ? doc.fm[doc.fm.length - 1].eol || doc.eol : doc.eol;
  doc.fm.push(classify({ text: `${indent}${key}: ${encoded}`, eol }));
}

/**
 * Set a scalar key. Only the value substring on that one line changes; a
 * trailing comment on the same line survives.
 */
export function setValue(doc, key, value) {
  if (!doc.hasFrontmatter) throw fail('not_found', 'document has no frontmatter block');
  const idx = findKeyIndex(doc, key);
  if (idx === -1) {
    appendKey(doc, key, encodeScalar(value, undefined));
    return doc;
  }
  const l = doc.fm[idx];
  assertEditable(l);

  // A key that currently heads a block array becomes a plain scalar: drop items.
  const items = blockItemIndices(doc, idx);
  if (items.length > 0 && l.valueStart === l.valueEnd) {
    for (let i = items.length - 1; i >= 0; i -= 1) doc.fm.splice(items[i], 1);
  }

  // Preserve an unquoted numeric/boolean field when the client round-trips it
  // back as a string ("3" from a contenteditable must not become order: "3").
  const style = l.valueStart === l.valueEnd ? 'empty' : scanStyle(l);
  let out = value;
  if (typeof value === 'string' && style === 'plain') {
    const prev = decodeScalar(l.text.slice(l.valueStart, l.valueEnd));
    if (typeof prev === 'number' && PLAIN_NUM.test(value.trim())) out = Number(value);
    else if (typeof prev === 'boolean' && /^(true|false)$/.test(value.trim())) out = value.trim() === 'true';
  }
  const encoded = encodeScalar(out, style === 'empty' ? undefined : style);
  if (style === 'empty') {
    spliceLine(doc, idx, l.valueStart, l.valueEnd, ` ${encoded}`);
  } else {
    spliceLine(doc, idx, l.valueStart, l.valueEnd, encoded);
  }
  return doc;
}

function scanStyle(line) {
  const head = line.text[line.valueStart];
  if (head === '"') return 'dquote';
  if (head === "'") return 'squote';
  if (head === '[') return 'flow-seq';
  if (head === '{') return 'flow-map';
  return 'plain';
}

/** Quote char used by the existing items, so appends match the file's style. */
function detectItemStyle(texts) {
  for (const t of texts) {
    const s = t.trim();
    if (s.startsWith('"')) return 'dquote';
    if (s.startsWith("'")) return 'squote';
  }
  return texts.length > 0 ? 'plain' : 'dquote';
}

/**
 * Set an array key. Inline arrays stay inline (matching separator + quote
 * style); block arrays stay block, rewriting only the item lines that change.
 */
export function setArray(doc, key, values) {
  if (!doc.hasFrontmatter) throw fail('not_found', 'document has no frontmatter block');
  const list = values.map(String);
  const idx = findKeyIndex(doc, key);

  if (idx === -1) {
    appendKey(doc, key, `[${list.map((v) => encodeScalar(v, 'dquote')).join(', ')}]`);
    return doc;
  }
  const l = doc.fm[idx];
  assertEditable(l);
  const inline = l.valueStart !== l.valueEnd && scanStyle(l) === 'flow-seq';

  if (inline) {
    const body = l.text.slice(l.valueStart + 1, l.valueEnd - 1);
    const parts = splitFlow(body);
    const style = detectItemStyle(parts.filter((p) => p.trim() !== ''));
    const sep = /,\s/.test(body) || parts.length <= 1 ? ', ' : ',';
    const encoded = `[${list.map((v) => encodeScalar(v, style)).join(sep)}]`;
    spliceLine(doc, idx, l.valueStart, l.valueEnd, encoded);
    return doc;
  }

  const items = blockItemIndices(doc, idx);
  if (items.length === 0) {
    // Empty or scalar value: write an inline array on the key line.
    const encoded = `[${list.map((v) => encodeScalar(v, 'dquote')).join(', ')}]`;
    if (l.valueStart === l.valueEnd) spliceLine(doc, idx, l.valueStart, l.valueEnd, ` ${encoded}`);
    else spliceLine(doc, idx, l.valueStart, l.valueEnd, encoded);
    return doc;
  }

  const style = detectItemStyle(items.map((i) => doc.fm[i].text.slice(doc.fm[i].valueStart, doc.fm[i].valueEnd)));
  const proto = doc.fm[items[0]];
  const dashPrefix = proto.text.slice(0, proto.valueStart);

  const keep = Math.min(items.length, list.length);
  for (let n = 0; n < keep; n += 1) {
    const li = items[n];
    const rec = doc.fm[li];
    spliceLine(doc, li, rec.valueStart, rec.valueEnd, encodeScalar(list[n], style));
  }
  if (list.length < items.length) {
    for (let n = items.length - 1; n >= list.length; n -= 1) doc.fm.splice(items[n], 1);
  } else if (list.length > items.length) {
    const after = items[items.length - 1];
    const eol = doc.fm[after].eol || doc.eol;
    const extra = list.slice(items.length).map((v) =>
      classify({ text: dashPrefix + encodeScalar(v, style), eol }));
    doc.fm.splice(after + 1, 0, ...extra);
  }
  return doc;
}

/** Replace only the post-frontmatter region. */
export function setBody(doc, text) {
  const normalized = String(text).replace(/\r\n/g, '\n').replace(/\n/g, doc.eol);
  doc.body = normalized === '' || normalized.endsWith(doc.eol) ? normalized : normalized + doc.eol;
  return doc;
}

export const getBody = (doc) => doc.body;

/** Ordered list of top-level frontmatter keys. */
export function keys(doc) {
  const base = topIndent(doc);
  return doc.fm.filter((l) => l.kind === 'key' && l.indent === base).map((l) => l.key);
}
