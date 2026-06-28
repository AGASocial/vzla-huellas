"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";

type HuellaDesconocida = {
  id: string;
  huella_url: string;
  created_at: string;
};

export default function GaleriaHuellasPage() {
  const [huellas, setHuellas] = useState<HuellaDesconocida[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/huellas-desconocidas")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setHuellas(data.huellas);
      })
      .catch(() => setError("No se pudo cargar la galería."));
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-white w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold mb-1">Huellas sin identificar</h1>
        <p className="text-neutral-400 text-sm">
          Huellas escaneadas en el terreno que aún no tienen una coincidencia
          confirmada. Si reconoces a alguien, regístralo como familiar para
          comparar.
        </p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {huellas === null && !error && <p className="text-neutral-400">Cargando...</p>}
      {huellas?.length === 0 && (
        <p className="text-neutral-400">No hay huellas pendientes por ahora.</p>
      )}

      <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {huellas?.map((huella) => (
          <li key={huella.id}>
            <Link href={`/huellas-desconocidas/${huella.id}/candidatos`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={huella.huella_url}
                alt="Huella sin identificar"
                className="rounded-lg w-full h-24 object-cover border border-neutral-700"
              />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
