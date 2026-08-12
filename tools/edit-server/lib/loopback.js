// Loopback gate. The ONLY authentication this server has, so it trusts nothing
// that a remote peer can spoof: not Host, not X-Forwarded-For, not Origin, not
// Referer. Only the kernel-reported socket peer address counts. This must hold
// when the dev server is started with `vite --host`.

const ALLOWED = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

/**
 * Canonicalize a socket peer address to one of the three allowed spellings, or
 * return null when it is anything else.
 */
export function normalizeAddress(addr) {
  if (typeof addr !== 'string') return null;
  let a = addr.trim().toLowerCase();
  if (a === '') return null;
  // Strip an IPv6 zone id ("fe80::1%eth0", "::1%lo0").
  const pct = a.indexOf('%');
  if (pct !== -1) a = a.slice(0, pct);
  // Strip brackets from a literal like "[::1]".
  if (a.startsWith('[') && a.endsWith(']')) a = a.slice(1, -1);
  if (a === '127.0.0.1') return '127.0.0.1';
  // Fully expanded IPv6 loopback.
  if (/^(0{1,4}:){7}0{0,3}1$/.test(a)) return '::1';
  if (a === '::1') return '::1';
  // IPv4-mapped loopback, dotted or hex tail ("::ffff:7f00:1").
  if (a === '::ffff:127.0.0.1') return '::ffff:127.0.0.1';
  if (a === '::ffff:7f00:1' || a === '0:0:0:0:0:0:ffff:7f00:1') return '::ffff:127.0.0.1';
  return null;
}

/**
 * @param {{remoteAddress?: string}|null|undefined} socket
 * @returns {boolean} true only for a loopback peer.
 */
export function isLoopbackSocket(socket) {
  if (!socket) return false;
  const norm = normalizeAddress(socket.remoteAddress);
  return norm !== null && ALLOWED.has(norm);
}

/** Convenience wrapper for a connect request. Reads req.socket only. */
export function isLoopbackRequest(req) {
  return isLoopbackSocket(req && req.socket);
}
