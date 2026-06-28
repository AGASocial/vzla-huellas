"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { BackButton } from "@/components/BackButton";

type TipoDocumento = "" | "V" | "E" | "pasaporte" | "sin_documento";

const NUMERO_DOCUMENTO_CONFIG: Record<
  TipoDocumento,
  { placeholder: string; maxLength?: number; pattern?: string; inputMode?: "numeric" | "text" }
> = {
  "": { placeholder: "Selecciona primero el tipo de documento" },
  V: { placeholder: "Ej: 12345678", maxLength: 8, pattern: "[0-9]{1,8}", inputMode: "numeric" },
  E: { placeholder: "Ej: 12345678", maxLength: 8, pattern: "[0-9]{1,8}", inputMode: "numeric" },
  pasaporte: {
    placeholder: "Ej: A1234567",
    maxLength: 9,
    pattern: "[A-Za-z0-9]{1,9}",
    inputMode: "text",
  },
  sin_documento: { placeholder: "Sin número de documento" },
};

export default function NuevoFamiliarPage() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>("");
  const [numeroDocumento, setNumeroDocumento] = useState("");

  const numeroDocumentoConfig = NUMERO_DOCUMENTO_CONFIG[tipoDocumento];

  function handleTipoDocumentoChange(value: TipoDocumento) {
    setTipoDocumento(value);
    setNumeroDocumento("");
  }

  function handleNumeroDocumentoChange(value: string) {
    if (tipoDocumento === "pasaporte") {
      setNumeroDocumento(value.toUpperCase());
    } else if (tipoDocumento === "V" || tipoDocumento === "E") {
      setNumeroDocumento(value.replace(/\D/g, ""));
    } else {
      setNumeroDocumento(value);
    }
  }

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
    <main className="min-h-screen bg-neutral-950 text-white w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <BackButton />
      <h1 className="text-2xl font-bold mb-1">Sube los datos de tu familiar</h1>
      <p className="text-neutral-400 text-sm mb-6">
        Registra a la persona desaparecida con su huella e información de
        contacto.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Campo label="Nombre completo de la persona">
          <input name="nombre_completo" required className={inputClass} />
        </Campo>

        <Campo label="Tipo de documento">
          <select
            name="tipo_documento"
            required
            className={inputClass}
            value={tipoDocumento}
            onChange={(event) =>
              handleTipoDocumentoChange(event.target.value as TipoDocumento)
            }
          >
            <option value="" disabled>
              Selecciona...
            </option>
            <option value="V">Cédula V</option>
            <option value="E">Cédula E</option>
            <option value="pasaporte">Pasaporte</option>
            <option value="sin_documento">Sin documento</option>
          </select>
        </Campo>

        <Campo label="Número de documento">
          <input
            name="numero_documento"
            value={numeroDocumento}
            onChange={(event) => handleNumeroDocumentoChange(event.target.value)}
            disabled={!tipoDocumento || tipoDocumento === "sin_documento"}
            required={tipoDocumento !== "sin_documento"}
            placeholder={numeroDocumentoConfig.placeholder}
            maxLength={numeroDocumentoConfig.maxLength}
            pattern={numeroDocumentoConfig.pattern}
            inputMode={numeroDocumentoConfig.inputMode}
            className={`${inputClass} disabled:opacity-50`}
          />
        </Campo>

        <Campo label="Número de teléfono (opcional)">
          <input name="telefono" className={inputClass} />
        </Campo>

        <Campo label="Dirección donde se encuentra">
          <input name="direccion" required className={inputClass} />
        </Campo>

        <Campo label="Correo electrónico">
          <input name="correo" type="email" required className={inputClass} />
        </Campo>

        <Campo label="Nombre del familiar que lo busca">
          <input name="nombre_familiar" required className={inputClass} />
        </Campo>

        <Campo label="Número del familiar que lo busca">
          <input name="telefono_familiar" required className={inputClass} />
        </Campo>

        <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3 items-start bg-amber-950/40 border border-amber-700/50 rounded-lg p-3">
          <Image
            src="/huella_ejemplo.jpeg"
            alt="Ejemplo de cómo debe verse la foto de la huella"
            width={120}
            height={150}
            className="rounded-lg w-24 h-auto sm:w-28 shrink-0"
          />
          <p className="text-amber-200 text-sm">
            Usa la huella del <strong>dedo pulgar derecho</strong>, la misma
            que aparece en la cédula de identidad. Toma la foto bien enfocada
            y con buena luz, como en el ejemplo.
          </p>
        </div>

        <div className="sm:col-span-2">
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
        </div>

        {error && <p className="sm:col-span-2 text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="sm:col-span-2 mt-2 rounded-lg bg-teal-700 hover:bg-teal-600 disabled:opacity-50 py-3 font-semibold"
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
