import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import { makeContentRoot, cleanup, startServer, api, read, changedLines } from './helpers.js';
import { loadSharp } from '../lib/image.js';
import { TODO_MARKER } from '../lib/handlers.js';

/** Fresh temp content root + server per test body. */
async function withServer(fn) {
  const root = makeContentRoot();
  const server = await startServer(root);
  try {
    await fn(server, root);
  } finally {
    await server.close();
    cleanup(root);
  }
}

/* -------------------------------------------------------------------- ping */

test('GET /__edit/ping reports the content root and codec availability', async () => {
  await withServer(async ({ origin }, root) => {
    const { status, body, contentType } = await api(origin, 'GET', '/__edit/ping');
    assert.equal(status, 200);
    assert.match(contentType, /application\/json/);
    assert.equal(body.ok, true);
    assert.equal(path.resolve(body.contentRoot), path.resolve(root));
    assert.equal(typeof body.ffmpeg, 'boolean');
    assert.equal(typeof body.sharp, 'boolean');
  });
});

test('base-prefixed and bare URLs both route', async () => {
  await withServer(async ({ origin }) => {
    assert.equal((await api(origin, 'GET', '/__edit/ping')).body.ok, true);
    assert.equal((await api(origin, 'GET', '/ProjectSite/__edit/ping')).body.ok, true);
    assert.equal((await api(origin, 'GET', '/__edit/ping?t=1')).body.ok, true);
  });
});

test('unknown routes and wrong methods return not_found', async () => {
  await withServer(async ({ origin }) => {
    const a = await api(origin, 'GET', '/__edit/nope');
    assert.equal(a.status, 404);
    assert.equal(a.body.error, 'not_found');
    const b = await api(origin, 'GET', '/__edit/text');
    assert.equal(b.status, 404);
    assert.equal(b.body.error, 'not_found');
  });
});

test('non-edit URLs fall through to the next middleware', async () => {
  await withServer(async ({ origin }) => {
    const res = await fetch(`${origin}/index.html`);
    assert.equal(res.status, 404);
    assert.equal(await res.text(), 'not an edit route');
  });
});

/* -------------------------------------------------------------------- text */

test('POST /__edit/text edits a frontmatter key on disk', async () => {
  await withServer(async ({ origin }, root) => {
    const rel = 'projects/bee-tracker/index.md';
    const before = read(root, rel);
    const { status, body } = await api(origin, 'POST', '/__edit/text', {
      path: `${rel}#title`,
      value: 'Hive Cam',
    });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.value, 'Hive Cam');

    const after = read(root, rel);
    const diff = changedLines(before, after);
    assert.equal(diff.length, 1);
    assert.equal(diff[0].after, 'title: "Hive Cam"');
  });
});

test('POST /__edit/text with #body replaces only the body', async () => {
  await withServer(async ({ origin }, root) => {
    const rel = 'projects/bee-tracker/index.md';
    const before = read(root, rel);
    const cut = before.indexOf('\n---\n', 4) + '\n---\n'.length;
    const { status } = await api(origin, 'POST', '/__edit/text', {
      path: `${rel}#body`,
      value: '# Rewritten\n\nAll new prose.\n',
    });
    assert.equal(status, 200);
    const after = read(root, rel);
    assert.equal(after.slice(0, cut), before.slice(0, cut), 'frontmatter must be byte-identical');
    assert.equal(after.slice(cut), '# Rewritten\n\nAll new prose.\n');
  });
});

test('POST /__edit/text sets a JSON dot key', async () => {
  await withServer(async ({ origin }, root) => {
    const before = read(root, 'site/skills.json');
    const { status } = await api(origin, 'POST', '/__edit/text', {
      path: 'site/skills.json#categories.0.name',
      value: 'Perception & CV',
    });
    assert.equal(status, 200);
    const after = read(root, 'site/skills.json');
    assert.equal(JSON.parse(after).categories[0].name, 'Perception & CV');
    assert.equal(changedLines(before, after).length, 1);
  });
});

