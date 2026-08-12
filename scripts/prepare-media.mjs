/**
 * One-shot media importer for content/projects/**.
 *
 * Copies the owner's source images/PDFs under sanitized filenames and
 * transcodes source videos to web-playable H.264 under a hard 10 MB cap.
 *
 * ffmpeg comes from the `ffmpeg-static` devDependency (no system ffmpeg on this
 * machine) and is always invoked with an argument array - never a shell string.
 *
 *   node scripts/prepare-media.mjs
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = 'C:/Users/PaulC/Desktop/Personal Website Content';
const MAX_BYTES = 10 * 1024 * 1024; // 10,485,760
const AUDIO_KBPS = 128;

/** What lands in each project folder. Source paths are read-only. */
const PLAN = [
  {
    slug: 'bee-tracker-research',
    from: 'Bee Tracker Research',
    copy: [
      ['BeeTracker_Poster_42x27_v2 (1).pdf', 'bee-tracker-poster.pdf'],
      ['Screenshot 2026-04-20 084151.png', 'screenshot-2026-04-20-084151.png'],
      ['Screenshot 2026-04-23 180213.png', 'screenshot-2026-04-23-180213.png'],
      ['Screenshot 2026-04-23 180408.png', 'screenshot-2026-04-23-180408.png'],
      ['Screenshot 2026-04-23 180711.png', 'screenshot-2026-04-23-180711.png'],
    ],
    video: [
      ['BeeTrackerDemo1.mp4', 'bee-tracker-demo-1.mp4'],
      ['BeeTrackerDemo2.mp4', 'bee-tracker-demo-2.mp4'],
    ],
  },
  {
    slug: 'highschool-autograder',
    from: 'Highschool Autograder',
    copy: [
      ['Screenshot 2026-07-03 092524.png', 'screenshot-2026-07-03-092524.png'],
      ['Screenshot 2026-07-03 092535.png', 'screenshot-2026-07-03-092535.png'],
      ['Screenshot 2026-07-03 092601.png', 'screenshot-2026-07-03-092601.png'],
    ],
    video: [],
  },
];

function run(args) {
  const res = spawnSync(ffmpegPath, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (res.error) throw res.error;
  return res;
}

/** ffmpeg prints `Duration: HH:MM:SS.ss` to stderr when probing an input. */
function probeDurationSeconds(file) {
  const res = run(['-hide_banner', '-i', file]);
  const m = /Duration:\s*(\d+):(\d\d):(\d\d(?:\.\d+)?)/.exec(res.stderr ?? '');
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

const BASE_ARGS = [
  '-c:v', 'libx264',
  '-profile:v', 'high',
  '-pix_fmt', 'yuv420p',
  // Quotes are consumed by ffmpeg's own filtergraph parser, which would
  // otherwise read the comma in min(1280,iw) as a filter separator.
  '-vf', "scale='min(1280,iw)':-2",
  '-c:a', 'aac',
  '-b:a', `${AUDIO_KBPS}k`,
  '-movflags', '+faststart',
];

function encode(src, out, quality) {
  const args = ['-hide_banner', '-loglevel', 'error', '-y', '-i', src, ...BASE_ARGS, ...quality, out];
  const res = run(args);
  if (res.status !== 0) {
    throw new Error(`ffmpeg failed (${res.status}) for ${path.basename(out)}:\n${res.stderr}`);
  }
  return fs.statSync(out).size;
}

function transcode(src, out) {
  // Pass 1: quality-targeted. Usually lands well under the cap.
  let size = encode(src, out, ['-crf', '28', '-preset', 'slow']);
  console.log(`    crf 28          -> ${(size / 1048576).toFixed(2)} MB`);
  if (size <= MAX_BYTES) return size;

  // Over cap: switch to a bitrate computed from the actual duration.
  const duration = probeDurationSeconds(src);
  if (!duration) throw new Error(`cannot read duration of ${src}; unable to hit the size cap`);

  let safety = 0.95;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const totalKbps = (MAX_BYTES * 8) / duration / 1000;
    const videoKbps = Math.max(64, Math.floor(totalKbps * safety - AUDIO_KBPS));
    size = encode(src, out, [
      '-preset', 'slow',
      '-b:v', `${videoKbps}k`,
      '-maxrate', `${Math.floor(videoKbps * 1.2)}k`,
      '-bufsize', `${videoKbps * 2}k`,
    ]);
    console.log(`    ${String(videoKbps).padStart(5)} kbps v -> ${(size / 1048576).toFixed(2)} MB`);
    if (size <= MAX_BYTES) return size;
    safety -= 0.12;
  }
  throw new Error(`could not get ${path.basename(out)} under ${MAX_BYTES} bytes`);
}

let failed = false;
for (const project of PLAN) {
  const outDir = path.join(REPO_ROOT, 'content', 'projects', project.slug);
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`\n${project.slug}`);

  for (const [from, to] of project.copy) {
    const src = path.join(SOURCE_ROOT, project.from, from);
    if (!fs.existsSync(src)) { console.error(`  MISSING ${src}`); failed = true; continue; }
    fs.copyFileSync(src, path.join(outDir, to));
    console.log(`  copied ${to} (${fs.statSync(src).size} bytes)`);
  }

  for (const [from, to] of project.video) {
    const src = path.join(SOURCE_ROOT, project.from, from);
    if (!fs.existsSync(src)) { console.error(`  MISSING ${src}`); failed = true; continue; }
    const out = path.join(outDir, to);
    console.log(`  transcoding ${from} (${fs.statSync(src).size} bytes) -> ${to}`);
    const size = transcode(src, out);
    console.log(`  ${size <= MAX_BYTES ? 'OK  ' : 'FAIL'} ${to}: ${size} bytes (cap ${MAX_BYTES})`);
    if (size > MAX_BYTES) failed = true;
  }
}

console.log(failed ? '\nFAILED' : '\nAll media prepared.');
process.exit(failed ? 1 : 0);
