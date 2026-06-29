import Link from "next/link";

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className ?? ""}`}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--fondo)] text-[var(--oscuro)] w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-8">
      <header className="flex flex-col gap-1 bg-[var(--oscuro)] text-white -mx-4 sm:-mx-8 -mt-6 sm:-mt-10 px-4 sm:px-8 py-6 sm:py-10 mb-2">
        <h1 className="text-4xl font-display">Reencuentro</h1>
        <p className="text-[var(--amarillo)] text-2xl">
          Registro y comparación de huellas digitales - Venezuela
        </p>
      </header>

      <div className="rounded-2xl bg-[var(--oscuro)] text-white p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-[var(--amarillo)] opacity-15 -translate-y-8 translate-x-8" />
        <h2 className="text-2xl sm:text-3xl font-display leading-tight relative">
          Cada huella <span className="text-[var(--amarillo)]">es una vida</span> que
          busca a alguien
        </h2>
        <p className="text-white/70 text-2xl mt-3 relative">
          Sistema de identificación biométrica para personas desaparecidas o no
          identificadas en Venezuela.
        </p>
      </div>

      <nav className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <h3 className="text-2xl font-display uppercase tracking-wide text-[var(--gris)]">
            Para familiares
          </h3>
          <Link
            href="/familiares/nuevo"
            className="rounded-xl bg-[var(--azul)] hover:bg-[var(--azul)]/90 active:scale-[0.98] text-white transition-all p-6 flex flex-col gap-1 shadow-[0_4px_20px_rgba(0,36,125,0.35)]"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="text-2xl font-display">Si eres un familiar, <u>haz click aquí</u></span>
              <ChevronIcon className="text-white" />
            </span>
            <span className="text-white/80 text-2xl">
              Si estas buscando un familiar y tiene algun documento donde aparezca la huella digital LEGIBLE de esa persona entra aqui y sigue los pasos a continuacion.
            </span>
          </Link>
          <Link
            href="/base-datos"
            className="rounded-xl bg-white border-2 border-[var(--gris-claro)] hover:border-[var(--oscuro)]/40 active:scale-[0.98] transition-all p-6 flex flex-col gap-1 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="text-2xl font-display">Busca aquí a tu familiar ya registrado <u>haz click aquí</u></span>
              <ChevronIcon className="text-[var(--oscuro)]" />
            </span>
            <span className="text-[var(--gris)] text-2xl">
              Busca un registro por documento de identidad, correo o teléfono.
            </span>
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-2xl font-display uppercase tracking-wide text-[var(--gris)]">
            Para colaboradores
          </h3>
          <Link
            href="/escanear"
            className="rounded-xl bg-[var(--verde-ok)] hover:bg-[var(--verde-ok)]/90 active:scale-[0.98] text-white transition-all p-6 flex flex-col gap-1 shadow-[0_4px_20px_rgba(26,138,90,0.35)]"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="text-2xl font-display">Ayúdanos a registrar huellas digitales en todas partes <u>haz click aquí</u></span>
              <ChevronIcon className="text-white" />
            </span>
            <span className="text-white/80 text-2xl">
              Ayudanos a registrar huellas digitales de fallecidos y personas heridas o perdidas entrando a esta opción y siguiendo los pasos a continuacion.
            </span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
