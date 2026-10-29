import React from "react";
import { Building2, Radio, Users, Newspaper, ExternalLink, Clock } from "lucide-react";

export interface DiffusionNodeItem {
  id: string;
  title: string;
  url: string;
  source_name: string;
  published_at?: string | null;
  diffusion_step: string;
  time_delta_seconds: number;
  is_orlen_official: boolean;
  is_labor_signal: boolean;
}

interface DiffusionFlowGraphProps {
  documents: DiffusionNodeItem[];
  maxNodes?: number;
}

export function DiffusionFlowGraph({ documents, maxNodes = 4 }: DiffusionFlowGraphProps) {
  const nodes = documents.slice(0, maxNodes);

  if (nodes.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 bg-surface-muted/40 rounded-xl border border-surface-border">
        Brak zarejestrowanych węzłów przepływu dla tego tematu.
      </div>
    );
  }

  const getStepBadge = (step: string, isOfficial: boolean, isLabor: boolean, index: number) => {
    if (index === 0) {
      return {
        label: "Sygnał pierwotny (Origin)",
        borderColor: "border-cyan-400/60",
        bgColor: "bg-cyan-950/50",
        textColor: "text-cyan-300",
        dotColor: "bg-cyan-400",
        icon: Radio,
      };
    }
    if (isOfficial) {
      return {
        label: "Komunikat ORLEN",
        borderColor: "border-sky-400/60",
        bgColor: "bg-sky-950/50",
        textColor: "text-sky-300",
        dotColor: "bg-sky-400",
        icon: Building2,
      };
    }
    if (isLabor) {
      return {
        label: "Sygnał związkowy",
        borderColor: "border-amber-400/60",
        bgColor: "bg-amber-950/50",
        textColor: "text-amber-300",
        dotColor: "bg-amber-400",
        icon: Users,
      };
    }
    return {
      label: step === "national_media" ? "Media ogólnopolskie" : "Podjęcie medialne",
      borderColor: "border-indigo-400/40",
      bgColor: "bg-slate-900/80",
      textColor: "text-slate-200",
      dotColor: "bg-indigo-400",
      icon: Newspaper,
    };
  };

  return (
    <div className="relative py-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
        {nodes.map((node, idx) => {
          const style = getStepBadge(node.diffusion_step, node.is_orlen_official, node.is_labor_signal, idx);
          const IconComponent = style.icon;
          const isLast = idx === nodes.length - 1;
          const deltaMinutes = Math.round((node.time_delta_seconds || 0) / 60);

          return (
            <div key={node.id} className="relative flex flex-col">
              {/* Animowane połączenie wektorowe SVG pomiędzy kartami na desktopie */}
              {!isLast && (
                <div
                  className="hidden lg:flex items-center justify-center absolute -right-6 top-1/2 -translate-y-1/2 w-6 z-20 pointer-events-none"
                  aria-hidden="true"
                >
                  <svg width="28" height="24" viewBox="0 0 28 24" fill="none" className="overflow-visible">
                    {/* Tło ścieżki */}
                    <line
                      x1="0"
                      y1="12"
                      x2="26"
                      y2="12"
                      stroke="rgba(0, 229, 255, 0.2)"
                      strokeWidth="2"
                    />
                    {/* Animowany impuls przepływu */}
                    <line
                      x1="0"
                      y1="12"
                      x2="26"
                      y2="12"
                      stroke="#00e5ff"
                      strokeWidth="2.5"
                      className="animate-signal-flow"
                    />
                    {/* Grot strzałki */}
                    <polygon points="22,7 28,12 22,17" fill="#00e5ff" />
                  </svg>
                </div>
              )}

              {/* Karta węzła dyfuzji */}
              <div
                className={`flex-1 rounded-xl border ${style.borderColor} ${style.bgColor} p-4 flex flex-col justify-between transition-all hover:scale-[1.01] shadow-[0_4px_20px_rgba(0,0,0,0.35)] relative overflow-hidden`}
              >
                {/* Dekoracyjny pasek świetlny u góry */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 border border-white/10 text-cyan-300">
                    <span className={`w-2 h-2 rounded-full ${style.dotColor} animate-node-pulse`} />
                    Krok {idx + 1}
                  </span>

                  <span className="text-[10px] font-mono text-slate-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {idx === 0
                      ? "T+0 min"
                      : deltaMinutes > 120
                      ? `+${Math.round(deltaMinutes / 60)} godz.`
                      : `+${deltaMinutes} min`}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${style.textColor}`}>
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{style.label}</span>
                  </div>

                  <h4 className="text-xs font-semibold text-white leading-snug line-clamp-3 hover:text-cyan-300 transition-colors">
                    <a
                      href={node.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-start gap-1"
                    >
                      <span>{node.title}</span>
                      <ExternalLink className="w-3 h-3 text-cyan-400 flex-shrink-0 mt-0.5" />
                    </a>
                  </h4>
                </div>

                <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
                  <span className="font-medium truncate max-w-[140px]" title={node.source_name}>
                    {node.source_name}
                  </span>
                  <span className="font-mono text-slate-400">
                    {node.published_at
                      ? new Date(node.published_at).toLocaleTimeString("pl-PL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
