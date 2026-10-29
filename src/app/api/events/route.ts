import { NextRequest, NextResponse } from "next/server";
import { dbRepo } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const eventDetails = dbRepo.getEventById(id);
      if (!eventDetails) {
        return NextResponse.json({ ok: false, error: "Wydarzenie nie zostało odnalezione." }, { status: 404 });
      }
      return NextResponse.json({ ok: true, event: eventDetails });
    }

    const events = dbRepo.getAllEvents();
    return NextResponse.json({ ok: true, events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd pobierania wydarzeń";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
