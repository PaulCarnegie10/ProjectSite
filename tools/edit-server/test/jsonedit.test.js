import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getJsonValue, setJsonValue } from '../lib/jsonedit.js';
import { FIXTURES, changedLines } from './helpers.js';

const home = () => fs.readFileSync(path.join(FIXTURES, 'site/home.json'), 'utf8');
const skills = () => fs.readFileSync(path.join(FIXTURES, 'site/skills.json'), 'utf8');

test('reads a top-level key', () => {
  assert.equal(getJsonValue(home(), 'heroTitle'), 'Paul Colombo');
});

test('reads a nested dot path through an array index', () => {
  assert.equal(getJsonValue(skills(), 'categories.0.name'), 'Perception');
  assert.equal(getJsonValue(skills(), 'categories.1.name'), 'Embedded');
  assert.equal(getJsonValue(skills(), 'categories.0.skills.1.name'), 'PyTorch');
  assert.equal(getJsonValue(skills(), 'categories.0.skills.1.level'), 75);
});

test('sets categories.0.name and changes only that line', () => {
  const before = skills();
  const after = setJsonValue(before, 'categories.0.name', 'Perception & CV');
  assert.equal(getJsonValue(after, 'categories.0.name'), 'Perception & CV');
  const diff = changedLines(before, after);
  assert.equal(diff.length, 1, `expected 1 changed line, got ${JSON.stringify(diff)}`);
  assert.match(diff[0].after, /"name": "Perception & CV"/);
  // Nothing else in the document moved.
  assert.equal(getJsonValue(after, 'categories.0.skills.0.name'), 'OpenCV');
  assert.equal(getJsonValue(after, 'categories.1.name'), 'Embedded');
});

test('sets a deeply nested numeric value', () => {
  const after = setJsonValue(skills(), 'categories.0.skills.1.level', 90);
  assert.equal(getJsonValue(after, 'categories.0.skills.1.level'), 90);
  assert.equal(changedLines(skills(), after).length, 1);
});

test('sets a top-level string and preserves the rest of the file', () => {
  const before = home();
  const after = setJsonValue(before, 'heroTitle', 'Paul C.');
  assert.equal(getJsonValue(after, 'heroTitle'), 'Paul C.');
  assert.equal(changedLines(before, after).length, 1);
  assert.equal(getJsonValue(after, 'socials.0.kind'), 'github');
});

test('sets a value inside an array of objects', () => {
  const after = setJsonValue(home(), 'socials.0.url', 'https://github.com/paul');
  assert.equal(getJsonValue(after, 'socials.0.url'), 'https://github.com/paul');
});

test('values needing JSON escaping are written safely', () => {
  const after = setJsonValue(home(), 'intro', 'He said "hi"\nand left \\ behind');
  assert.equal(getJsonValue(after, 'intro'), 'He said "hi"\nand left \\ behind');
  assert.doesNotThrow(() => JSON.parse(after));
});

test('the output always stays parseable JSON', () => {
  const after = setJsonValue(skills(), 'categories.1.skills.0.name', 'C++17');
  assert.doesNotThrow(() => JSON.parse(after));
  assert.equal(JSON.parse(after).categories[1].skills[0].name, 'C++17');
});

test('unknown keys and out-of-range indices report not_found', () => {
  assert.throws(() => setJsonValue(home(), 'nope', 1), (e) => e.code === 'not_found' && e.status === 404);
  assert.throws(() => getJsonValue(skills(), 'categories.9.name'), (e) => e.code === 'not_found');
  assert.throws(() => setJsonValue(skills(), 'categories.0.nope.deep', 1), (e) => e.code === 'not_found');
});

test('an empty key is rejected', () => {
  assert.throws(() => setJsonValue(home(), '', 1), (e) => e.code === 'bad_path');
});
