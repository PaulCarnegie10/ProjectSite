// Mock /__edit/* server for the edit harness.
//
// Implements the frozen wire spec (docs/CONTENT_SCHEMA.md §4) against a
// throwaway fixture tree in the OS temp dir, so every client flow can be
// exercised without the real edit server, ffmpeg or sharp. "Compression" is
// simulated with a delay proportional to file size — that is what puts the
// client's indeterminate "compressing…" state under test.
//
// This is harness-only. It is NOT the production middleware.

import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

export const FIXTURE_ROOT = path.join(os.tmpdir(), 'portfolio-edit-harness');
const CONTENT_ROOT = path.join(FIXTURE_ROOT, 'content');

const JSON_CAP = 1024 * 1024; // 1 MB
const MULTIPART_CAP = 512 * 1024 * 1024; // 512 MB
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.bmp']);
const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm', '.mkv', '.m4v', '.avi']);

// ---------------------------------------------------------------- utilities

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fail(code, message, status) {
  const err = new Error(message);
  err.code = code;
  err.status = status;
  return err;
}

const STATUS = {
  not_loopback: 403,
  bad_path: 400,
  not_found: 404,
  too_large: 413,
  unsupported_media: 415,
  encode_failed: 500,
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(body);
}

function sendError(res, err) {
  const code = err?.code && STATUS[err.code] ? err.code : 'encode_failed';
  const status = err?.status || STATUS[code] || 500;
  sendJson(res, status, { ok: false, error: code, message: err?.message || 'failed' });
}

function readBody(req, cap) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > cap) {
        reject(fail('too_large', `Body over ${cap} bytes.`));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readJsonBody(req) {
  const buf = await readBody(req, JSON_CAP);
  try {
    return JSON.parse(buf.toString('utf8') || '{}');
  } catch {
    throw fail('bad_path', 'Body was not JSON.');
  }
}

/** Jail every write under content/. */
function resolveContent(rel) {
  if (typeof rel !== 'string' || !rel || rel.includes('\0')) throw fail('bad_path', 'Missing path.');
  const norm = rel.replace(/\\/g, '/');
  if (norm.startsWith('/') || /^[A-Za-z]:/.test(norm)) throw fail('bad_path', 'Absolute paths rejected.');
  const abs = path.resolve(CONTENT_ROOT, norm);
  const rootWithSep = CONTENT_ROOT.endsWith(path.sep) ? CONTENT_ROOT : CONTENT_ROOT + path.sep;
  if (abs !== CONTENT_ROOT && !abs.startsWith(rootWithSep)) throw fail('bad_path', 'Path escapes content/.');
  return abs;
}

function splitPath(p) {
  const hash = String(p ?? '').indexOf('#');
  if (hash < 0) throw fail('bad_path', 'Content path needs a #key.');
  return { file: String(p).slice(0, hash), key: String(p).slice(hash + 1) };
}

function sanitizeName(name) {
  const base = path.basename(String(name || 'file')).toLowerCase();
  const clean = base.replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^[-.]+/, '');
  return clean || 'file';
}

function slugify(title) {
  const s = String(title || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'untitled';
}

// ------------------------------------------------------- frontmatter (mock)

function scalar(v) {
  const t = v.trim();
  if (t === '') return '';
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if (t.startsWith('[') || t.startsWith('{')) {
    try {
      return JSON.parse(t.replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":').replace(/'/g, '"'));
    } catch {
      return t;
    }
  }
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) return { data: {}, body: text };
  const data = {};
  let listKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const item = /^\s*-\s+(.*)$/.exec(line);
    if (item && listKey) {
      data[listKey].push(scalar(item[1]));
      continue;
    }
    const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    if (kv[2].trim() === '') {
      listKey = kv[1];
      data[listKey] = [];
    } else {
      listKey = null;
      data[kv[1]] = scalar(kv[2]);
    }
  }
  return { data, body: m[2] };
}

