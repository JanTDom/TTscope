"use client";

import { useState } from "react";
import { Search, ExternalLink, MapPin, Clock } from "lucide-react";
import type { Document } from "@/lib/db/types";
import { formatPublicationTime } from "@/lib/format/publication";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/documents?query=${encodeURIComponent(query)}&limit=50`);
      const data = await res.json();
      if (data.ok) {
        setResults(data.documents);
      }
    } catch (err) {
      console.error("Błąd wyszukiwania:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-surface-border pb-5">
        <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-neutral-400" />
          Wyszukiwarka OSINT bazy TTscope
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Wyszukiwanie pełnotekstowe w zindeksowanych publikacjach, oświadczeniach i komunikatach.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Wpisz frazę (np. ceny paliw, Olefiny, Płock, Anwil, Obajtek, Fąfara, spór płacowy)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-surface border border-surface-border rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          Szukaj
        </button>
      </form>

      {/* Szybkie podpowiedzi */}
      <div className="flex items-center gap-2 text-xs text-neutral-400 flex-wrap">
        <span>Przykładowe zapytania:</span>
        {["Ceny paliw", "Olefiny", "Płock", "Anwil", "Gdańsk", "Spór zbiorowy"].map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => {
              setQuery(term);
            }}
            className="bg-surface-muted hover:bg-neutral-800 px-2.5 py-1 rounded text-neutral-300 border border-surface-border text-xs transition-colors"
          >
            {term}
          </button>
        ))}
      </div>

      {/* Wyniki wyszukiwania */}
      {loading ? (
        <div className="text-center py-12 text-neutral-400 text-xs animate-pulse">
          Przeszukiwanie bazy danych...
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 text-center text-neutral-400">
          <p className="text-sm font-medium">Brak wyników dla zapytania: "{query}".</p>
          <p className="text-xs text-neutral-500 mt-1">Upewnij się, że słowa kluczowe są poprawne.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((doc) => (
            <div key={doc.id} className="bg-surface p-4 rounded-xl border border-surface-border space-y-2">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span className="font-semibold text-neutral-200">{doc.source_name}</span>
                <span className="font-mono">{formatPublicationTime(doc.published_at)}</span>
              </div>

              <h3 className="text-sm font-semibold text-white">
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="hover:text-red-300 inline-flex items-center gap-1.5">
                  <span>{doc.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                </a>
              </h3>

              <p className="text-xs text-neutral-300 line-clamp-2">
                {doc.excerpt || doc.content}
              </p>

              <div className="flex items-center gap-2 text-[10px] text-neutral-400 pt-1">
                {doc.facility_location && (
                  <span className="flex items-center gap-1 bg-surface-muted px-2 py-0.5 rounded border border-surface-border">
                    <MapPin className="w-3 h-3 text-neutral-400" />
                    {doc.facility_location}
                  </span>
                )}
                {doc.is_orlen_official && (
                  <span className="bg-red-950/40 text-red-300 px-1.5 py-0.5 rounded border border-red-900/40">
                    Oficjalny ORLEN
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
