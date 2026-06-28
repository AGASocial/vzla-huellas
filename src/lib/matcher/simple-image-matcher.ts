import sharp from "sharp";
import type { FingerprintMatcher } from "./types";

const SIZE = 32;

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
 *
 * El vector se extrae una sola vez por imagen (en el upload) y se guarda en
 * la base de datos. Comparar es aritmética pura sobre números ya guardados,
 * sin volver a descargar ni decodificar ninguna imagen.
 */
export class SimpleImageMatcher implements FingerprintMatcher {
  async extractFeatures(imageBuffer: Buffer): Promise<number[]> {
    const { data } = await sharp(imageBuffer)
      .resize(SIZE, SIZE, { fit: "fill" })
      .grayscale()
      .normalize()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return Array.from(data);
  }

  compareFeatures(featuresA: number[], featuresB: number[]): number {
    const similarity = cosineSimilarity(featuresA, featuresB);
    const score = Math.max(0, Math.min(1, similarity)) * 100;
    return Math.round(score * 10) / 10;
  }
}
