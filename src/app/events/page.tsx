import Link from "next/link";
import { dbRepo } from "@/lib/db";
import {
  Layers,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
} from "lucide-react";
import { formatEventStage } from "@/lib/format/publication";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EventsPage() {
  const events = dbRepo.getAllEvents();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-neutral-400" />
            Centrum wydarzeń i ognisk iskrzeń
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Grupowanie publikacji w spójne wątki tematyczne z analizą wskaźnika ryzyka Sparks Score.
          </p>
        </div>

        <div className="text-xs text-neutral-400 font-mono">
          Aktywne wątki: <strong className="text-white">{events.length}</strong>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 text-center text-neutral-400">
          <p className="text-sm font-medium">Brak zagregowanych wydarzeń.</p>
          <p className="text-xs text-neutral-500 mt-1">
            Pobierz publikacje ze źródeł, a silnik klastrowania automatycznie połączy je w wątki.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((evt) => {
            const eventDetails = dbRepo.getEventById(evt.id);
            const docsCount = eventDetails?.documents?.length || 0;

            return (
              <div
                key={evt.id}
                className="bg-surface p-5 rounded-xl border border-surface-border flex flex-col justify-between hover:border-neutral-600 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded text-neutral-300">
                      {formatEventStage(evt.event_stage)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-neutral-400">Sparks Score:</span>
                      <span className={`text-base font-bold font-mono ${
                        evt.sparks_score >= 60 ? "text-red-400" : evt.sparks_score >= 40 ? "text-amber-300" : "text-emerald-400"
                      }`}>
                        {evt.sparks_score.toFixed(0)}/100
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-white leading-snug">{evt.title}</h3>
                  <p className="text-xs text-neutral-300 leading-relaxed">{evt.summary}</p>

                  <div className="p-3 bg-surface-muted rounded-lg border border-surface-border space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-neutral-400">
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
                      <p className="text-[11px] text-neutral-400 italic">
                        {evt.orlen_statement_summary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-surface-border text-xs">
                  <span className="text-neutral-400">
                    Liczba publikacji: <strong className="text-white font-mono">{docsCount}</strong>
                  </span>

                  <Link
                    href={`/events/${evt.id}`}
                    className="flex items-center gap-1 text-red-400 hover:text-red-300 font-medium transition-colors"
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
