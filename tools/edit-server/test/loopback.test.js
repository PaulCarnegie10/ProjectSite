import test from 'node:test';
import assert from 'node:assert/strict';
import { isLoopbackSocket, isLoopbackRequest, normalizeAddress } from '../lib/loopback.js';

const socket = (remoteAddress) => ({ remoteAddress });

test('loopback peers are accepted', () => {
  for (const addr of [
    '127.0.0.1',
    '::1',
    '::ffff:127.0.0.1',
    '0:0:0:0:0:0:0:1',
    '::ffff:7f00:1',
    '::1%lo0',
    '[::1]',
    '::FFFF:127.0.0.1',
  ]) {
    assert.equal(isLoopbackSocket(socket(addr)), true, `${addr} should be loopback`);
  }
});

test('non-loopback peers are rejected', () => {
  for (const addr of [
    '192.168.1.50',
    '10.0.0.7',
    '0.0.0.0',
    '::',
    '::ffff:192.168.1.50',
    '203.0.113.9',
    'fe80::1',
    '2001:db8::1',
    '127.0.0.2',      // loopback /8 but not the exact allowed address
    '127.1',
    '0177.0.0.1',     // octal spelling of 127.0.0.1
    '2130706433',     // decimal spelling of 127.0.0.1
    'localhost',      // a name is not an address
    '',
    undefined,
    null,
  ]) {
    assert.equal(isLoopbackSocket(socket(addr)), false, `${addr} should be rejected`);
  }
});

test('a missing socket is rejected', () => {
  assert.equal(isLoopbackSocket(undefined), false);
  assert.equal(isLoopbackSocket(null), false);
  assert.equal(isLoopbackRequest({}), false);
});

test('spoofable headers never make a remote peer loopback', () => {
  const req = {
    socket: socket('203.0.113.9'),
    headers: {
      host: 'localhost:5173',
      origin: 'http://localhost:5173',
      referer: 'http://127.0.0.1:5173/',
      'x-forwarded-for': '127.0.0.1',
      'x-real-ip': '127.0.0.1',
    },
  };
  assert.equal(isLoopbackRequest(req), false);
});

test('normalizeAddress canonicalizes only the three allowed spellings', () => {
  assert.equal(normalizeAddress('127.0.0.1'), '127.0.0.1');
  assert.equal(normalizeAddress('0:0:0:0:0:0:0:1'), '::1');
  assert.equal(normalizeAddress('::ffff:7f00:1'), '::ffff:127.0.0.1');
  assert.equal(normalizeAddress('10.0.0.1'), null);
});
