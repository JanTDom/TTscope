import { dbRepo } from "@/lib/db";
import { Bell, Flame, ShieldAlert, CheckCircle2, Clock } from "lucide-react";
import { formatPublicationTime } from "@/lib/format/publication";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AlertsPage() {
  const alerts = dbRepo.getActiveAlerts();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-neutral-400" />
            Alerty wywiadowcze wczesnego ostrzegania
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Automatyczne powiadomienia generowane na podstawie dynamiki publikacji, anomalii sentymentu i sygnałów pracowniczych.
          </p>
        </div>

        <div className="text-xs text-neutral-400 font-mono">
          Aktywne alerty: <strong className="text-white">{alerts.length}</strong>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 text-center text-neutral-400">
          <ShieldAlert className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
          <p className="text-sm font-medium">Brak aktywnych alertów kryzysowych.</p>
          <p className="text-xs text-neutral-500 mt-1">
            Wskaźnik Iskrzenia we wszystkich monitorowanych tematach znajduje się poniżej progu alarmowego.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-5 rounded-xl border flex flex-col justify-between space-y-3 ${
                alert.severity === "critical"
                  ? "bg-red-950/20 border-red-900/50"
                  : "bg-surface border-surface-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                  alert.severity === "critical"
                    ? "bg-red-900 text-red-100"
                    : "bg-amber-900/60 text-amber-200"
                }`}>
                  Poziom: {alert.severity}
                </span>

                <span className="text-xs text-cyan-300 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Godzina ostatniej publikacji: {formatPublicationTime(alert.created_at)}
                </span>
              </div>

              <div>
                <h3 className="text-base font-semibold text-white leading-snug">{alert.title}</h3>
                <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{alert.message}</p>
              </div>

              {alert.evidence_list && alert.evidence_list.length > 0 && (
                <div className="p-3 bg-surface-muted rounded-lg border border-surface-border text-xs space-y-1">
                  <span className="text-[10px] font-mono uppercase text-neutral-400">Dowody źródłowe w bazie:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-neutral-300 text-[11px]">
                    {alert.evidence_list.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
