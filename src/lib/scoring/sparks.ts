import type { Document, EventStage } from "../db/types";

export interface SparksCalculation {
  totalScore: number;
  velocitySubscore: number;
  sourcesCountSubscore: number;
  reachSubscore: number;
  verificationSubscore: number;
  sentimentSubscore: number;
  stage: EventStage;
  explanation: {
    velocityNotes: string;
    sourcesNotes: string;
    reachNotes: string;
    verificationNotes: string;
    sentimentNotes: string;
  };
}

export function calculateSparksScore(documents: Document[]): SparksCalculation {
  if (documents.length === 0) {
    return {
      totalScore: 0,
      velocitySubscore: 0,
      sourcesCountSubscore: 0,
      reachSubscore: 0,
      verificationSubscore: 0,
      sentimentSubscore: 0,
      stage: "single_mention",
      explanation: {
        velocityNotes: "Brak dokumentów",
        sourcesNotes: "0 źródeł",
        reachNotes: "Brak zasięgu",
        verificationNotes: "Brak danych",
        sentimentNotes: "Neutralny",
      },
    };
  }

  // 1. Liczba niezależnych źródeł (max 20 pkt)
  const uniqueSources = new Set(documents.map((d) => d.source_name));
  const sourcesCount = uniqueSources.size;
  let sourcesCountSubscore = Math.min(sourcesCount * 5, 20);

  // 2. Dynamika publikacji (max 25 pkt)
  // Mierzymy ile dokumentów pojawiło się w ostatnich 24h
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const docsLast24h = documents.filter((d) => {
    const pub = d.published_at ? new Date(d.published_at).getTime() : new Date(d.fetched_at).getTime();
    return now - pub <= dayMs;
  }).length;
  let velocitySubscore = Math.min(docsLast24h * 5, 25);

  // 3. Zasięg mediów (max 20 pkt)
  // Przejście z lokalnych do ogólnopolskich lub branżowych
  const hasNational = documents.some((d) => d.source_type === "media_general");
  const hasIndustry = documents.some((d) => d.source_type === "media_industry");
  const hasRegional = documents.some((d) => d.source_type === "media_regional");

  let reachSubscore = 0;
  if (hasRegional) reachSubscore += 5;
  if (hasIndustry) reachSubscore += 8;
  if (hasNational) reachSubscore += 7;
  reachSubscore = Math.min(reachSubscore, 20);

  // 4. Weryfikacja sygnałów pracowniczych lub lokalnych awarii (max 20 pkt)
  const laborCount = documents.filter((d) => d.is_labor_signal).length;
  const localCount = documents.filter((d) => d.is_local_signal).length;
  let verificationSubscore = 0;
  if (laborCount > 0) verificationSubscore += Math.min(laborCount * 6, 12);
  if (localCount > 0) verificationSubscore += Math.min(localCount * 8, 8);
  verificationSubscore = Math.min(verificationSubscore, 20);

  // 5. Wydźwięk negatywny i zarzuty (max 15 pkt)
  // Analiza słów kluczowych negatywnych w tytułach
  const negativeKeywords = ["awaria", "spór", "strajk", "smród", "odór", "flara", "protest", "zwolnien", "drożyzn", "afer", "śledztw", "zarzut"];
  let negativeMatches = 0;
  for (const d of documents) {
    const t = d.title.toLowerCase();
    if (negativeKeywords.some((kw) => t.includes(kw))) {
      negativeMatches++;
    }
  }
  let sentimentSubscore = Math.min(negativeMatches * 5, 15);

  const totalScore = Number(
    (velocitySubscore + sourcesCountSubscore + reachSubscore + verificationSubscore + sentimentSubscore).toFixed(2)
  );

  // Określenie etapu zdarzenia (Event Stage)
  let stage: EventStage = "single_mention";
  if (documents.length === 1) {
    stage = "single_mention";
  } else if (totalScore < 30) {
    stage = "verification_signal";
  } else if (hasRegional && !hasNational && totalScore < 50) {
    stage = "local_cluster";
  } else if (totalScore >= 50 && totalScore < 70) {
    stage = "growing_topic";
  } else if (totalScore >= 70 && !documents.some((d) => d.is_orlen_official)) {
    stage = "media_crisis";
  } else if (totalScore >= 85) {
    stage = "confirmed_crisis";
  } else {
    stage = "growing_topic";
  }

  return {
    totalScore,
    velocitySubscore,
    sourcesCountSubscore,
    reachSubscore,
    verificationSubscore,
    sentimentSubscore,
    stage,
    explanation: {
      velocityNotes: `${docsLast24h} publikacji w ostatnich 24h`,
      sourcesNotes: `${sourcesCount} niezależnych źródeł (${Array.from(uniqueSources).slice(0, 3).join(", ")})`,
      reachNotes: `Zasięg: ${[hasRegional && "regionalny", hasIndustry && "branżowy", hasNational && "ogólnopolski"].filter(Boolean).join(" + ") || "lokalny"}`,
      verificationNotes: `Sygnały pracownicze: ${laborCount}, sygnały lokalne: ${localCount}`,
      sentimentNotes: `Wykryto ${negativeMatches} negatywnych wskaźników leksykalnych`,
    },
  };
}
