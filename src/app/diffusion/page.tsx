import Link from "next/link";
import { dbRepo } from "@/lib/db";
import { GitFork, Clock, ArrowRight, Layers, Activity, Flame } from "lucide-react";
import { DiffusionFlowGraph } from "@/components/DiffusionFlowGraph";
import { formatEventStage, formatPublicationTime } from "@/lib/format/publication";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DiffusionPage() {
  const events = dbRepo.getAllEvents();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2.5">
            <GitFork className="w-5 h-5 text-cyan-400" />
            Ścieżki przepływu i dyfuzji informacji (komunikat → publikacje medialne)
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Graficzna wizualizacja rozprzestrzeniania się tematów: od sygnału pierwotnego, przez komunikaty Grupy ORLEN, aż po media lokalne i ogólnopolskie.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-cyan-950/50 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-cyan-200">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          Aktywne łańcuchy: <strong>{events.length}</strong>
        </div>
      </div>

      {/* Legenda wizualna ścieżki */}
      <div className="bg-surface/90 rounded-xl border border-surface-border p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6 flex-wrap text-xs">
          <span className="text-slate-400 font-mono uppercase text-[11px]">Legenda węzłów:</span>
          <span className="flex items-center gap-2 text-cyan-300">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-node-pulse" />
            1. Sygnał pierwotny (Origin)
          </span>
          <span className="flex items-center gap-2 text-sky-300">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            2. Oficjalny komunikat ORLEN
          </span>
          <span className="flex items-center gap-2 text-amber-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            3. Sygnał związkowy / pracowniczy
          </span>
          <span className="flex items-center gap-2 text-indigo-300">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            4. Rezonans w mediach
          </span>
        </div>

        <span className="text-[11px] font-mono text-cyan-400/80">
          Impulsy świetlne obrazują kierunek i opóźnienie czasowe (\(\Delta t\))
        </span>
      </div>

      <div className="space-y-6">
        {events.map((evt) => {
          const eventDetails = dbRepo.getEventById(evt.id);
          const docs = eventDetails?.documents || [];

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

                  <Link
                    href={`/events/${evt.id}`}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-xs text-cyan-300 flex items-center gap-1 transition-all"
                  >
                    Pełna oś <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Graficzna, animowana ścieżka przepływu */}
              <DiffusionFlowGraph documents={docs} maxNodes={4} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
