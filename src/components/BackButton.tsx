"use client";

import { useRouter } from "next/navigation";

export function BackButton({ href }: { href?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => (href ? router.push(href) : router.back())}
      aria-label="Volver"
      className="inline-flex items-center justify-center w-9 h-9 shrink-0 rounded-[10px] border border-[var(--gris-claro)] bg-white text-[var(--oscuro)] hover:bg-[var(--gris-claro)] transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-5 h-5"
      >
        <path
          fillRule="evenodd"
          d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}
