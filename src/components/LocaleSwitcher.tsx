"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(next: string) {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div
      className="flex items-center gap-2 text-sm"
      aria-label="Seleccionar idioma"
    >
      <button
        onClick={() => switchLocale("es")}
        disabled={isPending}
        aria-pressed={locale === "es"}
        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
          locale === "es"
            ? "font-semibold text-[var(--oscuro)]"
            : "text-[var(--gris)] hover:text-[var(--oscuro)]"
        }`}
      >
        🇻🇪 ES
      </button>
      <span className="text-[var(--gris-claro)]">|</span>
      <button
        onClick={() => switchLocale("en")}
        disabled={isPending}
        aria-pressed={locale === "en"}
        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
          locale === "en"
            ? "font-semibold text-[var(--oscuro)]"
            : "text-[var(--gris)] hover:text-[var(--oscuro)]"
        }`}
      >
        🇺🇸 EN
      </button>
    </div>
  );
}