test('POST /__edit/text rejects traversal and leaves the target untouched', async () => {
  await withServer(async ({ origin }, root) => {
    const outside = path.resolve(root, '..', 'package.json');
    fs.writeFileSync(outside, '{"canary":true}\n');
    try {
      for (const hostile of ['../../package.json#x', '..\\..\\x#y', 'C:\\Windows\\x#y', '%2e%2e%2fx#y']) {
        const { status, body } = await api(origin, 'POST', '/__edit/text', { path: hostile, value: 'pwned' });
        assert.equal(status, 400, `${hostile} must be 400`);
        assert.equal(body.ok, false);
        assert.equal(body.error, 'bad_path');
        assert.equal(typeof body.message, 'string');
      }
      assert.equal(fs.readFileSync(outside, 'utf8'), '{"canary":true}\n', 'canary must be unmodified');
    } finally {
      fs.rmSync(outside, { force: true });
    }
  });
});

test('POST /__edit/text on a missing file is not_found', async () => {
  await withServer(async ({ origin }) => {
    const { status, body } = await api(origin, 'POST', '/__edit/text', {
      path: 'projects/ghost/index.md#title',
      value: 'x',
    });
    assert.equal(status, 404);
    assert.equal(body.error, 'not_found');
  });
});

test('an oversized JSON body is rejected as too_large', async () => {
  await withServer(async ({ origin }) => {
    const { status, body } = await api(origin, 'POST', '/__edit/text', {
      path: 'site/home.json#intro',
      value: 'x'.repeat(1024 * 1024 + 64),
    });
    assert.equal(status, 413);
    assert.equal(body.error, 'too_large');
  });
});

/* ----------------------------------------------------------------- project */

test('POST /__edit/project scaffolds a project with every §1.1 key', async () => {
  await withServer(async ({ origin }, root) => {
    const { status, body } = await api(origin, 'POST', '/__edit/project', { title: 'Sensor Fusion Rig!' });
    assert.equal(status, 200);
    assert.equal(body.slug, 'sensor-fusion-rig');

    const raw = read(root, 'projects/sensor-fusion-rig/index.md');
    for (const key of ['title', 'blurb', 'date', 'tags', 'order', 'draft', 'hero', 'gallery', 'videos', 'links']) {
      assert.match(raw, new RegExp(`^${key}:`, 'm'), `scaffold must contain ${key}`);
    }
    assert.match(raw, /^order: 3$/m, 'order must be max existing (2) + 1');
    assert.match(raw, /^draft: true$/m, 'new projects start as drafts (owner clears the flag)');
    assert.match(raw, /^tags: \[\]$/m);
    assert.ok(raw.includes(TODO_MARKER), 'body must carry the TODO marker');

    // The em dash must be a real UTF-8 U+2014 (E2 80 94), not an escape.
    const bytes = fs.readFileSync(path.join(root, 'projects/sensor-fusion-rig/index.md'));
    assert.ok(bytes.includes(Buffer.from([0xe2, 0x80, 0x94])), 'em dash must be UTF-8 encoded');
    assert.ok(!raw.includes('\\u2014'), 'em dash must not be a literal escape');
  });
});

test('POST /__edit/project refuses to clobber an existing folder', async () => {
  await withServer(async ({ origin }) => {
    const { status, body } = await api(origin, 'POST', '/__edit/project', { title: 'Bee Tracker' });
    assert.equal(status, 400);
    assert.equal(body.error, 'bad_path');
    assert.match(body.message, /already exists/);
  });
});

