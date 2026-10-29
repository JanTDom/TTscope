import { dbRepo } from "@/lib/db";
import { Scale, Building2, Radio, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrlenDiffPage() {
  const { documents } = dbRepo.getDocuments({ limit: 200 });

  const officialDocs = documents.filter((d) => d.is_orlen_official);
  const mediaDocs = documents.filter((d) => !d.is_orlen_official);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-neutral-400" />
            Analiza komunikacji: Oficjalny przekaz ORLEN vs Interpretacje medialne
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Zestawienie oświadczeń Biura Prasowego i Relacji Inwestorskich z tytułami i ujęciem tematu w mediach ogólnych i branżowych.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolumna lewa: Oficjalne komunikaty Grupy ORLEN */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-surface-border pb-2">
            <Building2 className="w-4 h-4 text-red-500" />
            <span>Oficjalne komunikaty Grupy ORLEN ({officialDocs.length})</span>
          </div>

          <div className="space-y-3">
            {officialDocs.map((doc) => (
              <div key={doc.id} className="bg-surface p-4 rounded-xl border border-red-950/40 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="text-red-400 font-semibold">{doc.source_name}</span>
                  <span className="font-mono">{doc.published_at ? new Date(doc.published_at).toLocaleString("pl-PL") : ""}</span>
                </div>

                <h4 className="text-xs font-semibold text-white">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="hover:text-red-300 inline-flex items-center gap-1">
                    <span>{doc.title}</span>
                    <ExternalLink className="w-3 h-3 text-neutral-500 flex-shrink-0" />
                  </a>
                </h4>

                <p className="text-xs text-neutral-300 line-clamp-3">
                  {doc.excerpt || doc.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Kolumna prawa: Doniesienia mediów */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-surface-border pb-2">
            <Radio className="w-4 h-4 text-neutral-400" />
            <span>Relacje i interpretacje medialne ({mediaDocs.length})</span>
          </div>

          <div className="space-y-3">
            {mediaDocs.slice(0, 10).map((doc) => (
              <div key={doc.id} className="bg-surface p-4 rounded-xl border border-surface-border space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="text-neutral-200 font-semibold">{doc.source_name}</span>
                  <span className="font-mono">{doc.published_at ? new Date(doc.published_at).toLocaleString("pl-PL") : ""}</span>
                </div>

                <h4 className="text-xs font-semibold text-white">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="hover:text-red-300 inline-flex items-center gap-1">
                    <span>{doc.title}</span>
                    <ExternalLink className="w-3 h-3 text-neutral-500 flex-shrink-0" />
                  </a>
                </h4>

                <p className="text-xs text-neutral-300 line-clamp-2">
                  {doc.excerpt || doc.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
