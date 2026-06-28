"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
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
    <main className="min-h-screen bg-neutral-950 text-white px-6 py-10 max-w-md mx-auto flex flex-col gap-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold mb-1">Escanear huellas</h1>
        <p className="text-neutral-400 text-sm">
          Toma o sube la huella de una persona desaparecida o fallecida para
          buscar coincidencias.
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