/** JSON encoding of our shapes is valid YAML flow style. */
function stringifyFrontmatter(data, body) {
  const lines = Object.entries(data).map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
  return `---\n${lines.join('\n')}\n---\n${body}`;
}

function readDoc(abs) {
  if (!fs.existsSync(abs)) throw fail('not_found', `No such file: ${path.relative(CONTENT_ROOT, abs)}`);
  return parseFrontmatter(fs.readFileSync(abs, 'utf8'));
}

function writeDoc(abs, doc) {
  fs.writeFileSync(abs, stringifyFrontmatter(doc.data, doc.body), 'utf8');
}

function setDeep(obj, dotted, value) {
  const parts = dotted.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const k = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i];
    if (cur[k] == null) throw fail('not_found', `Key not found: ${dotted}`);
    cur = cur[k];
  }
  const last = parts[parts.length - 1];
  cur[/^\d+$/.test(last) ? Number(last) : last] = value;
}

// ---------------------------------------------------------- multipart (mock)

function parseMultipart(buf, boundary) {
  const delim = Buffer.from(`--${boundary}`);
  const parts = [];
  let cursor = buf.indexOf(delim);
  if (cursor < 0) return parts;
  cursor += delim.length;
  for (;;) {
    if (buf.slice(cursor, cursor + 2).toString('latin1') === '--') break;
    if (buf[cursor] === 13 && buf[cursor + 1] === 10) cursor += 2;
    const headEnd = buf.indexOf('\r\n\r\n', cursor);
    if (headEnd < 0) break;
    const head = buf.slice(cursor, headEnd).toString('utf8');
    const bodyStart = headEnd + 4;
    const next = buf.indexOf(delim, bodyStart);
    if (next < 0) break;
    let bodyEnd = next;
    if (buf[bodyEnd - 2] === 13 && buf[bodyEnd - 1] === 10) bodyEnd -= 2;
    parts.push({
      name: /name="([^"]*)"/i.exec(head)?.[1],
      filename: /filename="([^"]*)"/i.exec(head)?.[1],
      type: /content-type:\s*([^\r\n]+)/i.exec(head)?.[1]?.trim(),
      data: buf.slice(bodyStart, bodyEnd),
    });
    cursor = next + delim.length;
  }
  return parts;
}