test('DELETE /__edit/project moves the folder to content/.trash', async () => {
  await withServer(async ({ origin }, root) => {
    const { status, body } = await api(origin, 'DELETE', '/__edit/project', { slug: 'robot-arm' });
    assert.equal(status, 200);
    assert.equal(body.slug, 'robot-arm');
    assert.match(body.trashed, /^\.trash\/robot-arm-\d+$/);

    assert.equal(fs.existsSync(path.join(root, 'projects/robot-arm')), false, 'original folder is gone');
    const moved = path.join(root, body.trashed.replace('/', path.sep));
    assert.ok(fs.existsSync(path.join(moved, 'index.md')), 'content survives in .trash');
    assert.match(fs.readFileSync(path.join(moved, 'index.md'), 'utf8'), /^title: Robot Arm$/m);
  });
});

test('DELETE /__edit/project rejects a traversal slug', async () => {
  await withServer(async ({ origin }, root) => {
    for (const slug of ['../..', 'a/b', '..\\..', 'NUL']) {
      const { status, body } = await api(origin, 'DELETE', '/__edit/project', { slug });
      assert.equal(status, 400, `${slug} must be 400`);
      assert.equal(body.error, 'bad_path');
    }
    assert.ok(fs.existsSync(path.join(root, 'projects/bee-tracker')));
  });
});

/* ----------------------------------------------------------------- reorder */

test('POST /__edit/reorder rewrites only the order lines', async () => {
  await withServer(async ({ origin }, root) => {
    const beeBefore = read(root, 'projects/bee-tracker/index.md');
    const armBefore = read(root, 'projects/robot-arm/index.md');

    const { status, body } = await api(origin, 'POST', '/__edit/reorder', {
      slugs: ['bee-tracker', 'robot-arm'],
    });
    assert.equal(status, 200);
    assert.deepEqual(body.orders, { 'bee-tracker': 1, 'robot-arm': 2 });

    const beeDiff = changedLines(beeBefore, read(root, 'projects/bee-tracker/index.md'));
    assert.equal(beeDiff.length, 1, JSON.stringify(beeDiff));
    assert.match(beeDiff[0].before, /^order: 2\b/);
    assert.match(beeDiff[0].after, /^order: 1\b/);
    assert.ok(beeDiff[0].after.includes('# ascending sort'), 'trailing comment survives');

    const armDiff = changedLines(armBefore, read(root, 'projects/robot-arm/index.md'));
    assert.equal(armDiff.length, 1, JSON.stringify(armDiff));
    assert.equal(armDiff[0].after, 'order: 2');
  });
});

test('reorder validates the whole list before writing anything', async () => {
  await withServer(async ({ origin }, root) => {
    const before = read(root, 'projects/bee-tracker/index.md');
    const { status, body } = await api(origin, 'POST', '/__edit/reorder', {
      slugs: ['bee-tracker', 'does-not-exist'],
    });
    assert.equal(status, 404);
    assert.equal(body.error, 'not_found');
    assert.equal(read(root, 'projects/bee-tracker/index.md'), before, 'no partial write');
  });
});

// S9: a subset renumbers 1..k and collides with the untouched projects.
test('reorder rejects a partial (subset) slug list', async () => {
  await withServer(async ({ origin }, root) => {
    const before = read(root, 'projects/bee-tracker/index.md');
    const { status, body } = await api(origin, 'POST', '/__edit/reorder', {
      slugs: ['bee-tracker'], // robot-arm is also non-draft and is missing
    });
    assert.equal(status, 400);
    assert.equal(body.error, 'bad_path');
    assert.match(body.message, /all 2 non-draft projects/);
    assert.equal(read(root, 'projects/bee-tracker/index.md'), before, 'no write on rejection');
  });
});

test('reorder rejects a duplicated slug', async () => {
  await withServer(async ({ origin }) => {
    const { status, body } = await api(origin, 'POST', '/__edit/reorder', {
      slugs: ['bee-tracker', 'bee-tracker'],
    });
    assert.equal(status, 400);
    assert.equal(body.error, 'bad_path');
  });
});

