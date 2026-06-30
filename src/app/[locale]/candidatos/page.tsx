"use client";

import { Suspense, useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BackButton } from "@/components/BackButton";

type HuellaDesconocida = {
  id: string;
  huella_url: string;
  created_at: string;
};

export default function GaleriaHuellasPage() {
  return (
    <Suspense>
      <GaleriaHuellas />
    </Suspense>
  );
}

function GaleriaHuellas() {
  const t = useTranslations("galeria");
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const [huellas, setHuellas] = useState<HuellaDesconocida[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHuellas(null);
    fetch(`/api/huellas-desconocidas?page=${page}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setHuellas(data.huellas);
        setTotalPages(data.totalPages);
      })
      .catch(() => setError(t("error_cargar")));
  }, [page, t]);

  function goToPage(target: number) {
    router.push(`/candidatos?page=${target}`);
  }

  return (
    <main className="min-h-screen bg-[var(--fondo)] text-[var(--oscuro)] w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <BackButton />
          <h1 className="text-2xl font-display">{t("title")}</h1>
        </div>
        <p className="text-[var(--gris)] text-sm">{t("subtitle")}</p>
      </div>

      {error && <p className="text-[var(--rojo)] text-sm">{error}</p>}
      {huellas === null && !error && <p className="text-[var(--gris)]">{t("cargando")}</p>}
      {huellas?.length === 0 && (
        <p className="text-[var(--gris)]">{t("sin_huellas")}</p>
      )}

      <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {huellas?.map((huella) => (
          <li key={huella.id} className="relative aspect-square">
            <Link href={`/huellas-desconocidas/${huella.id}/candidatos`}>
              <Image
                src={huella.huella_url}
                alt={t("huella_alt")}
                fill
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
                className="rounded-lg object-cover border border-[var(--gris-claro)]"
              />
            </Link>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            className="rounded-lg bg-white border border-[var(--gris-claro)] px-4 py-2 text-sm disabled:opacity-40 hover:border-[var(--oscuro)]/40"
          >
            {t("anterior")}
          </button>
          <span className="text-sm text-[var(--gris)]">
            {t("pagina", { page, total: totalPages })}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
            className="rounded-lg bg-white border border-[var(--gris-claro)] px-4 py-2 text-sm disabled:opacity-40 hover:border-[var(--oscuro)]/40"
          >
            {t("siguiente")}
          </button>
        </div>
      )}
    </main>
  );
}
