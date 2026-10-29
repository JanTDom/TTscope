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
} from "lucide-react";

export const metadata: Metadata = {
  title: "TTscope — Monitoring Wywiadowczy i Analiza Kryzysowa Grupy ORLEN",
  description: "Zaawansowany system OSINT, monitoringu dyfuzji informacji i detekcji iskrzeń Grupy ORLEN",
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
    { href: "/diffusion", label: "Przepływ informacji", icon: GitFork },
    { href: "/orlen-diff", label: "Analiza narracji ORLEN", icon: Scale },
    { href: "/search", label: "Wyszukiwarka OSINT", icon: Search },
    { href: "/alerts", label: "Alerty kryzysowe", icon: Bell },
    { href: "/reports", label: "Raporty analityczne", icon: FileText },
    { href: "/ask", label: "Zapytaj TTscope", icon: MessageSquareCode },
    { href: "/admin", label: "Panel źródeł i audyt", icon: ShieldCheck },
  ];

  return (
    <html lang="pl" className="dark">
      <body className="min-h-screen flex bg-background text-foreground text-sm selection:bg-red-950 selection:text-red-200">
        {/* Pasek boczny nawigacji */}
        <aside className="w-64 border-r border-surface-border bg-surface flex flex-col flex-shrink-0">
          {/* Logo i Brand */}
          <div className="p-5 border-b border-surface-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-orlen-red flex items-center justify-center font-bold text-white tracking-widest text-xs">
                TT
              </div>
              <div>
                <h1 className="font-semibold text-base tracking-tight text-white flex items-center gap-1.5">
                  TTscope
                  <span className="text-[10px] font-mono uppercase bg-white/10 px-1.5 py-0.5 rounded text-neutral-300">
                    ORLEN
                  </span>
                </h1>
                <p className="text-[11px] text-neutral-400">Media & OSINT Engine</p>
              </div>
            </div>
          </div>

          {/* Lista nawigacyjna */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-surface-muted transition-colors font-medium text-[13px]"
                >
                  <Icon className="w-4 h-4 text-neutral-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Stopka statusowa */}
          <div className="p-4 border-t border-surface-border bg-surface-muted/30">
            <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                System aktywny
              </span>
              <span className="font-mono text-[10px]">FABLE 5.1</span>
            </div>
            <p className="text-[10px] text-neutral-500 leading-relaxed">
              Wyłącznie zweryfikowane publiczne źródła. Zero mocków.
            </p>
          </div>
        </aside>

        {/* Główny obszar roboczy */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <header className="h-14 border-b border-surface-border bg-surface/50 backdrop-blur px-6 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-400">
                Zakres monitoringu: <strong className="text-neutral-200">Grupa ORLEN i podmioty zależne</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-muted hover:bg-neutral-800 border border-surface-border rounded-md text-xs font-medium text-neutral-300 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-neutral-400" />
                Pobierz dane
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
