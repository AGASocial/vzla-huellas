import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-serif font-bold">Reencuentro</h1>
        <p className="text-neutral-400 text-sm">
          Registro y comparación de huellas — Venezuela
        </p>
      </header>

      <div className="rounded-lg border border-amber-700/50 bg-amber-950/40 text-amber-200 text-sm p-4">
        <strong>Aviso importante:</strong> esta herramienta usa comparación de
        imágenes de huellas por similitud visual y sirve como{" "}
        <strong>primer filtro orientativo</strong>, no es un sistema biométrico
        forense certificado. Toda coincidencia debe confirmarse con
        autoridades, Cruz Roja u organismos forenses competentes antes de
        actuar.
      </div>

      <nav className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/familiares/nuevo"
          className="rounded-xl bg-teal-900/60 hover:bg-teal-900 transition-colors p-6 flex flex-col gap-1"
        >
          <span className="text-lg font-semibold">Sube los datos de tu familiar</span>
          <span className="text-neutral-300 text-sm">
            Registra a la persona desaparecida con su huella e información de
            contacto.
          </span>
        </Link>

        <Link
          href="/escanear"
          className="rounded-xl bg-teal-900/60 hover:bg-teal-900 transition-colors p-6 flex flex-col gap-1"
        >
          <span className="text-lg font-semibold">Escanear huellas</span>
          <span className="text-neutral-300 text-sm">
            Toma o sube la huella de una persona desaparecida o fallecida para
            buscar coincidencias.
          </span>
        </Link>

        <Link
          href="/candidatos"
          className="rounded-xl border border-neutral-700 hover:border-neutral-500 transition-colors p-6 flex flex-col gap-1"
        >
          <span className="text-lg font-semibold">Ver huellas sin identificar</span>
          <span className="text-neutral-300 text-sm">
            Revisa huellas desconocidas pendientes de coincidencia.
          </span>
        </Link>
      </nav>
    </main>
  );
}
