"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, ArrowRight, AlertCircle, Lock, ShieldCheck } from "lucide-react";
import { AnimatedTTscopeLogo } from "@/components/auth/AnimatedTTscopeLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        router.push(from);
        router.refresh();
      } else {
        setError(data.error || "Nieprawidłowe hasło dostępu");
      }
    } catch {
      setError("Wystąpił błąd połączenia z serwerem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
          Klucz dostępu analityka
        </label>
        <div className="relative">
          <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/70" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Wprowadź hasło autoryzacyjne..."
            required
            autoFocus
            autoComplete="new-password"
            className="w-full bg-[#030914] border border-cyan-500/40 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !password}
        className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-500 hover:from-cyan-300 hover:to-sky-300 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,229,255,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.99]"
      >
        <span>{loading ? "Uwierzytelnianie..." : "Zaloguj do TTscope"}</span>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden radar-grid-bg">
      {/* Poświaty tła */}
      <div className="absolute -left-20 -top-20 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full bg-[#051124]/95 border border-cyan-500/35 rounded-3xl p-6 sm:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.85)] relative z-10 backdrop-blur-2xl space-y-6 my-auto">
        {/* Kontener z dużym logo i animowaną głową w logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <AnimatedTTscopeLogo className="w-full max-w-md mx-auto" />
          
          <div className="pt-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-wider text-slate-100 font-mono">
              KONSOLA WYWIADOWCZA <span className="text-cyan-400">TTSCOPE</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              ORLEN OSINT & Media Intelligence System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-cyan-950/30 border border-cyan-500/20 rounded-xl text-xs text-cyan-300">
          <Lock className="w-4 h-4 flex-shrink-0 text-cyan-400" />
          <span>Dostęp ograniczony: wymagana autoryzacja sesji wywiadowczej</span>
        </div>

        <Suspense fallback={<div className="text-center py-4 text-xs font-mono text-slate-500">Inicjalizacja modułu autoryzacji...</div>}>
          <LoginForm />
        </Suspense>

        <div className="pt-3 border-t border-cyan-500/20 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Połączenie bezpieczne
          </span>
          <span>TTscope Intelligence Engine v2.4 // 2026</span>
        </div>
      </div>
    </div>
  );
}
