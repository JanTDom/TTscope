import { dbRepo } from "@/lib/db";
import { GitFork, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { DiffusionFlowGraph } from "@/components/DiffusionFlowGraph";
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

export default async function DiffusionPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const stats = await dbRepo.getDashboardStats();
  const latestPublished = stats.latestPublished || "2026-10-29T14:27:00.000Z";

  const timeRange = resolveTimeRange(
    {
      preset: resolvedParams.time_range,
      from: resolvedParams.from,
      to: resolvedParams.to,
    },
    latestPublished
  );

  const rawEvents = await dbRepo.getAllEvents({
    from: timeRange.fromIso,
    to: timeRange.toIso,
  });

  const eventsWithDetails = await Promise.all(
    rawEvents.map(async (evt) => {
      const details = await dbRepo.getEventById(evt.id);
      return {
        ...evt,
        documents: details?.documents || [],
      };
    })
  );

  return (
    <div className="space-y-6">
      {/* Nagłówek z selektorem czasu */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <GitFork className="w-5 h-5 text-cyan-400" />
            Matryca dyfuzji informacji (Leakage & Penetration Graph)
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Aktywne okno: <strong className="text-cyan-300 font-mono">{timeRange.label}</strong>.
            Śledzenie rozprzestrzeniania się komunikatów od źródła pierwotnego po media regionalne i ogólnopolskie.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <GlobalTimeRangeSelector
            currentPreset={timeRange.preset}
            currentFrom={resolvedParams.from}
            currentTo={resolvedParams.to}
          />
          <div className="text-xs text-slate-300 font-mono bg-[#07162c] px-3.5 py-2 rounded-xl border border-cyan-500/30">
            Ścieżek w oknie: <strong className="text-cyan-300">{eventsWithDetails.length}</strong>
          </div>
        </div>
      </div>

      {/* Lista łańcuchów dyfuzji */}
      {eventsWithDetails.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-xl border border-surface-border space-y-2">
          <div className="text-sm font-medium text-slate-200">Brak zarejestrowanych ścieżek dyfuzji w wybranym przedziale czasu</div>
          <p className="text-xs text-slate-400">
            Zmień horyzont czasowy na pasku powyżej (np. 7 dni lub miesiąc), aby przeanalizować wcześniejsze przepływy informacji.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {eventsWithDetails.map((evt) => {
            const docs = evt.documents;

            return (
              <div
                key={evt.id}
                className="bg-surface/95 p-6 rounded-2xl border border-surface-border shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-4 hover:border-cyan-500/40 transition-colors"
              >
                <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row border-b border-surface-border/70 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[10px] font-mono uppercase bg-cyan-500/15 border border-cyan-400/30 px-2 py-0.5 rounded text-cyan-300">
                        {formatEventStage(evt.event_stage)}
                      </span>
                      <h3 className="text-base font-semibold text-white">{evt.title}</h3>
                    </div>
                    <p className="text-xs text-slate-300 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      Pierwsza publikacja: {formatPublicationTime(evt.first_detected_at)} | Ostatnia publikacja:{" "}
                      {formatPublicationTime(evt.last_signal_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Sparks Index</span>
                      <span
                        className={`text-lg font-bold font-mono ${
                          evt.sparks_score >= 60
                            ? "text-rose-400"
                            : evt.sparks_score >= 40
                            ? "text-amber-300"
                            : "text-emerald-400"
                        }`}
                      >
                        {evt.sparks_score.toFixed(0)}/100
                      </span>
                    </div>

                    <div className="text-xs font-mono bg-cyan-950/60 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-cyan-200">
                      Publikacje w łańcuchu: <strong>{docs.length}</strong>
                    </div>
                  </div>
                </div>

                {/* Graficzna wizualizacja węzłów dyfuzji */}
                <DiffusionFlowGraph documents={docs} maxNodes={5} />

                <div className="pt-2 flex items-center justify-between border-t border-surface-border text-xs">
                  <span className="text-slate-400">
                    Kolejność ogniw odzwierciedla autentyczną oś czasu ukazania się publikacji.
                  </span>
                  <Link
                    href={`/events/${evt.id}`}
                    className="text-cyan-300 hover:text-white font-semibold flex items-center gap-1"
                  >
                    Szczegółowa oś czasu i analiza dowodowa <ArrowRight className="w-3.5 h-3.5" />
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
