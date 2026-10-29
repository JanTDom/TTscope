import { NextRequest, NextResponse } from "next/server";
import { dbRepo } from "@/lib/db";
import { resolveTimeRange } from "@/lib/analytics/time-ranges";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const preset = searchParams.get("time_range") || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    const timeRange = resolveTimeRange({ preset, from, to });
    const events = dbRepo.getAllEvents({
      from: timeRange.fromIso,
      to: timeRange.toIso,
    });

    return NextResponse.json({
      ok: true,
      timeRange,
      total: events.length,
      events,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd pobierania wydarzeń";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
