"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
  ArrowUpRight,
  Radio,
  Calendar,
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
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [internalLimit, setInternalLimit] = useState(expanded ? 20 : 6);
  const [externalLimit, setExternalLimit] = useState(expanded ? 24 : 12);

  // Wyliczamy unikalne dni obecne we wszystkich dokumentach w oknie
  const availableDays = useMemo(() => {
    const map = new Map<string, { fullLabel: string; shortLabel: string; count: number }>();
    const dayFormatter = new Intl.DateTimeFormat("pl-PL", {
      timeZone: "Europe/Warsaw",
      weekday: "short",
      day: "numeric",
      month: "numeric",
    });
    const fullFormatter = new Intl.DateTimeFormat("pl-PL", {
      timeZone: "Europe/Warsaw",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    for (const doc of [...mediaDocs, ...officialDocs, ...laborDocs]) {
      if (!doc.published_at) continue;
      const d = new Date(doc.published_at);
      if (Number.isNaN(d.getTime())) continue;
      const key = doc.published_at.slice(0, 10);
      const existing = map.get(key);
      if (existing) {
        existing.count++;
      } else {
        const shortStr = dayFormatter.format(d);
        const fullStr = fullFormatter.format(d);
        map.set(key, {
          shortLabel: shortStr,
          fullLabel: fullStr.charAt(0).toUpperCase() + fullStr.slice(1),
          count: 1,
        });
      }
    }

    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, val]) => ({
        key,
        shortLabel: val.shortLabel,
        fullLabel: val.fullLabel,
        count: val.count,
      }));
  }, [mediaDocs, officialDocs, laborDocs]);

  // Wyznaczamy dokumenty do prezentacji
  const displayedMedia = useMemo(() => {
    if (selectedDay) {
      return mediaDocs.filter((d) => d.published_at?.startsWith(selectedDay));
    }
    // Gdy nie wybrano konkretnego dnia, a okno obejmuje wiele dni: robimy zbalansowany przekrój po dniach!
    if (availableDays.length > 1) {
      const result: StreamDocItem[] = [];
      const perDay = availableDays.length > 7 ? 1 : 2;
      for (const day of availableDays) {
        const dayDocs = mediaDocs.filter((d) => d.published_at?.startsWith(day.key));
        result.push(...dayDocs.slice(0, perDay));
      }
      return result.length > 0 ? result.slice(0, externalLimit) : mediaDocs.slice(0, externalLimit);
    }
    return mediaDocs.slice(0, externalLimit);
  }, [mediaDocs, selectedDay, availableDays, externalLimit]);

  const displayedOfficial = useMemo(() => {
    if (selectedDay) {
      return officialDocs.filter((d) => d.published_at?.startsWith(selectedDay));
    }
    if (availableDays.length > 1) {
      const result: StreamDocItem[] = [];
      for (const day of availableDays) {
        const dayDocs = officialDocs.filter((d) => d.published_at?.startsWith(day.key));
        result.push(...dayDocs.slice(0, 2));
      }
      return result.length > 0 ? result.slice(0, internalLimit) : officialDocs.slice(0, internalLimit);
    }
    return officialDocs.slice(0, internalLimit);
  }, [officialDocs, selectedDay, availableDays, internalLimit]);

  const displayedLabor = useMemo(() => {
    if (selectedDay) {
      return laborDocs.filter((d) => d.published_at?.startsWith(selectedDay));
    }
    if (availableDays.length > 1) {
      const result: StreamDocItem[] = [];
      for (const day of availableDays) {
        const dayDocs = laborDocs.filter((d) => d.published_at?.startsWith(day.key));
        result.push(...dayDocs.slice(0, 2));
      }
      return result.length > 0 ? result.slice(0, internalLimit) : laborDocs.slice(0, internalLimit);
    }
    return laborDocs.slice(0, internalLimit);
  }, [laborDocs, selectedDay, availableDays, internalLimit]);

  const totalDocsCount = mediaDocs.length + officialDocs.length + laborDocs.length;

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

      {/* Interaktywny pasek wyboru dnia — gdy w oknie jest więcej niż 1 dzień */}
      {availableDays.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap px-6 py-2.5 bg-[#040e1c] border-b border-cyan-500/20 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] uppercase mr-1">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>Wybierz dzień:</span>
          </div>

          <button
            onClick={() => setSelectedDay(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              selectedDay === null
                ? "bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(0,229,255,0.35)] font-bold"
                : "text-slate-300 hover:text-white bg-white/5 hover:bg-white/10"
            }`}
          >
            <span>Przekrój wszystkich dni</span>
            <span className="text-[10px] opacity-75 font-mono">({totalDocsCount})</span>
          </button>

          {availableDays.slice(0, 14).map((d) => (
            <button
              key={d.key}
              onClick={() => setSelectedDay(d.key)}
              className={`px-2 py-1 rounded-lg font-mono text-[11px] transition-all flex items-center gap-1 ${
                selectedDay === d.key
                  ? "bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(0,229,255,0.35)]"
                  : "text-slate-300 hover:text-white bg-white/5 hover:bg-white/10"
              }`}
              title={d.fullLabel}
            >
              <span>{d.shortLabel}</span>
              <span className="text-[10px] opacity-70">({d.count})</span>
            </button>
          ))}

          {availableDays.length > 14 && (
            <span className="text-[10px] font-mono text-slate-500 px-1">
              +{availableDays.length - 14} wcześniejszych dni
            </span>
          )}
        </div>
      )}

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
                <span>
                  1. Oficjalne komunikaty prasowe i giełdowe ORLEN (
                  {selectedDay ? displayedOfficial.length : officialDocs.length})
                </span>
                <span>Godzina ukazania się</span>
              </div>

              {displayedOfficial.length === 0 ? (
                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-slate-400 text-center">
                  Brak oficjalnych komunikatów koncernu w wybranym dniu.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {displayedOfficial.map((doc) => (
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
              )}
            </div>

            {/* Podsekcja B: Głos załogi i związki zawodowe */}
            <div className="space-y-2.5 pt-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-amber-300 flex items-center justify-between">
                <span>
                  2. Sygnały wewnętrzne załogi i związków zawodowych (
                  {selectedDay ? displayedLabor.length : laborDocs.length})
                </span>
                <span>Godzina ukazania się</span>
              </div>

              {displayedLabor.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-slate-400 text-center">
                  Brak sygnałów związkowych w wybranym dniu.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {displayedLabor.map((doc) => (
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
              )}
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
              <span>
                Publikacje prasowe i portale zewnętrzne (
                {selectedDay ? displayedMedia.length : mediaDocs.length})
                {!selectedDay && availableDays.length > 1 && (
                  <span className="text-[10px] text-cyan-300 font-sans normal-case ml-1">
                    (przekrój z poszczególnych dni)
                  </span>
                )}
              </span>
              <span>Data i godzina ukazania się</span>
            </div>

            {displayedMedia.length === 0 ? (
              <div className="p-8 text-center bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-xs text-slate-400">
                Brak publikacji medialnych w wybranym dniu.
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedMedia.map((doc) => (
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
            )}

            {mediaDocs.length > displayedMedia.length && (
              <div className="pt-2 flex items-center justify-between gap-3 flex-wrap border-t border-indigo-500/20">
                <button
                  onClick={() => setExternalLimit((prev) => prev + 24)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 text-xs text-indigo-200 font-semibold transition-all"
                >
                  Pokaż kolejne publikacje prasowe ({mediaDocs.length - displayedMedia.length} pozostało)
                </button>
                <Link
                  href="/stream?channel=external"
                  className="text-xs text-cyan-300 hover:text-white flex items-center gap-1 font-semibold"
                >
                  <span>Otwórz pełny strumień ({mediaDocs.length})</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
