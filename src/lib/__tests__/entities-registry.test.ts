import { describe, it, expect } from "vitest";
import {
  orlenEntityRegistry,
  removeDiacritics,
  generateDeclensions,
  INITIAL_ORLEN_ENTITIES,
} from "../entities/registry";
import { entityDisambiguationEngine } from "../entities/disambiguation";
import type { Document, OrlenEntity } from "../db/types";

describe("OrlenEntityRegistry — Rejestr i Warianty Wyszukiwania", () => {
  it("powinien prawidłowo usuwać polskie znaki diakrytyczne", () => {
    expect(removeDiacritics("Gdańska Spółka Płock Słoneczna")).toBe("Gdanska Spolka Plock Sloneczna");
    expect(removeDiacritics("Łódź Możejki")).toBe("Lodz Mozejki");
  });

  it("powinien generować polskie formy deklinacyjne dla podmiotów", () => {
    const orlenForms = generateDeclensions("ORLEN");
    expect(orlenForms).toContain("ORLENu");
    expect(orlenForms).toContain("ORLENem");

    const energaForms = generateDeclensions("Energa");
    expect(energaForms).toContain("Enerdze");
    expect(energaForms).toContain("Energi");
    expect(energaForms).toContain("Energę");

    const anwilForms = generateDeclensions("Anwil");
    expect(anwilForms).toContain("Anwilu");
    expect(anwilForms).toContain("Anwilem");
  });

  it("powinien wygenerować kompletną matrycę zapytań dla spółki", () => {
    const sampleEntity = INITIAL_ORLEN_ENTITIES.find((e) => e.id === "ent_anwil_sa") as OrlenEntity;
    expect(sampleEntity).toBeDefined();

    const matrix = orlenEntityRegistry.generateSearchVariants(sampleEntity);
    expect(matrix.legal_name).toBe("ANWIL Spółka Akcyjna");
    expect(matrix.short_name).toBe("Anwil");
    expect(matrix.no_diacritics).toBe("Anwil");
    expect(matrix.orlen_combinations).toContain("Anwil Orlen");
    expect(matrix.declensions).toContain("Anwilu");
  });

  it("powinien wygenerować zapytania dla Facebooka, YouTube i X", () => {
    const sampleEntity = INITIAL_ORLEN_ENTITIES.find((e) => e.id === "ent_anwil_sa") as OrlenEntity;
    const queries = orlenEntityRegistry.generatePlatformQueries(sampleEntity);

    // Zapytania ogólne (14 wzorców)
    expect(queries.general_queries).toContain("Anwil Orlen");
    expect(queries.general_queries).toContain("Anwil awaria");
    expect(queries.general_queries).toContain("Anwil Facebook");

    // Zapytania Facebook
    expect(queries.facebook_queries.some((q) => q.includes("site:facebook.com"))).toBe(true);

    // Zapytania YouTube i X
    expect(queries.youtube_queries.length).toBeGreaterThan(0);
    expect(queries.twitter_queries.length).toBeGreaterThan(0);
  });
});

describe("EntityDisambiguationEngine — Kontrola Fałszywych Trafień", () => {
  const entities = INITIAL_ORLEN_ENTITIES as OrlenEntity[];

  it("powinien odrzucić fałszywe trafienie Anwilu w kontekście meczu koszykówki", () => {
    const basketballDoc: Document = {
      id: "doc_test_basket",
      title: "Mecz Anwil Włocławek w hali mistrzów",
      url: "https://sportowefakty.wp.pl/koszykowka/mecz-anwil",
      source_name: "Sportowe Fakty",
      content: "Koszykarze z Włocławka zdobyli ważne punkty. Trener chwalił zbiórki i defensywę w tabeli PLK.",
      fetched_at: new Date().toISOString(),
      language: "pl",
      source_type: "media_general",
      content_hash: "hash_basket",
      processing_status: "parsed",
      licensing_status: "open",
      is_orlen_official: false,
      is_labor_signal: false,
      is_local_signal: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const matches = entityDisambiguationEngine.matchDocumentToEntities(basketballDoc, entities);
    const anwilMatch = matches.find((m) => m.entity_id === "ent_anwil_sa");
    expect(anwilMatch).toBeUndefined(); // Został prawidłowo odrzucony!
  });

  it("powinien prawidłowo dopasować Anwil w kontekście nawozów i instalacji chemicznej z wysoką pewnością", () => {
    const chemicalDoc: Document = {
      id: "doc_test_chem",
      title: "ANWIL uruchamia nową instalację nawozową we Włocławku",
      url: "https://wnp.pl/chemia/anwil-uruchamia-nowa-instalacje,123.html",
      source_name: "WNP.pl",
      content: "Spółka ANWIL należąca do Grupy ORLEN zwiększa produkcję saletrzaku i PCW. Zarząd podsumował inwestycje.",
      fetched_at: new Date().toISOString(),
      language: "pl",
      source_type: "media_industry",
      content_hash: "hash_chem",
      processing_status: "parsed",
      licensing_status: "open",
      is_orlen_official: false,
      is_labor_signal: false,
      is_local_signal: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const matches = entityDisambiguationEngine.matchDocumentToEntities(chemicalDoc, entities);
    const anwilMatch = matches.find((m) => m.entity_id === "ent_anwil_sa");
    expect(anwilMatch).toBeDefined();
    expect(anwilMatch!.confidence).toBeGreaterThanOrEqual(0.8);
    expect(anwilMatch!.match_rationale).toContain("potwierdzonym kontekście");
  });

  it("powinien przypisać dokument z oficjalnej domeny orlen.pl z pewnością bliską 1.0", () => {
    const officialDoc: Document = {
      id: "doc_test_official",
      title: "Komunikat Zarządu ORLEN S.A. w sprawie dywidendy",
      url: "https://www.orlen.pl/pl/relacje-inwestorskie/komunikat-dywidenda",
      source_name: "ORLEN S.A.",
      content: "Zarząd ORLEN Spółka Akcyjna rekomenduje wypłatę dywidendy.",
      fetched_at: new Date().toISOString(),
      language: "pl",
      source_type: "official_orlen",
      content_hash: "hash_off",
      processing_status: "parsed",
      licensing_status: "open",
      is_orlen_official: true,
      is_labor_signal: false,
      is_local_signal: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const matches = entityDisambiguationEngine.matchDocumentToEntities(officialDoc, entities);
    const orlenMatch = matches.find((m) => m.entity_id === "ent_orlen_sa");
    expect(orlenMatch).toBeDefined();
    expect(orlenMatch!.confidence).toBeGreaterThanOrEqual(0.95);
    expect(orlenMatch!.match_rationale).toContain("oficjalnej domeny");
  });
});
