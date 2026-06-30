"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BackButton } from "@/components/BackButton";

type EstadoPersona = "" | "fallecido" | "con_vida";

export default function EscanearPage() {
  const router = useRouter();
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
    if (!huella) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(huella);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [huella]);

  useEffect(() => {
    if (!etiqueta) {
      setEtiquetaPreviewUrl(null);
      return;
    }
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
    // Intento silencioso al entrar a la pantalla. Si no hay permiso
    // todavía, no molestamos al usuario con mensajes ni botones.
    capturarUbicacion();

    // Si el usuario otorga el permiso más tarde (desde el navegador o los
    // ajustes del sistema), reintentamos automáticamente sin que tenga que
    // volver a hacer nada.
    if (!navigator.permissions?.query) return;
    let permissionStatus: PermissionStatus | undefined;
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        permissionStatus = status;
        status.onchange = () => {
          if (status.state === "granted" && !coordsRef.current) {
            capturarUbicacion();
          }
        };
      })
      .catch(() => {});
    return () => {
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  function handleHuellaChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setHuella(file);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!huella) {
      setError("Toma o sube una foto de la huella antes de guardar.");
      return;
    }

    setEnviando(true);

    // Si todavía no tenemos coordenadas (ej. el permiso tardó en llegar),
    // probamos una vez más con un límite corto para no demorar la subida.
    if (!coordsRef.current) {
      await capturarUbicacion(2500);
    }
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
      const response = await fetch("/api/huellas-desconocidas", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Ocurrió un error al procesar la huella.");
        setEnviando(false);
        return;
      }

      router.push(`/huellas-desconocidas/${data.huellaDesconocida.id}/candidatos`);
    } catch {
      setError("No se pudo conectar con el servidor.");
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--fondo)] text-[var(--oscuro)] w-full mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <div className="flex items-center gap-3 mb-1">
        <BackButton />
        <h1 className="text-2xl font-display">Escanear huellas digitales</h1>
      </div>
      <p className="text-[var(--gris)] text-sm mb-2">
        Toma o sube la huella de una persona desaparecida o fallecida para
        buscar coincidencias. Puedes subir la foto primero y completar los
        detalles después.
      </p>
      <Link
        href="/escanear/guia"
        className="inline-block text-sm text-[var(--azul)] underline mb-6"
      >
        Ver ayuda
      </Link>

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
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 rounded-xl bg-[var(--verde-ok)] text-white border border-[var(--gris-claro)] hover:border-[var(--oscuro)]/40 transition-colors p-5 text-left"
          >
            <span className="text-lg font-semibold block">Subir imagen de la huella</span>
            <span className="text-white text-sm">
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

      {/* Foto de etiqueta */}
      <div className="mb-6">
        <p className="text-sm text-[var(--gris)] mb-2">Foto de etiqueta en muñeca o tobillo (opcional)</p>
        {etiquetaPreviewUrl ? (
          <div className="flex items-center gap-4">
            <Image
              src={etiquetaPreviewUrl}
              alt="Etiqueta seleccionada"
              width={80}
              height={80}
              unoptimized
              className="rounded-lg w-20 h-20 object-cover border border-[var(--azul)]"
            />
            <div className="flex flex-col gap-2">
              <p className="text-[var(--azul)] text-sm">Foto de etiqueta lista.</p>
              <button
                type="button"
                onClick={() => etiquetaInputRef.current?.click()}
                className="rounded-lg border border-[var(--gris-claro)] bg-white px-3 py-1.5 text-sm hover:border-[var(--oscuro)]/40"
              >
                Cambiar foto
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => etiquetaInputRef.current?.click()}
            className="w-full rounded-xl bg-white border border-dashed border-[var(--gris-claro)] hover:border-[var(--azul)] transition-colors p-4 text-left"
          >
            <span className="text-sm font-semibold text-[var(--oscuro)] block">Subir foto de etiqueta</span>
            <span className="text-xs text-[var(--gris)]">Opcional — foto de la etiqueta en muñeca o tobillo</span>
          </button>
        )}
        <input
          ref={etiquetaInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setEtiqueta(f); }}
        />
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="sm:col-span-2 flex flex-col gap-1 text-sm text-[var(--gris)]">
          Dirección donde se encuentra (opcional)
          <input
            value={direccion}
            onChange={(event) => setDireccion(event.target.value)}
            disabled={enviando}
            className="rounded-lg bg-white border border-[var(--gris-claro)] px-3 py-2 text-[var(--oscuro)] focus:outline-none focus:border-[var(--azul)] disabled:opacity-50"
          />
        </label>

        <fieldset className="sm:col-span-2 flex flex-col gap-2 text-sm text-[var(--gris)]">
          Estado de la persona (opcional)
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={enviando}
              onClick={() => setEstado(estado === "con_vida" ? "" : "con_vida")}
              className={`rounded-xl p-5 text-left transition-colors disabled:opacity-50 ${
                estado === "con_vida"
                  ? "bg-[var(--verde-ok)]/10 border border-[var(--verde-ok)] text-[var(--verde-ok)]"
                  : "bg-white border border-[var(--gris-claro)] hover:border-[var(--oscuro)]/40 text-[var(--oscuro)]"
              }`}
            >
              <span className="text-lg font-semibold block">Con vida</span>
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={() => setEstado(estado === "fallecido" ? "" : "fallecido")}
              className={`rounded-xl p-5 text-left transition-colors disabled:opacity-50 ${
                estado === "fallecido"
                  ? "bg-[var(--rojo)]/10 border border-[var(--rojo)] text-[var(--rojo)]"
                  : "bg-white border border-[var(--gris-claro)] hover:border-[var(--oscuro)]/40 text-[var(--oscuro)]"
              }`}
            >
              <span className="text-lg font-semibold block">Fallecido</span>
            </button>
          </div>
        </fieldset>

        <label className="sm:col-span-2 flex flex-col gap-1 text-sm text-[var(--gris)]">
          Observaciones (opcional)
          <textarea
            value={observaciones}
            onChange={(event) => setObservaciones(event.target.value)}
            disabled={enviando}
            rows={3}
            placeholder="Ej: lugar exacto, estado del cuerpo, señas particulares..."
            className="rounded-lg bg-white border border-[var(--gris-claro)] px-3 py-2 text-[var(--oscuro)] focus:outline-none focus:border-[var(--azul)] disabled:opacity-50"
          />
        </label>

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