test('reorder accepts the full non-draft set once a project is drafted out', async () => {
  await withServer(async ({ origin }) => {
    // Draft robot-arm; the non-draft set becomes just bee-tracker.
    await api(origin, 'POST', '/__edit/text', {
      path: 'projects/robot-arm/index.md#draft',
      value: true,
    });
    const { status, body } = await api(origin, 'POST', '/__edit/reorder', { slugs: ['bee-tracker'] });
    assert.equal(status, 200, JSON.stringify(body));
    assert.deepEqual(body.orders, { 'bee-tracker': 1 });
  });
});

/* ---------------------------------------------------------------- CSRF gate */

// B1: the loopback peer is the owner's own browser, so a page he visits could
// fire a no-preflight simple-request POST. The required custom header forces a
// preflight the dev server won't grant, so such a request never arrives.
test('a request WITHOUT the x-edit-dev header is rejected', async () => {
  await withServer(async ({ origin }, root) => {
    const before = read(root, 'projects/bee-tracker/index.md');
    const { status, body } = await api(
      origin, 'POST', '/__edit/text',
      { path: 'projects/bee-tracker/index.md#title', value: 'CSRF' },
      { noDevHeader: true },
    );
    assert.equal(status, 403);
    assert.equal(body.error, 'not_loopback');
    assert.equal(read(root, 'projects/bee-tracker/index.md'), before, 'no write without the header');
  });
});

test('GET ping without the x-edit-dev header is rejected', async () => {
  await withServer(async ({ origin }) => {
    const { status, body } = await api(origin, 'GET', '/__edit/ping', undefined, { noDevHeader: true });
    assert.equal(status, 403);
    assert.equal(body.error, 'not_loopback');
  });
});

test('the same request WITH the x-edit-dev header succeeds', async () => {
  await withServer(async ({ origin }) => {
    const { status, body } = await api(origin, 'POST', '/__edit/text', {
      path: 'projects/bee-tracker/index.md#title',
      value: 'Allowed',
    });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.value, 'Allowed');
  });
});

/* ------------------------------------------------------------------- asset */

test('DELETE /__edit/asset removes the frontmatter entry but keeps the file', async () => {
  await withServer(async ({ origin }, root) => {
    const dir = path.join(root, 'projects/bee-tracker');
    fs.writeFileSync(path.join(dir, 'wide.png'), 'not really a png');

    const { status, body } = await api(origin, 'DELETE', '/__edit/asset', {
      path: 'projects/bee-tracker/index.md#gallery',
      name: 'wide.png',
    });
    assert.equal(status, 200);
    assert.deepEqual(body.items, ['closeup.png']);
    assert.match(read(root, 'projects/bee-tracker/index.md'), /^gallery: \["closeup\.png"\]$/m);
    assert.ok(fs.existsSync(path.join(dir, 'wide.png')), 'the file on disk must stay');
  });
});

test('DELETE /__edit/asset reports not_found for an unlisted name', async () => {
  await withServer(async ({ origin }) => {
    const { status, body } = await api(origin, 'DELETE', '/__edit/asset', {
      path: 'projects/bee-tracker/index.md#gallery',
      name: 'never-added.png',
    });
    assert.equal(status, 404);
    assert.equal(body.error, 'not_found');
  });
});

test('POST /__edit/asset rejects a PDF as unsupported_media', async () => {
  await withServer(async ({ origin }) => {
    const form = new FormData();
    form.append('path', 'projects/bee-tracker/index.md#gallery');
    form.append('file', new Blob([Buffer.from('%PDF-1.4 fake')], { type: 'application/pdf' }), 'poster.pdf');
    const { status, body } = await api(origin, 'POST', '/__edit/asset', form);
    assert.equal(status, 415);
    assert.equal(body.error, 'unsupported_media');
  });
});

