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

  /**
   * Identificador del motor + versión usados para comparar (ej.
   * "source-afis-v1", "simple-image-v1"). Se guarda junto a cada score en
   * caché (vzla_huellas_matches) para poder invalidar resultados viejos si
   * el motor cambia, sin tener que adivinar qué filas son obsoletas.
   */
  matcherVersion(): string;
}
