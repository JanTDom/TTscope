"use client";

import React, { useState } from "react";
import {
  Building2,
  Users,
  Newspaper,
  ExternalLink,
  Clock,
  MapPin,
  Sparkles,
  Scale,
  ArrowRight,
  Radio,
} from "lucide-react";
import { formatPublicationTime } from "@/lib/format/publication";

export interface StreamDocItem {
  id: string;
  title: string;
  url: string;
  source_name: string;
  source_type: string;
  published_at?: string | null;
  fetched_at: string;
  excerpt?: string | null;
  content: string;
  facility_location?: string | null;
  is_orlen_official: boolean;
  is_labor_signal: boolean;
  is_local_signal: boolean;
}

interface DualZoneProps {
  officialDocs: StreamDocItem[];
  laborDocs: StreamDocItem[];
  mediaDocs: StreamDocItem[];
  /** Pełna strona porównawcza pokazuje więcej pozycji niż kafel na kokpicie. */
  expanded?: boolean;
}

export function DualCommunicationZone({ officialDocs, laborDocs, mediaDocs, expanded = false }: DualZoneProps) {
  const [activeTab, setActiveTab] = useState<"split" | "internal" | "external">("split");
  const internalLimit = activeTab === "internal" || expanded ? 10 : 4;
  const externalLimit = activeTab === "external" || expanded ? 16 : 8;

  return (
    <div className="bg-surface/95 rounded-2xl border border-cyan-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Pasek nagłówkowy z przełącznikiem stref komunikacji */}
      <div className="bg-gradient-to-r from-[#06152b] via-[#0a2140] to-[#061428] px-6 py-4 border-b border-cyan-500/25 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-semibold text-white tracking-tight">
              Rozdział komunikacji: Wewnętrzna i Korporacyjna vs Zewnętrzna (Media)
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            Bezpośrednie porównanie oficjalnych oświadczeń i sygnałów załogi z tym, co i o której godzinie publikują media zewnętrzne.
          </p>
        </div>

        {/* Przełącznik trybu widoku */}
        <div className="inline-flex rounded-xl bg-[#040b16] p-1 border border-cyan-500/30 self-start lg:self-center">
          <button
            onClick={() => setActiveTab("split")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "split"
                ? "bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Widok zsynchronizowany (Obok siebie)
          </button>
          <button
            onClick={() => setActiveTab("internal")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "internal"
                ? "bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <span>Tylko wewnątrz Grupy i Związki</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/25">
              {officialDocs.length + laborDocs.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("external")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "external"
                ? "bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <span>Tylko media zewnętrzne</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/25">
              {mediaDocs.length}
            </span>
          </button>
        </div>
      </div>

      {/* Zawartość stref */}
      <div
        className={`p-6 grid gap-6 ${
          activeTab === "split" ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {/* STREFA I: KOMUNIKACJA WEWNĘTRZNA I KORPORACYJNA (Biuro Prasowe + Związki Zawodowe) */}
        {(activeTab === "split" || activeTab === "internal") && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-cyan-500/25 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wide font-mono">
                    Strefa I: Komunikacja Wewnętrzna i Oficjalna
                  </h4>
                  <p className="text-[11px] text-cyan-300/80">
                    Biuro Prasowe ORLEN, raporty ESPI, Energa, OSGE oraz organizacje związkowe (NSZZ Solidarność, MZZPRC)
                  </p>
                </div>
              </div>
            </div>

            {/* Podsekcja A: Oficjalne oświadczenia koncernu */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 flex items-center justify-between">
                <span>1. Oficjalne komunikaty prasowe i giełdowe ORLEN ({officialDocs.length})</span>
                <span>Godzina ukazania się</span>
              </div>

              <div className="space-y-2.5">
                {officialDocs.slice(0, internalLimit).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/45 via-[#071930] to-[#061325] border border-cyan-400/35 hover:border-cyan-300 transition-all space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        {doc.source_name}
                      </span>
                      <span className="font-mono text-white bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        Ukazano: {formatPublicationTime(doc.published_at)}
                      </span>
                    </div>

                    <h5 className="text-xs font-semibold text-white leading-snug hover:text-cyan-300">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start justify-between gap-2"
                      >
                        <span>{doc.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      </a>
                    </h5>

                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                      {doc.excerpt || doc.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Podsekcja B: Głos załogi i związki zawodowe */}
            <div className="space-y-2.5 pt-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-amber-300 flex items-center justify-between">
                <span>2. Sygnały wewnętrzne załogi i związków zawodowych ({laborDocs.length})</span>
                <span>Godzina ukazania się</span>
              </div>

              <div className="space-y-2.5">
                {laborDocs.slice(0, internalLimit).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-[#19140a] to-[#08101f] border border-amber-400/35 hover:border-amber-300 transition-all space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        {doc.source_name}
                      </span>
                      <span className="font-mono text-white bg-amber-950/70 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Ukazano: {formatPublicationTime(doc.published_at)}
                      </span>
                    </div>

                    <h5 className="text-xs font-semibold text-white leading-snug hover:text-amber-300">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start justify-between gap-2"
                      >
                        <span>{doc.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      </a>
                    </h5>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STREFA II: KOMUNIKACJA ZEWNĘTRZNA (Media Ogólnopolskie, Branżowe i Regionalne) */}
        {(activeTab === "split" || activeTab === "external") && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-indigo-400/25 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                  <Newspaper className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wide font-mono">
                    Strefa II: Komunikacja Zewnętrzna (Media i Otoczenie)
                  </h4>
                  <p className="text-[11px] text-indigo-300/80">
                    Prasa ogólnopolska, portale energetyczne i branżowe oraz redakcje lokalne wokół rafinerii
                  </p>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono uppercase tracking-wider text-indigo-300 flex items-center justify-between">
              <span>Publikacje prasowe i portale zewnętrzne ({mediaDocs.length})</span>
              <span>Godzina ukazania się</span>
            </div>

            <div className="space-y-2.5">
              {mediaDocs.slice(0, externalLimit).map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl bg-gradient-to-r from-[#09152b] via-[#0b1830] to-[#061020] border border-indigo-400/25 hover:border-cyan-400/50 transition-all space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold text-indigo-200 flex items-center gap-1.5 truncate max-w-[240px]">
                      <Radio className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      {doc.source_name}
                    </span>
                    <span className="font-mono text-white bg-slate-900/90 border border-white/10 px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      Ukazano: {formatPublicationTime(doc.published_at)}
                    </span>
                  </div>

                  <h5 className="text-xs font-semibold text-white leading-snug hover:text-cyan-300">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start justify-between gap-2"
                    >
                      <span>{doc.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    </a>
                  </h5>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 font-mono uppercase">
                        {doc.source_type === "media_regional"
                          ? "Prasa lokalna"
                          : doc.source_type === "media_industry"
                          ? "Portal branżowy"
                          : "Media ogólnokrajowe"}
                      </span>
                      {doc.facility_location && (
                        <span className="flex items-center gap-1 text-cyan-300">
                          <MapPin className="w-3 h-3" />
                          {doc.facility_location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
