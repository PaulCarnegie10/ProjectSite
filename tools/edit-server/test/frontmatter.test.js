import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import * as fm from '../lib/frontmatter.js';
import { FIXTURES, changedLines } from './helpers.js';

const BEE = path.join(FIXTURES, 'projects/bee-tracker/index.md');
const ARM = path.join(FIXTURES, 'projects/robot-arm/index.md');
const beeRaw = () => fs.readFileSync(BEE, 'utf8');

test('parse -> serialize with no edit is byte-identical', () => {
  for (const file of [BEE, ARM]) {
    const raw = fs.readFileSync(file, 'utf8');
    const out = fm.serialize(fm.parseDocument(raw));
    assert.equal(out, raw, `${path.basename(path.dirname(file))} must round-trip byte-for-byte`);
    assert.equal(
      Buffer.compare(Buffer.from(out, 'utf8'), fs.readFileSync(file)),
      0,
      'byte comparison must match too',
    );
  }
});

test('round-trip survives comments, block arrays, links and odd spacing', () => {
  const raw = beeRaw();
  const doc = fm.parseDocument(raw);
  assert.ok(raw.includes('# regression fixture'), 'fixture must contain comments');
  assert.ok(raw.includes('\n  -   embedded'), 'fixture must contain an oddly spaced block item');
  assert.ok(raw.includes('links:\n  - { label:'), 'fixture must contain the links inline-object array');
  assert.deepEqual(fm.keys(doc), [
    'title', 'blurb', 'date', 'tags', 'order', 'draft', 'hero', 'gallery', 'videos', 'links',
  ]);
  assert.equal(fm.serialize(doc), raw);
});

test('round-trip preserves CRLF and a missing trailing newline', () => {
  const crlf = beeRaw().replace(/\n/g, '\r\n').replace(/\r\n$/, '');
  assert.equal(fm.serialize(fm.parseDocument(crlf)), crlf);
});

test('values decode with the right JS types', () => {
  const doc = fm.parseDocument(beeRaw());
  assert.equal(fm.getValue(doc, 'title'), 'Bee Tracker');
  assert.equal(fm.getValue(doc, 'blurb'), 'Computer vision for hive traffic');
  assert.equal(fm.getValue(doc, 'order'), 2);
  assert.equal(fm.getValue(doc, 'draft'), false);
  assert.deepEqual(fm.getValue(doc, 'tags'), ['computer-vision', 'robotics', 'embedded']);
  assert.deepEqual(fm.getValue(doc, 'gallery'), ['wide.png', 'closeup.png']);
  assert.deepEqual(fm.getValue(doc, 'links'), [
    { label: 'GitHub', url: 'https://github.com/example/bee-tracker' },
    { label: 'Poster', url: './poster.pdf' },
  ]);
});

test('a single-key edit changes exactly one line and nothing else', () => {
  const raw = beeRaw();
  const doc = fm.parseDocument(raw);
  fm.setValue(doc, 'title', 'Hive Cam');
  const out = fm.serialize(doc);

  const diff = changedLines(raw, out);
  assert.equal(diff.length, 1, `expected 1 changed line, got ${JSON.stringify(diff)}`);
  assert.equal(diff[0].before, 'title: "Bee Tracker"');
  assert.equal(diff[0].after, 'title: "Hive Cam"');
  // Everything except that line's value span is byte-identical.
  const at = raw.indexOf('title: "Bee Tracker"');
  assert.equal(out.slice(0, at), raw.slice(0, at));
  assert.equal(out.slice(at + 'title: "Hive Cam"'.length), raw.slice(at + 'title: "Bee Tracker"'.length));
});

test('a trailing comment on the edited line survives', () => {
  const doc = fm.parseDocument(beeRaw());
  fm.setValue(doc, 'order', 9);
  const line = fm.serialize(doc).split('\n').find((l) => l.startsWith('order:'));
  assert.equal(line, 'order: 9                   # ascending sort on the Projects grid');
});

