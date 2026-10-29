/**
 * Globalny moduł zarządzania zakresami czasowymi dla systemu TTscope.
 * Obsługuje zakresy: 1h, 8h, 24h, 7d, 30d (miesiąc) oraz dowolny przedział "od-do" (custom).
 * Wszystkie kalkulacje oparte o czas polski (Europe/Warsaw) i autentyczną datę ostatniej publikacji w bazie.
 */

export type TimeRangePreset = "1h" | "8h" | "24h" | "7d" | "30d" | "custom";

export interface TimeRangeFilter {
  preset: TimeRangePreset;
  from?: string; // ISO string UTC
  to?: string;   // ISO string UTC
}

export interface ResolvedTimeRange {
  preset: TimeRangePreset;
  label: string;
  shortLabel: string;
  fromIso: string;
  toIso: string;
  isCustom: boolean;
}

export const TIME_RANGE_PRESETS: ReadonlyArray<{
  preset: TimeRangePreset;
  label: string;
  shortLabel: string;
  hours?: number;
  days?: number;
}> = [
  { preset: "1h", label: "Ostatnia godzina (1h)", shortLabel: "1h", hours: 1 },
  { preset: "8h", label: "Ostatnie 8 godzin (8h)", shortLabel: "8h", hours: 8 },
  { preset: "24h", label: "Ostatnie 24 godziny (24h)", shortLabel: "24h", hours: 24 },
  { preset: "7d", label: "Ostatnie 7 dni", shortLabel: "7 dni", days: 7 },
  { preset: "30d", label: "Ostatni miesiąc (30 dni)", shortLabel: "Miesiąc", days: 30 },
  { preset: "custom", label: "Własny zakres (od - do)", shortLabel: "Od - do" },
];

export function isTimeRangePreset(val: string): val is TimeRangePreset {
  return TIME_RANGE_PRESETS.some((p) => p.preset === val);
}

/**
 * Rozwiązuje zakres czasowy na bezwzględne znaczniki czasu ISO UTC.
 * Jeśli preset jest względny (1h, 8h, 24h, 7d, 30d), punktem odniesienia jest
 * `referenceTimeIso` (najnowszy rekord w bazie lub aktualny czas).
 */
export function resolveTimeRange(
  params: { preset?: string | null; from?: string | null; to?: string | null },
  referenceTimeIso?: string | null
): ResolvedTimeRange {
  const refTime = referenceTimeIso ? new Date(referenceTimeIso).getTime() : Date.now();
  const refDate = new Date(Number.isNaN(refTime) ? Date.now() : refTime);

  const presetParam = params.preset;
  const isCustom = presetParam === "custom" || Boolean(params.from && params.to && !presetParam);

  if (isCustom && params.from) {
    const fromDate = new Date(params.from);
    const toDate = params.to ? new Date(params.to) : new Date(refDate.getTime() + 60000);
    const validFrom = !Number.isNaN(fromDate.getTime()) ? fromDate.toISOString() : new Date(refDate.getTime() - 24 * 3600000).toISOString();
    const validTo = !Number.isNaN(toDate.getTime()) ? toDate.toISOString() : refDate.toISOString();

    return {
      preset: "custom",
      label: "Zakres zdefiniowany (od - do)",
      shortLabel: "Od - do",
      fromIso: validFrom,
      toIso: validTo,
      isCustom: true,
    };
  }

  const matchedPreset = TIME_RANGE_PRESETS.find((p) => p.preset === presetParam) || TIME_RANGE_PRESETS[2]; // Domyślnie 24h

  let fromMillis = refDate.getTime() - 24 * 3600000;
  if (matchedPreset.hours) {
    fromMillis = refDate.getTime() - matchedPreset.hours * 3600000;
  } else if (matchedPreset.days) {
    fromMillis = refDate.getTime() - matchedPreset.days * 24 * 3600000;
  }

  // toIso ustawiamy na 5 minut po najnowszym rekordzie, by nie uciąć publikacji z tą samą sekundą
  const toMillis = refDate.getTime() + 5 * 60000;

  return {
    preset: matchedPreset.preset,
    label: matchedPreset.label,
    shortLabel: matchedPreset.shortLabel,
    fromIso: new Date(fromMillis).toISOString(),
    toIso: new Date(toMillis).toISOString(),
    isCustom: false,
  };
}

/**
 * Generuje string parametrów URL z zachowaniem bieżącego zakresu czasowego.
 */
export function buildTimeRangeParams(
  current: { preset?: string; from?: string; to?: string },
  otherParams?: Record<string, string | undefined>
): string {
  const sp = new URLSearchParams();
  if (current.preset && current.preset !== "custom") {
    sp.set("time_range", current.preset);
  } else if (current.from) {
    sp.set("time_range", "custom");
    sp.set("from", current.from);
    if (current.to) sp.set("to", current.to);
  }

  if (otherParams) {
    Object.entries(otherParams).forEach(([k, v]) => {
      if (v !== undefined && v !== "") sp.set(k, v);
    });
  }

  const str = sp.toString();
  return str ? `?${str}` : "";
}
