// Endpoint implementations for §4 of docs/CONTENT_SCHEMA.md.
// Every filesystem path used here comes out of resolveInRoot(); nothing else
// in this file is allowed to build a path from client input.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fail } from './errors.js';
import { resolveInRoot, splitContentPath, validateRelPath } from './pathjail.js';
import * as fm from './frontmatter.js';
import { getJsonValue, setJsonValue } from './jsonedit.js';
import { classifyUpload, slugify, uniqueName } from './filename.js';
import { compressImage, hasSharp } from './image.js';
import { compressVideo, hasFfmpeg } from './video.js';

const ASSET_KEYS = new Set(['hero', 'gallery', 'videos']);
const EM_DASH = String.fromCharCode(0x2014);
export const TODO_MARKER = `[TODO ${EM_DASH} Paul]`;

/* ------------------------------------------------------------------ utils */

/** Write via a sibling temp file + rename so a crash cannot truncate content. */
function atomicWrite(target, contents) {
  const tmp = path.join(path.dirname(target), `.${path.basename(target)}.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(tmp, contents, 'utf8');
  fs.renameSync(tmp, target);
}

function readExisting(abs, rel) {
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    throw fail('not_found', `no such content file: ${rel}`);
  }
  return fs.readFileSync(abs, 'utf8');
}

const requireString = (value, name) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw fail('bad_path', `${name} is required`);
  }
  return value.trim();
};

/** projects/<slug>/index.md -> absolute dir, asserting the file exists. */
function projectDirFor(contentRoot, rel) {
  const abs = resolveInRoot(contentRoot, rel);
  if (!/index\.md$/i.test(rel)) throw fail('bad_path', 'asset path must target a project index.md');
  if (!fs.existsSync(abs)) throw fail('not_found', `no such content file: ${rel}`);
  return { abs, dir: path.dirname(abs) };
}

const projectsDir = (contentRoot) => path.join(contentRoot, 'projects');

/* ------------------------------------------------------------------- ping */

export async function ping(ctx) {
  return {
    contentRoot: ctx.contentRoot,
    ffmpeg: await hasFfmpeg(),
    sharp: await hasSharp(),
  };
}

/* ------------------------------------------------------------------- text */

export async function setText(ctx, body) {
  const contentPath = requireString(body.path, 'path');
  const { rel, key } = splitContentPath(contentPath);
  if (key === '') throw fail('bad_path', 'path must include a #key');
  const abs = resolveInRoot(ctx.contentRoot, rel);
  const raw = readExisting(abs, rel);
  const { value } = body;

  if (/\.json$/i.test(rel)) {
    atomicWrite(abs, setJsonValue(raw, key, value));
    return { path: contentPath, value };
  }
  if (/\.md$/i.test(rel)) {
    const doc = fm.parseDocument(raw);
    if (key === 'body') fm.setBody(doc, value == null ? '' : String(value));
    else {
      if (!doc.hasFrontmatter) throw fail('not_found', `${rel} has no frontmatter block`);
      fm.setValue(doc, key, value);
    }
    atomicWrite(abs, fm.serialize(doc));
    return { path: contentPath, value };
  }
  throw fail('bad_path', 'only .json and .md files are editable');
}

export function readText(ctx, contentPath) {
  const { rel, key } = splitContentPath(contentPath);
  const abs = resolveInRoot(ctx.contentRoot, rel);
  const raw = readExisting(abs, rel);
  if (/\.json$/i.test(rel)) return getJsonValue(raw, key);
  const doc = fm.parseDocument(raw);
  return key === 'body' ? fm.getBody(doc) : fm.getValue(doc, key);
}

/* ------------------------------------------------------------------ asset */

/**
 * @param {{contentRoot:string}} ctx
 * @param {{fields:object, file:object|null}} upload
 */
export async function putAsset(ctx, upload) {
  const contentPath = requireString(upload.fields.path, 'path');
  const { rel, key } = splitContentPath(contentPath);
  if (!ASSET_KEYS.has(key)) {
    throw fail('bad_path', `asset key must be one of ${[...ASSET_KEYS].join(', ')}`);
  }
  if (!upload.file) throw fail('bad_path', 'no file part in upload');

  const { abs, dir } = projectDirFor(ctx.contentRoot, rel);
  const { kind, ext, stem } = classifyUpload(upload.file.filename);

  if (kind === 'image' && key === 'videos') {
    throw fail('unsupported_media', 'images cannot be added to #videos');
  }
  if (kind === 'video' && key !== 'videos') {
    throw fail('unsupported_media', `videos can only be added to #videos, not #${key}`);
  }

  const outExt = kind === 'image' ? '.webp' : '.mp4';
  const name = uniqueName(dir, stem, outExt);
  // Encode to a temp file first; a failed encode must not leave a half-written
  // asset inside content/.
  const stageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edit-encode-'));
  const staged = path.join(stageDir, name);
  let result;
  try {
    result = kind === 'image'
      ? await compressImage(upload.file.tmpPath, staged, { animated: ext === '.gif' })
      : await compressVideo(upload.file.tmpPath, staged);
    fs.renameSync(staged, path.join(dir, name));
  } catch (err) {
    fs.rmSync(stageDir, { recursive: true, force: true });
    throw err;
  }
  fs.rmSync(stageDir, { recursive: true, force: true });

  const doc = fm.parseDocument(fs.readFileSync(abs, 'utf8'));
  if (!doc.hasFrontmatter) throw fail('not_found', `${rel} has no frontmatter block`);
  if (key === 'hero') {
    fm.setValue(doc, 'hero', name);
  } else {
    const items = fm.getArray(doc, key).filter((v) => v !== '');
    items.push(name);
    fm.setArray(doc, key, items);
  }
  atomicWrite(abs, fm.serialize(doc));

  return {
    name,
    kind,
    bytesIn: result.bytesIn,
    bytesOut: result.bytesOut,
    path: contentPath,
  };
}

