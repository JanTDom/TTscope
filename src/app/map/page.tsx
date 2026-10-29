import { dbRepo } from "@/lib/db";
import { MapPin, AlertCircle, Building2, Flame } from "lucide-react";
import { formatPublicationTime } from "@/lib/format/publication";
import { resolveTimeRange } from "@/lib/analytics/time-ranges";
import { GlobalTimeRangeSelector } from "@/components/navigation/GlobalTimeRangeSelector";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    time_range?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function MapPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const stats = await dbRepo.getDashboardStats();
  const latestPublished = stats.latestPublished || "2026-10-29T14:27:00.000Z";

  const timeRange = resolveTimeRange(
    {
      preset: resolvedParams.time_range,
      from: resolvedParams.from,
      to: resolvedParams.to,
    },
    latestPublished
  );

  const [facilities, { documents }] = await Promise.all([
    dbRepo.getAllFacilities(),
    dbRepo.getDocuments({
      publishedFrom: timeRange.fromIso,
      publishedTo: timeRange.toIso,
      limit: 500,
    }),
  ]);

  // Zliczanie publikacji przypisanych do zakładu w danym oknie czasowym
  const facilityMentions: Record<string, number> = {};
  documents.forEach((doc) => {
    if (doc.facility_location) {
      facilityMentions[doc.facility_location] = (facilityMentions[doc.facility_location] || 0) + 1;
    }
  });

  return (
    <div className="space-y-6">
      {/* Nagłówek z selektorem czasu */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            Mapa zakładów produkcyjnych i ognisk lokalnych
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Aktywne okno: <strong className="text-cyan-300 font-mono">{timeRange.label}</strong>.
            Lokalizacja kluczowych instalacji, rafinerii, petrochemii oraz natężenie doniesień w wybranym horyzoncie.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <GlobalTimeRangeSelector
            currentPreset={timeRange.preset}
            currentFrom={resolvedParams.from}
            currentTo={resolvedParams.to}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {facilities.map((fac) => {
          const mentions = facilityMentions[fac.city] || 0;
          return (
            <div
              key={fac.id}
              className="bg-surface p-5 rounded-xl border border-surface-border hover:border-cyan-500/50 transition-colors flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-cyan-300 text-[10px] uppercase bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded">
                    {fac.facility_type}
                  </span>
                  <span className="text-slate-400 font-mono">
                    Współrzędne: {fac.lat ? fac.lat.toFixed(2) : "—"}, {fac.lng ? fac.lng.toFixed(2) : "—"}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-white leading-snug">{fac.name}</h3>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{fac.operator_company} ({fac.city})</span>
                </div>
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center justify-between text-xs">
                <span className="text-slate-300">
                  Doniesienia w oknie:{" "}
                  <strong className={mentions > 0 ? "text-cyan-300 font-mono font-bold" : "text-slate-500 font-mono"}>
                    {mentions}
                  </strong>
                </span>

                {mentions > 0 && (
                  <Link
                    href={`/stream?location=${encodeURIComponent(fac.city)}&time_range=${timeRange.preset}`}
                    className="text-cyan-300 hover:text-white font-medium text-[11px]"
                  >
                    Zobacz publikacje →
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
