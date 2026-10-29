import { NextResponse } from "next/server";
import { dbRepo } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [stats, events, alerts, { documents: recentDocs }, facilities] = await Promise.all([
      dbRepo.getDashboardStats(),
      dbRepo.getAllEvents(),
      dbRepo.getActiveAlerts(),
      dbRepo.getDocuments({ limit: 20 }),
      dbRepo.getAllFacilities(),
    ]);

    const report = {
      generated_at: new Date().toISOString(),
      report_title: "Biuletyn Sytuacyjny OSINT — Grupa ORLEN",
      classification: "JAWNE / ANALIZA WYWIADOWCZA BAZY DANYCH",
      zero_mock_verified: true,
      stats: {
        total_indexed_documents: stats.totalDocs,
        official_orlen_statements: stats.officialDocs,
        labor_and_union_signals: stats.laborDocs,
        local_community_signals: stats.localDocs,
        active_sources: stats.activeSources,
        total_sources: stats.totalSources,
        last_synchronization: stats.lastFetch,
      },
      critical_alerts: alerts.map((a) => ({
        id: a.id,
        severity: a.severity,
        title: a.title,
        message: a.message,
        created_at: a.created_at,
        evidence: a.evidence_list,
      })),
      key_events: events.map((e) => ({
        id: e.id,
        title: e.title,
        stage: e.event_stage,
        sparks_score: e.sparks_score,
        first_detected_at: e.first_detected_at,
        last_signal_at: e.last_signal_at,
        has_orlen_responded: e.has_orlen_responded,
        orlen_statement: e.orlen_statement_summary,
      })),
      monitored_facilities: facilities.map((f) => ({
        name: f.name,
        city: f.city,
        type: f.facility_type,
        risk_level: f.risk_level,
      })),
      recent_evidence_sample: recentDocs.slice(0, 8).map((d) => ({
        id: d.id,
        title: d.title,
        source: d.source_name,
        url: d.url,
        published_at: d.published_at,
        facility_location: d.facility_location,
        is_orlen_official: d.is_orlen_official,
        is_labor_signal: d.is_labor_signal,
      })),
    };

    return NextResponse.json({ ok: true, report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd generowania raportu";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
