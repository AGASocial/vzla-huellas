"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Image from "next/image";
import { BackButton } from "@/components/BackButton";

export default function EscanearPage() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subirHuella(file: File) {
    setError(null);
    setEnviando(true);
    setMensaje("Coloque el dedo de la persona desconocida en el teléfono...");

    const formData = new FormData();
    formData.append("huella", file);

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

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) subirHuella(file);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white w-full max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold mb-1">Escanear huellas</h1>
        <p className="text-neutral-400 text-sm">
          Toma o sube la huella de una persona desaparecida o fallecida para
          buscar coincidencias.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start bg-amber-950/40 border border-amber-700/50 rounded-lg p-3">
        <Image
          src="/huella_ejemplo.jpeg"
          alt="Ejemplo de cómo debe verse la foto de la huella"
          width={120}
          height={150}
          className="rounded-lg w-24 h-auto sm:w-28 shrink-0"
        />
        <p className="text-amber-200 text-sm">
          Usa el <strong>dedo pulgar derecho</strong> de la persona
          desconocida si es posible. Toma la foto bien enfocada y con buena
          luz, como en el ejemplo.
        </p>
      </div>

      {mensaje && enviando && (
        <p className="text-teal-300 text-sm">{mensaje} Procesando...</p>
      )}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        disabled={enviando}
        onClick={() => cameraInputRef.current?.click()}
        className="rounded-xl bg-teal-900/60 hover:bg-teal-900 disabled:opacity-50 transition-colors p-5 text-left"
      >
        <span className="text-lg font-semibold block">Tomar huella con el teléfono</span>
        <span className="text-neutral-300 text-sm">
          Usa la cámara para fotografiar la huella de la persona desconocida.
        </span>
      </button>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        disabled={enviando}
        onClick={() => fileInputRef.current?.click()}
        className="rounded-xl border border-neutral-700 hover:border-neutral-500 disabled:opacity-50 transition-colors p-5 text-left"
      >
        <span className="text-lg font-semibold block">Subir imagen de la huella</span>
        <span className="text-neutral-300 text-sm">
          Selecciona una foto o escaneo existente de la huella.
        </span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </main>
  );
}
