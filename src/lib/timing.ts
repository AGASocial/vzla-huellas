/**
 * Logging de métricas en JSON por línea — sin dependencias externas.
 * Vercel captura stdout de las functions como logs estructurados, así que
 * esto ya es consultable/filtrable en el dashboard de Logs/Observability
 * sin instalar nada (ej. filtrar por `event:"hash_huella"` o por
 * `duration_ms` alto para encontrar requests lentos).
 */
export function startTimer() {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}

export function logMetric(event: string, fields: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ event, ...fields, ts: new Date().toISOString() }));
}
