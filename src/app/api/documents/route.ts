import { NextRequest, NextResponse } from "next/server";
import { dbRepo } from "@/lib/db";
import { isCommunicationChannel } from "@/lib/analytics/publication-rhythm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_PUBLISHER_LENGTH = 200;

/** `undefined` gdy parametru brak, `null` gdy jest, ale nie jest poprawną datą. */
function parseIsoParam(value: string | null): string | undefined | null {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;
    const sourceType = searchParams.get("source_type") || undefined;
    const facilityLocation = searchParams.get("location") || undefined;
    const isOrlenOfficial = searchParams.has("official")
      ? searchParams.get("official") === "true"
      : undefined;
    const isLaborSignal = searchParams.has("labor")
      ? searchParams.get("labor") === "true"
      : undefined;
    const channelParam = searchParams.get("channel");
    if (channelParam && !isCommunicationChannel(channelParam)) {
      return NextResponse.json({ ok: false, error: "Nieznany kanał komunikacji" }, { status: 400 });
    }
    const channel = channelParam && isCommunicationChannel(channelParam) ? channelParam : undefined;
    const publishedFrom = parseIsoParam(searchParams.get("from"));
    const publishedTo = parseIsoParam(searchParams.get("to"));
    if (publishedFrom === null || publishedTo === null) {
      return NextResponse.json({ ok: false, error: "Nieprawidłowy zakres dat" }, { status: 400 });
    }
    const sourceName = searchParams.get("publisher")?.slice(0, MAX_PUBLISHER_LENGTH) || undefined;
    const limit = Number(searchParams.get("limit")) || 50;
    const offset = Number(searchParams.get("offset")) || 0;

    const result = dbRepo.getDocuments({
      query,
      sourceType,
      facilityLocation,
      isOrlenOfficial,
      isLaborSignal,
      channel,
      sourceName,
      publishedFrom,
      publishedTo,
      limit,
      offset,
    });

    return NextResponse.json({
      ok: true,
      total: result.total,
      limit,
      offset,
      documents: result.documents,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd pobierania dokumentów";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
