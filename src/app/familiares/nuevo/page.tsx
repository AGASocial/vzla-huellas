"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [huella, setHuella] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const numeroDocumentoConfig = NUMERO_DOCUMENTO_CONFIG[tipoDocumento];

  useEffect(() => {
    if (!huella) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(huella);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [huella]);

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

  function handleHuellaChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setHuella(file);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!huella) {
      setError("Sube o toma una foto de la huella antes de guardar.");
      return;
    }

    setEnviando(true);

    const formData = new FormData(event.currentTarget);
    formData.delete("huella");
    formData.append("huella", huella);

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
    <main className="min-h-screen bg-[var(--fondo)] text-[var(--oscuro)] w-full mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <div className="flex items-center gap-3 mb-1">
        <BackButton />
        <h1 className="text-2xl font-display">Sube los datos de tu familiar</h1>
      </div>
      <p className="text-[var(--gris)] text-sm mb-6">
        Registra a la persona desaparecida con su huella e información de
        contacto. Puedes subir la foto de la huella primero y llenar el resto
        después.
      </p>

      {!previewUrl && (
        <div className="flex flex-col sm:flex-row gap-3 items-start bg-[#FFF9F0] border border-[var(--amarillo)]/40 rounded-lg p-3 mb-6">
          <Image
            src="/huella_ejemplo.jpeg"
            alt="Ejemplo de cómo debe verse la foto de la huella"
            width={120}
            height={150}
            className="rounded-lg w-24 h-auto sm:w-28 shrink-0"
          />
          <p className="text-[#7a4f00] text-sm">
            Usa la huella del <strong>dedo pulgar derecho</strong>, la misma
            que aparece en la cédula de identidad. Toma la foto bien enfocada
            y con buena luz, como en el ejemplo.
          </p>
        </div>
      )}

      {previewUrl ? (
        <div className="flex items-center gap-4 mb-6">
          <Image
            src={previewUrl}
            alt="Huella seleccionada"
            width={96}
            height={96}
            unoptimized
            className="rounded-lg w-24 h-24 object-cover border border-[var(--verde-ok)]"
          />
          <div className="flex flex-col gap-2">
            <p className="text-[var(--verde-ok)] text-sm">Huella lista para guardar.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="rounded-lg border border-[var(--gris-claro)] bg-white px-3 py-1.5 text-sm hover:border-[var(--oscuro)]/40"
              >
                Tomar otra foto
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-[var(--gris-claro)] bg-white px-3 py-1.5 text-sm hover:border-[var(--oscuro)]/40"
              >
                Subir otra imagen
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 rounded-xl bg-[var(--azul)] hover:bg-[var(--azul)]/90 text-white transition-colors p-5 text-left shadow-[0_4px_15px_rgba(0,36,125,0.3)]"
          >
            <span className="text-lg font-display block">Tomar huella con el teléfono</span>
            <span className="text-white/80 text-sm">
              Usa la cámara para fotografiar la huella.
            </span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 rounded-xl bg-white border border-[var(--gris-claro)] hover:border-[var(--oscuro)]/40 transition-colors p-5 text-left"
          >
            <span className="text-lg font-semibold block">Subir huella</span>
            <span className="text-[var(--gris)] text-sm">
              Selecciona una foto o escaneo existente.
            </span>
          </button>
        </div>
      )}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleHuellaChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleHuellaChange}
      />

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

        {error && <p className="sm:col-span-2 text-[var(--rojo)] text-sm">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="sm:col-span-2 mt-2 rounded-lg bg-[var(--verde-ok)] hover:bg-[var(--verde-ok)]/90 text-white disabled:opacity-50 py-3 font-display shadow-[0_4px_15px_rgba(26,138,90,0.3)]"
        >
          {enviando ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </main>
  );
}

const inputClass =
  "rounded-lg bg-white border border-[var(--gris-claro)] px-3 py-2 text-[var(--oscuro)] focus:outline-none focus:border-[var(--azul)]";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-[var(--gris)]">
      {label}
      {children}
    </label>
  );
}
