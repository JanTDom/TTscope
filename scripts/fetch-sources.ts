import { initSourcesRegistry } from "../src/lib/sources/init";
import { ingestAllActiveSources } from "../src/lib/ingest/engine";
import { dbRepo } from "../src/lib/db";

async function main() {
  console.log("=== TTscope: Inicjalizacja Rejestru Źródeł i Pobieranie Danych Publicznych ===");
  initSourcesRegistry();

  console.log("Rozpoczynanie pobierania ze wszystkich aktywnych źródeł...");
  const results = await ingestAllActiveSources();

  console.log("\n--- Podsumowanie Przebiegu Pobierania ---");
  for (const r of results) {
    console.log(`[${r.status.toUpperCase()}] ${r.source_name}: znaleziono ${r.items_found}, nowych: ${r.items_new}${r.error ? ` (${r.error})` : ""}`);
  }

  const stats = await dbRepo.getDashboardStats();
  console.log("\n--- Stan Bazy TTscope ---");
  console.log(`Dokumenty łącznie: ${stats.totalDocs}`);
  console.log(`Oficjalne Orlen: ${stats.officialDocs}`);
  console.log(`Sygnały pracownicze: ${stats.laborDocs}`);
  console.log(`Sygnały lokalne: ${stats.localDocs}`);
  console.log(`Aktywne źródła: ${stats.activeSources}/${stats.totalSources}`);
}

main().catch((err) => {
  console.error("Błąd krytyczny skryptu pobierania:", err);
  process.exit(1);
});
