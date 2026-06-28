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
 * Comparación por similitud de imagen (NO es matching biométrico real — ver
 * SourceAfisHttpMatcher para eso). Da scores altos entre dedos distintos
 * porque toda foto de huella se ve "globalmente parecida" (mancha oscura
 * ovalada sobre papel claro). Útil solo como filtro de emergencia mientras
 * no haya un motor real configurado.
 */
export class SimpleImageMatcher implements FingerprintMatcher {
  async extractFeatures(imageBuffer: Buffer): Promise<string> {
    const { data } = await sharp(imageBuffer)
      .resize(SIZE, SIZE, { fit: "fill" })
      .grayscale()
      .normalize()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return JSON.stringify(Array.from(data));
  }

  async compareFeatures(featuresA: string, featuresB: string): Promise<number> {
    const vecA: number[] = JSON.parse(featuresA);
    const vecB: number[] = JSON.parse(featuresB);
    const similarity = cosineSimilarity(vecA, vecB);
    const score = Math.max(0, Math.min(1, similarity)) * 100;
    return Math.round(score * 10) / 10;
  }
}
