import { SimpleImageMatcher } from "./simple-image-matcher";
import { SourceAfisHttpMatcher } from "./source-afis-http-matcher";
import type { FingerprintMatcher } from "./types";

export type { FingerprintMatcher };

/**
 * Punto único de selección del motor de matching.
 * Si AFIS_SERVICE_URL está configurada, usa el motor real (SourceAFIS, por
 * minucias). Si no, cae en la similitud de imagen simple (NO confiable para
 * distinguir huellas digitales — ver advertencia en SimpleImageMatcher).
 */
export function getMatcher(): FingerprintMatcher {
  const afisUrl = process.env.AFIS_SERVICE_URL;
  if (afisUrl) {
    return new SourceAfisHttpMatcher(afisUrl, process.env.AFIS_SERVICE_TOKEN);
  }
  return new SimpleImageMatcher();
}
