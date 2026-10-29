import { NextRequest, NextResponse } from "next/server";
import { dbRepo } from "@/lib/db";
import { analyzeDocumentWithGemini } from "@/lib/gemini/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { documentId, forceRefresh } = await req.json();

    if (!documentId) {
      return NextResponse.json({ ok: false, error: "Brak parametru documentId." }, { status: 400 });
    }

    const doc = dbRepo.getDocumentById(documentId);
    if (!doc) {
      return NextResponse.json({ ok: false, error: "Dokument nie istnieje w bazie." }, { status: 404 });
    }

    const result = await analyzeDocumentWithGemini(doc, Boolean(forceRefresh));

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd analizy Gemini";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
