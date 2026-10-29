"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./LogoutButton";
import {
  LayoutDashboard,
  Building2,
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
  Menu,
  X,
  Radar,
} from "lucide-react";

export const navItems = [
  { href: "/", label: "Centrum sytuacyjne", icon: LayoutDashboard },
  { href: "/entities", label: "Grupa ORLEN", icon: Building2 },
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

export function AppNavigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* ============================================================== */}
      {/* 1. DESKTOP SIDEBAR (Tylko na ekranach lg: i większych)          */}
      {/* ============================================================== */}
      <aside className="hidden lg:flex w-64 border-r border-cyan-500/20 bg-[#050d1a]/95 backdrop-blur-2xl flex-col flex-shrink-0 shadow-[6px_0_32px_rgba(0,0,0,0.6)]">
        {/* Nagłówek konsoli */}
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

        {/* Lista linków nawigacyjnych */}
        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Moduły analityczne
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-medium text-[13px] group ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-transparent border border-cyan-400/40 text-cyan-200 shadow-[0_0_15px_rgba(0,229,255,0.15)]"
                    : "text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500/15 hover:to-transparent border border-transparent hover:border-cyan-400/30"
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive
                      ? "text-cyan-300"
                      : "text-cyan-400/75 group-hover:text-cyan-300"
                  }`}
                />
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
            Wszystkie fakty posiadają autentyczną datę ukazania się i link źródłowy.
          </p>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MOBILE TOP BAR (Tylko na ekranach mniejszych niż lg)         */}
      {/* ============================================================== */}
      <header className="lg:hidden border-b border-cyan-500/25 bg-[#050d1a]/95 backdrop-blur-xl px-4 py-2 flex items-center justify-between flex-shrink-0 z-30 sticky top-0 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
        <Link href="/" className="flex items-center group">
          <img
            src="/ttscope-logo.png"
            alt="Logo TTscope"
            className="h-14 sm:h-16 w-auto object-contain drop-shadow-[0_2px_15px_rgba(0,229,255,0.4)] group-hover:scale-[1.02] transition-transform"
          />
        </Link>

        <div className="flex items-center gap-2">
          <LogoutButton />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Zamknij menu" : "Otwórz menu"}
            className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 3. MOBILE DRAWER (Wysuwany panel pełnego menu ze wszystkimi opcjami) */}
      {/* ============================================================== */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop przyciemniający */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-80 max-w-[85vw] bg-[#050d1a] border-r border-cyan-500/30 flex flex-col h-full shadow-[10px_0_40px_rgba(0,0,0,0.9)] z-10">
            {/* Nagłówek panelu */}
            <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between bg-cyan-950/30">
              <div className="flex items-center gap-2">
                <Radar className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-200">
                  Moduły wywiadowcze
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista linków */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-medium text-sm ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-500/25 to-transparent border border-cyan-400/50 text-cyan-200"
                        : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Szybkie akcje w drawerze */}
            <div className="p-4 border-t border-cyan-500/20 bg-[#030914] space-y-2.5">
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-bold rounded-xl text-xs shadow-[0_0_20px_rgba(0,229,255,0.3)]"
              >
                <RefreshCw className="w-4 h-4" />
                Pobierz nowe publikacje
              </Link>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/10 font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  43/43 źródeł online
                </span>
                <span>OSINT v2.4</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. MOBILE BOTTOM BAR (Dolna belka z kluczowymi zakładkami)      */}
      {/* ============================================================== */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#050d1a]/95 backdrop-blur-xl border-t border-cyan-500/25 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_25px_rgba(0,0,0,0.8)]">
        {[
          { href: "/", label: "Centrum", icon: LayoutDashboard },
          { href: "/entities", label: "Grupa", icon: Building2 },
          { href: "/stream", label: "Strumień", icon: Radio },
          { href: "/diffusion", label: "Dyfuzja", icon: GitFork },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all min-w-[60px] ${
                isActive
                  ? "text-cyan-300 font-bold bg-cyan-950/60"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-cyan-400 mt-0.5 shadow-[0_0_6px_#00e5ff]" />
              )}
            </Link>
          );
        })}

        {/* Przycisk Menu otwierający pełny panel */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all min-w-[60px] ${
            mobileMenuOpen
              ? "text-cyan-300 font-bold bg-cyan-950/60"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Więcej</span>
        </button>
      </nav>
    </>
  );
}
