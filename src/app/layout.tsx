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
    { href: "/", label: "Kokpit główny", icon: LayoutDashboard },
    { href: "/stream", label: "Strumień informacji", icon: Radio },
    { href: "/events", label: "Centrum wydarzeń", icon: Layers },
    { href: "/map", label: "Mapa instalacji i ryzyka", icon: MapPin },
    { href: "/diffusion", label: "Ścieżki przepływu", icon: GitFork },
    { href: "/orlen-diff", label: "Analiza narracji ORLEN", icon: Scale },
    { href: "/search", label: "Wyszukiwarka OSINT", icon: Search },
    { href: "/alerts", label: "Alerty kryzysowe", icon: Bell },
    { href: "/reports", label: "Raporty analityczne", icon: FileText },
    { href: "/ask", label: "Zapytaj TTscope", icon: MessageSquareCode },
    { href: "/admin", label: "Panel źródeł i audyt", icon: ShieldCheck },
  ];

  return (
    <html lang="pl" className="dark">
      <body className="min-h-screen flex bg-background text-foreground text-sm selection:bg-cyan-950 selection:text-cyan-200 radar-grid-bg">
        {/* Pasek boczny nawigacji */}
        <aside className="w-64 border-r border-surface-border bg-surface/90 backdrop-blur-xl flex flex-col flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
          {/* Kompaktowy znak w pasku bocznym */}
          <div className="p-4 border-b border-surface-border">
            <Link href="/" className="block group">
              <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[#06152d] via-[#0a2246] to-[#040d1a] p-2.5 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,229,255,0.12)] group-hover:border-cyan-400/60 transition-all">
                <img
                  src="/ttscope-logo.png"
                  alt="Logo TTscope"
                  className="w-full h-auto object-contain drop-shadow-[0_2px_10px_rgba(0,229,255,0.25)]"
                />
              </div>
            </Link>
          </div>

          {/* Lista nawigacyjna */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/25 transition-all font-medium text-[13px] group"
                >
                  <Icon className="w-4 h-4 text-cyan-400/70 group-hover:text-cyan-300 transition-colors" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Stopka statusowa */}
          <div className="p-4 border-t border-surface-border bg-surface-muted/40">
            <div className="flex items-center justify-between text-[11px] text-slate-300 mb-2">
              <span className="flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-node-pulse" />
                Radar OSINT aktywny
              </span>
              <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                43/47 ŹRÓDEŁ
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              100% autentyczne źródła publiczne. Zero mocków.
            </p>
          </div>
        </aside>

        {/* Główny obszar roboczy */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Reprezentacyjny Banner Główny z dużym Logo i jednym zdaniem misji */}
          <header className="border-b border-surface-border bg-gradient-to-r from-[#051124]/95 via-[#091e3a]/95 to-[#061529]/95 backdrop-blur-md px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-6 flex-shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.45)] relative overflow-hidden">
            {/* Subtelna poświata radarowa */}
            <div className="absolute -left-10 -top-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
              <Link href="/" className="flex-shrink-0 group">
                <img
                  src="/ttscope-logo.png"
                  alt="TTscope"
                  className="h-24 md:h-28 w-auto object-contain drop-shadow-[0_0_18px_rgba(0,229,255,0.35)] group-hover:scale-[1.02] transition-transform"
                />
              </Link>

              <div className="h-14 w-px bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent hidden sm:block" />

              <div className="max-w-2xl text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono uppercase tracking-wider mb-2">
                  <Radar className="w-3 h-3 text-cyan-400" />
                  Intelligence & Crisis Early Warning Engine
                </div>
                <p className="text-sm md:text-base font-medium text-slate-100 leading-relaxed tracking-tight">
                  System wywiadu medialnego i wczesnego ostrzegania, który w czasie rzeczywistym śledzi komunikaty, publikacje oraz sygnały kryzysowe wokół wszystkich spółek i zakładów Grupy ORLEN.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10 flex-shrink-0">
              <Link
                href="/diffusion"
                className="flex items-center gap-2 px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/40 rounded-lg text-xs font-medium text-cyan-200 transition-all shadow-[0_0_15px_rgba(0,229,255,0.12)]"
              >
                <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                Ścieżki dyfuzji
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-semibold rounded-lg text-xs transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Synchronizuj źródła
              </Link>
            </div>
          </header>

          {/* Zawartość strony */}
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
