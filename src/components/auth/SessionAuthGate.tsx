"use client";

import { useState, useEffect } from "react";
import { KeyRound, ArrowRight, AlertCircle, Lock, ShieldCheck } from "lucide-react";

export function SessionAuthGate({ children }: { children: React.ReactNode }) {
  // Konsola ZAWSZE startuje zablokowana (false).
  // Brak automatycznego odblokowywania z pamięci (sessionStorage/localStorage)
  // zapobiega zjawisku samoczynnego znikania formularza przed wpisaniem hasła.
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Czyszczenie wszelkich pozostałości po pamięci podręcznej przy starcie
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("ttscope_unlocked");
      localStorage.removeItem("ttscope_unlocked");
    }
  }, []);

  // Nasłuchiwanie na polecenie blokady konsoli (np. kliknięcie przycisku "Zablokuj")
  useEffect(() => {
    const handleLock = () => {
      setIsUnlocked(false);
      setPassword("");
      setError(null);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("ttscope_unlocked");
        localStorage.removeItem("ttscope_unlocked");
      }
    };

    window.addEventListener("ttscope:lock", handleLock);
    return () => window.removeEventListener("ttscope:lock", handleLock);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (data.ok) {
        setIsUnlocked(true);
        setError(null);
        setPassword("");
      } else {
        setError(data.error || "Nieprawidłowe hasło dostępu");
      }
    } catch {
      setError("Wystąpił błąd weryfikacji hasła z serwerem");
    } finally {
      setLoading(false);
    }
  };

  // Dopóki konsola nie jest odblokowana, ZAWSZE wyświetla się pojedynczy, spektakularny ekran logowania
  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 z-[9999] min-h-screen bg-[#030914] flex flex-col justify-center items-center p-4 sm:p-6 overflow-y-auto radar-grid-bg">
        {/* Poświaty tła */}
        <div className="absolute -left-20 -top-20 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-xl w-full bg-[#051124]/95 border border-cyan-500/35 rounded-3xl p-6 sm:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.9)] relative z-10 backdrop-blur-2xl space-y-6 my-auto">
          {/* Czysty element graficzny z domeną bez postaci i bez animacji */}
          <div className="flex flex-col items-center text-center space-y-3 pt-2">
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-400/15 rounded-full blur-xl pointer-events-none" />
              <img
                src="/ttscope-domain-brand.png"
                alt="TTscope.pl"
                className="relative z-10 h-16 sm:h-20 w-auto object-contain drop-shadow-[0_8px_24px_rgba(0,229,255,0.35)]"
              />
            </div>
            
            <div className="space-y-1">
              <h1 className="text-lg sm:text-xl font-black tracking-wider text-slate-100 font-mono">
                TERMINAL AUTORYZACYJNY
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Wymagane uwierzytelnienie kluczem sesyjnym
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-cyan-950/40 border border-cyan-500/25 rounded-xl text-xs text-cyan-200">
            <Lock className="w-4 h-4 flex-shrink-0 text-cyan-400" />
            <span>Wymagana autoryzacja bieżącego wejścia do systemu analitycznego</span>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                Klucz dostępu analityka
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/70" />
                <input
                  type="password"
                  name="auth_key_temp"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Wprowadź hasło autoryzacyjne..."
                  required
                  autoFocus
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  className="w-full bg-[#020712] border border-cyan-500/40 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-500 hover:from-cyan-300 hover:to-sky-300 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.99]"
            >
              <span>{loading ? "Weryfikacja klucza..." : "Zaloguj do TTscope"}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <div className="pt-3 border-t border-cyan-500/20 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Szyfrowanie sesji aktywne
            </span>
            <span>OSINT v2.4 // 2026</span>
          </div>
        </div>
      </div>
    );
  }

  // Po odblokowaniu: renderuje pełną aplikację
  return <>{children}</>;
}
