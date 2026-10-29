// ==============================================================================
// TTscope — Silnik Kontroli Fałszywych Trafień i Disambiguacji Encji Grupy ORLEN
// ==============================================================================

import type { OrlenEntity, Document, DocumentEntity } from "../db/types";
import { orlenEntityRegistry, removeDiacritics } from "./registry";
import { postgresRepo } from "../db/postgres";

export interface DisambiguationResult {
  entity_id: string;
  confidence: number;
  match_rationale: string;
  matched_text: string;
}

// Konteksty fałszywych trafień (słowa dyskwalifikujące lub obniżające wagę)
const AMBIGUOUS_WORDS: Record<string, { falseContexts: string[]; requiredContexts: string[] }> = {
  Energa: {
    falseContexts: [
      "energia słoneczna w domu",
      "brak energii",
      "napój energetyczny",
      "dużo energii",
      "energia kinetyczna",
      "energia potencjalna",
      "pozytywna energia",
      "energia odnawialna w polsce ogółem",
    ],
    requiredContexts: [
      "spółka",
      "grupa",
      "orlen",
      "zarząd",
      "operator",
      "obrót",
      "ostrołęka",
      "sieć",
      "dystrybucja",
      "fuzja",
      "akcje",
      "wyniki",
      "prezes",
      "prąd",
      "taryfa",
      "ure",
    ],
  },
  Anwil: {
    falseContexts: [
      "koszykówka",
      "koszykarze",
      "mecz",
      "plk",
      "hala mistrzów",
      "trener",
      "punkty",
      "zbiórki",
      "liga",
      "tabela",
    ],
    requiredContexts: [
      "nawozy",
      "saletra",
      "saletrzak",
      "pcw",
      "tworzywa",
      "instalacja",
      "chemia",
      "orlen",
      "zarząd",
      "inwestycje",
      "produkcja",
      "azoty",
    ],
  },
  Lotos: {
    falseContexts: [
      "kwiat lotosu",
      "pozycja lotosu",
      "herbata z lotosu",
      "hotel lotos",
      "restauracja lotos",
    ],
    requiredContexts: [
      "rafineria",
      "gdańsk",
      "fuzja",
      "paliwa",
      "aramco",
      "saudi",
      "orlen",
      "ropa",
      "przejęcie",
      "asfalt",
      "zarząd",
    ],
  },
  PGNiG: {
    falseContexts: [
      "superliga",
      "piłka ręczna",
      "puchar polski w piłce ręcznej",
    ],
    requiredContexts: [
      "gaz",
      "wydobycie",
      "baltic pipe",
      "magazyny",
      "ropa",
      "orlen",
      "fuzja",
      "norwegia",
      "złoża",
      "koncesje",
      "psg",
      "taryfa",
    ],
  },
};

