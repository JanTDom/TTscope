import { z } from "zod";

// Schemat wejściowy do walidacji odpowiedzi modelu
export const GeminiAnalysisSchema = z.object({
  document_id: z.string(),
  entities: z.array(
    z.object({
      name: z.string().min(1),
      type: z.enum([
        "organization",
        "person",
        "location",
        "facility",
        "union",
        "authority",
        "other",
      ]),
      evidence: z.string().min(1),
      confidence: z.number().min(0).max(1),
    })
  ),
  topics: z.array(
    z.object({
      label: z.string().min(1),
      evidence: z.string().min(1),
      confidence: z.number().min(0).max(1),
    })
  ),
  claims: z.array(
    z.object({
      claim: z.string().min(1),
      evidence: z.string().min(1),
      claim_status: z.enum([
        "directly_stated",
        "reported_by_source",
        "unverified",
        "opinion",
      ]),
      confidence: z.number().min(0).max(1),
    })
  ),
  sentiment: z.object({
    label: z.enum(["positive", "neutral", "negative", "mixed", "unclear"]),
    confidence: z.number().min(0).max(1),
    evidence: z.string().min(1),
  }),
  analysis_notes: z.array(z.string()),
});

export type GeminiAnalysisOutput = z.infer<typeof GeminiAnalysisSchema>;

export interface GroundingCheckResult {
  passed: boolean;
  rejectedEvidence: string[];
  validatedOutput: GeminiAnalysisOutput;
}

/**
 * Weryfikacja uziemienia (Grounding):
 * Sprawdza, czy każdy cytat lub fragment 'evidence' istnieje w tekście źródłowym.
 * Jeżeli fragmentu nie ma w źródle, twierdzenie/encja zostaje odrzucona.
 */
export function verifyGrounding(
  output: GeminiAnalysisOutput,
  sourceText: string
): GroundingCheckResult {
  const normSource = sourceText.toLowerCase().replace(/\s+/g, " ");
  const rejectedEvidence: string[] = [];

  const checkFragment = (evidence: string): boolean => {
    if (!evidence || evidence.trim().length === 0) return false;
    const normEvidence = evidence.toLowerCase().replace(/\s+/g, " ").trim();
    // Szukamy dokładnego dopasowania lub podciągu o długości co najmniej 15 znaków
    if (normSource.includes(normEvidence)) return true;

    // Próba elastycznego dopasowania początku dłuższego cytatu
    const sample = normEvidence.slice(0, Math.min(30, normEvidence.length));
    if (sample.length >= 10 && normSource.includes(sample)) return true;

    return false;
  };

  // 1. Walidacja encji
  const validEntities = output.entities.filter((e) => {
    const ok = checkFragment(e.evidence);
    if (!ok) rejectedEvidence.push(`Encja '${e.name}': nie znaleziono fragmentu [${e.evidence}]`);
    return ok;
  });

  // 2. Walidacja tematów
  const validTopics = output.topics.filter((t) => {
    const ok = checkFragment(t.evidence);
    if (!ok) rejectedEvidence.push(`Temat '${t.label}': nie znaleziono fragmentu [${t.evidence}]`);
    return ok;
  });

  // 3. Walidacja twierdzeń (claims)
  const validClaims = output.claims.filter((c) => {
    const ok = checkFragment(c.evidence);
    if (!ok) rejectedEvidence.push(`Twierdzenie '${c.claim}': nie znaleziono fragmentu [${c.evidence}]`);
    return ok;
  });

  // 4. Walidacja sentymentu
  let validSentiment = output.sentiment;
  if (!checkFragment(output.sentiment.evidence)) {
    rejectedEvidence.push(`Sentyment '${output.sentiment.label}': brak dowodu w tekście`);
    validSentiment = {
      label: "unclear",
      confidence: 0.3,
      evidence: "Brak zweryfikowanego dowodu sentymentu w źródle",
    };
  }

  const validatedOutput: GeminiAnalysisOutput = {
    ...output,
    entities: validEntities,
    topics: validTopics,
    claims: validClaims,
    sentiment: validSentiment,
  };

  return {
    passed: rejectedEvidence.length === 0,
    rejectedEvidence,
    validatedOutput,
  };
}
