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
          <h1 className="text-2xl font-display">Registro guardado</h1>
        </div>
        <p className="text-[var(--gris)] text-sm">
          Estas son las huellas digitales registradas hasta ahora. Compara
          visualmente con la huella de {nombre ?? "tu familiar"}.
        </p>
      </div>

      {error && <p className="text-[var(--rojo)] text-sm">{error}</p>}

      {huellaUrl && (
        <div>
          <p className="text-sm text-[var(--gris)] mb-1">Huella registrada</p>
          <Image src={huellaUrl} alt="Huella registrada" width={128} height={128} className="rounded-lg w-32 h-auto" />
        </div>
      )}

      {candidatos === null && !error && <p className="text-[var(--gris)]">Buscando coincidencias...</p>}

      {candidatos !== null && candidatos.length === 0 && (
        <p className="text-[var(--gris)]">
          No hay huellas digitales registradas todavía. Si alguien escanea
          una huella en el futuro, se comparará automáticamente con este
          registro.
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {candidatos?.map(({ huellaDesconocida, score }) => (
          <li
            key={huellaDesconocida.id}
            className="rounded-xl bg-white border border-[var(--gris-claro)] p-4 flex flex-col gap-2"
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
                <p className="text-sm text-[var(--gris)]">Score: {score}%</p>
                {huellaDesconocida.direccion && (
                  <p className="text-sm text-[var(--oscuro)]">{huellaDesconocida.direccion}</p>
                )}
                {huellaDesconocida.estado && (
                  <p className="text-sm text-[var(--oscuro)]">
                    Estado: {huellaDesconocida.estado === "fallecido" ? "Fallecido" : "Con vida"}
                  </p>
                )}
                {/* GPS oculto por ahora */}
                {huellaDesconocida.observaciones && (
                  <p className="text-sm text-[var(--oscuro)] mt-1">
                    {huellaDesconocida.observaciones}
                  </p>
                )}
              </div>
            </div>

            {abierto !== huellaDesconocida.id ? (
              <button
                onClick={() => setAbierto(huellaDesconocida.id)}
                className="rounded-lg border border-[var(--verde-ok)] text-[var(--verde-ok)] hover:bg-[var(--verde-ok)]/10 py-2 text-sm font-semibold"
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