/** Frontmatter-only removal. The file on disk is deliberately left alone. */
export async function deleteAsset(ctx, body) {
  const contentPath = requireString(body.path, 'path');
  const name = requireString(body.name, 'name');
  const { rel, key } = splitContentPath(contentPath);
  if (!ASSET_KEYS.has(key)) {
    throw fail('bad_path', `asset key must be one of ${[...ASSET_KEYS].join(', ')}`);
  }
  const { abs } = projectDirFor(ctx.contentRoot, rel);
  const doc = fm.parseDocument(fs.readFileSync(abs, 'utf8'));
  if (!doc.hasFrontmatter) throw fail('not_found', `${rel} has no frontmatter block`);

  let items;
  if (key === 'hero') {
    if (String(fm.getValue(doc, 'hero') ?? '') !== name) {
      throw fail('not_found', `hero is not ${name}`);
    }
    fm.setValue(doc, 'hero', '');
    items = [];
  } else {
    const before = fm.getArray(doc, key);
    items = before.filter((v) => v !== name);
    if (items.length === before.length) throw fail('not_found', `${name} is not listed in ${key}`);
    fm.setArray(doc, key, items);
  }
  atomicWrite(abs, fm.serialize(doc));
  return { path: contentPath, items };
}

/* ---------------------------------------------------------------- project */

const yyyymm = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Highest `order` currently in use across all projects (0 when none). */
export function maxOrder(contentRoot) {
  const dir = projectsDir(contentRoot);
  if (!fs.existsSync(dir)) return 0;
  let max = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const index = path.join(dir, entry.name, 'index.md');
    if (!fs.existsSync(index)) continue;
    const value = fm.getValue(fm.parseDocument(fs.readFileSync(index, 'utf8')), 'order');
    if (typeof value === 'number' && Number.isFinite(value)) max = Math.max(max, value);
  }
  return max;
}

export function scaffold(title, order) {
  return [
    '---',
    `title: ${JSON.stringify(String(title))}`,
    'blurb: ""',
    `date: "${yyyymm()}"`,
    'tags: []',
    `order: ${order}`,
    'draft: false',
    'hero: ""',
    'gallery: []',
    'videos: []',
    'links: []',
    '---',
    TODO_MARKER,
    '',
  ].join('\n');
}

export async function createProject(ctx, body) {
  const title = requireString(body.title, 'title');
  const slug = slugify(title);
  const dir = resolveInRoot(ctx.contentRoot, `projects/${slug}`);
  if (fs.existsSync(dir)) throw fail('bad_path', `project "${slug}" already exists`);
  fs.mkdirSync(dir, { recursive: true });
  atomicWrite(path.join(dir, 'index.md'), scaffold(title, maxOrder(ctx.contentRoot) + 1));
  return { slug };
}

/** Move, never remove: a mis-click must be recoverable from content/.trash/. */
export async function deleteProject(ctx, body) {
  const slug = validateRelPath(requireString(body.slug, 'slug'));
  if (slug.includes('/')) throw fail('bad_path', 'slug must be a single path segment');
  const dir = resolveInRoot(ctx.contentRoot, `projects/${slug}`);
  if (!fs.existsSync(dir)) throw fail('not_found', `no such project: ${slug}`);

  const trashRoot = path.join(ctx.contentRoot, '.trash');
  fs.mkdirSync(trashRoot, { recursive: true });
  const stamp = `${slug}-${Date.now()}`;
  const dest = path.join(trashRoot, stamp);
  try {
    fs.renameSync(dir, dest);
  } catch (err) {
    if (err.code !== 'EXDEV') throw err;
    fs.cpSync(dir, dest, { recursive: true });
    fs.rmSync(dir, { recursive: true, force: true });
  }
  return { slug, trashed: `.trash/${stamp}` };
}

/* ---------------------------------------------------------------- reorder */

export async function reorder(ctx, body) {
  const { slugs } = body;
  if (!Array.isArray(slugs)) throw fail('bad_path', 'slugs must be an array');
  const orders = {};
  const targets = slugs.map((raw, i) => {
    const slug = validateRelPath(requireString(raw, 'slug'));
    if (slug.includes('/')) throw fail('bad_path', 'slug must be a single path segment');
    const abs = resolveInRoot(ctx.contentRoot, `projects/${slug}/index.md`);
    if (!fs.existsSync(abs)) throw fail('not_found', `no such project: ${slug}`);
    return { slug, abs, order: i + 1 };
  });
  // Validated as a set before anything is written, so a bad slug at the end of
  // the list cannot leave a half-applied ordering behind.
  for (const t of targets) {
    const doc = fm.parseDocument(fs.readFileSync(t.abs, 'utf8'));
    if (!doc.hasFrontmatter) throw fail('not_found', `${t.slug}/index.md has no frontmatter block`);
    fm.setValue(doc, 'order', t.order);
    atomicWrite(t.abs, fm.serialize(doc));
    orders[t.slug] = t.order;
  }
  return { orders };
}
