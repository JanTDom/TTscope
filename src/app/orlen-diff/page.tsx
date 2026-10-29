import { dbRepo } from "@/lib/db";
import { Scale } from "lucide-react";
import { DualCommunicationZone } from "@/components/DualCommunicationZone";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrlenDiffPage() {
  const { documents } = dbRepo.getDocuments({ limit: 300 });

  const officialDocs = documents.filter((d) => d.is_orlen_official);
  const laborDocs = documents.filter((d) => d.is_labor_signal && !d.is_orlen_official);
  const externalMediaDocs = documents.filter((d) => !d.is_orlen_official && !d.is_labor_signal);

  return (
    <div className="space-y-6">
      <div className="border-b border-surface-border pb-5">
        <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
          <Scale className="w-5 h-5 text-cyan-400" aria-hidden="true" />
          Co powiedział ORLEN, a co napisały media
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Po lewej komunikaty Biura Prasowego, raporty ESPI i sygnały związkowe. Po prawej publikacje mediów
          zewnętrznych. Przy każdej pozycji godzina ukazania się w źródle, nie godzina pobrania.
        </p>
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
