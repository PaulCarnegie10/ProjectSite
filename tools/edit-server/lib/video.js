// Video compression via ffmpeg-static.
//
// There is no ffprobe in ffmpeg-static, so duration comes from parsing the
// `Duration:` banner that `ffmpeg -i <in>` prints to stderr before it exits
// complaining about the missing output file.
//
// ffmpeg is ALWAYS spawned as (binary, [args]) with no shell: the input path is
// attacker-influenced and a shell string would be a command-injection hole.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fail } from './errors.js';

export const TARGET_BYTES = 10 * 1024 * 1024; // 10 MB
export const AUDIO_BITRATE = 128000;
export const MIN_VIDEO_BITRATE = 300000;
export const MAX_VIDEO_BITRATE = 6000000;
const SCALE_FILTER = "scale='min(1920,iw)':-2";
const SPAWN_TIMEOUT_MS = 20 * 60 * 1000;

let cachedBin;
/** @returns {Promise<string|null>} path to the ffmpeg binary, or null. */
export async function loadFfmpeg() {
  if (cachedBin !== undefined) return cachedBin;
  try {
    const mod = await import('ffmpeg-static');
    const bin = mod.default || mod;
    cachedBin = typeof bin === 'string' && fs.existsSync(bin) ? bin : null;
  } catch {
    cachedBin = null;
  }
  return cachedBin;
}

export const hasFfmpeg = async () => (await loadFfmpeg()) !== null;

/**
 * Run ffmpeg with an argument array. Never a shell string.
 * An AbortSignal kills the child (SIGKILL) so a client cancel actually stops
 * the encode server-side rather than orphaning ffmpeg. Resolves with
 * `aborted:true` in that case.
 */
function run(bin, args, signal) {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve({ code: -1, stdout: '', stderr: 'aborted before start', aborted: true });
      return;
    }
    const child = spawn(bin, args, { shell: false, windowsHide: true });
    let stderr = '';
    let stdout = '';
    let aborted = false;
    const timer = setTimeout(() => child.kill('SIGKILL'), SPAWN_TIMEOUT_MS);
    const onAbort = () => {
      aborted = true;
      child.kill('SIGKILL');
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', (err) => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      resolve({ code: -1, stdout, stderr: `${stderr}\n${err.message}`, aborted });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      resolve({ code, stdout, stderr, aborted });
    });
  });
}

/** Parse `Duration: HH:MM:SS.ss` out of an ffmpeg banner. */
export function parseDuration(stderr) {
  const m = /Duration:\s*(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/.exec(stderr);
  if (!m) return null;
  const seconds = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

/** @returns {Promise<number>} duration in seconds @throws encode_failed */
export async function probeDuration(inputPath) {
  const bin = await loadFfmpeg();
  if (!bin) throw fail('encode_failed', 'ffmpeg is not available');
  const { stderr } = await run(bin, ['-hide_banner', '-i', inputPath]);
  const duration = parseDuration(stderr);
  if (duration === null) throw fail('encode_failed', 'could not determine video duration');
  return duration;
}

/** Bits/s of video that fits TARGET_BYTES once the audio track is paid for. */
export function videoBitrateFor(durationSeconds) {
  const budget = (TARGET_BYTES * 8) / durationSeconds - AUDIO_BITRATE;
  return Math.round(Math.min(MAX_VIDEO_BITRATE, Math.max(MIN_VIDEO_BITRATE, budget)));
}

const baseVideoArgs = (bitrate) => [
  '-c:v', 'libx264',
  '-preset', 'veryfast',
  '-pix_fmt', 'yuv420p',
  '-vf', SCALE_FILTER,
  '-b:v', String(bitrate),
];

const outputArgs = (bitrate) => [
  '-maxrate', String(bitrate),
  '-bufsize', String(bitrate * 2),
  '-c:a', 'aac',
  '-b:a', '128k',
  '-movflags', '+faststart',
];

const abortedError = () => fail('encode_failed', 'video encode cancelled');

/**
 * Compress to H.264 MP4 under TARGET_BYTES. Single ABR pass first; if that
 * overshoots AND the budget was not already at the floor, a proper two-pass
 * encode at the same computed bitrate. When bitrate is already at
 * MIN_VIDEO_BITRATE the target is unreachable, so a second pass at the same
 * bitrate would only burn two more encodes for the same oversized result — we
 * return the honest oversized bytesOut instead.
 * @param {{signal?: AbortSignal}} [opts]
 * @returns {Promise<{bytesIn,bytesOut,duration,bitrate,twoPass}>}
 */
export async function compressVideo(inputPath, outPath, { signal } = {}) {
  const bin = await loadFfmpeg();
  if (!bin) throw fail('encode_failed', 'ffmpeg is not available; cannot process video uploads');

  const bytesIn = fs.statSync(inputPath).size;
  const duration = await probeDuration(inputPath);
  const bitrate = videoBitrateFor(duration);

  const one = await run(bin, [
    '-hide_banner', '-nostats', '-i', inputPath,
    ...baseVideoArgs(bitrate),
    ...outputArgs(bitrate),
    '-y', outPath,
  ], signal);
  if (one.aborted) throw abortedError();
  if (one.code !== 0 || !fs.existsSync(outPath)) {
    throw fail('encode_failed', `ffmpeg failed: ${tail(one.stderr)}`);
  }
  let bytesOut = fs.statSync(outPath).size;
  // At the bitrate floor the target is mathematically unreachable; don't waste
  // two more encodes chasing it.
  if (bytesOut <= TARGET_BYTES || bitrate === MIN_VIDEO_BITRATE) {
    return { bytesIn, bytesOut, duration, bitrate, twoPass: false };
  }

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edit-2pass-'));
  const passlog = path.join(workDir, 'ffmpeg2pass');
  const scratch = path.join(workDir, 'pass1.mp4');
  try {
    const p1 = await run(bin, [
      '-hide_banner', '-nostats', '-i', inputPath,
      ...baseVideoArgs(bitrate),
      '-pass', '1', '-passlogfile', passlog,
      '-an', '-f', 'mp4', '-y', scratch,
    ], signal);
    if (p1.aborted) throw abortedError();
    if (p1.code !== 0) throw fail('encode_failed', `ffmpeg pass 1 failed: ${tail(p1.stderr)}`);
    const p2 = await run(bin, [
      '-hide_banner', '-nostats', '-i', inputPath,
      ...baseVideoArgs(bitrate),
      '-pass', '2', '-passlogfile', passlog,
      ...outputArgs(bitrate),
      '-y', outPath,
    ], signal);
    if (p2.aborted) throw abortedError();
    if (p2.code !== 0 || !fs.existsSync(outPath)) {
      throw fail('encode_failed', `ffmpeg pass 2 failed: ${tail(p2.stderr)}`);
    }
    bytesOut = fs.statSync(outPath).size;
    return { bytesIn, bytesOut, duration, bitrate, twoPass: true };
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

const tail = (s) => String(s || '').trim().split('\n').slice(-4).join(' | ').slice(0, 400);
