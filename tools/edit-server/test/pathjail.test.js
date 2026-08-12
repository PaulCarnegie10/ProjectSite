import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveInRoot, validateRelPath, splitContentPath } from '../lib/pathjail.js';

const ROOT = path.join(os.tmpdir(), 'edit-jail-root');

// Every entry here must be rejected with bad_path. This is the table the whole
// security story rests on, so it is intentionally long and intentionally
// includes shapes that only matter on one platform.
const HOSTILE = [
  ['../../package.json', 'parent traversal to a repo file'],
  ['..\\..\\x', 'backslash parent traversal'],
  ['C:\\Windows\\x', 'absolute drive path'],
  ['c:/windows/system32', 'lowercase drive path'],
  ['\\\\server\\share', 'UNC path'],
  ['\\\\?\\C:\\x', 'win32 device namespace'],
  ['%2e%2e%2f', 'percent-encoded ../'],
  ['%2e%2e%2fpackage.json', 'percent-encoded traversal to a file'],
  ['content/../../x', 'traversal hidden mid-path'],
  ['NUL', 'reserved device name'],
  ['projects/CON/index.md', 'reserved device name in a segment'],
  ['projects/com1.md', 'reserved device name with an extension'],
  ['/etc/passwd', 'absolute posix path'],
  ['\\windows\\x', 'leading backslash'],
  ['projects/x/index.md\u0000.png', 'embedded NUL byte'],
  ['projects/trailingdot.', 'trailing dot segment'],
  ['projects/trailing ', 'trailing space segment'],
  ['a//b', 'empty path segment'],
  ['projects/./index.md', 'dot segment'],
  ['index.md:stream', 'NTFS alternate data stream'],
  ['%', 'malformed percent-encoding'],
  ['', 'empty path'],
];

test('path jail rejects every hostile input', () => {
  for (const [input, why] of HOSTILE) {
    assert.throws(
      () => resolveInRoot(ROOT, input),
      (err) => err.code === 'bad_path' && err.status === 400,
      `expected bad_path for ${JSON.stringify(input)} (${why})`,
    );
  }
});

test('path jail accepts legitimate content paths', () => {
  const ok = [
    'site/home.json',
    'projects/bee-tracker/index.md',
    'projects/bee-tracker/cover.webp',
    'projects/a-b_c.1/index.md',
  ];
  for (const rel of ok) {
    const abs = resolveInRoot(ROOT, rel);
    assert.ok(
      abs === path.resolve(ROOT) || abs.startsWith(path.resolve(ROOT) + path.sep),
      `${rel} should resolve inside the root`,
    );
  }
});

test('resolved path is always inside the root, even for a sibling-prefix root', () => {
  // "…/edit-jail-root-evil" must not pass a naive startsWith(root) check.
  const root = path.resolve(ROOT);
  assert.throws(() => resolveInRoot(root, '../edit-jail-root-evil/x'), (e) => e.code === 'bad_path');
});

test('validateRelPath normalizes separators without widening what is allowed', () => {
  assert.equal(validateRelPath('projects\\bee-tracker\\index.md'), 'projects/bee-tracker/index.md');
  assert.equal(validateRelPath('site/home.json'), 'site/home.json');
});

test('double-encoded traversal survives as an inert filename, not an escape', () => {
  // One decode leaves the literal text "%2e%2e%2f", which is just a weird name.
  const abs = resolveInRoot(ROOT, '%252e%252e%252fx');
  assert.ok(abs.startsWith(path.resolve(ROOT) + path.sep));
});

test('splitContentPath splits on the first # only', () => {
  assert.deepEqual(splitContentPath('site/skills.json#categories.0.name'), {
    rel: 'site/skills.json',
    key: 'categories.0.name',
  });
  assert.deepEqual(splitContentPath('projects/x/index.md#body'), {
    rel: 'projects/x/index.md',
    key: 'body',
  });
  assert.deepEqual(splitContentPath('site/home.json'), { rel: 'site/home.json', key: '' });
});

test('a real traversal attempt cannot reach a file outside the root', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'edit-jail-'));
  const outside = path.join(path.dirname(root), 'outside-target.txt');
  fs.writeFileSync(outside, 'untouched');
  try {
    assert.throws(() => resolveInRoot(root, '../outside-target.txt'), (e) => e.code === 'bad_path');
    assert.equal(fs.readFileSync(outside, 'utf8'), 'untouched');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(outside, { force: true });
  }
});
