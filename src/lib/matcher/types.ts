export interface FingerprintMatcher {
  /** Devuelve un score de similitud entre 0 y 100 comparando dos imágenes de huella. */
  compare(imageBufferA: Buffer, imageBufferB: Buffer): Promise<number>;
}
