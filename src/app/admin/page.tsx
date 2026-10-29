"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Key,
  Globe,
  Clock,
  History,
} from "lucide-react";
import type { Source, AuditLog } from "@/lib/db/types";

interface ConnectorWithSource {
  id: string;
  source_id: string;
  connector_type: string;
  is_configured: boolean;
  last_success_at?: string | null;
  last_attempt_at?: string | null;
  last_error?: string | null;
  source_name: string;
  source_domain: string;
}

export default function AdminPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [connectors, setConnectors] = useState<ConnectorWithSource[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sources");
      const data = await res.json();
      if (data.ok) {
        setSources(data.sources);
        setConnectors(data.connectors);
        setAuditLogs(data.auditLogs);
      }
    } catch (err) {
      console.error("Błąd pobierania źródeł z bazy:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/ingest", { method: "POST" });
      const data = await res.json();
      setSyncResult(data);
      await loadData();
    } catch (err) {
      console.error("Błąd synchronizacji:", err);
      setSyncResult({ ok: false, error: "Błąd połączenia z serwerem." });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-neutral-400" />
            Panel administracyjny, rejestr źródeł i audyt
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Rzeczywisty rejestr konektorów w bazie danych TTscope, kontrola stanu zdrowia i dziennik zdarzeń.
          </p>
        </div>

        <button
          onClick={handleSyncAll}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Pobieranie i klastrowanie..." : "Uruchom synchronizację teraz"}
        </button>
      </div>

      {/* Podsumowanie synchronizacji */}
      {syncResult && (
        <div className={`p-4 rounded-xl border text-xs ${
          syncResult.ok ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300" : "bg-red-950/20 border-red-800/40 text-red-300"
        }`}>
          {syncResult.ok ? (
            <div>
              <div className="font-semibold mb-1">Synchronizacja zakończona sukcesem!</div>
              <p className="text-[11px] text-neutral-300">
                Pobrano i zindeksowano materiały. Klastry utworzone/zaktualizowane: {syncResult.clusterResults?.clustersCreated}, aktywne alerty: {syncResult.clusterResults?.alertsCreated}.
              </p>
            </div>
          ) : (
            <div>{syncResult.error || "Wystąpił błąd synchronizacji."}</div>
          )}
        </div>
      )}

      {/* Dynamiczny Rejestr Konektorów z Bazy Danych */}
      <div className="bg-surface rounded-xl border border-surface-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-neutral-400" />
            Rejestr konektorów i źródeł w bazie danych ({connectors.length})
          </h3>
          <span className="text-xs text-neutral-400 font-mono">100% dane z tabeli sources i source_connectors</span>
        </div>

        {loading ? (
          <div className="text-xs text-neutral-500 py-6 text-center animate-pulse">
            Ładowanie rejestru z bazy danych...
          </div>
        ) : connectors.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500 bg-surface-muted rounded-lg border border-surface-border">
            Brak zarejestrowanych konektorów w bazie. Uruchom synchronizację, aby zainicjalizować rejestr.
          </div>
        ) : (
          <div className="space-y-3">
            {connectors.map((c) => (
              <div
                key={c.id}
                className="p-4 bg-surface-muted rounded-lg border border-surface-border flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-semibold text-white">{c.source_name}</h4>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                      c.is_configured
                        ? "bg-emerald-950/60 border-emerald-800/40 text-emerald-300"
                        : "bg-amber-950/60 border-amber-800/40 text-amber-300"
                    }`}>
                      {c.is_configured ? `Aktywny (${c.connector_type})` : "Wymagany klucz API"}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-400">
                    Domena: <strong className="text-neutral-300">{c.source_domain}</strong> | Konektor: <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-[10px]">{c.connector_type}</code>
                  </p>

                  {c.last_error && (
                    <p className="text-[11px] text-amber-300/90 pt-1">
                      Status: {c.last_error}
                    </p>
                  )}
                </div>

                <div className="text-right text-[11px] text-neutral-400 font-mono flex-shrink-0">
                  <div>
                    {c.last_success_at ? (
                      <span className="text-emerald-400 flex items-center gap-1 justify-end">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {new Date(c.last_success_at).toLocaleTimeString("pl-PL")}
                      </span>
                    ) : (
                      <span className="text-neutral-500">Brak synchronizacji</span>
                    )}
                  </div>
                  {c.last_attempt_at && (
                    <div className="text-[10px] text-neutral-500 mt-1">
                      Próba: {new Date(c.last_attempt_at).toLocaleTimeString("pl-PL")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rzeczywisty Dziennik Zdarzeń (Audit Log) */}
      <div className="bg-surface rounded-xl border border-surface-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-neutral-400" />
            Dziennik operacyjny (Audit Log) ({auditLogs.length})
          </h3>
          <span className="text-[11px] text-neutral-400 font-mono">Tabela audit_logs</span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-6 text-center text-xs text-neutral-500 bg-surface-muted rounded-lg border border-surface-border">
            Brak odnotowanych wpisów w dzienniku audytu.
          </div>
        ) : (
          <div className="space-y-2">
            {auditLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="p-3 bg-surface-muted rounded-lg border border-surface-border flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-white">{log.action_type}</span>
                  <span className="text-neutral-400 ml-2">obiekt: {log.entity_type}</span>
                </div>
                <span className="text-[11px] text-neutral-500 font-mono">
                  {new Date(log.created_at).toLocaleString("pl-PL")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
