"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Radio,
  Search,
  Filter,
  ExternalLink,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle,
  Building2,
  Users,
  Newspaper,
  X,
  Calendar,
  Layers,
  ArrowDownCircle,
} from "lucide-react";
import type { Document } from "@/lib/db/types";
import { formatPublicationTime } from "@/lib/format/publication";
import {
  type CommunicationChannel,
  isCommunicationChannel,
} from "@/lib/analytics/publication-rhythm";
import { CHANNEL_THEME } from "@/components/charts/channel-theme";
import { GlobalTimeRangeSelector } from "@/components/navigation/GlobalTimeRangeSelector";
import {
  TIME_RANGE_PRESETS,
  type TimeRangePreset,
} from "@/lib/analytics/time-ranges";

const BATCH_SIZE = 250;

interface DayGroup {
  dateKey: string;
  label: string;
  documents: Document[];
}

function groupDocumentsByDay(docs: Document[]): DayGroup[] {
  const groups: { [dateKey: string]: { label: string; documents: Document[] } } = {};
  const dayFormatter = new Intl.DateTimeFormat("pl-PL", {
    timeZone: "Europe/Warsaw",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  for (const doc of docs) {
    let dateKey = "unknown";
    let label = "Brak zarejestrowanej daty publikacji";
    if (doc.published_at) {
      const d = new Date(doc.published_at);
      if (!Number.isNaN(d.getTime())) {
        dateKey = doc.published_at.slice(0, 10);
        const formatted = dayFormatter.format(d);
        label = formatted.charAt(0).toUpperCase() + formatted.slice(1);
      }
    }

    if (!groups[dateKey]) {
      groups[dateKey] = { label, documents: [] };
    }
    groups[dateKey].documents.push(doc);
  }

  return Object.entries(groups).map(([dateKey, val]) => ({
    dateKey,
    label: val.label,
    documents: val.documents,
  }));
}

function StreamContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filtry
  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const [sourceType, setSourceType] = useState(searchParams.get("source_type") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");

  const initialChannelParam = searchParams.get("channel");
  const [channel, setChannel] = useState<CommunicationChannel | "">(
    initialChannelParam && isCommunicationChannel(initialChannelParam)
      ? initialChannelParam
      : searchParams.get("official") === "true"
      ? "official"
      : searchParams.get("labor") === "true"
      ? "labor"
      : ""
  );
  const [publisher, setPublisher] = useState(searchParams.get("publisher") ?? "");
  const [fromDate, setFromDate] = useState(searchParams.get("from") ?? "");
  const [toDate, setToDate] = useState(searchParams.get("to") ?? "");
  const [timeRange, setTimeRange] = useState<TimeRangePreset>(
    (searchParams.get("time_range") as TimeRangePreset) || "24h"
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const [analyzingDocId, setAnalyzingDocId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  useEffect(() => {
    const ch = searchParams.get("channel");
    setChannel(
      ch && isCommunicationChannel(ch)
        ? ch
        : searchParams.get("official") === "true"
        ? "official"
        : searchParams.get("labor") === "true"
        ? "labor"
        : ""
    );
    setPublisher(searchParams.get("publisher") ?? "");
    setFromDate(searchParams.get("from") ?? "");
    setToDate(searchParams.get("to") ?? "");
    setLocation(searchParams.get("location") ?? "");
    setSourceType(searchParams.get("source_type") ?? "");
    setQuery(searchParams.get("query") ?? "");
    setTimeRange((searchParams.get("time_range") as TimeRangePreset) || "24h");
  }, [searchParams]);

  const fetchDocs = async (append = false, fetchAll = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (sourceType) params.set("source_type", sourceType);
      if (location) params.set("location", location);
      if (channel) params.set("channel", channel);
      if (publisher) params.set("publisher", publisher);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (timeRange && !fromDate) params.set("time_range", timeRange);

      const offset = append ? documents.length : 0;
      const limit = fetchAll ? 500 : BATCH_SIZE;

      params.set("limit", String(limit));
      params.set("offset", String(offset));

      const res = await fetch(`/api/documents?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        if (append) {
          setDocuments((prev) => [...prev, ...data.documents]);
        } else {
          setDocuments(data.documents);
        }
        setTotal(data.total);
      }
    } catch (err) {
      console.error("Błąd pobierania strumienia:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchDocs(false);
  }, [sourceType, location, channel, publisher, fromDate, toDate, timeRange]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocs(false);
  };

  const clearAllFilters = () => {
    setQuery("");
    setSourceType("");
    setLocation("");
    setChannel("");
    setPublisher("");
    setFromDate("");
    setToDate("");
    router.replace("/stream");
  };

  const handleAnalyzeGemini = async (docId: string) => {
    setAnalyzingDocId(docId);
    setAnalysisResult(null);
    try {
      const res = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId }),
      });
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error("Błąd analizy Gemini:", err);
    } finally {
      setAnalyzingDocId(null);
    }
  };

  const hasActiveFilters = Boolean(
    channel || publisher || fromDate || toDate || location || sourceType || query || (timeRange && timeRange !== "24h")
  );

  const matchedPreset = TIME_RANGE_PRESETS.find((p) => p.preset === timeRange);
  const timeRangeLabel = matchedPreset ? matchedPreset.label : "Zakres niestandardowy";

  // Grupowanie dokumentów po dniach (kalendarz warszawski)
  const dayGroups = useMemo(() => groupDocumentsByDay(documents), [documents]);

  const availableDays = useMemo(() => {
    return dayGroups.map((g) => ({
      key: g.dateKey,
      label: g.label,
      shortLabel: g.dateKey !== "unknown" ? `${g.dateKey.slice(8, 10)}.${g.dateKey.slice(5, 7)}` : "Inne",
      count: g.documents.length,
    }));
  }, [dayGroups]);

  const filteredDayGroups = useMemo(() => {
    if (!selectedDay) return dayGroups;
    return dayGroups.filter((g) => g.dateKey === selectedDay);
  }, [dayGroups, selectedDay]);

  return (
    <div className="space-y-6">
      {/* Pasek nagłówkowy z nadrzędnym selektorem czasu */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <span>Strumień publikacji i sygnałów wywiadowczych</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Pełny, chronologiczny zapis materiałów wg daty i godziny ukazania się w źródle.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <GlobalTimeRangeSelector
            currentPreset={timeRange}
            currentFrom={fromDate}
            currentTo={toDate}
          />
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/40 text-xs text-rose-200 inline-flex items-center gap-1.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Wyczyść filtry
            </button>
          )}
          <div className="text-xs text-slate-300 font-mono bg-[#07162c] px-3.5 py-2 rounded-xl border border-cyan-500/30">
            Wyniki w oknie: <strong className="text-cyan-300">{total}</strong>
          </div>
        </div>
      </div>

      {/* Pasek statusu wybranego horyzontu i kontrola wczytywania partii */}
      <div className="flex items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-[#06152b] via-[#091f3c] to-[#061326] rounded-xl border border-cyan-500/30 text-xs flex-wrap">
        <div className="flex items-center gap-2 text-slate-200">
          <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>
            Horyzont analizy: <strong className="text-cyan-300 font-mono">{timeRangeLabel}</strong>
            {" "}(wczytano <span className="text-white font-bold font-mono">{documents.length}</span> z <span className="text-cyan-300 font-bold font-mono">{total}</span> zarejestrowanych materiałów)
          </span>
        </div>

        {documents.length < total && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => fetchDocs(true, false)}
              disabled={loadingMore}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <ArrowDownCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>{loadingMore ? "Wczytywanie..." : `Wczytaj kolejne 250 (+${Math.min(BATCH_SIZE, total - documents.length)})`}</span>
            </button>
            <button
              onClick={() => fetchDocs(false, true)}
              disabled={loadingMore}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
            >
              Wczytaj wszystkie ({total})
            </button>
          </div>
        )}
      </div>

      {/* Pasek wyboru konkretnego dnia w oknie */}
      {availableDays.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap px-4 py-2.5 bg-[#040e1c] rounded-xl border border-cyan-500/25 text-xs">
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
            <span>Wszystkie dni w oknie</span>
            <span className="text-[10px] opacity-75 font-mono">({documents.length})</span>
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
              title={d.label}
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

      {/* Przełączniki kanałów komunikacji */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setChannel("")}
          className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
            channel === ""
              ? "bg-cyan-950/70 border-cyan-400 text-white shadow-[0_0_20px_rgba(0,229,255,0.2)]"
              : "bg-surface/80 border-surface-border text-slate-300 hover:border-cyan-500/40"
          }`}
        >
          <span className="text-xs font-semibold">Wszystkie kanały</span>
          <Radio className="w-4 h-4 text-cyan-400" />
        </button>

        <button
          onClick={() => setChannel("official")}
          className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
            channel === "official"
              ? "bg-cyan-950/80 border-cyan-400 text-white shadow-[0_0_20px_rgba(0,229,255,0.25)]"
              : "bg-surface/80 border-surface-border text-slate-300 hover:border-cyan-400/50"
          }`}
        >
          <span className="text-xs font-semibold text-cyan-300">
            {CHANNEL_THEME.official.label}
          </span>
          <Building2 className="w-4 h-4 text-cyan-400" />
        </button>

        <button
          onClick={() => setChannel("labor")}
          className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
            channel === "labor"
              ? "bg-amber-950/70 border-amber-400 text-white shadow-[0_0_20px_rgba(251,191,36,0.25)]"
              : "bg-surface/80 border-surface-border text-slate-300 hover:border-amber-400/50"
          }`}
        >
          <span className="text-xs font-semibold text-amber-300">
            {CHANNEL_THEME.labor.label}
          </span>
          <Users className="w-4 h-4 text-amber-400" />
        </button>

        <button
          onClick={() => setChannel("external")}
          className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
            channel === "external"
              ? "bg-indigo-950/80 border-indigo-400 text-white shadow-[0_0_20px_rgba(129,140,248,0.25)]"
              : "bg-surface/80 border-surface-border text-slate-300 hover:border-indigo-400/50"
          }`}
        >
          <span className="text-xs font-semibold text-indigo-300">
            {CHANNEL_THEME.external.label}
          </span>
          <Newspaper className="w-4 h-4 text-indigo-400" />
        </button>
      </div>

      {/* Aktywne zawężenia */}
      {(publisher || fromDate || toDate || location) && (
        <div className="flex items-center gap-2 flex-wrap bg-[#061326] p-3 rounded-xl border border-cyan-500/30 text-xs">
          <span className="text-slate-400">Aktywne filtry:</span>
          {publisher && (
            <button
              onClick={() => setPublisher("")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/30"
            >
              <span>Wydawca: {publisher}</span>
              <X className="w-3 h-3" />
            </button>
          )}
          {location && (
            <button
              onClick={() => setLocation("")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/30"
            >
              <span>Lokalizacja: {location}</span>
              <X className="w-3 h-3" />
            </button>
          )}
          {(fromDate || toDate) && (
            <button
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/30"
            >
              <span>
                Zakres czasu: {fromDate ? formatPublicationTime(fromDate) : "początek"} →{" "}
                {toDate ? formatPublicationTime(toDate) : "teraz"}
              </span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Wyszukiwarka i filtry dodatkowe */}
      <div className="bg-surface p-4 rounded-xl border border-surface-border space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Szukaj po tytule lub treści (np. Olefiny, LNG, spór płacowy, SMR)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-surface-muted border border-surface-border rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-semibold transition-colors"
          >
            Filtruj
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            Filtry dodatkowe:
          </div>

          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="bg-surface-muted border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="">Wszystkie typy źródeł</option>
            <option value="official_orlen">Oficjalne ORLEN</option>
            <option value="media_regional">Media regionalne i lokalne</option>
            <option value="media_industry">Media branżowe</option>
            <option value="media_general">Media ogólnopolskie</option>
            <option value="social_media">Media społecznościowe i kanały syndykacji</option>
          </select>

          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-surface-muted border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="">Wszystkie zakłady / miasta</option>
            <option value="Płock">Płock (Kompleks)</option>
            <option value="Gdańsk">Gdańsk (Rafineria)</option>
            <option value="Włocławek">Włocławek (ANWIL)</option>
            <option value="Trzebinia">Trzebinia (Południe)</option>
            <option value="Jedlicze">Jedlicze</option>
            <option value="Ostrołęka">Ostrołęka (Energa)</option>
          </select>
        </div>
      </div>

      {/* Modal / Panel analizy Gemini */}
      {analysisResult && (
        <div className="bg-surface rounded-xl border border-cyan-500/40 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-semibold text-white">
                Wynik analizy dowodowej Gemini
              </h4>
            </div>
            <button
              onClick={() => setAnalysisResult(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Zamknij
            </button>
          </div>

          {analysisResult.ok ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-semibold text-slate-200 mb-1.5">Wykryte encje:</h5>
                  <ul className="space-y-1">
                    {analysisResult.validatedAnalysis?.entities?.map((e: any, idx: number) => (
                      <li key={idx} className="bg-surface-muted p-2 rounded border border-surface-border">
                        <strong>{e.name}</strong> ({e.type}) — dowód: <em className="text-slate-300">"{e.evidence}"</em>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-slate-200 mb-1.5">Twierdzenia (Claims):</h5>
                  <ul className="space-y-1">
                    {analysisResult.validatedAnalysis?.claims?.map((c: any, idx: number) => (
                      <li key={idx} className="bg-surface-muted p-2 rounded border border-surface-border">
                        <div>{c.claim}</div>
                        <div className="text-[10px] text-slate-400 mt-1">Cytat dowodowy: "{c.evidence}"</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-3 bg-surface-muted rounded-lg border border-surface-border flex items-center justify-between">
                <div>
                  <span className="text-slate-400">Wydźwięk (Sentyment): </span>
                  <strong className="text-white uppercase font-mono">{analysisResult.validatedAnalysis?.sentiment?.label}</strong>
                  <p className="text-[11px] text-slate-300 mt-0.5">"{analysisResult.validatedAnalysis?.sentiment?.evidence}"</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono">Pewność analizy</span>
                  <div className="text-sm font-bold text-emerald-400 font-mono">
                    {((analysisResult.validatedAnalysis?.sentiment?.confidence || 0.8) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-950/30 border border-red-800/40 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{analysisResult.error || "Wystąpił błąd podczas analizy materiału."}</span>
            </div>
          )}
        </div>
      )}

      {/* Główna lista materiałów z podziałem na dni */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-surface animate-pulse rounded-xl border border-surface-border" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-xl border border-surface-border space-y-2">
          <div className="text-sm font-medium text-slate-200">Brak dokumentów spełniających kryteria</div>
          <p className="text-xs text-slate-400">
            Zmień horyzont czasowy lub wyczyść filtry, aby wyświetlić więcej zarejestrowanych materiałów.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredDayGroups.map((group) => (
            <div key={group.dateKey} className="space-y-3">
              {/* Przyklejany nagłówek dnia z liczbą publikacji */}
              <div className="sticky top-2 z-10 flex items-center justify-between gap-3 bg-[#071932]/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-cyan-500/35 shadow-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    {group.label}
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                  {group.documents.length} {group.documents.length === 1 ? "publikacja" : group.documents.length < 5 ? "publikacje" : "publikacji"}
                </span>
              </div>

              {/* Karty materiałów w danym dniu */}
              <div className="space-y-3">
                {group.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-surface p-5 rounded-xl border border-surface-border hover:border-cyan-500/40 transition-colors space-y-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {doc.is_orlen_official ? (
                          <button
                            onClick={() => setChannel("official")}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900/80"
                          >
                            <Building2 className="w-3 h-3" /> Oficjalne ORLEN
                          </button>
                        ) : doc.is_labor_signal ? (
                          <button
                            onClick={() => setChannel("labor")}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-950/80 text-amber-300 border border-amber-500/40 hover:bg-amber-900/80"
                          >
                            <Users className="w-3 h-3" /> Sygnał związkowy / załogi
                          </button>
                        ) : (
                          <button
                            onClick={() => setChannel("external")}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-950/70 text-indigo-300 border border-indigo-500/35 hover:bg-indigo-900/70"
                          >
                            <Newspaper className="w-3 h-3" /> Media zewnętrzne
                          </button>
                        )}

                        <button
                          onClick={() => setPublisher(doc.source_name)}
                          className="text-xs font-semibold text-cyan-300 hover:text-white transition-colors"
                          title="Filtruj po tym wydawcy"
                        >
                          {doc.source_name}
                        </button>

                        {doc.facility_location && (
                          <button
                            onClick={() => setLocation(doc.facility_location!)}
                            className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-cyan-300 bg-surface-muted px-2 py-0.5 rounded border border-white/10"
                          >
                            <MapPin className="w-3 h-3 text-cyan-400" />
                            {doc.facility_location}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-300 font-mono">
                        <span className="flex items-center gap-1 text-cyan-200">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          Godzina: {formatPublicationTime(doc.published_at)}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-base font-semibold text-white leading-snug">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>{doc.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      </a>
                    </h4>

                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {doc.excerpt || doc.content}
                    </p>

                    <div className="pt-2 border-t border-surface-border flex items-center justify-between gap-4 flex-wrap">
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-md">
                        Źródło URL:{" "}
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-300 hover:underline"
                        >
                          {doc.url}
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href="/orlen-diff"
                          className="px-2.5 py-1.5 rounded-lg bg-surface-muted hover:bg-cyan-950/60 border border-surface-border text-[11px] text-slate-300 hover:text-cyan-200 transition-colors"
                        >
                          Porównaj z ORLEN
                        </Link>
                        <button
                          onClick={() => handleAnalyzeGemini(doc.id)}
                          disabled={analyzingDocId === doc.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-xs text-cyan-200 transition-colors disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          {analyzingDocId === doc.id ? "Analizowanie (Gemini)..." : "Analizuj dowodowo (Gemini)"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Dolny pasek ładowania kolejnych materiałów */}
          {documents.length < total && (
            <div className="p-6 rounded-2xl bg-[#07162c] border border-cyan-500/35 text-center space-y-3">
              <p className="text-xs text-slate-300">
                Wyświetlono <strong className="text-white font-mono">{documents.length}</strong> z <strong className="text-cyan-300 font-mono">{total}</strong> publikacji w wybranym horyzoncie.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => fetchDocs(true, false)}
                  disabled={loadingMore}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-xs font-semibold text-cyan-200 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <ArrowDownCircle className="w-4 h-4 text-cyan-400" />
                  <span>{loadingMore ? "Wczytywanie..." : `Wczytaj kolejne 100 materiałów (+${Math.min(BATCH_SIZE, total - documents.length)})`}</span>
                </button>
                <button
                  onClick={() => fetchDocs(false, true)}
                  disabled={loadingMore}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-50"
                >
                  Wczytaj wszystkie ({total})
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StreamPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-surface animate-pulse rounded-xl border border-surface-border" />
          ))}
        </div>
      }
    >
      <StreamContent />
    </Suspense>
  );
}
