"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ConfirmarMatchForm } from "@/components/ConfirmarMatchForm";
import { BackButton } from "@/components/BackButton";

type HuellaDesconocida = {
  id: string;
  huella_url: string;
};

type Candidato = { huellaDesconocida: HuellaDesconocida; score: number };

export default function CandidatosFamiliarPage() {
  const params = useParams<{ id: string }>();
  const [huellaUrl, setHuellaUrl] = useState<string | null>(null);
  const [nombre, setNombre] = useState<string | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[] | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState<{
    nombre_familiar: string;
    telefono_familiar: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/familiares/${params.id}/candidatos`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setHuellaUrl(data.familiar.huella_url);
        setNombre(data.familiar.nombre_completo);
        setCandidatos(data.candidatos);
      })
      .catch(() => setError("No se pudo cargar la información."));
  }, [params.id]);

  if (confirmado) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white px-6 py-10 max-w-md mx-auto flex flex-col gap-4">
        <BackButton />
        <h1 className="text-2xl font-bold">¡Coincidencia confirmada!</h1>
        <p className="text-neutral-300">
          Contacta a la familia para darle seguimiento:
        </p>
        <div className="rounded-lg bg-teal-900/40 p-4">
          <p className="font-semibold">{confirmado.nombre_familiar}</p>
          <p className="text-neutral-300">{confirmado.telefono_familiar}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-6 py-10 max-w-md mx-auto flex flex-col gap-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold mb-1">Registro guardado</h1>
        <p className="text-neutral-400 text-sm">
          Estas son las huellas desconocidas registradas hasta ahora. Compara
          visualmente con la huella de {nombre ?? "tu familiar"}.
        </p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {huellaUrl && (
        <div>
          <p className="text-sm text-neutral-400 mb-1">Huella registrada</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={huellaUrl} alt="Huella registrada" className="rounded-lg w-32" />
        </div>
      )}

      {candidatos === null && !error && <p className="text-neutral-400">Buscando coincidencias...</p>}

      {candidatos !== null && candidatos.length === 0 && (
        <p className="text-neutral-400">
          No hay huellas desconocidas registradas todavía. Si alguien escanea
          una huella en el futuro, se comparará automáticamente con este
          registro.
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {candidatos?.map(({ huellaDesconocida, score }) => (
          <li
            key={huellaDesconocida.id}
            className="rounded-xl border border-neutral-700 p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={huellaDesconocida.huella_url}
                alt="Huella desconocida"
                className="rounded-lg w-16 h-16 object-cover"
              />
              <p className="text-sm text-neutral-400">Score: {score}%</p>
            </div>

            {abierto !== huellaDesconocida.id ? (
              <button
                onClick={() => setAbierto(huellaDesconocida.id)}
                className="rounded-lg border border-teal-700 text-teal-300 hover:bg-teal-900/40 py-2 text-sm font-semibold"
              >
                Es esta persona — confirmar coincidencia
              </button>
            ) : (
              <ConfirmarMatchForm
                huellaDesconocidaId={huellaDesconocida.id}
                familiarId={params.id}
                onConfirmado={setConfirmado}
              />
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
