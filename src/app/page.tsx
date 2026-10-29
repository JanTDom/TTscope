import Link from "next/link";
import { dbRepo } from "@/lib/db";
import {
  Activity,
  Building2,
  FileCheck2,
  Flame,
  Radio,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  ShieldAlert,
  GitFork,
  Layers,
} from "lucide-react";
import { DiffusionFlowGraph } from "@/components/DiffusionFlowGraph";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const stats = dbRepo.getDashboardStats();
  const events = dbRepo.getAllEvents();
  const alerts = dbRepo.getActiveAlerts();
  const { documents: recentDocs } = dbRepo.getDocuments({ limit: 12 });

  // Pobieramy główny łańcuch dyfuzji dla najważniejszego wydarzenia
  const topEvent = events[0] ? dbRepo.getEventById(events[0].id) : null;

  return (
    <div className="space-y-6">
      {/* Pasek nagłówkowy z indeksem iskrzeń i podsumowaniem */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Centrum sytuacyjne i radar wywiadowczy Grupy ORLEN
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Bieżący nadzór nad komunikatami oficjalnymi, spółkami zależnymi, związkami zawodowymi oraz dyfuzją w mediach.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-surface-muted/80 px-3.5 py-1.5 rounded-lg border border-cyan-500/30 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-slate-200">
              Ostatnia synchronizacja:{" "}
              <strong className="text-cyan-300 font-mono">
                {stats.lastFetch ? new Date(stats.lastFetch).toLocaleTimeString("pl-PL") : "Brak danych"}
              </strong>
            </span>
          </div>

          <div className="bg-rose-950/50 border border-rose-500/40 px-3.5 py-1.5 rounded-lg flex items-center gap-2 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-xs font-medium">
              Aktywne alerty: <strong>{stats.activeAlerts}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Bento Grid: Kluczowe metryki wywiadowcze w palecie Cyan/Navy */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-surface via-surface to-cyan-950/30 p-5 rounded-2xl border border-cyan-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-cyan-300">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Zindeksowane publikacje</span>
            <FileCheck2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-mono text-white drop-shadow-[0_0_10px_rgba(0,229,255,0.2)]">
              {stats.totalDocs}
            </div>
            <div className="text-[11px] text-slate-300 mt-1">Ze wszystkich zweryfikowanych źródeł</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-surface via-surface to-sky-950/30 p-5 rounded-2xl border border-sky-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-sky-300">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Spółki i oficjalne ORLEN</span>
            <Building2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-mono text-sky-300">{stats.officialDocs}</div>
            <div className="text-[11px] text-slate-300 mt-1">Centrala, PGNiG, Energa, ANWIL, OSGE, Unipetrol</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-surface via-surface to-amber-950/25 p-5 rounded-2xl border border-amber-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Sygnały pracownicze</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-mono text-amber-300">{stats.laborDocs}</div>
            <div className="text-[11px] text-slate-300 mt-1">NSZZ Solidarność, MZZPRC, spory, BHP</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-surface via-surface to-emerald-950/25 p-5 rounded-2xl border border-emerald-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Aktywne konektory</span>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-mono text-emerald-400">
              {stats.activeSources} <span className="text-sm text-slate-400">/ {stats.totalSources}</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">100% sprawności źródeł publicznych</div>
          </div>
        </div>
      </div>

      {/* Sekcja Graficznej Ścieżki Przepływu na żywo (Komunikat -> Publikacje) */}
      {topEvent && topEvent.documents.length > 0 && (
        <div className="bg-surface/95 rounded-2xl border border-cyan-500/35 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
            <div className="flex items-center gap-2.5">
              <GitFork className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">
                Ścieżka dyfuzji wiodącego tematu:{" "}
                <span className="text-cyan-300">{topEvent.title}</span>
              </h3>
            </div>
            <Link
              href="/diffusion"
              className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1 font-medium"
            >
              Pełna matryca przepływu ({events.length} łańcuchów) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <DiffusionFlowGraph documents={topEvent.documents} maxNodes={4} />
        </div>
      )}

      {/* Alerty Kryzysowe */}
      {alerts.length > 0 && (
        <div className="bg-surface/95 rounded-2xl border border-rose-500/35 p-5 space-y-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs tracking-wider uppercase font-mono">
              <ShieldAlert className="w-4 h-4" />
              Alerty wczesnego ostrzegania (Sparks Index)
            </div>
            <Link href="/alerts" className="text-xs text-rose-300 hover:text-white flex items-center gap-1">
              Wszystkie alerty ({alerts.length}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {alerts.slice(0, 6).map((alert) => (
              <div
                key={alert.id}
                className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-xl flex flex-col justify-between hover:border-rose-400/50 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase bg-rose-500/20 border border-rose-500/40 text-rose-200 px-2 py-0.5 rounded font-bold">
                      {alert.severity}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(alert.created_at).toLocaleTimeString("pl-PL")}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white leading-snug">{alert.title}</h4>
                  <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed line-clamp-3">{alert.message}</p>
                </div>
                {alert.evidence_list && alert.evidence_list.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-rose-500/20 text-[10px] text-slate-400 line-clamp-1">
                    Dowód: {alert.evidence_list[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Główny układ Bento: Wydarzenia vs Najnowszy Strumień */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolumna lewa: Zagregowane Wydarzenia i Iskrzenia (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Zagregowane klastry tematyczne i dynamika iskrzeń ({events.length})
            </h3>
            <Link
              href="/events"
              className="text-xs text-cyan-300 hover:text-white flex items-center gap-1 transition-colors"
            >
              Wszystkie wydarzenia <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {events.map((evt) => (
              <Link
                key={evt.id}
                href={`/events/${evt.id}`}
                className="block bg-surface hover:bg-surface-muted/80 transition-all p-4 rounded-xl border border-surface-border hover:border-cyan-500/40 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-mono uppercase bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded text-cyan-300">
                        {evt.event_stage.replace("_", " ")}
                      </span>
                      {evt.has_orlen_responded ? (
                        <span className="text-[10px] font-mono uppercase bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded">
                          Stanowisko ORLEN
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          Brak stanowiska
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(evt.last_signal_at).toLocaleTimeString("pl-PL")}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300">{evt.title}</h4>
                    {evt.summary && (
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">{evt.summary}</p>
                    )}
                  </div>

                  <div className="text-right flex flex-col items-end flex-shrink-0">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Sparks Score</div>
                    <div
                      className={`text-xl font-bold font-mono ${
                        evt.sparks_score >= 60
                          ? "text-rose-400"
                          : evt.sparks_score >= 40
                          ? "text-amber-300"
                          : "text-emerald-400"
                      }`}
                    >
                      {evt.sparks_score.toFixed(0)}
                      <span className="text-xs text-slate-500">/100</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Kolumna prawa: Ostatnio zindeksowane publikacje (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              Najnowsze publikacje w strumieniu
            </h3>
            <Link
              href="/stream"
              className="text-xs text-cyan-300 hover:text-white flex items-center gap-1 transition-colors"
            >
              Pełny strumień ({stats.totalDocs}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentDocs.slice(0, 8).map((doc) => (
              <div
                key={doc.id}
                className="bg-surface p-3.5 rounded-xl border border-surface-border hover:border-cyan-500/35 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span className="font-medium text-cyan-300 flex items-center gap-1.5 truncate max-w-[220px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                      {doc.source_name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {doc.published_at ? new Date(doc.published_at).toLocaleTimeString("pl-PL") : "Brak daty"}
                    </span>
                  </div>
                  <h5 className="text-xs font-medium text-white leading-snug hover:text-cyan-300 transition-colors">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start justify-between gap-2"
                    >
                      <span>{doc.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    </a>
                  </h5>
                </div>

                <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-surface-border/70 text-[10px] text-slate-400 flex-wrap">
                  {doc.facility_location && (
                    <span className="flex items-center gap-1 text-slate-200 bg-white/5 px-1.5 py-0.5 rounded">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      {doc.facility_location}
                    </span>
                  )}
                  {doc.is_labor_signal && (
                    <span className="bg-amber-950/50 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                      Sygnał pracowniczy
                    </span>
                  )}
                  {doc.is_orlen_official && (
                    <span className="bg-sky-950/60 text-sky-300 px-1.5 py-0.5 rounded border border-sky-500/30">
                      Ekosystem ORLEN
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
