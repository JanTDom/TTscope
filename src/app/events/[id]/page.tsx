import { notFound } from "next/navigation";
import Link from "next/link";
import { dbRepo } from "@/lib/db";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Flame,
  CheckCircle2,
  AlertTriangle,
  GitCommit,
  Building2,
  Users,
} from "lucide-react";

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
    <div className="space-y-6 max-w-5xl">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Powrót do listy wydarzeń
      </Link>

      {/* Nagłówek incydentu */}
      <div className="bg-surface p-6 rounded-xl border border-surface-border space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded text-neutral-300">
              {event.event_stage.replace("_", " ")}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              Wykryto: {new Date(event.first_detected_at).toLocaleString("pl-PL")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-400">Sparks Score:</span>
            <span className={`text-2xl font-bold font-mono ${
              event.sparks_score >= 60 ? "text-red-400" : event.sparks_score >= 40 ? "text-amber-300" : "text-emerald-400"
            }`}>
              {event.sparks_score.toFixed(0)}<span className="text-xs text-neutral-500">/100</span>
            </span>
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-white">{event.title}</h2>
        <p className="text-sm text-neutral-300 leading-relaxed">{event.summary}</p>

        {/* Stanowisko ORLEN */}
        <div className="p-4 bg-surface-muted rounded-xl border border-surface-border">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-neutral-300">Status komunikacji Grupy ORLEN:</span>
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
          <p className="text-xs text-neutral-400">
            {event.orlen_statement_summary || "Do tej pory nie odnotowano publicznego oświadczenia ani dementi w oficjalnych kanałach ORLEN S.A."}
          </p>
        </div>
      </div>

      {/* Oś Czasu (Timeline) Publikacji */}
      <div className="bg-surface p-6 rounded-xl border border-surface-border space-y-4">
        <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-neutral-400" />
          Chronologiczna oś czasu i ścieżka rozprzestrzeniania (Diffusion Timeline)
        </h3>

        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-border">
          {event.documents.map((doc, idx) => (
            <div key={doc.id} className="relative">
              {/* Kropka na osi czasu */}
              <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-surface ${
                doc.is_orlen_official
                  ? "border-red-500"
                  : doc.is_labor_signal
                  ? "border-amber-400"
                  : "border-neutral-500"
              }`} />

              <div className="bg-surface-muted p-4 rounded-lg border border-surface-border space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{doc.source_name}</span>
                    <span className="text-[10px] font-mono uppercase bg-white/10 px-1.5 py-0.5 rounded text-neutral-300">
                      Krok: {doc.diffusion_step}
                    </span>
                    {doc.time_delta_seconds > 0 && (
                      <span className="text-[10px] font-mono text-neutral-400">
                        +{(doc.time_delta_seconds / 60).toFixed(0)} min od sygnału pierwotnego
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-[11px]">
                    {doc.published_at ? new Date(doc.published_at).toLocaleString("pl-PL") : "Brak daty"}
                  </span>
                </div>

                <h4 className="text-sm font-medium text-white hover:text-red-300 transition-colors">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5">
                    <span>{doc.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                  </a>
                </h4>

                <p className="text-xs text-neutral-300 leading-relaxed line-clamp-2">
                  {doc.excerpt || doc.content}
                </p>

                <div className="flex items-center gap-2 text-[10px] text-neutral-400 pt-1">
                  {doc.is_orlen_official && (
                    <span className="bg-red-950/40 text-red-300 px-1.5 py-0.5 rounded border border-red-900/40">
                      Stanowisko oficjalne
                    </span>
                  )}
                  {doc.is_labor_signal && (
                    <span className="bg-amber-950/40 text-amber-300 px-1.5 py-0.5 rounded border border-amber-900/40">
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
