"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { BackButton } from "@/components/BackButton";
import { SKIP_GUIA_ESCANEO_KEY } from "@/lib/skip-guia-escaneo";

export default function GuiaEscanearPage() {
  const router = useRouter();
  const [noMostrarMas, setNoMostrarMas] = useState(false);

  function empezar() {
    if (noMostrarMas) {
      localStorage.setItem(SKIP_GUIA_ESCANEO_KEY, "true");
    }
    router.push("/escanear");
  }

  return (
    <main className="min-h-screen bg-[var(--fondo)] text-[var(--oscuro)] w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <BackButton href="/" />
        <h1 className="text-2xl font-display">Guía para colaboradores</h1>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-display leading-tight">
          Amigo Colaborador, gracias de antemano por ayudarnos con esta labor
        </h2>
        <p className="text-[var(--gris)] mt-3">
          Para realizar este proceso debes tener un <strong>huellero</strong> o
          un <strong>marcador permanente negro</strong> y una hoja de papel en
          blanco.
        </p>
      </div>

      <Image
        src="/escaner-paso-1.jpeg"
        alt="Colaborador preparando tinta y teléfono para fotografiar la huella"
        width={480}
        height={360}
        className="rounded-xl w-full max-w-[400px] aspect-[4/3] object-cover mx-auto"
      />

      <h2 className="text-xl font-display text-center">Pasos a seguir</h2>

      <ol className="flex flex-col gap-5">
        <li>
          <p className="font-display text-[var(--azul)]">1</p>
          <p className="text-[var(--oscuro)]">
            Limpia el <strong>PULGAR DERECHO</strong> de la persona desconocida.
          </p>
        </li>
        <li>
          <p className="font-display text-[var(--azul)]">2</p>
          <p className="text-[var(--oscuro)]">
            Colócale tinta con el huellero o con el marcador al dedo limpio
            (nota: no te excedas con la tinta para que la huella quede
            legible).
          </p>
        </li>
        <li>
          <p className="font-display text-[var(--azul)]">3</p>
          <p className="text-[var(--oscuro)] mb-3">
            Coloca el dedo en la superficie de la hoja sin presionar mucho,
            tal como se muestra en el ejemplo abajo.
          </p>
          <Image
            src="/escaner-paso-2.jpeg"
            alt="Tomando la huella de la persona encontrada sobre una hoja de papel"
            width={480}
            height={360}
            className="rounded-xl w-full max-w-[400px] aspect-[4/3] object-cover mx-auto"
          />
        </li>
        <li>
          <p className="font-display text-[var(--azul)]">4</p>
          <p className="text-[var(--oscuro)] mb-3">
            Toma una fotografía de la huella con la cámara del teléfono.
            Observa el ejemplo a continuación.
          </p>
          <Image
            src="/escaner-paso-3.jpeg"
            alt="Fotografiando la huella con la cámara del teléfono"
            width={480}
            height={360}
            className="rounded-xl w-full max-w-[400px] aspect-[4/3] object-cover mx-auto"
          />
        </li>
      </ol>

      <div>
        <Image
          src="/escaner-paso-4.jpeg"
          alt="Ejemplos de huellas: una legible (correcta) y dos borrosas (incorrectas)"
          width={480}
          height={160}
          className="rounded-xl w-full max-w-[400px] h-auto object-cover mx-auto"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--gris)] justify-center">
        <input
          type="checkbox"
          checked={noMostrarMas}
          onChange={(event) => setNoMostrarMas(event.target.checked)}
          className="w-4 h-4"
        />
        No mostrar esto de nuevo
      </label>

      <button
        onClick={empezar}
        className="rounded-xl bg-[var(--verde-ok)] hover:bg-[var(--verde-ok)]/90 text-white p-4 font-display shadow-[0_4px_15px_rgba(26,138,90,0.3)]"
      >
        ¡Listo! Ahora puede empezar
      </button>
    </main>
  );
}
