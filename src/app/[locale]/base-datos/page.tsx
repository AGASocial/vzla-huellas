"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { BackButton } from "@/components/BackButton";
import { useTranslations } from "next-intl";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 300;

type Resultado = {
  id: string;
  nombre_completo: string;
  tipo_documento: string;
  numero_documento: string | null;
  huella_url: string;
  estado: "buscando" | "encontrado";
};

export default function BaseDatosPage() {
  const t = useTranslations("base_datos");
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Resultado[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const termino = query.trim();
    abortRef.current?.abort();
    if (termino.length < MIN_QUERY_LENGTH) {
      setResultados(null);
      setBuscando(false);
      setError(null);
      return;
    }
    setBuscando(true);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/familiares/buscar?q=${encodeURIComponent(termino)}`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? t("error_generico"));
          setResultados(null);
          return;
        }
        setResultados(data.resultados);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(t("error_servidor"));
        setResultados(null);
      } finally {
        setBuscando(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query, t]);

  return (
    <main className="min-h-screen bg-[var(--fondo)] text-[var(--oscuro)] w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <BackButton href="/" />
        <h1 className="text-2xl font-display">{t("title")}</h1>
      </div>
      <div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("placeholder")}
          className="w-full rounded-lg bg-white border border-[var(--gris-claro)] px-4 py-3 text-[var(--oscuro)] focus:outline-none focus:border-[var(--azul)]"
        />
        <p className="text-[var(--gris)] text-xs mt-1">
          {t("min_chars", { min: MIN_QUERY_LENGTH })}
        </p>
      </div>
      {error && <p className="text-[var(--rojo)] text-sm">{error}</p>}
      {buscando && <p className="text-[var(--gris)]">{t("buscando")}</p>}
      {!buscando && resultados !== null && resultados.length === 0 && (
        <p className="text-[var(--gris)]">{t("sin_resultados")}</p>
      )}
      {!buscando && resultados !== null && resultados.length > 0 && (
        <ul className="flex flex-col gap-3">
          {resultados.map((resultado) => (
            <li key={resultado.id}>
              <Link
                href={`/familiares/${resultado.id}/candidatos?origen=base-datos`}
                className="rounded-xl bg-white border border-[var(--gris-claro)] hover:border-[var(--oscuro)]/40 transition-colors p-4 flex items-center gap-3"
              >
                <Image src={resultado.huella_url} alt={`Huella de ${resultado.nombre_completo}`} width={56} height={56} className="rounded-lg w-14 h-14 object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{resultado.nombre_completo}</p>
                  {resultado.numero_documento && (
                    <p className="text-sm text-[var(--gris)]">{resultado.tipo_documento}-{resultado.numero_documento}</p>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${resultado.estado === "encontrado" ? "bg-[var(--verde-ok)]/10 text-[var(--verde-ok)]" : "bg-[var(--azul)]/10 text-[var(--azul)]"}`}>
                  {resultado.estado === "encontrado" ? t("estado_encontrado") : t("estado_buscando")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
