"use client";

import { useEffect, useState } from "react";
import {
  Radio,
  Search,
  Filter,
  ExternalLink,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Building2,
  Users,
} from "lucide-react";
import type { Document } from "@/lib/db/types";

export default function StreamPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [location, setLocation] = useState("");
  const [onlyOfficial, setOnlyOfficial] = useState(false);
  const [onlyLabor, setOnlyLabor] = useState(false);

  // Stan analizy Gemini dla wybranego dokumentu
  const [analyzingDocId, setAnalyzingDocId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (sourceType) params.set("source_type", sourceType);
      if (location) params.set("location", location);
      if (onlyOfficial) params.set("official", "true");
      if (onlyLabor) params.set("labor", "true");

      const res = await fetch(`/api/documents?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setDocuments(data.documents);
        setTotal(data.total);
      }
    } catch (err) {
      console.error("Błąd pobierania strumienia:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [sourceType, location, onlyOfficial, onlyLabor]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocs();
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

  return (
    <div className="space-y-6">
      {/* Nagłówek */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-neutral-400" />
            Strumień publikacji i sygnałów wywiadowczych
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Pełny, chronologiczny zapis zindeksowanych materiałów z publicznych kanałów.
          </p>
        </div>

        <div className="text-xs text-neutral-400 font-mono">
          Łącznie w bazie: <strong className="text-white">{total}</strong>
        </div>
      </div>

      {/* Panel Filtrów */}
      <div className="bg-surface p-4 rounded-xl border border-surface-border space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Szukaj po tytule lub treści (np. Olefiny, Benzina, spór płacowy, Perm)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-surface-muted border border-surface-border rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Filtruj
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Filter className="w-3.5 h-3.5" />
            Kategorie:
          </div>

          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="bg-surface-muted border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none"
          >
            <option value="">Wszystkie typy źródeł</option>
            <option value="official_orlen">Oficjalne ORLEN</option>
            <option value="media_regional">Media regionalne i lokalne</option>
            <option value="media_industry">Media branżowe</option>
            <option value="media_general">Media ogólnopolskie</option>
            <option value="social_media">Media społecznościowe</option>
          </select>

          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-surface-muted border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none"
          >
            <option value="">Wszystkie zakłady / miasta</option>
            <option value="Płock">Płock (Kompleks)</option>
            <option value="Gdańsk">Gdańsk (Rafineria)</option>
            <option value="Włocławek">Włocławek (ANWIL)</option>
            <option value="Trzebinia">Trzebinia (Południe)</option>
            <option value="Jedlicze">Jedlicze</option>
            <option value="Ostrołęka">Ostrołęka (Energa)</option>
          </select>

          <label className="flex items-center gap-1.5 text-neutral-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyOfficial}
              onChange={(e) => setOnlyOfficial(e.target.checked)}
              className="rounded bg-surface-muted border-surface-border text-red-600 focus:ring-0"
            />
            <span>Tylko oficjalne ORLEN</span>
          </label>

          <label className="flex items-center gap-1.5 text-neutral-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyLabor}
              onChange={(e) => setOnlyLabor(e.target.checked)}
              className="rounded bg-surface-muted border-surface-border text-red-600 focus:ring-0"
            />
            <span>Tylko sygnały pracownicze</span>
          </label>
        </div>
      </div>

      {/* Modal / Szczegóły analizy Gemini */}
      {analysisResult && (
        <div className="bg-surface rounded-xl border border-neutral-700 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-semibold text-white">
                Wynik analizy Gemini API (Zwalidowany ze źródłem)
              </h4>
            </div>
            <button
              onClick={() => setAnalysisResult(null)}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Zamknij
            </button>
          </div>

          {analysisResult.ok ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-semibold text-neutral-300 mb-1.5">Wykryte encje:</h5>
                  <ul className="space-y-1">
                    {analysisResult.validatedAnalysis?.entities?.map((e: any, idx: number) => (
                      <li key={idx} className="bg-surface-muted p-2 rounded border border-surface-border">
                        <strong>{e.name}</strong> ({e.type}) — dowód: <em className="text-neutral-400">"{e.evidence}"</em>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-neutral-300 mb-1.5">Twierdzenia (Claims):</h5>
                  <ul className="space-y-1">
                    {analysisResult.validatedAnalysis?.claims?.map((c: any, idx: number) => (
                      <li key={idx} className="bg-surface-muted p-2 rounded border border-surface-border">
                        <div>{c.claim}</div>
                        <div className="text-[10px] text-neutral-400 mt-1">Cytat dowodowy: "{c.evidence}"</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-3 bg-surface-muted rounded-lg border border-surface-border flex items-center justify-between">
                <div>
                  <span className="text-neutral-400">Wydźwięk (Sentyment): </span>
                  <strong className="text-white uppercase font-mono">{analysisResult.validatedAnalysis?.sentiment?.label}</strong>
                  <p className="text-[11px] text-neutral-400 mt-0.5">"{analysisResult.validatedAnalysis?.sentiment?.evidence}"</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 font-mono">Pewność analizy</span>
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

      {/* Lista publikacji */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface p-5 rounded-xl border border-surface-border animate-pulse space-y-3">
              <div className="h-4 bg-white/5 rounded w-1/4" />
              <div className="h-5 bg-white/10 rounded w-3/4" />
              <div className="h-3 bg-white/5 rounded w-full" />
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 text-center text-neutral-400">
          <p className="text-sm font-medium">Brak publikacji spełniających wybrane kryteria.</p>
          <p className="text-xs text-neutral-500 mt-1">Zmień filtry lub pobierz nowe dane z panelu administracyjnego.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <article
              key={doc.id}
              className="bg-surface hover:bg-surface-muted/40 transition-colors p-5 rounded-xl border border-surface-border space-y-3"
            >
              <div className="flex items-center justify-between text-xs text-neutral-400 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-200">{doc.source_name}</span>
                  <span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded text-neutral-300">
                    {doc.source_type}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    Pub: {doc.published_at ? new Date(doc.published_at).toLocaleString("pl-PL") : "Brak daty"}
                  </span>
                  <span>Pobrano: {new Date(doc.fetched_at).toLocaleTimeString("pl-PL")}</span>
                </div>
              </div>

              <h3 className="text-base font-semibold text-white leading-snug">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-red-300 transition-colors inline-flex items-start gap-1.5"
                >
                  <span>{doc.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-500 mt-1 flex-shrink-0" />
                </a>
              </h3>

              <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3">
                {doc.excerpt || doc.content}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-surface-border flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {doc.facility_location && (
                    <span className="flex items-center gap-1 text-[11px] bg-surface-muted px-2 py-0.5 rounded text-neutral-300 border border-surface-border">
                      <MapPin className="w-3 h-3 text-neutral-400" />
                      {doc.facility_location}
                    </span>
                  )}
                  {doc.is_labor_signal && (
                    <span className="flex items-center gap-1 text-[11px] bg-amber-950/40 text-amber-300 px-2 py-0.5 rounded border border-amber-900/40">
                      <Users className="w-3 h-3" />
                      Sygnał pracowniczy
                    </span>
                  )}
                  {doc.is_orlen_official && (
                    <span className="flex items-center gap-1 text-[11px] bg-red-950/40 text-red-300 px-2 py-0.5 rounded border border-red-900/40">
                      <Building2 className="w-3 h-3" />
                      Oficjalny ORLEN
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleAnalyzeGemini(doc.id)}
                  disabled={analyzingDocId === doc.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 rounded-lg text-xs font-medium transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {analyzingDocId === doc.id ? "Analizowanie..." : "Analiza faktów AI"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
