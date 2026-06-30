"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ConfirmarMatchForm } from "@/components/ConfirmarMatchForm";
import { BackButton } from "@/components/BackButton";

type HuellaDesconocida = {
  id: string;
  huella_url: string;
  observaciones: string | null;
  direccion: string | null;
  estado: string | null;
  latitud: number | null;
  longitud: number | null;
  created_at: string;
};

type Candidato = { huellaDesconocida: HuellaDesconocida; score: number };

function formatearFecha(fechaIso: string) {
  return new Date(fechaIso).toLocaleString("es-VE", {
    timeZone: "America/Caracas",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).replace(",", "");
}

export default function CandidatosFamiliarPage() {
  const t = useTranslations("candidatos_familiar");
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const allowConfirm = searchParams.get("origen") === "base-datos";
  const [huellaUrl, setHuellaUrl] = useState<string | null>(null);
  const [nombre, setNombre] = useState<string | null>(null);
  const [numeroDocumento, setNumeroDocumento] = useState<string | null>(null);
  const [fechaCreado, setFechaCreado] = useState<string | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[] | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState<{
    nombre_contacto: string;
    telefono_contacto: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/familiares/${params.id}/candidatos`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setHuellaUrl(data.familiar.huella_url);
        setNombre(data.familiar.nombre_completo);
        setNumeroDocumento(data.familiar.numero_documento);
        setFechaCreado(data.familiar.created_at);
        setCandidatos(data.candidatos);
      })
      .catch(() => setError(t("error_cargar")));
  }, [params.id, t]);


  if (confirmado) {
    return (
      <main className="min-h-screen bg-[var(--fondo)] text-[var(--oscuro)] w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <BackButton href="/" />
          <h1 className="text-2xl font-display">{t("coincidencia_title")}</h1>
        </div>
        <p className="text-[var(--gris)]">
          {t("coincidencia_subtitle")}
        </p>
        <div className="rounded-lg bg-[var(--verde-ok)]/10 border border-[var(--verde-ok)]/30 p-4">
          <p className="font-semibold">{confirmado.nombre_contacto}</p>
          <p className="text-[var(--gris)]">{confirmado.telefono_contacto}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--fondo)] text-[var(--oscuro)] w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <BackButton href="/" />
          <h1 className="text-2xl font-display">
            {allowConfirm ? t("title_confirm") : t("title_readonly")}
          </h1>
        </div>
        <p className="text-[var(--gris)] text-sm">
          {allowConfirm
            ? t("subtitle_confirm")
            : nombre
            ? t("subtitle_readonly", { nombre })
            : null}
        </p>
      </div>

      {nombre && (
        <div className="rounded-lg bg-white border border-[var(--gris-claro)] p-3 flex items-center gap-3">
          {huellaUrl && (
            <Image
              src={huellaUrl}
              alt={t("huella_registrada_alt")}
              width={128}
              height={128}
              className="rounded-lg w-32 h-32 object-cover shrink-0"
            />
          )}
          <div>
            <p className="text-sm text-[var(--gris)]">{t("buscando_a")}</p>
            <p className="font-semibold">
              {nombre}
              {numeroDocumento && numeroDocumento.length >= 4 && (
                <span className="text-[var(--gris)] font-normal">
                  {" "}
                  - {t("doc_termina_en", { digitos: numeroDocumento.slice(-4) })}
                </span>
              )}
            </p>
            {fechaCreado && (
              <p className="text-sm text-[var(--gris)]">
                {t("registro_creado", { fecha: formatearFecha(fechaCreado) })}
              </p>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-[var(--rojo)] text-sm">{error}</p>}

      {candidatos === null && !error && (
        <div className="flex items-center gap-3 text-[var(--gris)]">
          <span className="inline-block w-4 h-4 rounded-full border-2 border-[var(--gris-claro)] border-t-[var(--azul)] animate-spin" />
          <p>{t("spinner")}</p>
        </div>
      )}

      {candidatos !== null && (candidatos ?? []).length === 0 && (
        <p className="text-[var(--gris)]">
          {t("sin_huellas")}
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {(candidatos ?? []).map(({ huellaDesconocida, score }) => (
          <li
            key={huellaDesconocida.id}
            className="rounded-xl bg-white border border-[var(--gris-claro)] p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-3">
              <Image
                src={huellaDesconocida.huella_url}
                alt={t("huella_desconocida_alt")}
                width={64}
                height={64}
                className="rounded-lg w-16 h-16 object-cover"
              />
              <div>
                <p className="text-sm text-[var(--gris)]">{t("score_label", { score })}</p>
                {huellaDesconocida.direccion && (
                  <p className="text-sm text-[var(--oscuro)]">{huellaDesconocida.direccion}</p>
                )}
                {huellaDesconocida.estado && (
                  <p className="text-sm text-[var(--oscuro)]">
                    {t("estado_label")}{" "}
                    {huellaDesconocida.estado === "fallecido" ? t("estado_fallecido") : t("estado_con_vida")}
                  </p>
                )}
                {huellaDesconocida.latitud != null && huellaDesconocida.longitud != null && (
                  <a
                    href={`https://www.google.com/maps?q=${huellaDesconocida.latitud},${huellaDesconocida.longitud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--azul)] underline"
                  >
                    {t("ver_mapa")}
                  </a>
                )}
                {huellaDesconocida.observaciones && (
                  <p className="text-sm text-[var(--oscuro)] mt-1">
                    <span className="text-[var(--gris)]">{t("observacion_label")} </span>
                    {huellaDesconocida.observaciones}
                  </p>
                )}
                <p className="text-sm text-[var(--gris)] mt-1">
                  {t("registro_creado", { fecha: formatearFecha(huellaDesconocida.created_at) })}
                </p>
              </div>
            </div>

            {allowConfirm &&
              (abierto !== huellaDesconocida.id ? (
                <button
                  onClick={() => setAbierto(huellaDesconocida.id)}
                  className="rounded-lg border border-[var(--verde-ok)] text-[var(--verde-ok)] hover:bg-[var(--verde-ok)]/10 py-2 text-sm font-semibold"
                >
                  {t("confirmar_btn")}
                </button>
              ) : (
                <ConfirmarMatchForm
                  huellaDesconocidaId={huellaDesconocida.id}
                  familiarId={params.id}
                  onConfirmado={setConfirmado}
                />
              ))}
          </li>
        ))}
      </ul>
    </main>
  );
}
