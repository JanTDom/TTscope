/**
 * Agregacje rytmu publikacji liczone wyłącznie z zapisanych dokumentów.
 * Wspiera agregację dobową (Daily) oraz godzinową (Hourly) dla krótszych okien (1h, 8h, 24h).
 * Wszystkie ramy czasowe kalkulowane są w strefie Europe/Warsaw.
 */

const ZONE = "Europe/Warsaw";
const DAY_MS = 24 * 3600 * 1000;
const HOUR_MS = 3600 * 1000;

export const COMMUNICATION_CHANNELS = ["official", "labor", "external"] as const;
export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];

export function isCommunicationChannel(value: string): value is CommunicationChannel {
  return (COMMUNICATION_CHANNELS as readonly string[]).includes(value);
}

export interface RhythmSourceRow {
  published_at: string | null;
  is_orlen_official: boolean;
  is_labor_signal: boolean;
}

export interface RhythmBucket {
  key: string;       // YYYY-MM-DD lub YYYY-MM-DD HH:00
  label: string;     // Etykieta wyświetlana na osi X (np. "14:00" lub "29.10")
  fullLabel: string; // Pełny opis w tooltipie (np. "29.10.2026, godz. 14:00-14:59")
  official: number;
  labor: number;
  external: number;
  fromIso: string;
  toIso: string;
}

export type DailyRhythmBucket = RhythmBucket;

/** Ten sam podział co w strefach komunikacji: oficjalne > związkowe > media. */
export function classifyChannel(row: Pick<RhythmSourceRow, "is_orlen_official" | "is_labor_signal">): CommunicationChannel {
  if (row.is_orlen_official) return "official";
  if (row.is_labor_signal) return "labor";
  return "external";
}

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Klucz dnia `YYYY-MM-DD` w strefie Europe/Warsaw albo `null` dla złej daty. */
export function warsawDayKey(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return dayFormatter.format(date);
}

function zoneOffsetMs(instant: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - instant;
}

function warsawMidnightUtc(dayKey: string): number {
  const [year, month, day] = dayKey.split("-").map(Number);
  const naive = Date.UTC(year, month - 1, day);
  const firstGuess = naive - zoneOffsetMs(naive);
  return naive - zoneOffsetMs(firstGuess);
}

const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Granice doby w UTC (od włącznie, do wyłącznie), także w dni zmiany czasu. */
export function warsawDayBoundsUtc(dayKey: string): { from: string; to: string } {
  if (!DAY_KEY_PATTERN.test(dayKey)) {
    throw new Error(`Nieprawidłowy klucz dnia: ${dayKey}`);
  }
  const start = warsawMidnightUtc(dayKey);
  const nextKey = warsawDayKey(new Date(start + DAY_MS + 3 * 3600 * 1000).toISOString());
  if (!nextKey) throw new Error(`Nie można wyznaczyć następnego dnia dla ${dayKey}`);
  return { from: new Date(start).toISOString(), to: new Date(warsawMidnightUtc(nextKey)).toISOString() };
}

/** Kolejne klucze dni kończące się na `endDayKey` (włącznie). */
export function lastDayKeys(endDayKey: string, days: number): string[] {
  const end = warsawMidnightUtc(endDayKey) + 12 * 3600 * 1000;
  const keys: string[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const key = warsawDayKey(new Date(end - offset * DAY_MS).toISOString());
    if (key) keys.push(key);
  }
  return keys;
}

/** Buduje kubełki dobowe (dla widoku 7 dni, 30 dni lub wielodniowego od-do). */
export function buildDailyRhythm(rows: readonly RhythmSourceRow[], dayKeys: readonly string[]): RhythmBucket[] {
  const buckets = new Map<string, RhythmBucket>();

  for (const day of dayKeys) {
    const bounds = warsawDayBoundsUtc(day);
    const parts = day.split("-");
    const m = parts[1];
    const d = parts[2];
    buckets.set(day, {
      key: day,
      label: `${d}.${m}`,
      fullLabel: `${d}.${m}.${parts[0]}`,
      official: 0,
      labor: 0,
      external: 0,
      fromIso: bounds.from,
      toIso: bounds.to,
    });
  }

  for (const row of rows) {
    if (!row.published_at) continue;
    const key = warsawDayKey(row.published_at);
    const bucket = key ? buckets.get(key) : undefined;
    if (bucket) bucket[classifyChannel(row)] += 1;
  }

  return dayKeys.map((day) => buckets.get(day) as RhythmBucket);
}

/**
 * Buduje kubełki godzinowe dla widoków krótkoterminowych (1h, 8h, 24h).
 * Generuje ciągły przedział slotów godzinowych od `fromIso` do `toIso`.
 */
export function buildHourlyRhythm(
  rows: readonly RhythmSourceRow[],
  fromIso: string,
  toIso: string
): RhythmBucket[] {
  const fromTime = new Date(fromIso).getTime();
  const toTime = new Date(toIso).getTime();

  // Zaokrąglenie w dół do pełnej godziny
  const startHourEpoch = Math.floor(fromTime / HOUR_MS) * HOUR_MS;
  const endHourEpoch = Math.ceil(toTime / HOUR_MS) * HOUR_MS;

  const buckets: RhythmBucket[] = [];
  const hourFormatter = new Intl.DateTimeFormat("pl-PL", {
    timeZone: ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const fullFormatter = new Intl.DateTimeFormat("pl-PL", {
    timeZone: ZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  for (let t = startHourEpoch; t < endHourEpoch; t += HOUR_MS) {
    const dStart = new Date(t);
    const dEnd = new Date(t + HOUR_MS);
    const key = dStart.toISOString().slice(0, 13);
    const label = hourFormatter.format(dStart);
    const fullLabel = `${fullFormatter.format(dStart)} - ${hourFormatter.format(dEnd)}`;

    buckets.push({
      key,
      label,
      fullLabel,
      official: 0,
      labor: 0,
      external: 0,
      fromIso: dStart.toISOString(),
      toIso: dEnd.toISOString(),
    });
  }

  for (const row of rows) {
    if (!row.published_at) continue;
    const pubTime = new Date(row.published_at).getTime();
    if (pubTime < fromTime || pubTime > toTime) continue;

    const slotEpoch = Math.floor(pubTime / HOUR_MS) * HOUR_MS;
    const matched = buckets.find((b) => new Date(b.fromIso).getTime() === slotEpoch);
    if (matched) {
      matched[classifyChannel(row)] += 1;
    }
  }

  return buckets;
}
