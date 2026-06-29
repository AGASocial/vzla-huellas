"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { BackButton } from "@/components/BackButton";

type Familiar = {
  id: string;
  nombre_completo: string;
  huella_url: string;
};

type Candidato = { familiar: Familiar; score: number };

export default function CandidatosHuellaDesconocidaPage() {
  const params = useParams<{ id: string }>();
  const [huellaUrl, setHuellaUrl] = useState<string | null>(null);
  const [observaciones, setObservaciones] = useState<string | null>(null);
  const [direccion, setDireccion] = useState<string | null>(null);
  const [estadoPersona, setEstadoPersona] = useState<string | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/huellas-desconocidas/${params.id}/candidatos`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setHuellaUrl(data.huellaDesconocida.huella_url);
        setObservaciones(data.huellaDesconocida.observaciones);
        setDireccion(data.huellaDesconocida.direccion);
        setEstadoPersona(data.huellaDesconocida.estado);
        setCandidatos(data.candidatos);
      })
      .catch(() => setError("No se pudo cargar la información."));
  }, [params.id]);


  return (
    <main className="min-h-screen bg-[var(--fondo)] text-[var(--oscuro)] w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <BackButton href="/" />
          <h1 className="text-2xl font-display">Posibles coincidencias</h1>
        </div>
        <p className="text-[var(--gris)] text-sm">
          Compara visualmente la huella escaneada con los familiares
          registrados. El porcentaje es solo un filtro orientativo. Para
          confirmar una coincidencia, búscala en &quot;Ver base de datos&quot;.
        </p>
      </div>

      {error && <p className="text-[var(--rojo)] text-sm">{error}</p>}

      {huellaUrl && (
        <div>
          <p className="text-sm text-[var(--gris)] mb-1">Huella escaneada</p>
          <Image src={huellaUrl} alt="Huella escaneada" width={128} height={128} className="rounded-lg w-32 h-auto" />
        </div>
      )}

      {(direccion || estadoPersona || observaciones) && (
        <div className="rounded-lg bg-white border border-[var(--gris-claro)] p-3 flex flex-col gap-2 text-sm">
          {direccion && (
            <p>
              <span className="text-[var(--gris)]">Dirección: </span>
              <span className="text-[var(--oscuro)]">{direccion}</span>
            </p>
          )}
          {estadoPersona && (
            <p>
              <span className="text-[var(--gris)]">Estado: </span>
              <span className="text-[var(--oscuro)]">
                {estadoPersona === "fallecido" ? "Fallecido" : "Con vida"}
              </span>
            </p>
          )}
          {observaciones && (
            <div>
              <p className="text-[var(--gris)] mb-1">Observaciones</p>
              <p className="text-[var(--oscuro)] whitespace-pre-wrap">{observaciones}</p>
            </div>
          )}
        </div>
      )}

      {candidatos === null && !error && (
        <div className="flex items-center gap-3 text-[var(--gris)]">
          <span className="inline-block w-4 h-4 rounded-full border-2 border-[var(--gris-claro)] border-t-[var(--azul)] animate-spin" />
          <p>Buscando coincidencias... esto puede tardar un poco si hay muchos registros.</p>
        </div>
      )}

      {candidatos !== null && (candidatos ?? []).length === 0 && (
        <p className="text-[var(--gris)]">
          No hay familiares registrados todavía para comparar. Esta huella queda
          guardada y se comparará automáticamente cuando alguien registre un
          familiar.
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {(candidatos ?? []).map(({ familiar, score }) => (
          <li
            key={familiar.id}
            className="rounded-xl bg-white border border-[var(--gris-claro)] p-4 flex items-center gap-3"
          >
            <Image
              src={familiar.huella_url}
              alt={`Huella de ${familiar.nombre_completo}`}
              width={64}
              height={64}
              className="rounded-lg w-16 h-16 object-cover"
            />
            <div>
              <p className="font-semibold">{familiar.nombre_completo}</p>
              <p className="text-sm text-[var(--gris)]">Score: {score}%</p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
