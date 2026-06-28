export interface FingerprintMatcher {
  /**
   * Extrae el vector de características de una imagen de huella. Se calcula
   * UNA SOLA VEZ por imagen (al subirla) y se guarda en la base de datos,
   * para no tener que re-descargar y reprocesar imágenes en cada comparación.
   */
  extractFeatures(imageBuffer: Buffer): Promise<number[]>;

  /** Devuelve un score de similitud entre 0 y 100 comparando dos vectores ya extraídos. */
  compareFeatures(featuresA: number[], featuresB: number[]): number;
}