// ------------------------------------------------------------- PNG fixtures

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Flat-colour PNG so the fixture has real, renderable images. */
function makePng(w, h, [r, g, b]) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y += 1) {
    const row = y * (1 + w * 3);
    raw[row] = 0;
    for (let x = 0; x < w; x += 1) {
      const o = row + 1 + x * 3;
      raw[o] = (r + x) % 256;
      raw[o + 1] = (g + y) % 256;
      raw[o + 2] = b;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function sniffType(buf, ext) {
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
  if (buf.slice(0, 4).toString('latin1') === 'RIFF') return 'image/webp';
  if (buf.slice(4, 8).toString('latin1') === 'ftyp') return 'video/mp4';
  if (VIDEO_EXT.has(ext)) return 'video/mp4';
  if (IMAGE_EXT.has(ext)) return 'image/png';
  return 'application/octet-stream';
}

// -------------------------------------------------------------------- seed

const SEED_BODY = `Bees leave the hive, the tracker follows them, and the trajectories come
out the other side. This body text is markdown and is edited with the
multiline overlay.

\`\`\`python
tracks = tracker.update(detections)
\`\`\`

[TODO — Paul] write up the calibration step.
`;

function seed() {
  fs.rmSync(FIXTURE_ROOT, { recursive: true, force: true });
  fs.mkdirSync(path.join(CONTENT_ROOT, 'site'), { recursive: true });

  fs.writeFileSync(
    path.join(CONTENT_ROOT, 'site', 'home.json'),
    JSON.stringify(
      {
        heroTitle: 'Paul Colombo',
        heroSubtitle: 'CS + robotics at CMU',
        intro:
          'I build perception systems that have to work outdoors.\nThis paragraph is the multiline slot on site/home.json#intro.',
        socials: [{ label: 'GitHub', url: 'https://github.com/', kind: 'github' }],
        featuredSlugs: ['bee-tracker'],
      },
      null,
      2,
    ),
    'utf8',
  );

  const projects = [
    { slug: 'bee-tracker', title: 'Bee Tracker', order: 1, colors: [[40, 90, 60], [120, 70, 40], [60, 60, 120]] },
    { slug: 'dr-wu-crew', title: 'Dr Wu Crew', order: 2, colors: [[90, 40, 90]] },
    { slug: 'terrain-mapper', title: 'Terrain Mapper', order: 3, colors: [[30, 70, 100]] },
  ];

  for (const p of projects) {
    const dir = path.join(CONTENT_ROOT, 'projects', p.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'cover.png'), makePng(320, 180, p.colors[0]));
    const gallery = [];
    p.colors.forEach((c, i) => {
      const name = `shot-${i + 1}.png`;
      fs.writeFileSync(path.join(dir, name), makePng(200, 140, c));
      gallery.push(name);
    });
    // Placeholder video bytes: enough to exercise list + remove without shipping a real encode.
    const videos = p.slug === 'bee-tracker' ? ['demo.mp4'] : [];
    for (const v of videos) fs.writeFileSync(path.join(dir, v), Buffer.alloc(2048));
    writeDoc(path.join(dir, 'index.md'), {
      data: {
        title: p.title,
        blurb: `${p.title} blurb — single-line editable slot.`,
        date: '2026-05',
        tags: ['cv', 'robotics'],
        order: p.order,
        draft: false,
        hero: 'cover.png',
        gallery,
        videos,
        links: [{ label: 'GitHub', url: 'https://github.com/' }],
      },
      body: SEED_BODY,
    });
  }
}

// --------------------------------------------------------------- handlers

function projectDirs() {
  const base = path.join(CONTENT_ROOT, 'projects');
  if (!fs.existsSync(base)) return [];
  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(base, d.name, 'index.md')))
    .map((d) => d.name);
}

