import { dbRepo } from "@/lib/db";
import { MapPin, Building2, Flame, AlertCircle, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MapPage() {
  const facilities = dbRepo.getAllFacilities();
  const { documents } = dbRepo.getDocuments({ limit: 500 });

  // Mapowanie dokumentów do zakładów
  const facilityStats = facilities.map((fac) => {
    const docs = documents.filter((d) => d.facility_location?.toLowerCase() === fac.city.toLowerCase());
    const laborDocs = docs.filter((d) => d.is_labor_signal);
    const localDocs = docs.filter((d) => d.is_local_signal);

    return {
      ...fac,
      docsCount: docs.length,
      laborCount: laborDocs.length,
      localCount: localDocs.length,
      recentDocs: docs.slice(0, 3),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-neutral-400" />
            Mapa instalacji przemysłowych i wskaźników ryzyka
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Geolokalizacja zakładów produkcyjnych, biorafinerii i petrochemii z przypisanymi sygnałami lokalnymi i pracowniczymi.
          </p>
        </div>

        <div className="text-xs text-neutral-400 font-mono">
          Monitorowane ośrodki: <strong className="text-white">{facilities.length}</strong>
        </div>
      </div>

      {/* Wizualna siatka zakładów z poziomem aktywności */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {facilityStats.map((f) => {
          const hasRisk = f.laborCount > 0 || f.localCount > 0;
          return (
            <div
              key={f.id}
              className={`bg-surface p-5 rounded-xl border flex flex-col justify-between transition-colors ${
                hasRisk ? "border-amber-900/50 bg-amber-950/10" : "border-surface-border"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded text-neutral-300">
                    {f.facility_type}
                  </span>
                  <span className="text-xs text-neutral-400 font-medium">{f.voivodeship}</span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white leading-snug">{f.name}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">{f.operator_company}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-surface-border text-center">
                  <div>
                    <div className="text-xs font-mono font-bold text-white">{f.docsCount}</div>
                    <div className="text-[10px] text-neutral-400">Wzmianki</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-amber-300">{f.laborCount}</div>
                    <div className="text-[10px] text-neutral-400">Związki</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-red-400">{f.localCount}</div>
                    <div className="text-[10px] text-neutral-400">Lokalne</div>
                  </div>
                </div>

                {f.recentDocs.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-mono text-neutral-500">Ostatnie sygnały:</span>
                    {f.recentDocs.map((doc) => (
                      <div key={doc.id} className="text-[11px] text-neutral-300 truncate">
                        • {doc.title}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-neutral-500 py-2">
                    Brak bieżących incydentów dla tej lokalizacji.
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between text-[11px]">
                <span className="text-neutral-400">Status zakładu:</span>
                <span className={`font-medium ${hasRisk ? "text-amber-400" : "text-emerald-400"}`}>
                  {hasRisk ? "Wzmożony monitoring" : "Stabilny"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
