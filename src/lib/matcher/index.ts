import { SimpleImageMatcher } from "./simple-image-matcher";
import type { FingerprintMatcher } from "./types";

export type { FingerprintMatcher };

/**
 * Punto único de selección del motor de matching.
 * Cambiar aquí para enchufar un motor biométrico real (ej. SourceAFIS) sin tocar el resto del sistema.
 */
export function getMatcher(): FingerprintMatcher {
  return new SimpleImageMatcher();
}
