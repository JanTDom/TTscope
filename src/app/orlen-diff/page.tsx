import { dbRepo } from "@/lib/db";
import { Scale } from "lucide-react";
import { DualCommunicationZone } from "@/components/DualCommunicationZone";
import { resolveTimeRange } from "@/lib/analytics/time-ranges";
import { GlobalTimeRangeSelector } from "@/components/navigation/GlobalTimeRangeSelector";
import { formatPublicationTime } from "@/lib/format/publication";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    time_range?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function OrlenDiffPage({ searchParams }: PageProps) {
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

  const { documents } = dbRepo.getDocuments({
    publishedFrom: timeRange.fromIso,
    publishedTo: timeRange.toIso,
    limit: 300,
  });

  const officialDocs = documents.filter((d) => d.is_orlen_official);
  const laborDocs = documents.filter((d) => d.is_labor_signal && !d.is_orlen_official);
  const externalMediaDocs = documents.filter((d) => !d.is_orlen_official && !d.is_labor_signal);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" aria-hidden="true" />
            Co powiedział ORLEN, a co napisały media
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Aktywne okno: <strong className="text-cyan-300 font-mono">{timeRange.label}</strong>{" "}
            (od {formatPublicationTime(timeRange.fromIso)} do {formatPublicationTime(timeRange.toIso)}).
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

      <DualCommunicationZone
        officialDocs={officialDocs}
        laborDocs={laborDocs}
        mediaDocs={externalMediaDocs}
        expanded
      />
    </div>
  );
}
