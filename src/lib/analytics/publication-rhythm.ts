/**
 * Agregacje rytmu publikacji liczone wyłącznie z zapisanych dokumentów.
 * Dni są wyznaczane w strefie Europe/Warsaw, bo tak analityk czyta kalendarz.
 */

const ZONE = "Europe/Warsaw";
const DAY_MS = 24 * 3600 * 1000;

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

export interface DailyRhythmBucket {
  day: string;
  official: number;
  labor: number;
  external: number;
}

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

export function buildDailyRhythm(rows: readonly RhythmSourceRow[], dayKeys: readonly string[]): DailyRhythmBucket[] {
  const buckets = new Map<string, DailyRhythmBucket>(
    dayKeys.map((day) => [day, { day, official: 0, labor: 0, external: 0 }])
  );
  for (const row of rows) {
    if (!row.published_at) continue;
    const key = warsawDayKey(row.published_at);
    const bucket = key ? buckets.get(key) : undefined;
    if (bucket) bucket[classifyChannel(row)] += 1;
  }
  return dayKeys.map((day) => buckets.get(day) as DailyRhythmBucket);
}
