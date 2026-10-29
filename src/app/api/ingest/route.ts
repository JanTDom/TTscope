import { NextResponse } from "next/server";
import { ingestAllActiveSources } from "@/lib/ingest/engine";
import { clusterDocumentsIntoEvents } from "@/lib/events/cluster";
import { initSourcesRegistry } from "@/lib/sources/init";
import { dbRepo } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

export async function POST() {
  try {
    // 1. Inicjalizacja rejestru jeśli baza jest pusta
    initSourcesRegistry();

    // 2. Pobieranie danych
    const ingestResults = await ingestAllActiveSources();

    // 3. Klastrowanie
    const clusterResults = await clusterDocumentsIntoEvents();

    // 4. Log do audit
    await dbRepo.logAudit({
      id: `audit_${Date.now()}`,
      action_type: "manual_ingest_trigger",
      entity_type: "system",
      details: { ingestResults, clusterResults },
      created_at: new Date().toISOString(),
    });

    const stats = await dbRepo.getDashboardStats();

    return NextResponse.json({
      ok: true,
      ingestResults,
      clusterResults,
      stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd podczas synchronizacji źródeł";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
