"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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
      .catch(() => setError("No se pudo cargar la galería."));
  }, [page]);

  function goToPage(target: number) {
    router.push(`/candidatos?page=${target}`);
  }

  return (
    <main className="min-h-screen bg-[var(--fondo)] text-[var(--oscuro)] w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <BackButton />
          <h1 className="text-2xl font-display">Huellas sin identificar</h1>
        </div>
        <p className="text-[var(--gris)] text-sm">
          Huellas escaneadas en el terreno que aún no tienen una coincidencia
          confirmada. Si reconoces a alguien, regístralo como familiar para
          comparar.
        </p>
      </div>

      {error && <p className="text-[var(--rojo)] text-sm">{error}</p>}
      {huellas === null && !error && <p className="text-[var(--gris)]">Cargando...</p>}
      {huellas?.length === 0 && (
        <p className="text-[var(--gris)]">No hay huellas pendientes por ahora.</p>
      )}

      <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {huellas?.map((huella) => (
          <li key={huella.id} className="relative aspect-square">
            <Link href={`/huellas-desconocidas/${huella.id}/candidatos`}>
              <Image
                src={huella.huella_url}
                alt="Huella sin identificar"
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
            Anterior
          </button>
          <span className="text-sm text-[var(--gris)]">
            Página {page} de {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
            className="rounded-lg bg-white border border-[var(--gris-claro)] px-4 py-2 text-sm disabled:opacity-40 hover:border-[var(--oscuro)]/40"
          >
            Siguiente
          </button>
        </div>
      )}
    </main>
  );
}