test('POST /__edit/asset rejects a traversal path before touching disk', async () => {
  await withServer(async ({ origin }) => {
    const form = new FormData();
    form.append('path', '../../package.json#gallery');
    form.append('file', new Blob([Buffer.from('x')], { type: 'image/png' }), 'shot.png');
    const { status, body } = await api(origin, 'POST', '/__edit/asset', form);
    assert.equal(status, 400);
    assert.equal(body.error, 'bad_path');
  });
});

test('POST /__edit/asset converts an image to webp and updates frontmatter', async (t) => {
  const sharp = await loadSharp();
  if (!sharp) return t.skip('sharp is not installed');

  await withServer(async ({ origin }, root) => {
    // 2400px so the 2000px cap has something to do.
    const png = await sharp({
      create: { width: 2400, height: 1200, channels: 3, background: { r: 30, g: 90, b: 160 } },
    }).png().toBuffer();

    const form = new FormData();
    form.append('path', 'projects/bee-tracker/index.md#gallery');
    form.append('file', new Blob([png], { type: 'image/png' }), 'My Wide Shot.PNG');
    const { status, body } = await api(origin, 'POST', '/__edit/asset', form);

    assert.equal(status, 200);
    assert.equal(body.kind, 'image');
    assert.equal(body.name, 'my-wide-shot.webp', 'name is sanitized and re-extensioned');
    assert.equal(body.bytesIn, png.length);
    assert.ok(body.bytesOut > 0);

    const written = path.join(root, 'projects/bee-tracker', body.name);
    assert.ok(fs.existsSync(written));
    // Read into a buffer: handing sharp the path keeps the file open on
    // Windows and the temp-root cleanup then fails with EBUSY.
    const meta = await sharp(fs.readFileSync(written)).metadata();
    assert.equal(meta.format, 'webp');
    assert.equal(meta.width, 2000, 'max dimension is clamped to 2000');
    assert.equal(meta.height, 1000, 'aspect ratio preserved');

    assert.match(read(root, 'projects/bee-tracker/index.md'),
      /^gallery: \["wide\.png", "closeup\.png", "my-wide-shot\.webp"\]$/m);
  });
});

test('a small image is never upscaled', async (t) => {
  const sharp = await loadSharp();
  if (!sharp) return t.skip('sharp is not installed');

  await withServer(async ({ origin }, root) => {
    const png = await sharp({
      create: { width: 64, height: 48, channels: 3, background: { r: 0, g: 0, b: 0 } },
    }).png().toBuffer();
    const form = new FormData();
    form.append('path', 'projects/bee-tracker/index.md#hero');
    form.append('file', new Blob([png], { type: 'image/png' }), 'cover.png');
    const { status, body } = await api(origin, 'POST', '/__edit/asset', form);
    assert.equal(status, 200);

    const meta = await sharp(fs.readFileSync(path.join(root, 'projects/bee-tracker', body.name))).metadata();
    assert.equal(meta.width, 64);
    assert.equal(meta.height, 48);
    assert.match(read(root, 'projects/bee-tracker/index.md'), /^hero: "cover\.webp"$/m);
  });
});

test('a colliding upload name gets a -2 suffix', async (t) => {
  const sharp = await loadSharp();
  if (!sharp) return t.skip('sharp is not installed');

  await withServer(async ({ origin }, root) => {
    fs.writeFileSync(path.join(root, 'projects/bee-tracker/cover.webp'), 'taken');
    const png = await sharp({
      create: { width: 20, height: 20, channels: 3, background: { r: 1, g: 2, b: 3 } },
    }).png().toBuffer();
    const form = new FormData();
    form.append('path', 'projects/bee-tracker/index.md#gallery');
    form.append('file', new Blob([png], { type: 'image/png' }), 'cover.png');
    const { body } = await api(origin, 'POST', '/__edit/asset', form);
    assert.equal(body.name, 'cover-2.webp');
    assert.equal(fs.readFileSync(path.join(root, 'projects/bee-tracker/cover.webp'), 'utf8'), 'taken');
  });
});
