export interface FingerprintMatcher {
  /**
   * Extrae las características de una imagen de huella como un string
   * opaco (vector serializado o template biométrico, según el motor). Se
   * calcula UNA SOLA VEZ por imagen (al subirla) y se guarda en la base de
   * datos, para no tener que re-descargar y reprocesar imágenes en cada
   * comparación.
   */
  extractFeatures(imageBuffer: Buffer): Promise<string>;

  /** Devuelve un score de similitud comparando dos features ya extraídos. */
  compareFeatures(featuresA: string, featuresB: string): Promise<number>;
}
