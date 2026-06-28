import type { FingerprintMatcher } from "./types";

/**
 * Matching real de huellas digitales por minucias, vía el microservicio Java en
 * services/afis-matcher (SourceAFIS). El score de SourceAFIS no es un
 * porcentaje: es un valor abierto donde >= 40 sugiere la misma huella. Para
 * no romper el resto del UI (que muestra/ordena por "score 0-100"), lo
 * acotamos a 100 conservando el orden relativo.
 */
export class SourceAfisHttpMatcher implements FingerprintMatcher {
  constructor(
    private readonly baseUrl: string,
    private readonly token?: string
  ) {}

  private headers(extra?: Record<string, string>) {
    return {
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...extra,
    };
  }

  async extractFeatures(imageBuffer: Buffer): Promise<string> {
    const response = await fetch(`${this.baseUrl}/extract`, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/octet-stream" }),
      body: new Uint8Array(imageBuffer),
    });
    if (!response.ok) {
      throw new Error(`afis-matcher /extract falló: ${response.status} ${await response.text()}`);
    }
    const data = await response.json();
    return data.template as string;
  }

  async compareFeatures(featuresA: string, featuresB: string): Promise<number> {
    const response = await fetch(`${this.baseUrl}/compare`, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ probe: featuresA, candidate: featuresB }),
    });
    if (!response.ok) {
      throw new Error(`afis-matcher /compare falló: ${response.status} ${await response.text()}`);
    }
    const data = await response.json();
    const score = Math.max(0, Math.min(100, data.score));
    return Math.round(score * 10) / 10;
  }
}
