import fs from "node:fs";
import path from "node:path";

// Wczytanie .env.local jeśli istnieje
if (fs.existsSync(path.resolve(process.cwd(), ".env.local"))) {
  // @ts-ignore
  if (typeof process.loadEnvFile === "function") {
    // @ts-ignore
    process.loadEnvFile(".env.local");
  }
}

import { dbRepo } from "../src/lib/db";
import { analyzeDocumentWithGemini } from "../src/lib/gemini/client";

async function run() {
  console.log("=== TTscope: Rzeczywista Analiza Gemini API na Prawdziwym Dokumencie ===");

  const { documents } = await dbRepo.getDocuments({ limit: 1 });
  if (documents.length === 0) {
    console.error("Brak dokumentów w bazie do analizy. Uruchom najpierw scripts/fetch-sources.ts");
    process.exit(1);
  }

  const doc = documents[0];
  console.log("\n[DOKUMENT ŹRÓDŁOWY]");
  console.log(`ID: ${doc.id}`);
  console.log(`Tytuł: ${doc.title}`);
  console.log(`Źródło: ${doc.source_name} (${doc.url})`);
  console.log(`Data publikacji: ${doc.published_at}`);
  console.log(`Fragment treści: ${doc.content.slice(0, 300)}...`);

  console.log("\n1. Wywołanie Gemini API z walidacją schematu i weryfikacją Grounding...");
  const result = await analyzeDocumentWithGemini(doc, true);

  console.log(`Status analizy: ${result.status}`);
  console.log(`Czas wykonania: ${result.durationMs} ms`);
  console.log(`Grounding zweryfikowany (dowody w tekście): ${result.groundingVerified}`);

  if (result.rejectedEvidence && result.rejectedEvidence.length > 0) {
    console.log("Odrzucone fragmenty bez dowodu w tekście:", result.rejectedEvidence);
  }

  if (result.validatedAnalysis) {
    console.log("\n[WYNIK STRUKTURALNY ZWALIDOWANY PRZEZ ZOD]");
    console.log("Wykryte encje:", JSON.stringify(result.validatedAnalysis.entities, null, 2));
    console.log("Wykryte tematy:", JSON.stringify(result.validatedAnalysis.topics, null, 2));
    console.log("Twierdzenia (Claims):", JSON.stringify(result.validatedAnalysis.claims, null, 2));
    console.log("Sentyment:", JSON.stringify(result.validatedAnalysis.sentiment, null, 2));
    console.log("Notatki analityczne:", result.validatedAnalysis.analysis_notes);
  } else {
    console.log("Błąd lub brak wyniku:", result.error);
  }

  // 2. Test zachowania w przypadku braku klucza
  console.log("\n2. Test zachowania w przypadku braku klucza API (symulacja):");
  const origKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "";
  const noKeyResult = await analyzeDocumentWithGemini(doc, true);
  console.log(`Status bez klucza: ${noKeyResult.status} (błąd: ${noKeyResult.error})`);
  process.env.GEMINI_API_KEY = origKey;

  // 3. Sprawdzenie rekordu w bazie
  const savedRun = await dbRepo.getLatestAiRunForDocument(doc.id);
  console.log("\n3. Sprawdzenie zapisu w bazie danych (ai_analysis_runs):");
  console.log(`Zapisano w bazie: ID=${savedRun?.id}, Model=${savedRun?.model_name}, Status=${savedRun?.status}`);
}

run().catch((err) => {
  console.error("Błąd skryptu analizy:", err);
  process.exit(1);
});
