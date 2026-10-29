import { NextResponse } from "next/server";
import { orlenEntityRegistry } from "@/lib/entities/registry";
import { entityDisambiguationEngine } from "@/lib/entities/disambiguation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  try {
    const syncRes = await orlenEntityRegistry.syncWithOfficialSources();
    const linkRes = await entityDisambiguationEngine.processAndLinkDocuments(200);

    return NextResponse.json({
      ok: true,
      sync_results: syncRes,
      linking_results: linkRes,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Błąd synchronizacji rejestru encji" },
      { status: 500 }
    );
  }
}
