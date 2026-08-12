// Pure-function coverage for the video budget math and the ffmpeg banner
// parser. Actual encoding is exercised by hand (see the task's live evidence)
// because a real encode is far too slow for the unit suite.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDuration,
  videoBitrateFor,
  TARGET_BYTES,
  AUDIO_BITRATE,
  MIN_VIDEO_BITRATE,
  MAX_VIDEO_BITRATE,
} from '../lib/video.js';

test('parseDuration reads the ffmpeg banner', () => {
  const banner = `
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'demo.mp4':
  Metadata:
    major_brand     : isom
  Duration: 00:01:23.45, start: 0.000000, bitrate: 8005 kb/s
  Stream #0:0[0x1](und): Video: h264 (High)
`;
  assert.equal(parseDuration(banner), 83.45);
});

test('parseDuration handles hour-long and sub-second durations', () => {
  assert.equal(parseDuration('Duration: 01:00:00.00, start: 0'), 3600);
  assert.equal(parseDuration('Duration: 00:00:02.50, start: 0'), 2.5);
});

test('parseDuration returns null when there is no usable duration', () => {
  assert.equal(parseDuration('Duration: N/A, start: 0.000000'), null);
  assert.equal(parseDuration('some unrelated ffmpeg error'), null);
  assert.equal(parseDuration('Duration: 00:00:00.00, start: 0'), null);
});

test('bitrate is the 10 MB budget minus the audio track', () => {
  const duration = 60;
  const expected = Math.round((TARGET_BYTES * 8) / duration - AUDIO_BITRATE);
  assert.equal(videoBitrateFor(duration), expected);
  assert.ok(expected > MIN_VIDEO_BITRATE && expected < MAX_VIDEO_BITRATE);
});

test('bitrate clamps to [300k, 6000k]', () => {
  assert.equal(videoBitrateFor(6000), MIN_VIDEO_BITRATE, 'a very long clip floors at 300k');
  assert.equal(videoBitrateFor(1), MAX_VIDEO_BITRATE, 'a very short clip ceilings at 6000k');
  assert.equal(videoBitrateFor(0.1), MAX_VIDEO_BITRATE);
});

test('the computed bitrate fits the 10 MB target while the budget is unclamped', () => {
  // The budget is only achievable between the two clamps. Below ~14s the
  // ceiling caps quality; above ~196s the floor wins (see the next test).
  for (const duration of [15, 30, 60, 120, 180]) {
    const bitrate = videoBitrateFor(duration);
    assert.ok(
      bitrate > MIN_VIDEO_BITRATE && bitrate < MAX_VIDEO_BITRATE,
      `${duration}s should land inside the clamp range`,
    );
    const predictedBytes = ((bitrate + AUDIO_BITRATE) * duration) / 8;
    assert.ok(
      predictedBytes <= TARGET_BYTES * 1.001,
      `${duration}s predicts ${Math.round(predictedBytes)} bytes, over the ${TARGET_BYTES} target`,
    );
  }
});

test('past the 300k floor the 10 MB target is mathematically unreachable', () => {
  // Documented consequence of the frozen clamp: a long clip cannot be squeezed
  // under 10 MB, and two-pass will not rescue it either. Not a bug - a limit.
  const duration = 400;
  assert.equal(videoBitrateFor(duration), MIN_VIDEO_BITRATE);
  const predictedBytes = ((MIN_VIDEO_BITRATE + AUDIO_BITRATE) * duration) / 8;
  assert.ok(predictedBytes > TARGET_BYTES, 'a 400s clip cannot reach the target at the floor');
});
