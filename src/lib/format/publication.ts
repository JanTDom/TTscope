import type { EventStage } from "../db/types";

/**
 * Strefa czasowa, w której analityk czyta godziny. Ustawiona jawnie, bo serwer
 * (np. Vercel w UTC) i przeglądarka mogą mieć różne strefy, a godzina ukazania
 * się materiału musi być identyczna w każdym widoku i w raportach.
 */
const DISPLAY_TIME_ZONE = "Europe/Warsaw";

/** Komunikat dla rekordu, którego źródło nie podało daty publikacji. */
export const MISSING_PUBLICATION_TIME = "Źródło nie podało daty publikacji";

const publicationFormatter = new Intl.DateTimeFormat("pl-PL", {
  timeZone: DISPLAY_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * Formatuje godzinę ukazania się materiału w źródle.
 *
 * Celowo nie przyjmuje daty pobrania: brak daty publikacji jest pokazywany
 * wprost, a nie zastępowany momentem, w którym system ściągnął rekord.
 */
export function formatPublicationTime(publishedAt: string | null | undefined): string {
  if (!publishedAt) return MISSING_PUBLICATION_TIME;
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return MISSING_PUBLICATION_TIME;

  const parts = publicationFormatter.formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${pick("day")}.${pick("month")}.${pick("year")}, godz. ${pick("hour")}:${pick("minute")}`;
}

export const EVENT_STAGE_LABELS: Readonly<Record<EventStage, string>> = {
  single_mention: "Pojedyncza wzmianka",
  verification_signal: "Sygnał do weryfikacji",
  local_cluster: "Lokalne ognisko",
  growing_topic: "Temat rosnący",
  media_crisis: "Kryzys medialny",
  multichannel_crisis: "Kryzys wielokanałowy",
  confirmed_crisis: "Kryzys potwierdzony",
};

export function formatEventStage(stage: string): string {
  return (EVENT_STAGE_LABELS as Readonly<Record<string, string>>)[stage] ?? "Etap nieokreślony";
}

const DIFFUSION_STEP_LABELS: Readonly<Record<string, string>> = {
  origin: "Pierwsze źródło",
  rebuttal: "Stanowisko ORLEN",
  labor_signal: "Sygnał związkowy lub pracowniczy",
  industry_media: "Portal branżowy",
  local_pickup: "Media regionalne",
  national_media: "Media ogólnopolskie",
};

export function formatDiffusionStep(step: string): string {
  return DIFFUSION_STEP_LABELS[step] ?? "Rola nieokreślona";
}
