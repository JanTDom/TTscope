import { NextRequest, NextResponse } from "next/server";
import { dbRepo } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    const limit = Number(searchParams.get("limit")) || 50;
    const offset = Number(searchParams.get("offset")) || 0;

    const result = dbRepo.getDocuments({
      query,
      sourceType,
      facilityLocation,
      isOrlenOfficial,
      isLaborSignal,
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
