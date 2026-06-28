"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackButton } from "@/components/BackButton";

export default function NuevoFamiliarPage() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setEnviando(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/familiares", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Ocurrió un error al guardar.");
        setEnviando(false);
        return;
      }

      sessionStorage.setItem(
        "candidatos_familiar",
        JSON.stringify({ familiar: data.familiar, candidatos: data.candidatos })
      );
      router.push(`/familiares/${data.familiar.id}/candidatos`);
    } catch {
      setError("No se pudo conectar con el servidor.");
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-6 py-10 max-w-md mx-auto">
      <BackButton />
      <h1 className="text-2xl font-bold mb-1">Sube los datos de tu familiar</h1>
      <p className="text-neutral-400 text-sm mb-6">
        Registra a la persona desaparecida con su huella e información de
        contacto.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Campo label="Nombre completo de la persona">
          <input name="nombre_completo" required className={inputClass} />
        </Campo>

        <Campo label="Tipo de documento">
          <select name="tipo_documento" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Selecciona...
            </option>
            <option value="V">Cédula V</option>
            <option value="E">Cédula E</option>
            <option value="pasaporte">Pasaporte</option>
            <option value="sin_documento">Sin documento</option>
          </select>
        </Campo>

        <Campo label="Número de documento (opcional)">
          <input name="numero_documento" className={inputClass} />
        </Campo>

        <Campo label="Número de teléfono">
          <input name="telefono" required className={inputClass} />
        </Campo>

        <Campo label="Dirección donde se encuentra">
          <input name="direccion" required className={inputClass} />
        </Campo>

        <Campo label="Correo electrónico (opcional)">
          <input name="correo" type="email" className={inputClass} />
        </Campo>

        <Campo label="Nombre del familiar que lo busca">
          <input name="nombre_familiar" required className={inputClass} />
        </Campo>

        <Campo label="Número del familiar que lo busca">
          <input name="telefono_familiar" required className={inputClass} />
        </Campo>

        <Campo label="Imagen de la huella digital">
          <input
            name="huella"
            type="file"
            accept="image/*"
            capture="environment"
            required
            className={inputClass}
          />
        </Campo>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="mt-2 rounded-lg bg-teal-700 hover:bg-teal-600 disabled:opacity-50 py-3 font-semibold"
        >
          {enviando ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </main>
  );
}

const inputClass =
  "rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-white focus:outline-none focus:border-teal-500";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-neutral-300">
      {label}
      {children}
    </label>
  );
}
