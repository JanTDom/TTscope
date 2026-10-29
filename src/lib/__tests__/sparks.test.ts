import { describe, it, expect } from "vitest";
import { calculateSparksScore } from "../scoring/sparks";
import type { Document } from "../db/types";

describe("TTscope Sparks Score & Early Warning", () => {
  it("powinien zwrócić wynik 0 i etap single_mention dla pustej listy dokumentów", () => {
    const res = calculateSparksScore([]);
    expect(res.totalScore).toBe(0);
    expect(res.stage).toBe("single_mention");
  });

  it("powinien naliczyć punkty za sygnały pracownicze, zasięg mediów i dynamikę", () => {
    const now = new Date().toISOString();
    const docs: Document[] = [
      {
        id: "d1",
        title: "Spór zbiorowy i postulaty płacowe załogi w Płocku",
        url: "https://petronews.pl/art1",
        source_name: "PetroNews Płock",
        source_type: "media_regional",
        published_at: now,
        fetched_at: now,
        content: "Związki zawodowe MZZPRC zapowiadają zaostrzenie protestu.",
        language: "pl",
        content_hash: "h1",
        processing_status: "parsed",
        licensing_status: "fair_use",
        is_orlen_official: false,
        is_labor_signal: true,
        is_local_signal: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: "d2",
        title: "Konflikt w rafinerii w Płocku trafia do mediów ogólnopolskich",
        url: "https://bankier.pl/art2",
        source_name: "Bankier.pl",
        source_type: "media_general",
        published_at: now,
        fetched_at: now,
        content: "Rosną obawy o strajk na instalacjach ciągłego ruchu.",
        language: "pl",
        content_hash: "h2",
        processing_status: "parsed",
        licensing_status: "fair_use",
        is_orlen_official: false,
        is_labor_signal: true,
        is_local_signal: false,
        created_at: now,
        updated_at: now,
      },
    ];

    const res = calculateSparksScore(docs);

    expect(res.totalScore).toBeGreaterThan(30);
    expect(res.verificationSubscore).toBeGreaterThan(0);
    expect(res.sourcesCountSubscore).toBe(10); // 2 źródła x 5 pkt
    expect(res.reachSubscore).toBeGreaterThan(10); // regional + national
    expect(res.explanation.velocityNotes).toContain("2 publikacji");
  });
});
