"use client";

import { useState } from "react";
import { MessageSquareCode, Send, Sparkles, AlertCircle, Database, ExternalLink } from "lucide-react";

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any | null>(null);

  const sampleQuestions = [
    "Co w ostatnich godzinach i dniach napisano o Orlenie?",
    "Które tematy i iskrzenia najbardziej rosną?",
    "Które lokalne tematy dotyczą pracowników lub związków?",
    "Co dokładnie opublikował oficjalnie Orlen lub Energa?",
    "Czy temat cen paliw trafił do mediów ogólnopolskich?",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/api/gemini/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error("Błąd zapytania:", err);
      setResponse({
        ok: false,
        error: "Błąd połączenia z modułem analitycznym.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-surface-border pb-5">
        <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
          <MessageSquareCode className="w-5 h-5 text-neutral-400" />
          Zapytaj TTscope (Analityk AI & Function Calling)
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Zadawaj pytania w języku naturalnym. Model odpytuje bezpośrednio bazę danych za pomocą kontrolowanych narzędzi.
        </p>
      </div>

      {/* Formularz pytania */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            rows={3}
            placeholder="Zadaj pytanie analityczne dotyczące bazy publikacji i wydarzeń Grupy ORLEN..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full bg-surface border border-surface-border rounded-xl p-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 resize-none"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="absolute right-3 bottom-3 px-4 py-1.5 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? "Analizowanie bazy..." : "Wyślij"}
          </button>
        </div>

        {/* Sugestie pytań */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-neutral-400">Przykładowe zapytania analityczne:</span>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuestion(q)}
                className="bg-surface-muted hover:bg-neutral-800 px-2.5 py-1 rounded text-neutral-300 border border-surface-border text-[11px] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Odpowiedź */}
      {loading && (
        <div className="bg-surface p-6 rounded-xl border border-surface-border flex items-center gap-3 text-xs text-neutral-400 animate-pulse">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>Odpytuję bazę danych TTscope za pomocą Function Calling...</span>
        </div>
      )}

      {response && (
        <div className="bg-surface p-6 rounded-xl border border-surface-border space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <span className="text-xs font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Odpowiedź analityczna TTscope
            </span>
            {response.functionExecuted && (
              <span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded text-neutral-300">
                Wywołana funkcja: {response.functionExecuted}
              </span>
            )}
          </div>

          {response.ok ? (
            <div className="space-y-4">
              {response.warning && (
                <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg text-xs text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{response.warning}</span>
                </div>
              )}

              <div className="text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap">
                {response.answer}
              </div>

              {response.sourcesUsed && response.sourcesUsed.length > 0 && (
                <div className="pt-3 border-t border-surface-border space-y-2">
                  <span className="text-[11px] font-mono uppercase text-neutral-400">
                    Źródła wykorzystane w odpowiedzi:
                  </span>
                  <div className="space-y-1.5">
                    {response.sourcesUsed.map((s: any, idx: number) => (
                      <div key={idx} className="text-xs text-neutral-300 flex items-center gap-2">
                        <span className="text-neutral-500 font-mono">•</span>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-red-300 inline-flex items-center gap-1 font-medium"
                        >
                          <span>{s.title}</span>
                          <ExternalLink className="w-3 h-3 text-neutral-500 flex-shrink-0" />
                        </a>
                        <span className="text-[11px] text-neutral-500 font-mono">({s.source})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-red-950/30 border border-red-800/40 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{response.error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
