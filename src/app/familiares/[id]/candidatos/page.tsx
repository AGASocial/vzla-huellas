"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { ConfirmarMatchForm } from "@/components/ConfirmarMatchForm";
import { BackButton } from "@/components/BackButton";

type HuellaDesconocida = {
  id: string;
  huella_url: string;
  observaciones: string | null;
  direccion: string | null;
  estado: string | null;
  latitud: number | null;
  longitud: number | null;
};

type Candidato = { huellaDesconocida: HuellaDesconocida; score: number };

export default function CandidatosFamiliarPage() {
  const params = useParams<{ id: string }>();
  const [huellaUrl, setHuellaUrl] = useState<string | null>(null);
  const [nombre, setNombre] = useState<string | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[] | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState<{
    nombre_contacto: string;
    telefono_contacto: string;
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
      <main className="min-h-screen bg-neutral-950 text-white w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-4">
        <BackButton />
        <h1 className="text-2xl font-bold">¡Coincidencia confirmada!</h1>
        <p className="text-neutral-300">
          Contacta a la familia para darle seguimiento:
        </p>
        <div className="rounded-lg bg-teal-900/40 p-4">
          <p className="font-semibold">{confirmado.nombre_contacto}</p>
          <p className="text-neutral-300">{confirmado.telefono_contacto}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-6">
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
          <Image src={huellaUrl} alt="Huella registrada" width={128} height={128} className="rounded-lg w-32 h-auto" />
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
              <Image
                src={huellaDesconocida.huella_url}
                alt="Huella desconocida"
                width={64}
                height={64}
                className="rounded-lg w-16 h-16 object-cover"
              />
              <div>
                <p className="text-sm text-neutral-400">Score: {score}%</p>
                {huellaDesconocida.direccion && (
                  <p className="text-sm text-neutral-300">{huellaDesconocida.direccion}</p>
                )}
                {huellaDesconocida.estado && (
                  <p className="text-sm text-neutral-300">
                    Estado: {huellaDesconocida.estado === "fallecido" ? "Fallecido" : "Con vida"}
                  </p>
                )}
                {/* GPS oculto por ahora */}
                {huellaDesconocida.observaciones && (
                  <p className="text-sm text-neutral-300 mt-1">
                    {huellaDesconocida.observaciones}
                  </p>
                )}
              </div>
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