export class EntityDisambiguationEngine {
  /**
   * Dopasowuje dokument do podmiotów Grupy ORLEN z wyliczeniem poziomu pewności (confidence)
   */
  matchDocumentToEntities(doc: Document, entities: OrlenEntity[]): DisambiguationResult[] {
    const results: DisambiguationResult[] = [];
    const textLower = `${doc.title} ${doc.content || ""} ${doc.excerpt || ""}`.toLowerCase();
    const cleanText = removeDiacritics(textLower);

    for (const entity of entities) {
      if (!entity.is_monitored) continue;

      // 0. Nadrzędny filtr wieloznaczności: jeśli tekst zawiera jednoznacznie fałszywy kontekst
      // i brak kontekstu korporacyjno-przemysłowego (np. koszykówka dla Anwilu, pozycja lotosu),
      // podmiot jest bezwzględnie odrzucany!
      const ambig = AMBIGUOUS_WORDS[entity.short_name];
      if (ambig) {
        const hasFalseContext = ambig.falseContexts.some((fc) => textLower.includes(fc));
        const hasRequiredContext = ambig.requiredContexts.some((rc) => textLower.includes(rc));
        if (hasFalseContext && !hasRequiredContext) {
          continue;
        }
      }

      let score = 0;
      const rationales: string[] = [];
      let matchedSnippet = "";

      // 1. Sprawdzenie dopasowania po domenie lub oficjalnym źródle spółki (pewność maksymalna: 0.95-1.0)
      const matchesDomain = entity.domains.some(
        (d) => doc.url.includes(d) || (doc.source_name && doc.source_name.toLowerCase().includes(d))
      );
      if (matchesDomain) {
        score += 0.95;
        rationales.push(`Dokument pochodzi z oficjalnej domeny podmiotu (${entity.domains.join(", ")})`);
        matchedSnippet = doc.url;
      }

      // 2. Sprawdzenie pełnej nazwy prawnej (np. "ANWIL Spółka Akcyjna")
      const legalLower = entity.legal_name.toLowerCase();
      if (textLower.includes(legalLower)) {
        score += 0.9;
        rationales.push(`W tekście występuje pełna nazwa prawna: "${entity.legal_name}"`);
        matchedSnippet = entity.legal_name;
      }

      // 3. Sprawdzenie nazwy skróconej lub marki (np. "Anwil", "Energa", "OSGE")
      const shortLower = entity.short_name.toLowerCase();
      const shortClean = removeDiacritics(shortLower);
      const nameRegex = new RegExp(`\\b${shortLower}\\b`, "i");

      if (nameRegex.test(textLower) || cleanText.includes(` ${shortClean} `)) {
        // Analiza wieloznaczności
        const ambig = AMBIGUOUS_WORDS[entity.short_name];
        if (ambig) {
          // Sprawdzamy czy nie występuje w fałszywym kontekście (np. mecz koszykówki Anwilu)
          const hasFalseContext = ambig.falseContexts.some((fc) => textLower.includes(fc));
          const hasRequiredContext = ambig.requiredContexts.some((rc) => textLower.includes(rc));

          if (hasFalseContext && !hasRequiredContext) {
            // Odrzucamy fałszywe trafienie
            continue;
          } else if (hasRequiredContext) {
            score += 0.85;
            rationales.push(
              `Wykryto nazwę "${entity.short_name}" w potwierdzonym kontekście przemysłowo-korporacyjnym`
            );
            matchedSnippet = entity.short_name;
          } else {
            score += 0.45;
            rationales.push(
              `Wykryto nazwę "${entity.short_name}", lecz brak jednoznacznych słów kluczowych segmentu`
            );
            matchedSnippet = entity.short_name;
          }
        } else {
          score += 0.8;
          rationales.push(`Wykryto nazwę podmiotu "${entity.short_name}"`);
          matchedSnippet = entity.short_name;
        }
      }

      // 4. Sprawdzenie aliasów wyszukiwawczych (np. "Reaktory SMR Orlen", "Elektrownia Ostrołęka")
      if (entity.search_aliases && entity.search_aliases.length > 0) {
        for (const alias of entity.search_aliases) {
          if (textLower.includes(alias.toLowerCase())) {
            score += 0.75;
            rationales.push(`Dopasowano na podstawie zdefiniowanego aliasu: "${alias}"`);
            matchedSnippet = alias;
            break;
          }
        }
      }

      // 5. Sprawdzenie dawnej nazwy (np. "Grupa Lotos", "Mažeikių Nafta")
      if (entity.former_name && textLower.includes(entity.former_name.toLowerCase())) {
        score += 0.7;
        rationales.push(`Dopasowano na podstawie dawnej nazwy: "${entity.former_name}"`);
        matchedSnippet = entity.former_name;
      }

      // 6. Normalizacja pewności do przedziału [0, 1]
      const finalConfidence = Math.min(1.0, Math.max(0.0, score));

      // Rejestrujemy tylko dopasowania o pewności >= 0.50
      if (finalConfidence >= 0.5) {
        results.push({
          entity_id: entity.id,
          confidence: parseFloat(finalConfidence.toFixed(3)),
          match_rationale: rationales.join("; "),
          matched_text: matchedSnippet,
        });
      }
    }

    return results;
  }

  /**
   * Automatyczne powiązanie i analiza dokumentów w bazie z kontrolą fałszywych trafień
   */
  async processAndLinkDocuments(limit = 150): Promise<{
    processed_docs: number;
    links_created: number;
  }> {
    const entities = await orlenEntityRegistry.getEntities();
    const pool = (postgresRepo as any).getPgPool ? (postgresRepo as any).getPgPool() : null;

    // Pobierzmy ostatnie dokumenty
    const docsRes = await postgresRepo.getDocuments({ limit });
    let linksCreated = 0;

    for (const doc of docsRes.documents) {
      const matches = this.matchDocumentToEntities(doc, entities);
      for (const m of matches) {
        const docEntity: DocumentEntity = {
          id: `de_${doc.id}_${m.entity_id}`,
          document_id: doc.id,
          entity_id: m.entity_id,
          entity_match_confidence: m.confidence,
          match_rationale: m.match_rationale,
          matched_text: m.matched_text,
          review_status: m.confidence >= 0.85 ? "confirmed" : "auto_matched",
          reviewed_by: m.confidence >= 0.85 ? "System Autoverify Engine" : null,
          reviewed_at: m.confidence >= 0.85 ? new Date().toISOString() : null,
          created_at: new Date().toISOString(),
        };

        await postgresRepo.upsertDocumentEntity(docEntity);
        linksCreated++;
      }
    }

    return {
      processed_docs: docsRes.documents.length,
      links_created: linksCreated,
    };
  }
}

export const entityDisambiguationEngine = new EntityDisambiguationEngine();
