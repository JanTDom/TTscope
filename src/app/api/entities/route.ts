import { NextResponse } from "next/server";
import { orlenEntityRegistry } from "@/lib/entities/registry";
import { postgresRepo } from "@/lib/db/postgres";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const segment = searchParams.get("segment") || undefined;
    const status = searchParams.get("status") || undefined;
    const country = searchParams.get("country") || undefined;
    const query = searchParams.get("query") || undefined;
    const monitoredParam = searchParams.get("is_monitored");
    const is_monitored = monitoredParam !== null ? monitoredParam === "true" : undefined;

    const [entities, stats] = await Promise.all([
      orlenEntityRegistry.getEntities({ segment, status, country, is_monitored, query }),
      postgresRepo.getEntityPublicationStats(),
    ]);

    // Mapowanie statystyk do encji
    const statsMap = new Map(stats.map((s) => [s.id, s]));

    const enriched = entities.map((entity) => {
      const s = statsMap.get(entity.id) || {
        total_mentions: 0,
        facebook_count: 0,
        youtube_count: 0,
        twitter_count: 0,
        official_count: 0,
        industry_count: 0,
        regional_count: 0,
        general_count: 0,
        first_seen_at: null,
        latest_seen_at: null,
      };

      const queries = orlenEntityRegistry.generatePlatformQueries(entity);

      return {
        ...entity,
        stats: s,
        platform_queries: queries,
      };
    });

    return NextResponse.json({
      ok: true,
      total_count: enriched.length,
      entities: enriched,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Błąd pobierania rejestru podmiotów" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.id) {
      return NextResponse.json(
        { ok: false, error: "Wymagane pola: id, name" },
        { status: 400 }
      );
    }

    const saved = await orlenEntityRegistry.saveEntity(
      body,
      true,
      "Ręczne dodanie przez analityka w panelu"
    );

    return NextResponse.json({ ok: true, entity: saved });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Błąd tworzenia podmiotu" },
      { status: 500 }
    );
  }
}
