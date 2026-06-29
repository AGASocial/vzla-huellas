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
      className="flex flex-col gap-3 mt-3 border-t border-[var(--gris-claro)] pt-3"
    >
      <label className="flex flex-col gap-1 text-sm text-[var(--gris)]">
        Dirección actual de la persona desaparecida
        <input
          value={direccion}
          onChange={(event) => setDireccion(event.target.value)}
          required
          className="rounded-lg bg-white border border-[var(--gris-claro)] px-3 py-2 text-[var(--oscuro)] focus:outline-none focus:border-[var(--azul)]"
        />
      </label>

      <fieldset className="flex flex-col gap-2 text-sm text-[var(--gris)]">
        Estado de la persona desaparecida (con vida o fallecido)
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setEstado(estado === "con_vida" ? "" : "con_vida")}
            className={`rounded-xl p-5 text-left transition-colors ${
              estado === "con_vida"
                ? "bg-[var(--verde-ok)]/10 border border-[var(--verde-ok)] text-[var(--verde-ok)]"
                : "bg-white border border-[var(--gris-claro)] hover:border-[var(--oscuro)]/40 text-[var(--oscuro)]"
            }`}
          >
            <span className="text-lg font-semibold block">Con vida</span>
          </button>
          <button
            type="button"
            onClick={() => setEstado(estado === "fallecido" ? "" : "fallecido")}
            className={`rounded-xl p-5 text-left transition-colors ${
              estado === "fallecido"
                ? "bg-[var(--rojo)]/10 border border-[var(--rojo)] text-[var(--rojo)]"
                : "bg-white border border-[var(--gris-claro)] hover:border-[var(--oscuro)]/40 text-[var(--oscuro)]"
            }`}
          >
            <span className="text-lg font-semibold block">Fallecido</span>
          </button>
        </div>
      </fieldset>

      {error && <p className="text-[var(--rojo)] text-sm">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-lg bg-[var(--verde-ok)] hover:bg-[var(--verde-ok)]/90 text-white disabled:opacity-50 py-2 font-display shadow-[0_4px_15px_rgba(26,138,90,0.3)]"
      >
        {enviando ? "Confirmando..." : "Confirmar coincidencia"}
      </button>
    </form>
  );
}
