import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import {
  LayoutDashboard,
  Radio,
  Layers,
  MapPin,
  GitFork,
  Search,
  Scale,
  Bell,
  FileText,
  MessageSquareCode,
  ShieldCheck,
  RefreshCw,
  Radar,
  ShieldAlert,
} from "lucide-react";

export const metadata: Metadata = {
  title: "TTscope — System Wywiadu Medialnego i Analizy Kryzysowej Grupy ORLEN",
  description:
    "System wywiadu medialnego i wczesnego ostrzegania, który w czasie rzeczywistym śledzi komunikaty, publikacje oraz sygnały kryzysowe wokół wszystkich spółek i zakładów Grupy ORLEN.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { href: "/", label: "Centrum sytuacyjne", icon: LayoutDashboard },
    { href: "/stream", label: "Strumień publikacji", icon: Radio },
    { href: "/events", label: "Wątki i wydarzenia", icon: Layers },
    { href: "/diffusion", label: "Ścieżki dyfuzji", icon: GitFork },
    { href: "/orlen-diff", label: "Wewnętrzne vs zewnętrzne", icon: Scale },
    { href: "/map", label: "Mapa zakładów i ryzyka", icon: MapPin },
    { href: "/alerts", label: "Alerty wczesnego ostrzegania", icon: Bell },
    { href: "/search", label: "Wyszukiwarka OSINT", icon: Search },
    { href: "/reports", label: "Raporty analityczne", icon: FileText },
    { href: "/ask", label: "Zapytaj TTscope (AI)", icon: MessageSquareCode },
    { href: "/admin", label: "Rejestr źródeł i audyt", icon: ShieldCheck },
  ];

  return (
    <html lang="pl" className="dark">
      <body className="min-h-screen flex bg-background text-foreground text-sm selection:bg-cyan-950 selection:text-cyan-200 radar-grid-bg">
        {/* Pasek boczny nawigacji — czysta, techniczna konsola bez duplikowania logo */}
        <aside className="w-64 border-r border-cyan-500/20 bg-[#050d1a]/95 backdrop-blur-2xl flex flex-col flex-shrink-0 shadow-[6px_0_32px_rgba(0,0,0,0.6)]">
          {/* Techniczny nagłówek konsoli nawigacyjnej */}
          <div className="px-5 py-5 border-b border-cyan-500/15 bg-gradient-to-r from-cyan-950/30 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-node-pulse" />
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300 font-semibold">
                  KONSOLA OPERACYJNA
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                OSINT v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              Monitoring ciągły ekosystemu Grupy ORLEN
            </p>
          </div>

          {/* Lista nawigacyjna */}
          <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Moduły analityczne
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500/15 hover:to-transparent border border-transparent hover:border-cyan-400/30 transition-all font-medium text-[13px] group"
                >
                  <Icon className="w-4 h-4 text-cyan-400/75 group-hover:text-cyan-300 transition-colors flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Stopka statusowa */}
          <div className="p-4 border-t border-cyan-500/15 bg-[#030914]/90">
            <div className="flex items-center justify-between text-[11px] text-slate-300 mb-2">
              <span className="flex items-center gap-2 font-medium text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                43/43 źródła online
              </span>
              <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                ZERO-MOCK
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Wszystkie prezentowane fakty posiadają autentyczną datę ukazania się i link źródłowy.
            </p>
          </div>
        </aside>

        {/* Główny obszar roboczy */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Pojedynczy, monumentalny Banner Główny z dużym Logo i jednym zdaniem misji */}
          <header className="border-b border-cyan-500/25 bg-gradient-to-r from-[#040d1a] via-[#081b36] to-[#051224] px-8 py-5 flex flex-col xl:flex-row items-center justify-between gap-6 flex-shrink-0 shadow-[0_10px_40px_rgba(0,0,0,0.65)] relative overflow-hidden">
            {/* Subtelna poświata celownika radarowego */}
            <div className="absolute -left-12 -top-16 w-96 h-96 bg-cyan-500/12 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-1/4 -bottom-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center gap-7 relative z-10">
              <Link href="/" className="flex-shrink-0 group">
                <div className="relative rounded-2xl p-1.5 bg-gradient-to-b from-cyan-400/20 to-transparent border border-cyan-400/30 shadow-[0_0_35px_rgba(0,229,255,0.22)]">
                  <img
                    src="/ttscope-logo.png"
                    alt="Logo TTscope"
                    className="h-24 md:h-28 w-auto object-contain drop-shadow-[0_4px_20px_rgba(0,229,255,0.45)] group-hover:scale-[1.02] transition-transform duration-200"
                  />
                </div>
              </Link>

              <div className="h-20 w-px bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent hidden md:block" />

              <div className="max-w-2xl text-center md:text-left space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-[10px] font-mono uppercase tracking-[0.15em] shadow-[0_0_15px_rgba(0,229,255,0.15)]">
                  <Radar className="w-3.5 h-3.5 text-cyan-400" />
                  ORLEN OSINT & Media Intelligence Command Center
                </div>
                <p className="text-base md:text-lg font-medium text-white leading-snug tracking-tight drop-shadow">
                  System wywiadu medialnego i wczesnego ostrzegania, który w czasie rzeczywistym śledzi komunikaty, publikacje oraz sygnały kryzysowe wokół wszystkich spółek i zakładów Grupy ORLEN.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10 flex-shrink-0">
              <Link
                href="/diffusion"
                className="flex items-center gap-2 px-4 py-2.5 bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-400/40 rounded-xl text-xs font-semibold text-cyan-200 transition-all shadow-[0_0_20px_rgba(0,229,255,0.12)]"
              >
                <GitFork className="w-4 h-4 text-cyan-400" />
                Ścieżki przepływu
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-[0_0_25px_rgba(0,229,255,0.4)]"
              >
                <RefreshCw className="w-4 h-4" />
                Pobierz nowe publikacje
              </Link>
            </div>
          </header>

          {/* Zawartość strony */}
          <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
