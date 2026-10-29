import { NextResponse } from "next/server";
import { dbRepo } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const stats = dbRepo.getDashboardStats();
    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd pobierania statystyk";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
