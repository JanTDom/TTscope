import { describe, expect, it } from "vitest";
import {
  buildDailyRhythm,
  buildHourlyRhythm,
  classifyChannel,
  isCommunicationChannel,
  lastDayKeys,
  warsawDayBoundsUtc,
  warsawDayKey,
} from "../analytics/publication-rhythm";

describe("warsawDayKey", () => {
  it("przypisuje publikację z 23:30 UTC do następnego dnia w Polsce", () => {
    expect(warsawDayKey("2026-10-28T23:30:00.000Z")).toBe("2026-10-29");
  });

  it("zwraca null dla nieprawidłowej daty", () => {
    expect(warsawDayKey("abc")).toBeNull();
  });
});

describe("warsawDayBoundsUtc", () => {
  it("wyznacza dobę zimową (UTC+1)", () => {
    expect(warsawDayBoundsUtc("2026-10-29")).toEqual({
      from: "2026-10-28T23:00:00.000Z",
      to: "2026-10-29T23:00:00.000Z",
    });
  });

  it("wyznacza dobę letnią (UTC+2)", () => {
    expect(warsawDayBoundsUtc("2026-07-10")).toEqual({
      from: "2026-07-09T22:00:00.000Z",
      to: "2026-07-10T22:00:00.000Z",
    });
  });

  it("obsługuje dobę zmiany czasu (25 godzin)", () => {
    expect(warsawDayBoundsUtc("2026-10-25")).toEqual({
      from: "2026-10-24T22:00:00.000Z",
      to: "2026-10-25T23:00:00.000Z",
    });
  });

  it("odrzuca nieprawidłowy klucz", () => {
    expect(() => warsawDayBoundsUtc("29.10.2026")).toThrow();
  });
});

describe("lastDayKeys", () => {
  it("zwraca ciągłe dni przez zmianę czasu", () => {
    expect(lastDayKeys("2026-10-26", 3)).toEqual(["2026-10-24", "2026-10-25", "2026-10-26"]);
  });
});

describe("classifyChannel i buildDailyRhythm", () => {
  it("oficjalny komunikat z tematyką pracowniczą liczy się jako oficjalny", () => {
    expect(classifyChannel({ is_orlen_official: true, is_labor_signal: true })).toBe("official");
  });

  it("zlicza publikacje per kanał i pomija rekordy bez daty oraz spoza okna", () => {
    const rhythm = buildDailyRhythm(
      [
        { published_at: "2026-10-29T08:00:00.000Z", is_orlen_official: true, is_labor_signal: false },
        { published_at: "2026-10-29T09:00:00.000Z", is_orlen_official: false, is_labor_signal: true },
        { published_at: "2026-10-28T09:00:00.000Z", is_orlen_official: false, is_labor_signal: false },
        { published_at: null, is_orlen_official: false, is_labor_signal: false },
        { published_at: "2026-09-01T09:00:00.000Z", is_orlen_official: false, is_labor_signal: false },
      ],
      ["2026-10-28", "2026-10-29"]
    );
    expect(rhythm.map(r => ({ key: r.key, official: r.official, labor: r.labor, external: r.external }))).toEqual([
      { key: "2026-10-28", official: 0, labor: 0, external: 1 },
      { key: "2026-10-29", official: 1, labor: 1, external: 0 },
    ]);
  });

  it("waliduje nazwę kanału z adresu URL", () => {
    expect(isCommunicationChannel("labor")).toBe(true);
    expect(isCommunicationChannel("DROP TABLE")).toBe(false);
  });

  it("buduje kubełki godzinowe dla widoku krótkoterminowego", () => {
    const from = "2026-10-29T10:00:00.000Z";
    const to = "2026-10-29T13:00:00.000Z";
    const rows = [
      { published_at: "2026-10-29T10:15:00.000Z", is_orlen_official: true, is_labor_signal: false },
      { published_at: "2026-10-29T11:45:00.000Z", is_orlen_official: false, is_labor_signal: true },
    ];
    const buckets = buildHourlyRhythm(rows, from, to);
    expect(buckets.length).toBe(3);
    expect(buckets[0].official).toBe(1);
    expect(buckets[1].labor).toBe(1);
    expect(buckets[2].official).toBe(0);
  });
});
