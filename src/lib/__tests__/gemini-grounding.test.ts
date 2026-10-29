import { describe, it, expect } from "vitest";
import { verifyGrounding, GeminiAnalysisSchema } from "../gemini/analyzer";

describe("TTscope Gemini Grounding & Prompt Injection Protection", () => {
  const sourceText = `
    ORLEN S.A. ogłasza podpisanie nowej umowy o współpracy w zakresie odnawialnych źródeł energii.
    Prezes zarządu Ireneusz Fąfara podkreślił, że inwestycja w Gdańsku ma kluczowe znaczenie.
    Władze spółki nie planują redukcji zatrudnienia w rafinerii.
  `;

  it("powinien zatwierdzić encje i twierdzenia mające dosłowny dowód w tekście", () => {
    const validRaw = {
      document_id: "doc_test_1",
      entities: [
        {
          name: "Ireneusz Fąfara",
          type: "person" as const,
          evidence: "Prezes zarządu Ireneusz Fąfara",
          confidence: 0.95,
        },
        {
          name: "Gdańsk",
          type: "location" as const,
          evidence: "inwestycja w Gdańsku",
          confidence: 0.95,
        },
      ],
      topics: [
        {
          label: "odnawialne źródła energii",
          evidence: "odnawialnych źródeł energii",
          confidence: 0.9,
        },
      ],
      claims: [
        {
          claim: "Brak planów redukcji zatrudnienia",
          evidence: "nie planują redukcji zatrudnienia w rafinerii",
          claim_status: "directly_stated" as const,
          confidence: 0.9,
        },
      ],
      sentiment: {
        label: "positive" as const,
        confidence: 0.85,
        evidence: "ogłasza podpisanie nowej umowy o współpracy",
      },
      analysis_notes: ["Pozytywny komunikat inwestycyjny"],
    };

    // Walidacja schematu Zod
    const zodParsed = GeminiAnalysisSchema.parse(validRaw);
    const check = verifyGrounding(zodParsed, sourceText);

    expect(check.passed).toBe(true);
    expect(check.validatedOutput.entities.length).toBe(2);
    expect(check.validatedOutput.claims.length).toBe(1);
  });

  it("powinien bezwzględnie odrzucić twierdzenia i encje, których dowodu nie ma w tekście źródłowym (Anti-Hallucination)", () => {
    const hallucinatedRaw = {
      document_id: "doc_test_2",
      entities: [
        {
          name: "Daniel Obajtek",
          type: "person" as const,
          evidence: "Daniel Obajtek podpisał umowę z Saudi Aramco", // Tego NIE ma w tekście!
          confidence: 0.99,
        },
      ],
      topics: [],
      claims: [
        {
          claim: "Planowany jest strajk generalny w Płocku",
          evidence: "Związki zawodowe ogłaszają strajk w Płocku", // Tego NIE ma w tekście!
          claim_status: "directly_stated" as const,
          confidence: 0.9,
        },
      ],
      sentiment: {
        label: "negative" as const,
        confidence: 0.9,
        evidence: "Wielka afera w zarządzie spółki", // Tego NIE ma w tekście!
      },
      analysis_notes: ["Zmyślona analiza"],
    };

    const zodParsed = GeminiAnalysisSchema.parse(hallucinatedRaw);
    const check = verifyGrounding(zodParsed, sourceText);

    expect(check.passed).toBe(false);
    expect(check.validatedOutput.entities.length).toBe(0); // Odrzucono halucynację
    expect(check.validatedOutput.claims.length).toBe(0); // Odrzucono fałszywe twierdzenie
    expect(check.validatedOutput.sentiment.label).toBe("unclear"); // Sentyment bez dowodu zdegradowany do unclear
    expect(check.rejectedEvidence.length).toBeGreaterThan(0);
  });
});
