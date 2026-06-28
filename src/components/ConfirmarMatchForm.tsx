"use client";

import { useState } from "react";

export function ConfirmarMatchForm({
  huellaDesconocidaId,
  familiarId,
  onConfirmado,
}: {
  huellaDesconocidaId: string;
  familiarId: string;
  onConfirmado: (resultado: {
    nombre_contacto: string;
    telefono_contacto: string;
  }) => void;
}) {
  const [direccion, setDireccion] = useState("");
  const [estado, setEstado] = useState<"fallecido" | "con_vida" | "">("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!direccion || !estado) return;
    setEnviando(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/huellas-desconocidas/${huellaDesconocidaId}/confirmar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ familiar_id: familiarId, direccion, estado }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo confirmar el match.");
        setEnviando(false);
        return;
      }

      const familiar = data.huellaDesconocida.familiar;
      onConfirmado({
        nombre_contacto: familiar.nombre_familiar || familiar.nombre_completo,
        telefono_contacto: familiar.telefono_familiar || familiar.telefono,
      });
    } catch {
      setError("No se pudo conectar con el servidor.");
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 mt-3 border-t border-neutral-700 pt-3"
    >
      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Dirección actual del desconocido
        <input
          value={direccion}
          onChange={(event) => setDireccion(event.target.value)}
          required
          className="rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-white focus:outline-none focus:border-teal-500"
        />
      </label>

      <fieldset className="flex flex-col gap-1 text-sm text-neutral-300">
        Estado de la persona desaparecida
        <div className="flex gap-4 mt-1">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`estado-${huellaDesconocidaId}`}
              value="fallecido"
              checked={estado === "fallecido"}
              onChange={() => setEstado("fallecido")}
            />
            Fallecido
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`estado-${huellaDesconocidaId}`}
              value="con_vida"
              checked={estado === "con_vida"}
              onChange={() => setEstado("con_vida")}
            />
            Con vida
          </label>
        </div>
      </fieldset>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-lg bg-teal-700 hover:bg-teal-600 disabled:opacity-50 py-2 font-semibold"
      >
        {enviando ? "Confirmando..." : "Confirmar coincidencia"}
      </button>
    </form>
  );
}
