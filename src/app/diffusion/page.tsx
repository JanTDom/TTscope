import { dbRepo } from "@/lib/db";
import { GitFork, Clock, ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DiffusionPage() {
  const events = dbRepo.getAllEvents();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <GitFork className="w-5 h-5 text-neutral-400" />
            Matryca dyfuzji i rozprzestrzeniania narracji
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Wizualizacja drogi informacji: od sygnału pierwotnego, przez media lokalne i branżowe, aż po media centralne.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {events.map((evt) => {
          const eventDetails = dbRepo.getEventById(evt.id);
          const docs = eventDetails?.documents || [];

          return (
            <div key={evt.id} className="bg-surface p-6 rounded-xl border border-surface-border space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="text-base font-semibold text-white">{evt.title}</h3>
                  <span className="text-xs text-neutral-400">
                    Rozpiętość czasowa: {new Date(evt.first_detected_at).toLocaleTimeString("pl-PL")} → {new Date(evt.last_signal_at).toLocaleTimeString("pl-PL")}
                  </span>
                </div>

                <div className="text-xs font-mono bg-white/10 px-2.5 py-1 rounded text-neutral-200">
                  Łańcuch publikacji: {docs.length}
                </div>
              </div>

              {/* Ścieżka przepływu */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                {docs.slice(0, 4).map((d, index) => (
                  <div
                    key={d.id}
                    className="bg-surface-muted p-4 rounded-lg border border-surface-border flex flex-col justify-between relative"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                        <span className="uppercase bg-neutral-800 px-1.5 py-0.5 rounded">
                          Krok {index + 1}: {d.diffusion_step}
                        </span>
                        <span>{d.published_at ? new Date(d.published_at).toLocaleTimeString("pl-PL") : ""}</span>
                      </div>

                      <h4 className="text-xs font-medium text-white line-clamp-2 hover:text-red-300">
                        <a href={d.url} target="_blank" rel="noopener noreferrer">
                          {d.title}
                        </a>
                      </h4>

                      <div className="text-[11px] text-neutral-400">
                        Źródło: <strong>{d.source_name}</strong>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-surface-border text-[10px] text-neutral-500">
                      Typ relacji:{" "}
                      <span className="text-neutral-300 font-medium">
                        {index === 0 ? "Sygnał pierwotny (Origin)" : "Wykryte podobieństwo treści"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
