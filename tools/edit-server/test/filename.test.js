import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { sanitizeName, classifyUpload, uniqueName, slugify } from '../lib/filename.js';

test('sanitizeName reduces anything to [a-z0-9._-]', () => {
  const cases = [
    ['My Photo (1).PNG', 'my-photo-1-.png'],
    ['../../etc/passwd', 'passwd'],
    ['C:\\Users\\Paul\\shot.jpg', 'shot.jpg'],
    ['..\\..\\evil.png', 'evil.png'],
    ['  spaced name .webp', 'spaced-name-.webp'],
    ['ünïcodé.png', 'unicode.png'],
    ['....', 'file'],
    ['', 'file'],
  ];
  for (const [input, expected] of cases) {
    assert.equal(sanitizeName(input), expected, `sanitizeName(${JSON.stringify(input)})`);
  }
});

test('sanitized names always match the documented alphabet and length', () => {
  for (const input of ['A'.repeat(400) + '.png', 'a b;c|d*e?.jpg', '%00.png', 'a\u0000b.png']) {
    const out = sanitizeName(input);
    assert.match(out, /^[a-z0-9._-]{1,64}$/, `${JSON.stringify(input)} -> ${JSON.stringify(out)}`);
  }
});

test('extension whitelist classifies images and videos', () => {
  for (const ext of ['.png', '.jpg', '.jpeg', '.webp', '.gif']) {
    assert.equal(classifyUpload(`shot${ext}`).kind, 'image');
  }
  for (const ext of ['.mp4', '.mov', '.webm', '.m4v']) {
    assert.equal(classifyUpload(`clip${ext}`).kind, 'video');
  }
});

test('pdf and everything else are unsupported_media', () => {
  for (const name of ['poster.pdf', 'notes.txt', 'payload.exe', 'archive.zip', 'script.js', 'noext']) {
    assert.throws(
      () => classifyUpload(name),
      (e) => e.code === 'unsupported_media' && e.status === 415,
      `${name} must be rejected`,
    );
  }
});

test('a double extension is judged by the last one', () => {
  assert.throws(() => classifyUpload('shot.png.exe'), (e) => e.code === 'unsupported_media');
  assert.equal(classifyUpload('shot.exe.png').kind, 'image');
});

test('uniqueName adds -2, -3 on collision', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'edit-name-'));
  try {
    assert.equal(uniqueName(dir, 'cover', '.webp'), 'cover.webp');
    fs.writeFileSync(path.join(dir, 'cover.webp'), '');
    assert.equal(uniqueName(dir, 'cover', '.webp'), 'cover-2.webp');
    fs.writeFileSync(path.join(dir, 'cover-2.webp'), '');
    assert.equal(uniqueName(dir, 'cover', '.webp'), 'cover-3.webp');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// S4: a long stem must never cost the extension its last character, or the
// recorded name (".web") would never match the ".webp" file on disk.
test('uniqueName trims the stem, never the extension', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'edit-name-'));
  try {
    const stem = 'a'.repeat(60); // 60 + ".webp"(5) = 65 > 64 cap
    const name = uniqueName(dir, stem, '.webp');
    assert.ok(name.endsWith('.webp'), `must keep the full extension, got ${name}`);
    assert.ok(name.length <= 64, `must fit the 64-char cap, got ${name.length}`);
    assert.equal(name, `${'a'.repeat(59)}.webp`);

    // And the collision path also preserves the extension.
    fs.writeFileSync(path.join(dir, name), '');
    const bumped = uniqueName(dir, stem, '.webp');
    assert.ok(bumped.endsWith('.webp'));
    assert.ok(bumped.length <= 64);
    assert.notEqual(bumped, name);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('slugify produces kebab-case slugs', () => {
  const cases = [
    ['Bee Tracker', 'bee-tracker'],
    ['  Robot Arm v2!  ', 'robot-arm-v2'],
    ['CMU 18-213', 'cmu-18-213'],
    ['Café Sensor', 'cafe-sensor'],
    ['a/b\\c', 'a-b-c'],
    ['...Hello...', 'hello'],
  ];
  for (const [input, expected] of cases) {
    assert.equal(slugify(input), expected, `slugify(${JSON.stringify(input)})`);
  }
});

test('a title with no usable characters is rejected', () => {
  assert.throws(() => slugify('!!!'), (e) => e.code === 'bad_path');
  assert.throws(() => slugify(''), (e) => e.code === 'bad_path');
});
