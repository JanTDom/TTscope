"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, KeyRound, ArrowRight, AlertCircle, Lock } from "lucide-react";

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
            className="w-full bg-[#030914] border border-cyan-500/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono transition-all"
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
        className="w-full py-3 px-4 bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-500 hover:from-cyan-300 hover:to-sky-300 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,229,255,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <span>{loading ? "Uwierzytelnianie..." : "Zaloguj do TTscope"}</span>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 relative overflow-hidden radar-grid-bg">
      {/* Poświaty tła */}
      <div className="absolute -left-20 -top-20 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-[#051124]/95 border border-cyan-500/35 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] relative z-10 backdrop-blur-2xl space-y-6">
        {/* Kontener z dużym logo i animowaną głową w logo */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative group cursor-pointer">
            {/* Animowana pulsująca aura */}
            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-sky-600 rounded-3xl blur-lg opacity-40 group-hover:opacity-75 transition duration-500 animate-pulse" />
            
            {/* Logo box */}
            <div className="relative w-28 h-28 bg-[#030914] border-2 border-cyan-400/60 rounded-3xl p-3 flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.25)]">
              {/* Animowana głowa w logo */}
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full text-cyan-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <style>{`
                  @keyframes headSway {
                    0%, 100% { transform: rotate(0deg) translateY(0px); }
                    25% { transform: rotate(-3deg) translateY(-2px); }
                    75% { transform: rotate(3deg) translateY(-2px); }
                  }
                  @keyframes eyeBlink {
                    0%, 90%, 100% { transform: scaleY(1); }
                    95% { transform: scaleY(0.1); }
                  }
                  @keyframes smileWiden {
                    0%, 100% { d: path("M36 68 Q50 78 64 68"); }
                    50% { d: path("M34 67 Q50 83 66 67"); }
                  }
                  .anim-head {
                    transform-origin: 50% 85%;
                    animation: headSway 5s ease-in-out infinite;
                  }
                  .anim-eyes {
                    transform-origin: 50% 48%;
                    animation: eyeBlink 4s ease-in-out infinite;
                  }
                  .anim-smile {
                    animation: smileWiden 3.5s ease-in-out infinite;
                  }
                `}</style>
                
                <g className="anim-head">
                  {/* Obrys głowy / hełmu analitycznego */}
                  <rect x="20" y="18" width="60" height="66" rx="20" stroke="currentColor" strokeWidth="3.5" fill="#06162d" />
                  
                  {/* Antena / sensor wywiadowczy */}
                  <line x1="50" y1="6" x2="50" y2="18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="50" cy="5" r="3" fill="#38bdf8" className="animate-ping" />
                  <circle cx="50" cy="5" r="3" fill="#00e5ff" />
                  
                  {/* Radarowe uszy */}
                  <path d="M14 42 C14 36 20 38 20 45 L20 57 C20 64 14 66 14 60 Z" fill="#0284c7" stroke="currentColor" strokeWidth="2" />
                  <path d="M86 42 C86 36 80 38 80 45 L80 57 C80 64 86 66 86 60 Z" fill="#0284c7" stroke="currentColor" strokeWidth="2" />

                  {/* Wizjer / oczy */}
                  <g className="anim-eyes">
                    {/* Lewe oko */}
                    <circle cx="37" cy="48" r="6.5" fill="#38bdf8" />
                    <circle cx="39" cy="46" r="2.5" fill="#ffffff" />
                    {/* Prawe oko */}
                    <circle cx="63" cy="48" r="6.5" fill="#38bdf8" />
                    <circle cx="65" cy="46" r="2.5" fill="#ffffff" />
                  </g>

                  {/* Uśmiech główki zwracający się do użytkownika */}
                  <path
                    className="anim-smile"
                    d="M36 68 Q50 78 64 68"
                    stroke="#38bdf8"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Dołeczki uśmiechu */}
                  <circle cx="33" cy="67" r="1.5" fill="#00e5ff" />
                  <circle cx="67" cy="67" r="1.5" fill="#00e5ff" />
                </g>
              </svg>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h1 className="text-2xl font-black tracking-wider text-slate-100 font-mono">
                TT<span className="text-cyan-400">SCOPE</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              ORLEN OSINT & Media Intelligence System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-cyan-950/30 border border-cyan-500/20 rounded-xl text-xs text-cyan-300">
          <Lock className="w-4 h-4 flex-shrink-0 text-cyan-400" />
          <span>Dostęp ograniczony: wymagana autoryzacja sesji wywiadowczej</span>
        </div>

        <Suspense fallback={<div className="text-center py-4 text-xs font-mono text-slate-500">Inicjalizacja modułu autoryzacji...</div>}>
          <LoginForm />
        </Suspense>

        <div className="pt-4 border-t border-cyan-500/20 text-center">
          <p className="text-[11px] text-slate-400 font-mono">
            TTscope Intelligence Engine v2.4 // 2026
          </p>
        </div>
      </div>
    </div>
  );
}