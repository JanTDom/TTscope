import { dbRepo } from "@/lib/db";
import { FileText, Printer, ShieldCheck, Clock, Flame, Building2, Radio } from "lucide-react";
import { formatPublicationTime } from "@/lib/format/publication";
import { resolveTimeRange } from "@/lib/analytics/time-ranges";
import { GlobalTimeRangeSelector } from "@/components/navigation/GlobalTimeRangeSelector";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    time_range?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const latestPublished = dbRepo.getDashboardStats().latestPublished || "2026-10-29T14:27:00.000Z";

  const timeRange = resolveTimeRange(
    {
      preset: resolvedParams.time_range,
      from: resolvedParams.from,
      to: resolvedParams.to,
    },
    latestPublished
  );

  const stats = dbRepo.getDashboardStats({
    from: timeRange.fromIso,
    to: timeRange.toIso,
  });

  const events = dbRepo.getAllEvents({
    from: timeRange.fromIso,
    to: timeRange.toIso,
  });

  const alerts = dbRepo.getActiveAlerts({
    from: timeRange.fromIso,
    to: timeRange.toIso,
  });

  const { documents: recentDocs } = dbRepo.getDocuments({
    publishedFrom: timeRange.fromIso,
    publishedTo: timeRange.toIso,
    limit: 20,
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Pasek akcji z selektorem czasu */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-surface-border pb-5 no-print">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Biuletyn sytuacyjny i raport wywiadowczy
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Aktywny zakres: <strong className="text-cyan-300 font-mono">{timeRange.label}</strong>{" "}
            (od {formatPublicationTime(timeRange.fromIso)} do {formatPublicationTime(timeRange.toIso)}).
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <GlobalTimeRangeSelector
            currentPreset={timeRange.preset}
            currentFrom={resolvedParams.from}
            currentTo={resolvedParams.to}
          />
          <PrintButton />
        </div>
      </div>

      {/* Wydruk raportu */}
      <div className="bg-surface p-8 rounded-2xl border border-surface-border space-y-8 shadow-lg print:border-none print:shadow-none print:p-0">
        <div className="border-b border-surface-border pb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400 mb-1">
              DOKUMENT WYWIADOWCZY OSINT // POZIOM: OFICJALNY
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Biuletyn Wywiadu Medialnego i Monitoringu Kryzysowego
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Podmiot monitorowany: Grupa ORLEN S.A. wraz ze spółkami zależnymi
            </p>
          </div>

          <div className="text-right text-[11px] font-mono text-slate-400 space-y-1">
            <div>OKNO ANALIZY: {timeRange.label.toUpperCase()}</div>
            <div>OD: {formatPublicationTime(timeRange.fromIso)}</div>
            <div>DO: {formatPublicationTime(timeRange.toIso)}</div>
          </div>
        </div>

        {/* Podsumowanie liczb w oknie */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-surface-muted rounded-xl border border-surface-border">
            <span className="text-[11px] text-slate-400 block">Publikacje w oknie</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">{stats.totalDocs}</div>
          </div>
          <div className="p-4 bg-surface-muted rounded-xl border border-surface-border">
            <span className="text-[11px] text-slate-400 block">Komunikaty ORLEN</span>
            <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">{stats.officialDocs}</div>
          </div>
          <div className="p-4 bg-surface-muted rounded-xl border border-surface-border">
            <span className="text-[11px] text-slate-400 block">Sygnały załogi / związki</span>
            <div className="text-2xl font-bold font-mono text-amber-300 mt-1">{stats.laborSignalDocs}</div>
          </div>
          <div className="p-4 bg-surface-muted rounded-xl border border-surface-border">
            <span className="text-[11px] text-slate-400 block">Alerty kryzysowe</span>
            <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{stats.activeAlerts}</div>
          </div>
        </div>

        {/* Główne wątki w oknie */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono border-b border-surface-border pb-2">
            1. Wątki tematyczne o najwyższym wskaźniku napięcia
          </h3>
          {events.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Brak zarejestrowanych wątków w zadanym oknie.</p>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 5).map((evt, idx) => (
                <div key={evt.id} className="p-4 bg-surface-muted rounded-xl border border-surface-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">#{idx + 1}. {evt.title}</span>
                    <span className="font-mono text-cyan-300">Sparks Score: {evt.sparks_score.toFixed(0)}/100</span>
                  </div>
                  <p className="text-xs text-slate-300">{evt.summary}</p>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Ostatnia publikacja: {formatPublicationTime(evt.last_signal_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ostatnie publikacje */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono border-b border-surface-border pb-2">
            2. Kluczowe publikacje w zadanym horyzoncie ({recentDocs.length})
          </h3>
          <div className="space-y-2 text-xs">
            {recentDocs.map((doc) => (
              <div key={doc.id} className="p-3 bg-surface-muted rounded-lg border border-surface-border flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-white">{doc.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Źródło: {doc.source_name} ({doc.source_type})
                  </div>
                </div>
                <div className="text-[11px] font-mono text-cyan-300 flex-shrink-0">
                  {formatPublicationTime(doc.published_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
