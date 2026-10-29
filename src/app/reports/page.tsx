import { dbRepo } from "@/lib/db";
import { FileText, Printer, Building2, Flame, ExternalLink, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReportsPage() {
  const stats = dbRepo.getDashboardStats();
  const events = dbRepo.getAllEvents();
  const alerts = dbRepo.getActiveAlerts();
  const { documents } = dbRepo.getDocuments({ limit: 10 });
  const facilities = dbRepo.getAllFacilities();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-neutral-400" />
            Biuletyn wywiadowczy OSINT (Raport sytuacyjny)
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Rzetelne zestawienie faktów, źródeł i oceny ryzyka oparte w 100% na danych z bazy.
          </p>
        </div>

        <button
          onClick={() => {}}
          className="print:hidden flex items-center gap-2 px-4 py-2 bg-surface-muted hover:bg-neutral-800 border border-surface-border rounded-lg text-xs font-medium text-white transition-colors"
        >
          <Printer className="w-3.5 h-3.5" /> Drukuj / Zapisz PDF
        </button>
      </div>

      {/* Ciało Raportu */}
      <div className="bg-surface p-8 rounded-xl border border-surface-border space-y-6 print:border-none print:p-0">
        <div className="border-b border-surface-border pb-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>DOKUMENT ANALITYCZNY TTSCOPE</span>
            <span>DATA GENEROWANIA: {new Date().toLocaleString("pl-PL")}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2">
            Biuletyn Sytuacyjny: Monitoring Grupy ORLEN
          </h1>
          <p className="text-xs text-neutral-300 mt-1">
            Wydanie bieżące oparte wyłącznie na zindeksowanych publikacjach publicznych. Zero mocków.
          </p>
        </div>

        {/* 1. Podsumowanie Liczbowe */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
            1. Stan bazy i statystyki monitoringu
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-surface-muted p-3 rounded-lg border border-surface-border">
              <span className="text-neutral-400">Wszystkie dokumenty</span>
              <div className="text-lg font-bold font-mono text-white mt-1">{stats.totalDocs}</div>
            </div>
            <div className="bg-surface-muted p-3 rounded-lg border border-surface-border">
              <span className="text-neutral-400">Oficjalne ORLEN</span>
              <div className="text-lg font-bold font-mono text-white mt-1">{stats.officialDocs}</div>
            </div>
            <div className="bg-surface-muted p-3 rounded-lg border border-surface-border">
              <span className="text-neutral-400">Sygnały pracownicze</span>
              <div className="text-lg font-bold font-mono text-amber-300 mt-1">{stats.laborDocs}</div>
            </div>
            <div className="bg-surface-muted p-3 rounded-lg border border-surface-border">
              <span className="text-neutral-400">Aktywne alerty</span>
              <div className="text-lg font-bold font-mono text-red-400 mt-1">{stats.activeAlerts}</div>
            </div>
          </div>
        </div>

        {/* 2. Zidentyfikowane Wydarzenia i Iskrzenia */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
            2. Kluczowe wątki i ocena ryzyka (Sparks Score)
          </h3>
          <div className="space-y-3">
            {events.map((evt) => (
              <div key={evt.id} className="bg-surface-muted p-4 rounded-lg border border-surface-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{evt.title}</span>
                  <span className="font-mono text-neutral-400">
                    Sparks Score: <strong>{evt.sparks_score.toFixed(0)}/100</strong>
                  </span>
                </div>
                <p className="text-xs text-neutral-300">{evt.summary}</p>
                <div className="text-[11px] text-neutral-400 pt-1 border-t border-surface-border flex items-center justify-between">
                  <span>
                    Stanowisko spółki:{" "}
                    <strong className="text-neutral-200">
                      {evt.has_orlen_responded ? "Odnotowano oficjalny komunikat" : "Brak oficjalnej odpowiedzi"}
                    </strong>
                  </span>
                  <span className="font-mono">
                    Wykryto: {new Date(evt.first_detected_at).toLocaleDateString("pl-PL")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Przegląd Ostatnich Dowodów Źródłowych */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
            3. Przegląd ostatnich publikacji źródłowych
          </h3>
          <div className="space-y-2">
            {documents.slice(0, 6).map((doc) => (
              <div key={doc.id} className="text-xs border-b border-surface-border pb-2 flex items-start justify-between gap-3">
                <div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-neutral-200 hover:text-red-300 inline-flex items-center gap-1"
                  >
                    <span>{doc.title}</span>
                    <ExternalLink className="w-3 h-3 text-neutral-500 flex-shrink-0" />
                  </a>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Źródło: <strong>{doc.source_name}</strong> | Opublikowano:{" "}
                    {doc.published_at ? new Date(doc.published_at).toLocaleString("pl-PL") : "Brak daty"}
                  </div>
                </div>

                <span className="text-[10px] font-mono uppercase bg-surface-muted px-2 py-0.5 rounded text-neutral-400 flex-shrink-0">
                  {doc.source_type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
