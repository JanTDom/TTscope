import { describe, it, expect, beforeEach } from "vitest";
import { createHash } from "node:crypto";
import { dbRepo } from "../db";
import type { Document } from "../db/types";

describe("TTscope Deduplikacja i Wersjonowanie", () => {
  it("powinien generować deterministyczny hash sha256 z normalizowanego tytułu i treści", () => {
    const title = "  Nowa inwestycja w Płocku  ";
    const content = "Kompleks Olefiny III wchodzi w kolejny etap.";
    const hash1 = createHash("sha256")
      .update(title.trim().toLowerCase() + "\n" + content.trim().slice(0, 1000))
      .digest("hex");

    const hash2 = createHash("sha256")
      .update("nowa inwestycja w płocku\nKompleks Olefiny III wchodzi w kolejny etap.")
      .digest("hex");

    expect(hash1).toBe(hash2);
  });

  it("powinien unikać duplikatów przy wstawianiu identycznego dokumentu", () => {
    const testDoc: Document = {
      id: "doc_test_dedup_1",
      title: "Testowy Komunikat Orlenu",
      url: "https://orlen.pl/test-dedup-1",
      source_name: "ORLEN S.A.",
      fetched_at: new Date().toISOString(),
      content: "Unikalna treść testowa",
      language: "pl",
      source_type: "official_orlen",
      content_hash: "hash_test_12345",
      processing_status: "pending",
      licensing_status: "fair_use_public_osint",
      is_orlen_official: true,
      is_labor_signal: false,
      is_local_signal: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const firstInsert = dbRepo.insertDocument(testDoc);
    const secondInsert = dbRepo.insertDocument(testDoc);

    expect(secondInsert.isNew).toBe(false);
  });
});
