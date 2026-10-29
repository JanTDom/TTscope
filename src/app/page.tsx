import Link from "next/link";
import { dbRepo } from "@/lib/db";
import {
  Activity,
  AlertTriangle,
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
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const stats = dbRepo.getDashboardStats();
  const events = dbRepo.getAllEvents();
  const alerts = dbRepo.getActiveAlerts();
  const { documents: recentDocs } = dbRepo.getDocuments({ limit: 12 });
  const facilities = dbRepo.getAllFacilities();

  const officialDocs = recentDocs.filter((d) => d.is_orlen_official);
  const mediaDocs = recentDocs.filter((d) => !d.is_orlen_official);

  return (
    <div className="space-y-6">
      {/* Pasek nagłówkowy z indeksem iskrzeń i podsumowaniem */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Centrum sytuacyjne Grupy ORLEN
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Ciągły monitoring publikacji publicznych, komunikatów oficjalnych i wczesnych zarzewi kryzysowych.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-surface-muted px-3 py-1.5 rounded-lg border border-surface-border flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-xs text-neutral-300">
              Ostatnia synchronizacja:{" "}
              <strong className="text-white font-mono">
                {stats.lastFetch ? new Date(stats.lastFetch).toLocaleTimeString("pl-PL") : "Brak danych"}
              </strong>
            </span>
          </div>

          <div className="bg-red-950/40 border border-red-800/40 px-3 py-1.5 rounded-lg flex items-center gap-2 text-red-300">
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-medium">
              Aktywne alerty: <strong>{stats.activeAlerts}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Bento Grid: Kluczowe metryki wywiadowcze */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-surface-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">Zindeksowane dokumenty</span>
            <FileCheck2 className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white">{stats.totalDocs}</div>
            <div className="text-[11px] text-neutral-400 mt-1">Ze wszystkich aktywnych źródeł</div>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-surface-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">Oficjalne ORLEN</span>
            <Building2 className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white">{stats.officialDocs}</div>
            <div className="text-[11px] text-neutral-400 mt-1">Biuro prasowe, relacje ESPI, Energa</div>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-surface-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">Sygnały pracownicze</span>
            <Activity className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-amber-300">{stats.laborDocs}</div>
            <div className="text-[11px] text-neutral-400 mt-1">Związki, płace, warunki BHP</div>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-surface-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">Aktywne źródła</span>
            <Radio className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {stats.activeSources} <span className="text-xs text-neutral-500">/ {stats.totalSources}</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">Monitorowane kanały publiczne</div>
          </div>
        </div>
      </div>

      {/* Alerty Kryzysowe (jeśli istnieją) */}
      {alerts.length > 0 && (
        <div className="bg-surface rounded-xl border border-red-900/40 p-4 space-y-3">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-xs tracking-wider uppercase">
            <ShieldAlert className="w-4 h-4" />
            Wykryte alerty wczesnego ostrzegania (Sparks Index)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-red-950/20 border border-red-900/30 p-3.5 rounded-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono uppercase bg-red-900/50 text-red-200 px-2 py-0.5 rounded font-bold">
                      {alert.severity}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(alert.created_at).toLocaleTimeString("pl-PL")}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white leading-snug">{alert.title}</h4>
                  <p className="text-[11px] text-neutral-300 mt-1 leading-relaxed">{alert.message}</p>
                </div>
                {alert.evidence_list && alert.evidence_list.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-red-900/20 text-[10px] text-neutral-400">
                    Dowody źródłowe: {alert.evidence_list.join("; ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Główny układ Bento: Wydarzenia vs Komunikacja ORLEN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolumna lewa: Zagregowane Wydarzenia i Iskrzenia (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-neutral-400" />
              Zagregowane tematy i dynamika iskrzeń
            </h3>
            <Link
              href="/events"
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              Wszystkie wydarzenia <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="bg-surface rounded-xl border border-surface-border p-8 text-center text-neutral-400">
              <p className="text-xs">Brak zagregowanych wydarzeń w wybranym przedziale czasowym.</p>
              <p className="text-[11px] text-neutral-500 mt-1">Uruchom pobieranie danych ze źródeł publicznych.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-surface hover:bg-surface-muted/60 transition-colors p-4 rounded-xl border border-surface-border"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded text-neutral-300">
                          {evt.event_stage.replace("_", " ")}
                        </span>
                        {evt.has_orlen_responded ? (
                          <span className="text-[10px] font-mono uppercase bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 px-2 py-0.5 rounded">
                            Odpowiedź ORLEN
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono uppercase bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
                            Brak stanowiska
                          </span>
                        )}
                        <span className="text-[11px] text-neutral-500 font-mono">
                          {new Date(evt.last_signal_at).toLocaleTimeString("pl-PL")}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-white">{evt.title}</h4>
                      {evt.summary && (
                        <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{evt.summary}</p>
                      )}
                    </div>

                    <div className="text-right flex flex-col items-end flex-shrink-0">
                      <div className="text-[10px] uppercase font-mono text-neutral-400">Sparks Score</div>
                      <div className={`text-xl font-bold font-mono ${
                        evt.sparks_score >= 60 ? "text-red-400" : evt.sparks_score >= 40 ? "text-amber-300" : "text-emerald-400"
                      }`}>
                        {evt.sparks_score.toFixed(0)}<span className="text-xs text-neutral-500">/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kolumna prawa: Zestawienie publikacji medialnych i oficjalnych (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-neutral-400" />
              Ostatnio zindeksowane publikacje
            </h3>
            <Link
              href="/stream"
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              Pełny strumień <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentDocs.slice(0, 6).map((doc) => (
              <div
                key={doc.id}
                className="bg-surface p-3.5 rounded-xl border border-surface-border flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1.5">
                    <span className="font-medium text-neutral-300 flex items-center gap-1.5">
                      {doc.is_orlen_official && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                      {doc.source_name}
                    </span>
                    <span className="font-mono text-[10px]">
                      {doc.published_at ? new Date(doc.published_at).toLocaleTimeString("pl-PL") : "Brak daty"}
                    </span>
                  </div>
                  <h5 className="text-xs font-medium text-white leading-snug hover:text-red-300 transition-colors">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1">
                      <span>{doc.title}</span>
                      <ExternalLink className="w-3 h-3 text-neutral-500 inline mt-0.5 flex-shrink-0" />
                    </a>
                  </h5>
                </div>

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-surface-border text-[10px] text-neutral-400 flex-wrap">
                  {doc.facility_location && (
                    <span className="flex items-center gap-1 text-neutral-300">
                      <MapPin className="w-3 h-3 text-neutral-400" />
                      {doc.facility_location}
                    </span>
                  )}
                  {doc.is_labor_signal && (
                    <span className="bg-amber-950/40 text-amber-300 px-1.5 py-0.5 rounded border border-amber-900/40">
                      Sygnał pracowniczy
                    </span>
                  )}
                  {doc.is_orlen_official && (
                    <span className="bg-red-950/40 text-red-300 px-1.5 py-0.5 rounded border border-red-900/40">
                      Oficjalny ORLEN
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
