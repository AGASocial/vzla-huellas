import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import { APP_VERSION, APP_COMMIT_SHA } from "@/lib/version";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reencuentro - Registro y comparación de huellas",
  description: "Herramienta humanitaria para reencontrar familias en Venezuela",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--fondo)]">
        <div className="h-[5px] w-full bg-[linear-gradient(to_right,var(--amarillo)_33.33%,var(--azul)_33.33%,var(--azul)_66.66%,var(--rojo)_66.66%)]" />
        <div className="flex-1">{children}</div>
        <footer className="w-full mx-auto px-4 sm:px-8 py-6 text-center bg-[var(--oscuro)]">
          <p className="text-[var(--amarillo)] text-xs">
            <strong>Aviso importante:</strong> esta herramienta usa
            comparación de imágenes de huellas digitales por similitud visual y sirve
            como <strong>primer filtro orientativo</strong>, no es un sistema
            biométrico forense certificado. Toda coincidencia debe
            confirmarse con autoridades, Cruz Roja u organismos forenses
            competentes antes de actuar.
          </p>
          <p className="text-white/80 text-xs mt-3">
            Este es un servicio de ayuda humanitaria, gratuito y sin fines de
            lucro.
          </p>
          <p className="text-white/60 text-xs mt-1">
            Realizado por Alejandro Trujillo y Gabriel Vega
          </p>
          <p className="text-[var(--amarillo)]/60 text-xs mt-2">
            Versión: {APP_VERSION}
          </p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
