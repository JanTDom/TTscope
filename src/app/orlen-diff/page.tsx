import { dbRepo } from "@/lib/db";
import { Scale, Building2, Radio, ExternalLink, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrlenDiffPage() {
  const { documents } = dbRepo.getDocuments({ limit: 300 });

  const officialDocs = documents.filter((d) => d.is_orlen_official);
  const mediaDocs = documents.filter((d) => !d.is_orlen_official);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            Analiza komunikacji: Oficjalny przekaz ORLEN vs Interpretacje medialne
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Zestawienie oświadczeń Biura Prasowego, Relacji Inwestorskich i spółek zależnych z publikacjami w mediach ogólnych, regionalnych i branżowych.
          </p>
        </div>
      </div>

      {/* Graficzny pasek przepływu pomiędzy kolumnami */}
      <div className="bg-surface/90 border border-cyan-500/30 rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-cyan-300 font-semibold">
          <Building2 className="w-4 h-4 text-cyan-400" />
          Wejście: Komunikaty oficjalne i spółki zależne ({officialDocs.length})
        </div>

        <div className="hidden md:flex items-center gap-2 flex-1 max-w-xs mx-auto">
          <svg width="100%" height="18" viewBox="0 0 200 18" fill="none">
            <line x1="0" y1="9" x2="190" y2="9" stroke="rgba(0,229,255,0.2)" strokeWidth="2" />
            <line x1="0" y1="9" x2="190" y2="9" stroke="#00e5ff" strokeWidth="2.5" className="animate-signal-flow" />
            <polygon points="188,4 198,9 188,14" fill="#00e5ff" />
          </svg>
        </div>

        <div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold">
          <Radio className="w-4 h-4 text-indigo-400" />
          Wyjście: Publikacje i komentarze prasowe ({mediaDocs.length})
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolumna lewa: Oficjalne komunikaty Grupy ORLEN */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-surface-border pb-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>Komunikaty i aktywność spółek Grupy ORLEN ({officialDocs.length})</span>
          </div>

          <div className="space-y-3">
            {officialDocs.slice(0, 12).map((doc) => (
              <div
                key={doc.id}
                className="bg-surface p-4 rounded-xl border border-cyan-500/30 hover:border-cyan-400/60 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-cyan-300 font-semibold">{doc.source_name}</span>
                  <span className="font-mono">
                    {doc.published_at ? new Date(doc.published_at).toLocaleString("pl-PL") : ""}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-white">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-cyan-300 inline-flex items-center gap-1"
                  >
                    <span>{doc.title}</span>
                    <ExternalLink className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                  </a>
                </h4>

                <p className="text-xs text-slate-300 line-clamp-3">{doc.excerpt || doc.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Kolumna prawa: Doniesienia mediów */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-surface-border pb-2">
            <Radio className="w-4 h-4 text-indigo-400" />
            <span>Relacje i interpretacje medialne ({mediaDocs.length})</span>
          </div>

          <div className="space-y-3">
            {mediaDocs.slice(0, 12).map((doc) => (
              <div
                key={doc.id}
                className="bg-surface p-4 rounded-xl border border-surface-border hover:border-indigo-400/50 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-indigo-300 font-semibold">{doc.source_name}</span>
                  <span className="font-mono">
                    {doc.published_at ? new Date(doc.published_at).toLocaleString("pl-PL") : ""}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-white">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-cyan-300 inline-flex items-center gap-1"
                  >
                    <span>{doc.title}</span>
                    <ExternalLink className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                  </a>
                </h4>

                <p className="text-xs text-slate-300 line-clamp-2">{doc.excerpt || doc.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
