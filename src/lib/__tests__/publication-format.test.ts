import { describe, expect, it } from "vitest";
import {
  MISSING_PUBLICATION_TIME,
  formatDiffusionStep,
  formatEventStage,
  formatPublicationTime,
} from "../format/publication";

describe("formatPublicationTime", () => {
  it("pokazuje godzinę w strefie Europe/Warsaw niezależnie od strefy serwera (czas zimowy)", () => {
    expect(formatPublicationTime("2026-10-29T12:05:00.000Z")).toBe("29.10.2026, godz. 13:05");
  });

  it("uwzględnia czas letni", () => {
    expect(formatPublicationTime("2026-07-10T07:00:00.000Z")).toBe("10.07.2026, godz. 09:00");
  });

  it("przechodzi przez północ do następnego dnia", () => {
    expect(formatPublicationTime("2026-10-28T23:30:00.000Z")).toBe("29.10.2026, godz. 00:30");
  });

  it("nie podstawia daty pobrania, gdy brak daty publikacji", () => {
    expect(formatPublicationTime(null)).toBe(MISSING_PUBLICATION_TIME);
    expect(formatPublicationTime(undefined)).toBe(MISSING_PUBLICATION_TIME);
    expect(formatPublicationTime("")).toBe(MISSING_PUBLICATION_TIME);
  });

  it("odrzuca nieprawidłową datę", () => {
    expect(formatPublicationTime("nie-data")).toBe(MISSING_PUBLICATION_TIME);
  });
});

describe("etykiety etapów i ról", () => {
  it("tłumaczy etapy wydarzenia na polskie nazwy", () => {
    expect(formatEventStage("single_mention")).toBe("Pojedyncza wzmianka");
    expect(formatEventStage("multichannel_crisis")).toBe("Kryzys wielokanałowy");
  });

  it("nie pokazuje surowych kodów dla nieznanych wartości", () => {
    expect(formatEventStage("xyz")).toBe("Etap nieokreślony");
    expect(formatDiffusionStep("xyz")).toBe("Rola nieokreślona");
  });

  it("tłumaczy role w łańcuchu dyfuzji", () => {
    expect(formatDiffusionStep("industry_media")).toBe("Portal branżowy");
    expect(formatDiffusionStep("labor_signal")).toBe("Sygnał związkowy lub pracowniczy");
  });
});
