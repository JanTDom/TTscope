import { NextResponse } from "next/server";
import { orlenEntityRegistry } from "@/lib/entities/registry";
import { postgresRepo } from "@/lib/db/postgres";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entity = await orlenEntityRegistry.getEntityById(id);
    if (!entity) {
      return NextResponse.json(
        { ok: false, error: "Podmiot nie został odnaleziony" },
        { status: 404 }
      );
    }

    const [matrix, queries, auditLogs, linkedDocs] = await Promise.all([
      orlenEntityRegistry.generateSearchVariants(entity),
      orlenEntityRegistry.generatePlatformQueries(entity),
      orlenEntityRegistry.getAuditHistory(id),
      postgresRepo.getDocumentEntities({ entityId: id, limit: 100 }),
    ]);

    return NextResponse.json({
      ok: true,
      entity,
      search_matrix: matrix,
      platform_queries: queries,
      audit_logs: auditLogs,
      linked_documents: linkedDocs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Błąd pobierania szczegółów podmiotu" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.toggle_monitored !== undefined) {
      await orlenEntityRegistry.toggleMonitored(id, Boolean(body.toggle_monitored), true);
    }

    if (body.add_alias) {
      await orlenEntityRegistry.addAlias(id, String(body.add_alias), true);
    }

    if (body.social_profile) {
      const { network, handle } = body.social_profile;
      if (network && handle) {
        await orlenEntityRegistry.updateSocialProfile(id, network, handle, true);
      }
    }

    if (body.entity_status) {
      await orlenEntityRegistry.saveEntity(
        { id, entity_status: body.entity_status } as any,
        true,
        "Zmiana statusu przez analityka"
      );
    }

    const updated = await orlenEntityRegistry.getEntityById(id);
    return NextResponse.json({ ok: true, entity: updated });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Błąd aktualizacji podmiotu" },
      { status: 500 }
    );
  }
}
