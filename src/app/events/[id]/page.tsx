import { notFound } from "next/navigation";
import Link from "next/link";
import { dbRepo } from "@/lib/db";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  GitFork,
} from "lucide-react";
import { DiffusionFlowGraph } from "@/components/DiffusionFlowGraph";
import { formatDiffusionStep, formatEventStage, formatPublicationTime } from "@/lib/format/publication";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = dbRepo.getEventById(id);

  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-white transition-colors font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Powrót do listy wydarzeń
      </Link>

      {/* Nagłówek incydentu */}
      <div className="bg-surface/95 p-6 rounded-2xl border border-cyan-500/35 shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono uppercase bg-cyan-500/15 border border-cyan-400/30 px-2.5 py-0.5 rounded text-cyan-300">
              {formatEventStage(event.event_stage)}
            </span>
            <span className="text-xs text-slate-300 font-mono">
              Pierwsza publikacja: {formatPublicationTime(event.first_detected_at)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-300">Sparks Score:</span>
            <span
              className={`text-2xl font-bold font-mono ${
                event.sparks_score >= 60
                  ? "text-rose-400"
                  : event.sparks_score >= 40
                  ? "text-amber-300"
                  : "text-emerald-400"
              }`}
            >
              {event.sparks_score.toFixed(0)}
              <span className="text-xs text-slate-500">/100</span>
            </span>
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-white">{event.title}</h2>
        <p className="text-sm text-slate-200 leading-relaxed">{event.summary}</p>

        {/* Stanowisko ORLEN */}
        <div className="p-4 bg-surface-muted/80 rounded-xl border border-cyan-500/25">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-cyan-200">Status komunikacji Grupy ORLEN:</span>
            {event.has_orlen_responded ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Odnotowano oficjalny komunikat
              </span>
            ) : (
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Brak oficjalnej odpowiedzi
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300">
            {event.orlen_statement_summary ||
              "Do tej pory nie odnotowano publicznego oświadczenia ani dementi w oficjalnych kanałach ORLEN S.A."}
          </p>
        </div>
      </div>

      {/* Graficzny wykres przepływu 4 pierwszych ogniw */}
      <div className="bg-surface/95 p-6 rounded-2xl border border-surface-border space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <GitFork className="w-4 h-4 text-cyan-400" />
          Graficzna ścieżka przenikania (pierwsze 4 ogniwa łańcucha)
        </h3>
        <DiffusionFlowGraph documents={event.documents} maxNodes={4} />
      </div>

      {/* Oś Czasu (Timeline) Publikacji */}
      <div className="bg-surface/95 p-6 rounded-2xl border border-surface-border space-y-5">
        <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          Pełna chronologiczna oś czasu i ścieżka rozprzestrzeniania ({event.documents.length} publikacji)
        </h3>

        <div className="relative pl-7 space-y-5 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-cyan-400 before:via-sky-500 before:to-slate-700">
          {event.documents.map((doc, idx) => (
            <div key={doc.id} className="relative">
              {/* Świecąca kropka na osi czasu */}
              <div
                className={`absolute -left-[25px] top-1.5 w-4 h-4 rounded-full border-2 bg-surface ${
                  idx === 0
                    ? "border-cyan-400 animate-node-pulse"
                    : doc.is_orlen_official
                    ? "border-sky-400"
                    : doc.is_labor_signal
                    ? "border-amber-400"
                    : "border-indigo-400"
                }`}
              />

              <div className="bg-surface-muted/80 p-4 rounded-xl border border-surface-border hover:border-cyan-500/40 transition-colors space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-cyan-300">{doc.source_name}</span>
                    <span className="text-[10px] font-mono uppercase bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded text-cyan-200">
                      Krok {idx + 1}: {formatDiffusionStep(doc.diffusion_step)}
                    </span>
                    {doc.time_delta_seconds > 0 && (
                      <span className="text-[10px] font-mono text-slate-400">
                        +{(doc.time_delta_seconds / 60).toFixed(0)} min od sygnału pierwotnego
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-[11px] text-slate-400">
                    {formatPublicationTime(doc.published_at)}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-white hover:text-cyan-300 transition-colors">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5"
                  >
                    <span>{doc.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  </a>
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {doc.excerpt || doc.content}
                </p>

                <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
                  {doc.is_orlen_official && (
                    <span className="bg-sky-950/60 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
                      Stanowisko ekosystemu ORLEN
                    </span>
                  )}
                  {doc.is_labor_signal && (
                    <span className="bg-amber-950/60 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                      Wątek pracowniczy / związki
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
