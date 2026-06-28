import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { APP_VERSION } from "@/lib/version";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reencuentro — Registro y comparación de huellas",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950">
        <div className="flex-1">{children}</div>
        <footer className="w-full mx-auto px-4 sm:px-8 py-6 text-center bg-neutral-950">
          <p className="text-amber-200 text-xs">
            Esta es una herramienta de ayuda comunitaria, no un servicio
            oficial ni un sistema biométrico forense. Úsala bajo tu propio
            riesgo y verifica siempre las imágenes y datos antes de actuar.
            Toda coincidencia debe confirmarse con autoridades, Cruz Roja u
            organismos forenses competentes.
          </p>
          <p className="text-amber-200/60 text-xs mt-2">Versión {APP_VERSION}</p>
        </footer>
      </body>
    </html>
  );
}
