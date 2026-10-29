import { NextResponse } from "next/server";
import { dbRepo } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [sources, connectors, auditLogs] = await Promise.all([
      dbRepo.getAllSources(),
      dbRepo.getSourceConnectors(),
      dbRepo.getAuditLogs(50),
    ]);

    return NextResponse.json({
      ok: true,
      sources,
      connectors,
      auditLogs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd pobierania źródeł";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
