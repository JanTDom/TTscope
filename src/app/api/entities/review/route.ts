import { NextResponse } from "next/server";
import { postgresRepo } from "@/lib/db/postgres";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, review_status, reviewed_by } = body;

    if (!id || !review_status) {
      return NextResponse.json(
        { ok: false, error: "Wymagane pola: id, review_status" },
        { status: 400 }
      );
    }

    if (!["confirmed", "rejected", "overridden"].includes(review_status)) {
      return NextResponse.json(
        { ok: false, error: "Nieprawidłowy status. Dozwolone: confirmed, rejected, overridden" },
        { status: 400 }
      );
    }

    await postgresRepo.updateDocumentEntityReview(
      id,
      review_status,
      reviewed_by || "Analityk Dyżurny TTscope"
    );

    return NextResponse.json({ ok: true, status: review_status });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Błąd weryfikacji powiązania encji" },
      { status: 500 }
    );
  }
}
