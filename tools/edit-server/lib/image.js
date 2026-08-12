// Image compression via sharp. Output is always .webp q82, max dimension
// 2000px, never upscaled, metadata stripped (sharp's default).

import fs from 'node:fs';
import { fail } from './errors.js';

export const MAX_DIMENSION = 2000;
export const WEBP_QUALITY = 82;

let cached;
/** @returns {Promise<object|null>} the sharp module, or null when unavailable. */
export async function loadSharp() {
  if (cached !== undefined) return cached;
  try {
    cached = (await import('sharp')).default;
  } catch {
    cached = null;
  }
  return cached;
}

export const hasSharp = async () => (await loadSharp()) !== null;

/**
 * @param {string} inputPath source file (a temp upload)
 * @param {string} outPath destination .webp (must differ from inputPath)
 * @returns {Promise<{bytesIn:number,bytesOut:number,width:number,height:number}>}
 */
export async function compressImage(inputPath, outPath, { animated = false } = {}) {
  const sharp = await loadSharp();
  if (!sharp) throw fail('encode_failed', 'sharp is not installed; cannot process image uploads');

  const bytesIn = fs.statSync(inputPath).size;
  try {
    // Animated GIFs keep their frames; stills get EXIF auto-orientation applied
    // before metadata is dropped, otherwise portrait photos come out sideways.
    const pipeline = animated
      ? sharp(inputPath, { animated: true })
      : sharp(inputPath).rotate();
    const info = await pipeline
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toFile(outPath);
    return {
      bytesIn,
      bytesOut: fs.statSync(outPath).size,
      width: info.width,
      height: info.height,
    };
  } catch (err) {
    if (animated) return compressImage(inputPath, outPath, { animated: false });
    throw fail('encode_failed', `image encode failed: ${err.message}`);
  }
}
