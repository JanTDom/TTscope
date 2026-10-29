import Link from "next/link";
import { dbRepo } from "@/lib/db";
import {
  Layers,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Building2,
  Calendar,
} from "lucide-react";
import { formatEventStage, formatPublicationTime } from "@/lib/format/publication";
import { resolveTimeRange } from "@/lib/analytics/time-ranges";
import { GlobalTimeRangeSelector } from "@/components/navigation/GlobalTimeRangeSelector";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    time_range?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
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

  const events = dbRepo.getAllEvents({
    from: timeRange.fromIso,
    to: timeRange.toIso,
  });

  return (
    <div className="space-y-6">
      {/* Nagłówek z selektorem czasu */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Wykryte wątki tematyczne i ogniska (Sparks Index)
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Aktywne okno: <strong className="text-cyan-300 font-mono">{timeRange.label}</strong>.
            Grupowanie publikacji w fale tematyczne i kalkulacja wskaźnika napięcia (0-100).
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <GlobalTimeRangeSelector
            currentPreset={timeRange.preset}
            currentFrom={resolvedParams.from}
            currentTo={resolvedParams.to}
          />
          <div className="text-xs text-slate-300 font-mono bg-[#07162c] px-3.5 py-2 rounded-xl border border-cyan-500/30">
            Wątków w oknie: <strong className="text-cyan-300">{events.length}</strong>
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-xl border border-surface-border space-y-2">
          <div className="text-sm font-medium text-slate-200">Brak zarejestrowanych wątków w wybranym przedziale czasu</div>
          <p className="text-xs text-slate-400">
            Zmień horyzont czasowy na pasku powyżej (np. 7 dni lub miesiąc), aby zobaczyć wcześniejsze zjawiska.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {events.map((evt) => {
            const eventDetails = dbRepo.getEventById(evt.id);
            const docsCount = eventDetails?.documents.length || 0;

            return (
              <div
                key={evt.id}
                className="bg-surface p-5 rounded-xl border border-surface-border hover:border-cyan-500/50 transition-colors flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded text-cyan-200">
                      {formatEventStage(evt.event_stage)}
                    </span>

                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span className="text-slate-400 text-[10px]">Sparks Index:</span>
                      <strong
                        className={`text-sm font-bold ${
                          evt.sparks_score >= 60
                            ? "text-rose-400"
                            : evt.sparks_score >= 40
                            ? "text-amber-300"
                            : "text-emerald-400"
                        }`}
                      >
                        {evt.sparks_score.toFixed(0)}/100
                      </strong>
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-white leading-snug">
                    <Link
                      href={`/events/${evt.id}`}
                      className="hover:text-cyan-300 transition-colors"
                    >
                      {evt.title}
                    </Link>
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono flex-wrap">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      Ostatnia publikacja: {formatPublicationTime(evt.last_signal_at)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{evt.summary}</p>

                  <div className="p-3 bg-surface-muted rounded-lg border border-surface-border space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Stanowisko ORLEN:</span>
                      {evt.has_orlen_responded ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Odnotowano komunikat
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" /> Brak oficjalnej odpowiedzi
                        </span>
                      )}
                    </div>
                    {evt.orlen_statement_summary && (
                      <p className="text-[11px] text-slate-400 italic">
                        {evt.orlen_statement_summary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-surface-border text-xs">
                  <span className="text-slate-400">
                    Liczba publikacji: <strong className="text-white font-mono">{docsCount}</strong>
                  </span>

                  <Link
                    href={`/events/${evt.id}`}
                    className="flex items-center gap-1 text-cyan-300 hover:text-white font-semibold transition-colors"
                  >
                    Szczegóły i oś czasu <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
