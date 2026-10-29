import React from "react";
import { Building2, Radio, Users, Newspaper, ExternalLink, Clock, Briefcase } from "lucide-react";
import { formatPublicationTime } from "@/lib/format/publication";

export interface DiffusionNodeItem {
  id: string;
  title: string;
  url: string;
  source_name: string;
  source_type?: string;
  published_at?: string | null;
  fetched_at?: string | null;
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

  const getStepStyle = (node: DiffusionNodeItem, index: number) => {
    if (node.is_orlen_official) {
      return {
        label: index === 0 ? "Komunikat pierwotny ORLEN" : "Oficjalne stanowisko ORLEN",
        borderColor: "border-cyan-400/70",
        bgColor: "bg-gradient-to-br from-cyan-950/70 via-[#081d38] to-[#051124]",
        textColor: "text-cyan-300",
        dotColor: "bg-cyan-400",
        icon: Building2,
      };
    }
    if (node.is_labor_signal || node.diffusion_step === "labor_signal") {
      return {
        label: "Sygnał wewnętrzny / związkowy",
        borderColor: "border-amber-400/70",
        bgColor: "bg-gradient-to-br from-amber-950/60 via-[#1f1608] to-[#0a0d18]",
        textColor: "text-amber-300",
        dotColor: "bg-amber-400",
        icon: Users,
      };
    }
    if (index === 0) {
      return {
        label: "Pierwsza publikacja w mediach",
        borderColor: "border-sky-400/60",
        bgColor: "bg-gradient-to-br from-sky-950/60 via-[#091b34] to-[#051020]",
        textColor: "text-sky-300",
        dotColor: "bg-sky-400",
        icon: Radio,
      };
    }
    if (node.diffusion_step === "industry_media" || node.source_type === "media_industry") {
      return {
        label: "Portal branżowy / energetyczny",
        borderColor: "border-indigo-400/50",
        bgColor: "bg-gradient-to-br from-indigo-950/50 via-[#0d152e] to-[#060c1a]",
        textColor: "text-indigo-300",
        dotColor: "bg-indigo-400",
        icon: Briefcase,
      };
    }
    if (node.diffusion_step === "local_pickup" || node.source_type === "media_regional") {
      return {
        label: "Prasa i portal regionalny",
        borderColor: "border-emerald-400/50",
        bgColor: "bg-gradient-to-br from-emerald-950/45 via-[#071f1e] to-[#05101a]",
        textColor: "text-emerald-300",
        dotColor: "bg-emerald-400",
        icon: Newspaper,
      };
    }
    return {
      label: "Publikacja w mediach ogólnopolskich",
      borderColor: "border-purple-400/45",
      bgColor: "bg-gradient-to-br from-slate-900/95 via-[#0c1428] to-[#050b16]",
      textColor: "text-purple-300",
      dotColor: "bg-purple-400",
      icon: Newspaper,
    };
  };

  const formatDelta = (seconds: number, index: number) => {
    if (index === 0) return "Punkt startowy (T+0)";
    const mins = Math.round((seconds || 0) / 60);
    if (mins < 60) return `+${mins} min później`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours < 24) return remMins > 0 ? `+${hours} godz. ${remMins} min` : `+${hours} godz.`;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `+${days} d ${remHours} godz.`;
  };

  return (
    <div className="relative py-3">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
        {nodes.map((node, idx) => {
          const style = getStepStyle(node, idx);
          const IconComponent = style.icon;
          const isLast = idx === nodes.length - 1;

          return (
            <div key={node.id} className="relative flex flex-col">
              {/* Animowane połączenie wektorowe SVG pomiędzy ogniwami na desktopie */}
              {!isLast && (
                <div
                  className="hidden lg:flex items-center justify-center absolute -right-6 top-1/2 -translate-y-1/2 w-6 z-20 pointer-events-none"
                  aria-hidden="true"
                >
                  <svg width="28" height="24" viewBox="0 0 28 24" fill="none" className="overflow-visible">
                    <line
                      x1="0"
                      y1="12"
                      x2="26"
                      y2="12"
                      stroke="rgba(0, 229, 255, 0.22)"
                      strokeWidth="2"
                    />
                    <line
                      x1="0"
                      y1="12"
                      x2="26"
                      y2="12"
                      stroke="#00e5ff"
                      strokeWidth="2.5"
                      className="animate-signal-flow"
                    />
                    <polygon points="21,7 28,12 21,17" fill="#00e5ff" />
                  </svg>
                </div>
              )}

              {/* Karta ogniwa dyfuzji */}
              <div
                className={`flex-1 rounded-2xl border ${style.borderColor} ${style.bgColor} p-4 flex flex-col justify-between transition-all hover:scale-[1.01] shadow-[0_8px_28px_rgba(0,0,0,0.45)] relative overflow-hidden`}
              >
                <div>
                  {/* Nagłówek karty z numerem ogniwa i opóźnieniem */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/50 border border-white/10 text-cyan-300 font-semibold">
                      <span className={`w-2 h-2 rounded-full ${style.dotColor} animate-node-pulse`} />
                      Ogniwo {idx + 1}
                    </span>

                    <span className="text-[10px] font-mono text-cyan-200/90 bg-cyan-950/60 border border-cyan-500/25 px-2 py-0.5 rounded-md">
                      {formatDelta(node.time_delta_seconds, idx)}
                    </span>
                  </div>

                  {/* Typ ogniwa (Komunikat ORLEN / Prasa / Związki) */}
                  <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold mb-2 ${style.textColor}`}>
                    <IconComponent className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{style.label}</span>
                  </div>

                  {/* Tytuł publikacji */}
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

                {/* Stopka z wydawcą i autentyczną godziną ukazania się */}
                <div className="mt-4 pt-3 border-t border-white/10 space-y-1 text-[10px]">
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="text-slate-400">Wydawca:</span>
                    <strong className="font-semibold text-cyan-200 truncate max-w-[155px]" title={node.source_name}>
                      {node.source_name}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300 font-mono">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-cyan-400" />
                      Ukazanie się:
                    </span>
                    <span className="text-white font-medium">
                      {formatPublicationTime(node.published_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
