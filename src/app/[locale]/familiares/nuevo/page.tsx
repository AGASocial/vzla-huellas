"use client";

import { useRouter } from "@/i18n/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { BackButton } from "@/components/BackButton";

type TipoDocumento = "" | "V" | "E" | "pasaporte" | "sin_documento";

export default function NuevoFamiliarPage() {
  const t = useTranslations("familiares_nuevo");
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [huella, setHuella] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const NUMERO_DOCUMENTO_CONFIG: Record<
    TipoDocumento,
    { placeholder: string; maxLength?: number; pattern?: string; inputMode?: "numeric" | "text" }
  > = {
    "": { placeholder: t("placeholder_doc_deshabilitado") },
    V: { placeholder: "Ej: 12345678", maxLength: 8, pattern: "[0-9]{1,8}", inputMode: "numeric" },
    E: { placeholder: "Ej: 12345678", maxLength: 8, pattern: "[0-9]{1,8}", inputMode: "numeric" },
    pasaporte: {
      placeholder: "Ej: A1234567",
      maxLength: 9,
      pattern: "[A-Za-z0-9]{1,9}",
      inputMode: "text",
    },
    sin_documento: { placeholder: t("placeholder_sin_doc") },
  };

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
      setError(t("error_sin_huella"));
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
        setError(data.error ?? t("error_generico"));
        setEnviando(false);
        return;
      }

      router.push(`/familiares/${data.familiar.id}/candidatos`);
    } catch {
      setError(t("error_servidor"));
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--fondo)] text-[var(--oscuro)] w-full mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <div className="flex items-center gap-3 mb-1">
        <BackButton />
        <h1 className="text-2xl font-display">{t("title")}</h1>
      </div>
      {!previewUrl && (
        <div className="flex flex-col sm:flex-row gap-3 items-start bg-[#FFF9F0] border border-[var(--amarillo)]/40 rounded-lg p-3 mb-6">
          <Image
            src="/huella_ejemplo.jpeg"
            alt={t("ejemplo_alt")}
            width={120}
            height={150}
            className="rounded-lg w-24 h-auto sm:w-28 shrink-0"
          />
          <p className="text-[#7a4f00] text-2xl">
            <span className="text-green-900">{t("example_note")}</span>{" "}
            {t("example_body")}{" "}
            <br /><br />
            <span className="text-green-900">{t("example_note2")}</span>{" "}
            {t("example_body2")}
          </p>
        </div>
      )}

      {previewUrl ? (
        <div className="flex items-center gap-4 mb-6">
          <Image
            src={previewUrl}
            alt={t("huella_preview_alt")}
            width={96}
            height={96}
            unoptimized
            className="rounded-lg w-24 h-24 object-cover border border-[var(--verde-ok)]"
          />
          <div className="flex flex-col gap-2">
            <p className="text-[var(--verde-ok)] text-2xl">{t("huella_lista")}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="rounded-lg border border-[var(--gris-claro)] bg-white px-3 py-1.5 text-md hover:border-[var(--oscuro)]/40"
              >
                {t("tomar_otra")}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-[var(--gris-claro)] bg-white px-3 py-1.5 text-md hover:border-[var(--oscuro)]/40"
              >
                {t("subir_otra")}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 rounded-xl bg-[var(--azul)] border border-[var(--gris-claro)] hover:border-[var(--oscuro)]/40 transition-colors p-5 text-left"
          >
            <span className="text-lg text-white font-semibold block">{t("subir_huella")}</span>
            <span className="text-white text-md">
              {t("subir_huella_desc")}
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
        <Campo label={t("label_nombre")}>
          <input name="nombre_completo" required className={inputClass} />
        </Campo>

        <Campo label={t("label_tipo_doc")}>
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
              {t("doc_selecciona")}
            </option>
            <option value="V">{t("doc_cedula_v")}</option>
            <option value="E">{t("doc_cedula_e")}</option>
            <option value="pasaporte">{t("doc_pasaporte")}</option>
            <option value="sin_documento">{t("doc_sin_documento")}</option>
          </select>
        </Campo>

        <Campo label={t("label_numero_doc")}>
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

        <Campo label={t("label_telefono")}>
          <input name="telefono" className={inputClass} />
        </Campo>

        <Campo label={t("label_direccion")}>
          <input name="direccion" required className={inputClass} />
        </Campo>

        <Campo label={t("label_correo")}>
          <input name="correo" type="email" required className={inputClass} />
        </Campo>

        <Campo label={t("label_nombre_familiar")}>
          <input name="nombre_familiar" required className={inputClass} />
        </Campo>

        <Campo label={t("label_telefono_familiar")}>
          <input name="telefono_familiar" required className={inputClass} />
        </Campo>

        {error && <p className="sm:col-span-2 text-[var(--rojo)] text-md">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="sm:col-span-2 mt-2 rounded-lg bg-[var(--verde-ok)] hover:bg-[var(--verde-ok)]/90 text-white disabled:opacity-50 py-3 font-display shadow-[0_4px_15px_rgba(26,138,90,0.3)]"
        >
          {enviando ? t("guardando") : t("guardar")}
        </button>
      </form>
    </main>
  );
}

const inputClass =
  "rounded-lg bg-white border border-[var(--gris-claro)] px-3 py-2 text-[var(--oscuro)] focus:outline-none focus:border-[var(--azul)]";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-md text-[var(--gris)]">
      {label}
      {children}
    </label>
  );
}