test('quote style is preserved per key', () => {
  const doc = fm.parseDocument(beeRaw());
  fm.setValue(doc, 'title', 'Quoted');       // was double-quoted
  fm.setValue(doc, 'blurb', 'Plain value');  // was unquoted
  const out = fm.serialize(doc);
  assert.match(out, /^title: "Quoted"$/m);
  assert.match(out, /^blurb: Plain value {5}# shows on the card$/m);

  const arm = fm.parseDocument(fs.readFileSync(ARM, 'utf8'));
  fm.setValue(arm, 'blurb', "it's single-quoted"); // was single-quoted
  assert.match(fm.serialize(arm), /^blurb: 'it''s single-quoted'$/m);
});

test('a string that would re-parse as another type gets quoted', () => {
  const doc = fm.parseDocument(beeRaw());
  fm.setValue(doc, 'blurb', 'true');
  assert.match(fm.serialize(doc), /^blurb: "true" {5}# shows on the card$/m);
});

test('a numeric key stays unquoted when the client sends it back as a string', () => {
  const doc = fm.parseDocument(beeRaw());
  fm.setValue(doc, 'order', '4');
  assert.match(fm.serialize(doc), /^order: 4 {19}# ascending sort on the Projects grid$/m);
});

test('editing the body leaves the frontmatter byte-identical', () => {
  const raw = beeRaw();
  const doc = fm.parseDocument(raw);
  fm.setBody(doc, '# New\n\nRewritten body.\n');
  const out = fm.serialize(doc);

  const cut = raw.indexOf('\n---\n', 4) + '\n---\n'.length;
  assert.equal(out.slice(0, cut), raw.slice(0, cut), 'frontmatter region must not move or change');
  assert.equal(fm.getBody(fm.parseDocument(out)), '# New\n\nRewritten body.\n');
  assert.deepEqual(fm.getValue(fm.parseDocument(out), 'tags'), ['computer-vision', 'robotics', 'embedded']);
});

test('editing frontmatter leaves the body byte-identical', () => {
  const raw = beeRaw();
  const doc = fm.parseDocument(raw);
  const bodyBefore = fm.getBody(doc);
  fm.setValue(doc, 'hero', 'new.webp');
  const after = fm.parseDocument(fm.serialize(doc));
  assert.equal(fm.getBody(after), bodyBefore);
  assert.ok(bodyBefore.includes('```python'), 'body fixture must contain a code fence');
});

test('inline arrays stay inline and keep their quote and separator style', () => {
  const doc = fm.parseDocument(beeRaw());
  fm.setArray(doc, 'gallery', ['wide.png', 'closeup.png', 'new.webp']);
  const out = fm.serialize(doc);
  assert.match(out, /^gallery: \["wide\.png", "closeup\.png", "new\.webp"\]$/m);
  assert.equal(changedLines(beeRaw(), out).length, 1);
});

test('block arrays stay block: appends add a line in the file\'s own style', () => {
  const raw = beeRaw();
  const doc = fm.parseDocument(raw);
  fm.setArray(doc, 'tags', ['computer-vision', 'robotics', 'embedded', 'jetson']);
  const out = fm.serialize(doc);
  assert.ok(out.includes('\n  - computer-vision\n'), 'existing items untouched');
  assert.ok(out.includes('\n  - jetson\n'), 'new item uses the same dash + indent');
  assert.ok(!out.includes('tags: ['), 'must not collapse a block array into inline form');
  assert.equal(out.split('\n').length, raw.split('\n').length + 1);
});

test('block arrays shrink by deleting item lines', () => {
  const doc = fm.parseDocument(beeRaw());
  fm.setArray(doc, 'tags', ['robotics']);
  const out = fm.serialize(doc);
  assert.ok(out.includes('\n  - robotics\n'));
  assert.ok(!out.includes('computer-vision'));
  assert.ok(!out.includes('embedded'));
  assert.ok(out.includes('# tags use the block form on purpose'), 'the comment above must survive');
});

test('an absent key is appended without disturbing existing lines', () => {
  const raw = beeRaw();
  const doc = fm.parseDocument(raw);
  fm.setValue(doc, 'subtitle', 'Season two');
  const out = fm.serialize(doc);
  assert.match(out, /^subtitle: Season two$/m);
  const cut = raw.indexOf('links:');
  assert.equal(out.slice(0, cut), raw.slice(0, cut));
  assert.equal(fm.getBody(fm.parseDocument(out)), fm.getBody(fm.parseDocument(raw)));
});

test('a document without frontmatter is left alone', () => {
  const raw = '# Just markdown\n\nNo frontmatter here.\n';
  const doc = fm.parseDocument(raw);
  assert.equal(doc.hasFrontmatter, false);
  assert.equal(fm.serialize(doc), raw);
  assert.throws(() => fm.setValue(doc, 'title', 'x'), (e) => e.code === 'not_found');
});

test('unterminated frontmatter is not treated as frontmatter', () => {
  const raw = '---\ntitle: x\n\nno closing delimiter\n';
  const doc = fm.parseDocument(raw);
  assert.equal(doc.hasFrontmatter, false);
  assert.equal(fm.serialize(doc), raw);
});
