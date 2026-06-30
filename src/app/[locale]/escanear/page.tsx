"use client";

import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BackButton } from "@/components/BackButton";
import { useTranslations } from "next-intl";

type EstadoPersona = "" | "fallecido" | "con_vida";

export default function EscanearPage() {
  const router = useRouter();
  const t = useTranslations("escanear");
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [direccion, setDireccion] = useState("");
  const [estado, setEstado] = useState<EstadoPersona>("");
  const [huella, setHuella] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const etiquetaInputRef = useRef<HTMLInputElement>(null);
  const [etiqueta, setEtiqueta] = useState<File | null>(null);
  const [etiquetaPreviewUrl, setEtiquetaPreviewUrl] = useState<string | null>(null);
  const coordsRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!huella) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(huella);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [huella]);

  useEffect(() => {
    if (!etiqueta) { setEtiquetaPreviewUrl(null); return; }
    const url = URL.createObjectURL(etiqueta);
    setEtiquetaPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [etiqueta]);

  function capturarUbicacion(timeout = 10000): Promise<{ lat: number; lng: number } | null> {
    if (!("geolocation" in navigator)) return Promise.resolve(null);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          coordsRef.current = coords;
          resolve(coords);
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout }
      );
    });
  }

  useEffect(() => {
    capturarUbicacion();
    if (!navigator.permissions?.query) return;
    let permissionStatus: PermissionStatus | undefined;
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        permissionStatus = status;
        status.onchange = () => {
          if (status.state === "granted" && !coordsRef.current) capturarUbicacion();
        };
      })
      .catch(() => {});
    return () => { if (permissionStatus) permissionStatus.onchange = null; };
  }, []);

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
    if (!coordsRef.current) await capturarUbicacion(2500);
    const coords = coordsRef.current;
    const formData = new FormData();
    formData.append("huella", huella);
    if (etiqueta) formData.append("etiqueta", etiqueta);
    formData.append("observaciones", observaciones);
    formData.append("direccion", direccion);
    formData.append("estado", estado);
    if (coords) {
      formData.append("latitud", String(coords.lat));
      formData.append("longitud", String(coords.lng));
    }
    try {
      const response = await fetch("/api/huellas-desconocidas", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? t("error_generico"));
        setEnviando(false);
        return;
      }
      router.push(`/huellas-desconocidas/${data.huellaDesconocida.id}/candidatos`);
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
      <p className="text-[var(--gris)] text-sm mb-2">
        {t("subtitle")}
      </p>
      <Link href="/escanear/guia" className="inline-block text-sm text-[var(--azul)] underline mb-6">
        {t("ver_ayuda")}
      </Link>

      {previewUrl ? (
        <div className="flex items-center gap-4 mb-6">
          <Image src={previewUrl} alt={t("huella_preview_alt")} width={96} height={96} unoptimized className="rounded-lg w-24 h-24 object-cover border border-[var(--verde-ok)]" />
          <div className="flex flex-col gap-2">
            <p className="text-[var(--verde-ok)] text-sm">{t("huella_lista")}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => cameraInputRef.current?.click()} className="rounded-lg border border-[var(--gris-claro)] bg-white px-3 py-1.5 text-sm hover:border-[var(--oscuro)]/40">{t("tomar_otra")}</button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-lg border border-[var(--gris-claro)] bg-white px-3 py-1.5 text-sm hover:border-[var(--oscuro)]/40">{t("subir_otra")}</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 rounded-xl bg-[var(--verde-ok)] text-white border border-[var(--gris-claro)] hover:border-[var(--oscuro)]/40 transition-colors p-5 text-left">
            <span className="text-lg font-semibold block">{t("subir_huella")}</span>
            <span className="text-white text-sm">{t("subir_huella_desc")}</span>
          </button>
        </div>
      )}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleHuellaChange} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleHuellaChange} />

      <div className="mb-6">
        <p className="text-sm text-[var(--gris)] mb-2">{t("etiqueta_label")}</p>
        {etiquetaPreviewUrl ? (
          <div className="flex items-center gap-4">
            <Image src={etiquetaPreviewUrl} alt={t("etiqueta_preview_alt")} width={80} height={80} unoptimized className="rounded-lg w-20 h-20 object-cover border border-[var(--azul)]" />
            <div className="flex flex-col gap-2">
              <p className="text-[var(--azul)] text-sm">{t("etiqueta_lista")}</p>
              <button type="button" onClick={() => etiquetaInputRef.current?.click()} className="rounded-lg border border-[var(--gris-claro)] bg-white px-3 py-1.5 text-sm hover:border-[var(--oscuro)]/40">{t("etiqueta_cambiar")}</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => etiquetaInputRef.current?.click()} className="w-full rounded-xl bg-white border border-dashed border-[var(--gris-claro)] hover:border-[var(--azul)] transition-colors p-4 text-left">
            <span className="text-sm font-semibold text-[var(--oscuro)] block">{t("etiqueta_subir")}</span>
            <span className="text-xs text-[var(--gris)]">{t("etiqueta_subir_desc")}</span>
          </button>
        )}
        <input ref={etiquetaInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setEtiqueta(f); }} />
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="sm:col-span-2 flex flex-col gap-1 text-sm text-[var(--gris)]">
          {t("label_direccion")}
          <input value={direccion} onChange={(event) => setDireccion(event.target.value)} disabled={enviando} className="rounded-lg bg-white border border-[var(--gris-claro)] px-3 py-2 text-[var(--oscuro)] focus:outline-none focus:border-[var(--azul)] disabled:opacity-50" />
        </label>
        <fieldset className="sm:col-span-2 flex flex-col gap-2 text-sm text-[var(--gris)]">
          {t("estado_label")}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" disabled={enviando} onClick={() => setEstado(estado === "con_vida" ? "" : "con_vida")} className={`rounded-xl p-5 text-left transition-colors disabled:opacity-50 ${estado === "con_vida" ? "bg-[var(--verde-ok)]/10 border border-[var(--verde-ok)] text-[var(--verde-ok)]" : "bg-white border border-[var(--gris-claro)] hover:border-[var(--oscuro)]/40 text-[var(--oscuro)]"}`}>
              <span className="text-lg font-semibold block">{t("estado_con_vida")}</span>
            </button>
            <button type="button" disabled={enviando} onClick={() => setEstado(estado === "fallecido" ? "" : "fallecido")} className={`rounded-xl p-5 text-left transition-colors disabled:opacity-50 ${estado === "fallecido" ? "bg-[var(--rojo)]/10 border border-[var(--rojo)] text-[var(--rojo)]" : "bg-white border border-[var(--gris-claro)] hover:border-[var(--oscuro)]/40 text-[var(--oscuro)]"}`}>
              <span className="text-lg font-semibold block">{t("estado_fallecido")}</span>
            </button>
          </div>
        </fieldset>
        <label className="sm:col-span-2 flex flex-col gap-1 text-sm text-[var(--gris)]">
          {t("label_observaciones")}
          <textarea value={observaciones} onChange={(event) => setObservaciones(event.target.value)} disabled={enviando} rows={3} placeholder={t("observaciones_placeholder")} className="rounded-lg bg-white border border-[var(--gris-claro)] px-3 py-2 text-[var(--oscuro)] focus:outline-none focus:border-[var(--azul)] disabled:opacity-50" />
        </label>
        {error && <p className="sm:col-span-2 text-[var(--rojo)] text-sm">{error}</p>}
        <button type="submit" disabled={enviando} className="sm:col-span-2 mt-2 rounded-lg bg-[var(--verde-ok)] hover:bg-[var(--verde-ok)]/90 text-white disabled:opacity-50 py-3 font-display shadow-[0_4px_15px_rgba(26,138,90,0.3)]">
          {enviando ? t("guardando") : t("guardar")}
        </button>
      </form>
    </main>
  );
}
