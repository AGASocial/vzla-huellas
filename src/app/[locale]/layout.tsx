import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { APP_VERSION } from "@/lib/version";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import "../globals.css";

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

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();

  setRequestLocale(locale);

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "layout" });

  return (
    <html
      lang={locale}
      className={`${spaceGrotesk.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--fondo)]">
        <NextIntlClientProvider messages={messages}>
          <div className="h-[5px] w-full bg-[linear-gradient(to_right,var(--amarillo)_33.33%,var(--azul)_33.33%,var(--azul)_66.66%,var(--rojo)_66.66%)]" />
          <div className="flex justify-end px-4 sm:px-8 py-2 border-b border-[var(--gris-claro)] bg-[var(--fondo)]">
            <LocaleSwitcher />
          </div>
          <div className="flex-1">{children}</div>
          <footer className="w-full mx-auto px-4 sm:px-8 py-6 text-center bg-[var(--oscuro)]">
            <p className="text-[var(--amarillo)] text-xs">
              <strong>{t("footer_disclaimer_label")}:</strong>{" "}
              {t("footer_disclaimer_body")}
            </p>
            <p className="text-white/80 text-xs mt-3">{t("footer_humanitarian")}</p>
            <p className="text-white/60 text-xs mt-1">{t("footer_credits")}</p>
            <p className="text-[var(--amarillo)]/60 text-xs mt-2">
              {t("footer_version", { version: APP_VERSION })}
            </p>
          </footer>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
