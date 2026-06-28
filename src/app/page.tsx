import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--fondo)] text-[var(--oscuro)] w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-8">
      <header className="flex flex-col gap-1 bg-[var(--oscuro)] text-white -mx-4 sm:-mx-8 -mt-6 sm:-mt-10 px-4 sm:px-8 py-6 sm:py-10 mb-2">
        <h1 className="text-3xl font-display">Reencuentro</h1>
        <p className="text-[var(--amarillo)] text-sm">
          Registro y comparación de huellas — Venezuela
        </p>
      </header>

      <nav className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/familiares/nuevo"
          className="rounded-xl bg-[var(--azul)] hover:bg-[var(--azul)]/90 text-white transition-colors p-6 flex flex-col gap-1 shadow-[0_4px_20px_rgba(0,36,125,0.35)]"
        >
          <span className="text-lg font-display">Sube los datos de tu familiar</span>
          <span className="text-white/80 text-sm">
            Registra a la persona desaparecida con su huella e información de
            contacto.
          </span>
        </Link>

        <Link
          href="/escanear"
          className="rounded-xl bg-[var(--rojo)] hover:bg-[var(--rojo)]/90 text-white transition-colors p-6 flex flex-col gap-1 shadow-[0_4px_20px_rgba(207,20,43,0.35)]"
        >
          <span className="text-lg font-display">Escanear huellas</span>
          <span className="text-white/80 text-sm">
            Toma o sube la huella de una persona desaparecida o fallecida para
            buscar coincidencias.
          </span>
        </Link>

        <Link
          href="/base-datos"
          className="rounded-xl bg-white border border-[var(--gris-claro)] hover:border-[var(--oscuro)]/40 transition-colors p-6 flex flex-col gap-1 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
        >
          <span className="text-lg font-display">Ver base de datos</span>
          <span className="text-[var(--gris)] text-sm">
            Busca un registro por documento, correo o teléfono.
          </span>
        </Link>
      </nav>
    </main>
  );
}
