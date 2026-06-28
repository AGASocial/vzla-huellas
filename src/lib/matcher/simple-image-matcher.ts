import sharp from "sharp";
import type { FingerprintMatcher } from "./types";

const SIZE = 32;

async function toGrayscaleVector(buffer: Buffer): Promise<number[]> {
  const { data } = await sharp(buffer)
    .resize(SIZE, SIZE, { fit: "fill" })
    .grayscale()
    .normalize()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return Array.from(data);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Comparación por similitud de imagen (NO es matching biométrico real).
 * Sirve como primer filtro orientativo para validación humana.
 */
export class SimpleImageMatcher implements FingerprintMatcher {
  async compare(imageBufferA: Buffer, imageBufferB: Buffer): Promise<number> {
    const [vecA, vecB] = await Promise.all([
      toGrayscaleVector(imageBufferA),
      toGrayscaleVector(imageBufferB),
    ]);
    const similarity = cosineSimilarity(vecA, vecB);
    const score = Math.max(0, Math.min(1, similarity)) * 100;
    return Math.round(score * 10) / 10;
  }
}
