"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import Image from "next/image";
import { BackButton } from "@/components/BackButton";
import { SKIP_GUIA_ESCANEO_KEY } from "@/lib/skip-guia-escaneo";
import { useTranslations } from "next-intl";

export default function GuiaEscanearPage() {
  const router = useRouter();
  const [noMostrarMas, setNoMostrarMas] = useState(false);
  const t = useTranslations("guia");

  function empezar() {
    if (noMostrarMas) localStorage.setItem(SKIP_GUIA_ESCANEO_KEY, "true");
    router.push("/escanear");
  }

  return (
    <main className="min-h-screen bg-[var(--fondo)] text-[var(--oscuro)] w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <BackButton href="/" />
        <h1 className="text-2xl font-display">{t("title")}</h1>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-display leading-tight">
          {t("gracias")}
        </h2>
        <p className="text-[var(--gris)] mt-3">
          {t.rich("materiales", { strong: (chunks) => <strong>{chunks}</strong> })}
        </p>
      </div>

      <Image src="/escaner-paso-1.jpeg" alt={t("paso0_alt")}
        width={480} height={360} className="rounded-xl w-full max-w-[400px] aspect-[4/3] object-cover mx-auto" />

      <h2 className="text-xl font-display text-center">{t("pasos_titulo")}</h2>

      <ol className="flex flex-col gap-5">
        <li>
          <p className="font-display text-[var(--azul)]">1</p>
          <p className="text-[var(--oscuro)]">{t.rich("paso1", { strong: (chunks) => <strong>{chunks}</strong> })}</p>
        </li>
        <li>
          <p className="font-display text-[var(--azul)]">2</p>
          <p className="text-[var(--oscuro)]">{t("paso2")}</p>
        </li>
        <li>
          <p className="font-display text-[var(--azul)]">3</p>
          <p className="text-[var(--oscuro)] mb-3">{t("paso3")}</p>
          <Image src="/escaner-paso-2.jpeg" alt={t("paso3_img_alt")}
            width={480} height={360} className="rounded-xl w-full max-w-[400px] aspect-[4/3] object-cover mx-auto" />
        </li>
        <li>
          <p className="font-display text-[var(--azul)]">4</p>
          <p className="text-[var(--oscuro)] mb-3">{t("paso4")}</p>
          <Image src="/escaner-paso-3.jpeg" alt={t("paso4_img_alt")}
            width={480} height={360} className="rounded-xl w-full max-w-[400px] aspect-[4/3] object-cover mx-auto" />
        </li>
      </ol>

      <div>
        <Image src="/escaner-paso-4.jpeg" alt={t("ejemplos_alt")}
          width={480} height={160} className="rounded-xl w-full max-w-[400px] h-auto object-cover mx-auto" />
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--gris)] justify-center">
        <input type="checkbox" checked={noMostrarMas} onChange={(event) => setNoMostrarMas(event.target.checked)} className="w-4 h-4" />
        {t("no_mostrar")}
      </label>

      <button onClick={empezar} className="rounded-xl bg-[var(--verde-ok)] hover:bg-[var(--verde-ok)]/90 text-white p-4 font-display shadow-[0_4px_15px_rgba(26,138,90,0.3)]">
        {t("empezar")}
      </button>
    </main>
  );
}