async function handleText(req, res) {
  const { path: p, value } = await readJsonBody(req);
  const { file, key } = splitPath(p);
  const abs = resolveContent(file);
  if (typeof value !== 'string') throw fail('bad_path', 'value must be a string.');

  if (file.endsWith('.json')) {
    if (!fs.existsSync(abs)) throw fail('not_found', `No such file: ${file}`);
    const data = JSON.parse(fs.readFileSync(abs, 'utf8'));
    setDeep(data, key, value);
    fs.writeFileSync(abs, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  } else if (file.endsWith('.md')) {
    const doc = readDoc(abs);
    if (key === 'body') doc.body = value;
    else doc.data[key] = value;
    writeDoc(abs, doc);
  } else {
    throw fail('bad_path', 'Only .json and .md files carry text.');
  }
  sendJson(res, 200, { ok: true, path: p, value });
}

async function handleAssetUpload(req, res) {
  const ct = req.headers['content-type'] || '';
  const boundary = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(ct);
  if (!boundary) throw fail('unsupported_media', 'Expected multipart/form-data.');
  const buf = await readBody(req, MULTIPART_CAP);
  const parts = parseMultipart(buf, (boundary[1] || boundary[2]).trim());

  const p = parts.find((x) => x.name === 'path')?.data?.toString('utf8');
  const filePart = parts.find((x) => x.name === 'file');
  if (!filePart) throw fail('bad_path', 'No file part.');

  const { file, key } = splitPath(p);
  if (!file.endsWith('index.md')) throw fail('bad_path', 'Assets attach to a project index.md.');
  if (!['hero', 'gallery', 'videos'].includes(key)) throw fail('bad_path', `Unknown asset key #${key}.`);
  const abs = resolveContent(file);
  const doc = readDoc(abs);
  const dir = path.dirname(abs);

  const original = sanitizeName(filePart.filename);
  const ext = path.extname(original);
  const isImage = IMAGE_EXT.has(ext) || (filePart.type || '').startsWith('image/');
  const isVideo = VIDEO_EXT.has(ext) || (filePart.type || '').startsWith('video/');
  if (!isImage && !isVideo) {
    throw fail(
      'unsupported_media',
      ext === '.pdf'
        ? 'PDFs are not uploadable. Copy the file into the project folder and link to it.'
        : `Unsupported file type: ${ext || filePart.type || 'unknown'}`,
    );
  }
  if (isVideo && key === 'gallery') throw fail('unsupported_media', 'Videos go in the videos slot.');
  if (isImage && key === 'videos') throw fail('unsupported_media', 'Images go in the hero or gallery slot.');

  const bytesIn = filePart.data.length;

  // Simulated encode. Real server: sharp -> webp q82 max 2000px, ffmpeg -> H.264 <=10MB.
  const encodeMs = isVideo
    ? Math.min(60000, Math.max(4000, Math.round((bytesIn / (1024 * 1024)) * 150)))
    : 500;
  await sleep(encodeMs);

  const stem = path.basename(original, ext) || 'asset';
  const outExt = isVideo ? '.mp4' : '.webp';
  let name = `${stem}${outExt}`;
  let n = 1;
  while (fs.existsSync(path.join(dir, name))) {
    n += 1;
    name = `${stem}-${n}${outExt}`;
  }
  // Bytes pass through unchanged; only the reported size pretends to be encoded.
  fs.writeFileSync(path.join(dir, name), filePart.data);
  const bytesOut = Math.max(1, Math.round(bytesIn * (isVideo ? 0.18 : 0.42)));

  if (key === 'hero') {
    doc.data.hero = name;
  } else {
    doc.data[key] = (Array.isArray(doc.data[key]) ? doc.data[key] : []).concat(name);
  }
  writeDoc(abs, doc);

  sendJson(res, 200, { ok: true, name, kind: isVideo ? 'video' : 'image', bytesIn, bytesOut, path: p });
}

async function handleAssetDelete(req, res) {
  const { path: p, name } = await readJsonBody(req);
  const { file, key } = splitPath(p);
  const abs = resolveContent(file);
  const doc = readDoc(abs);
  if (key === 'hero') {
    delete doc.data.hero;
    writeDoc(abs, doc);
    sendJson(res, 200, { ok: true, path: p, items: [] });
    return;
  }
  const list = Array.isArray(doc.data[key]) ? doc.data[key] : [];
  if (!list.includes(name)) throw fail('not_found', `${name} is not in #${key}.`);
  const items = list.filter((x) => x !== name); // frontmatter only; file stays on disk
  doc.data[key] = items;
  writeDoc(abs, doc);
  sendJson(res, 200, { ok: true, path: p, items });
}

async function handleProjectCreate(req, res) {
  const { title } = await readJsonBody(req);
  if (typeof title !== 'string' || !title.trim()) throw fail('bad_path', 'title is required.');
  const slug = slugify(title);
  const dir = resolveContent(path.posix.join('projects', slug));
  if (fs.existsSync(dir)) throw fail('bad_path', `${slug} already exists.`);
  fs.mkdirSync(dir, { recursive: true });
  const order = projectDirs().length + 1;
  writeDoc(path.join(dir, 'index.md'), {
    data: { title: title.trim(), blurb: '', date: '', tags: [], order, draft: true, gallery: [], videos: [] },
    body: '[TODO — Paul] write this one up.\n',
  });
  sendJson(res, 200, { ok: true, slug });
}

async function handleProjectDelete(req, res) {
  const { slug } = await readJsonBody(req);
  if (typeof slug !== 'string' || !slug.trim()) throw fail('bad_path', 'slug is required.');
  const dir = resolveContent(path.posix.join('projects', slug));
  if (!fs.existsSync(dir)) throw fail('not_found', `No project ${slug}.`);
  const rel = path.posix.join('.trash', `${slug}-${Date.now()}`);
  const dest = resolveContent(rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(dir, dest);
  sendJson(res, 200, { ok: true, slug, trashed: `content/${rel}` });
}

async function handleReorder(req, res) {
  const { slugs } = await readJsonBody(req);
  if (!Array.isArray(slugs) || !slugs.length) throw fail('bad_path', 'slugs[] is required.');
  const orders = {};
  slugs.forEach((slug, i) => {
    const abs = resolveContent(path.posix.join('projects', slug, 'index.md'));
    if (!fs.existsSync(abs)) throw fail('not_found', `No project ${slug}.`);
    const doc = readDoc(abs);
    doc.data.order = i + 1;
    writeDoc(abs, doc);
    orders[slug] = i + 1;
  });
  sendJson(res, 200, { ok: true, orders });
}

function harnessState(res) {
  const home = JSON.parse(fs.readFileSync(path.join(CONTENT_ROOT, 'site', 'home.json'), 'utf8'));
  const url = (slug, name) => `/__harness/file/projects/${slug}/${encodeURIComponent(name)}`;
  const projects = projectDirs()
    .map((slug) => {
      const { data, body } = readDoc(path.join(CONTENT_ROOT, 'projects', slug, 'index.md'));
      return {
        slug,
        data,
        body,
        heroUrl: data.hero ? url(slug, data.hero) : null,
        gallery: (data.gallery || []).map((name) => ({ name, src: url(slug, name) })),
        videos: (data.videos || []).map((name) => ({ name, src: url(slug, name) })),
      };
    })
    .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
  sendJson(res, 200, { ok: true, contentRoot: CONTENT_ROOT, home, projects });
}

function harnessFile(res, rel) {
  let abs;
  try {
    abs = resolveContent(decodeURIComponent(rel));
  } catch (err) {
    sendError(res, err);
    return;
  }
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    sendError(res, fail('not_found', 'no such file'));
    return;
  }
  const buf = fs.readFileSync(abs);
  res.statusCode = 200;
  res.setHeader('content-type', sniffType(buf, path.extname(abs).toLowerCase()));
  res.setHeader('cache-control', 'no-store');
  res.end(buf);
}

// ---------------------------------------------------------------- the plugin

export function mockEditServer() {
  return {
    name: 'edit-harness-mock-server',
    apply: 'serve',
    configureServer(server) {
      seed();
      server.config.logger.info(`  edit harness fixture: ${CONTENT_ROOT}`);

      server.middlewares.use(async (req, res, next) => {
        const url = (req.originalUrl || req.url || '').split('?')[0];
        // The real server accepts base-prefixed URLs too; clients send bare.
        const route = url.replace(/^\/ProjectSite/, '');
        if (!route.startsWith('/__edit') && !route.startsWith('/__harness')) {
          next();
          return;
        }

        const peer = req.socket?.remoteAddress || '';
        if (!LOOPBACK.has(peer)) {
          sendError(res, fail('not_loopback', `Refusing non-loopback peer ${peer}.`));
          return;
        }

        try {
          const m = req.method;
          if (route === '/__harness/state' && m === 'GET') return harnessState(res);
          if (route.startsWith('/__harness/file/') && m === 'GET')
            return harnessFile(res, route.slice('/__harness/file/'.length));
          if (route === '/__harness/reset' && m === 'POST') {
            seed();
            return sendJson(res, 200, { ok: true });
          }

          if (route === '/__edit/ping' && m === 'GET')
            return sendJson(res, 200, { ok: true, contentRoot: 'content/', ffmpeg: true, sharp: true });
          if (route === '/__edit/text' && m === 'POST') return await handleText(req, res);
          if (route === '/__edit/asset' && m === 'POST') return await handleAssetUpload(req, res);
          if (route === '/__edit/asset' && m === 'DELETE') return await handleAssetDelete(req, res);
          if (route === '/__edit/project' && m === 'POST') return await handleProjectCreate(req, res);
          if (route === '/__edit/project' && m === 'DELETE') return await handleProjectDelete(req, res);
          if (route === '/__edit/reorder' && m === 'POST') return await handleReorder(req, res);

          return sendError(res, fail('not_found', `No route ${m} ${route}`));
        } catch (err) {
          return sendError(res, err);
        }
      });
    },
  };
}
