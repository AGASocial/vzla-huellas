"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { ConfirmarMatchForm } from "@/components/ConfirmarMatchForm";
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
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[] | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState<{
    nombre_contacto: string;
    telefono_contacto: string;
  } | null>(null);
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
        if (data.huellaDesconocida.latitud && data.huellaDesconocida.longitud) {
          setCoords({ lat: data.huellaDesconocida.latitud, lng: data.huellaDesconocida.longitud });
        }
        setCandidatos(data.candidatos);
      })
      .catch(() => setError("No se pudo cargar la información."));
  }, [params.id]);

  const candidatosVisibles = (candidatos ?? []).filter(({ score }) => score > 1);

  if (confirmado) {
    return (
      <main className="min-h-screen bg-[var(--fondo)] text-[var(--oscuro)] w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <BackButton href="/" />
          <h1 className="text-2xl font-display">¡Coincidencia confirmada!</h1>
        </div>
        <p className="text-[var(--gris)]">
          Contacta a la familia para darle seguimiento:
        </p>
        <div className="rounded-lg bg-[var(--verde-ok)]/10 border border-[var(--verde-ok)]/30 p-4">
          <p className="font-semibold">{confirmado.nombre_contacto}</p>
          <p className="text-[var(--gris)]">{confirmado.telefono_contacto}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--fondo)] text-[var(--oscuro)] w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <BackButton href="/" />
          <h1 className="text-2xl font-display">Posibles coincidencias</h1>
        </div>
        <p className="text-[var(--gris)] text-sm">
          Compara visualmente la huella escaneada con los familiares
          registrados. El porcentaje es solo un filtro orientativo.
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
          {/* GPS oculto por ahora — ver coords más abajo, queda guardado en BD */}
          {observaciones && (
            <div>
              <p className="text-[var(--gris)] mb-1">Observaciones</p>
              <p className="text-[var(--oscuro)] whitespace-pre-wrap">{observaciones}</p>
            </div>
          )}
        </div>
      )}

      {candidatos === null && !error && <p className="text-[var(--gris)]">Buscando coincidencias...</p>}

      {candidatos !== null && candidatosVisibles.length === 0 && (
        <p className="text-[var(--gris)]">
          No hay familiares registrados todavía para comparar. Esta huella queda
          guardada y se comparará automáticamente cuando alguien registre un
          familiar.
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {candidatosVisibles.map(({ familiar, score }) => (
          <li
            key={familiar.id}
            className="rounded-xl bg-white border border-[var(--gris-claro)] p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-3">
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
            </div>

            {abierto !== familiar.id ? (
              <button
                onClick={() => setAbierto(familiar.id)}
                className="rounded-lg border border-[var(--verde-ok)] text-[var(--verde-ok)] hover:bg-[var(--verde-ok)]/10 py-2 text-sm font-semibold"
              >
                Es esta persona — confirmar coincidencia
              </button>
            ) : (
              <ConfirmarMatchForm
                huellaDesconocidaId={params.id}
                familiarId={familiar.id}
                onConfirmado={setConfirmado}
              />
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
