import { dbRepo } from "@/lib/db";
import { Bell, Flame, ShieldAlert, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatPublicationTime } from "@/lib/format/publication";
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

export default async function AlertsPage({ searchParams }: PageProps) {
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

  const alerts = dbRepo.getActiveAlerts({
    from: timeRange.fromIso,
    to: timeRange.toIso,
  });

  return (
    <div className="space-y-6">
      {/* Nagłówek z selektorem czasu */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-400" />
            Alerty wczesnego ostrzegania (Early Warning System)
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Aktywne okno: <strong className="text-cyan-300 font-mono">{timeRange.label}</strong>.
            Wykryte anomalie, skoki dynamiki, spory pracownicze i zagrożenia wizerunkowe wokół Grupy ORLEN.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <GlobalTimeRangeSelector
            currentPreset={timeRange.preset}
            currentFrom={resolvedParams.from}
            currentTo={resolvedParams.to}
          />
          <div className="text-xs text-rose-200 font-mono bg-rose-950/60 px-3.5 py-2 rounded-xl border border-rose-500/40">
            Aktywnych alertów: <strong className="text-white">{alerts.length}</strong>
          </div>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-xl border border-surface-border space-y-2">
          <ShieldAlert className="w-8 h-8 text-emerald-400 mx-auto" />
          <div className="text-sm font-medium text-white">Brak aktywnych alertów w wybranym przedziale czasu</div>
          <p className="text-xs text-slate-400">
            W zadanym oknie nie odnotowano sygnałów przekraczających progi kryzysowe. Zmień zakres czasowy, aby przejrzeć alerty historyczne.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-5 rounded-xl border transition-all ${
                alert.severity === "critical"
                  ? "bg-rose-950/20 border-rose-700/50 hover:border-rose-500 shadow-[0_4px_25px_rgba(244,63,94,0.15)]"
                  : alert.severity === "high"
                  ? "bg-amber-950/20 border-amber-700/50 hover:border-amber-500 shadow-[0_4px_25px_rgba(245,158,11,0.15)]"
                  : "bg-surface border-surface-border hover:border-cyan-500/40"
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase ${
                        alert.severity === "critical"
                          ? "bg-rose-600 text-white shadow-sm"
                          : alert.severity === "high"
                          ? "bg-amber-600 text-white shadow-sm"
                          : "bg-slate-700 text-slate-200"
                      }`}
                    >
                      {alert.severity}
                    </span>

                    <span className="text-slate-400">
                      Godzina ostatniej publikacji: {formatPublicationTime(alert.created_at)}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white">{alert.title}</h3>
                  <p className="text-xs text-slate-200 leading-relaxed">{alert.message}</p>

                  {/* Dowody i cytaty źródłowe */}
                  {alert.evidence_list && alert.evidence_list.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        Fakty i dowody wyzwalające:
                      </span>
                      <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                        {alert.evidence_list.map((ev, idx) => (
                          <li key={idx} className="leading-snug">{ev}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {alert.event_id && (
                  <Link
                    href={`/events/${alert.event_id}`}
                    className="flex-shrink-0 px-3.5 py-2 bg-[#040b16] hover:bg-[#07162c] text-xs font-semibold text-cyan-300 hover:text-white rounded-lg border border-cyan-500/30 flex items-center gap-1.5 transition-colors self-start sm:self-center"
                  >
                    <span>Otwórz oś czasu</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
