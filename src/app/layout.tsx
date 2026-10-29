import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { AppNavigation } from "@/components/navigation/AppNavigation";
import { SessionAuthGate } from "@/components/auth/SessionAuthGate";
import { LogoutButton } from "@/components/navigation/LogoutButton";
import { GitFork, RefreshCw, Radar } from "lucide-react";

export const metadata: Metadata = {
  metadataBase: new URL("https://ttscope.pl"),
  title: "TTscope",
  description: "ttscope.pl",
  openGraph: {
    title: "TTscope",
    description: "ttscope.pl",
    url: "https://ttscope.pl",
    siteName: "TTscope",
    type: "website",
    images: [
      {
        url: "https://ttscope.pl/icon.png",
        width: 512,
        height: 512,
        alt: "TTscope",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "TTscope",
    description: "ttscope.pl",
    images: ["https://ttscope.pl/icon.png"],
  },
  icons: {
    icon: [
      { url: "/icon.png?v=20261029_3", type: "image/png", sizes: "512x512" },
      { url: "/favicon-32x32.png?v=20261029_3", type: "image/png", sizes: "32x32" },
      { url: "/favicon.ico?v=20261029_3", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=20261029_3", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=20261029_3",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className="dark">
      <head>
        <link rel="icon" href="/icon.png?v=20261029_3" type="image/png" sizes="512x512" />
        <link rel="icon" href="/favicon-32x32.png?v=20261029_3" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon.ico?v=20261029_3" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=20261029_3" />
      </head>
      <body className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground text-sm selection:bg-cyan-950 selection:text-cyan-200 radar-grid-bg antialiased">
        <SessionAuthGate>
          {/* Responsywna nawigacja: Sidebar na desktopie + Mobile Top Bar + Mobile Drawer + Bottom Bar */}
          <AppNavigation />

          {/* Główny obszar roboczy */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Banner Główny Desktop (na ekranach lg: i większych) */}
            <header className="hidden lg:flex border-b border-cyan-500/25 bg-gradient-to-r from-[#040d1a] via-[#081b36] to-[#051224] px-8 py-5 items-center justify-between gap-6 flex-shrink-0 shadow-[0_10px_40px_rgba(0,0,0,0.65)] relative overflow-hidden">
              {/* Poświaty */}
              <div className="absolute -left-12 -top-16 w-96 h-96 bg-cyan-500/12 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute right-1/4 -bottom-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-7 relative z-10">
                <Link href="/" className="flex-shrink-0 group">
                  <div className="relative rounded-2xl p-1.5 bg-gradient-to-b from-cyan-400/20 to-transparent border border-cyan-400/30 shadow-[0_0_35px_rgba(0,229,255,0.22)]">
                    <img
                      src="/ttscope-logo.png"
                      alt="Logo TTscope"
                      className="h-24 md:h-28 w-auto object-contain drop-shadow-[0_4px_20px_rgba(0,229,255,0.45)] group-hover:scale-[1.02] transition-transform duration-200"
                    />
                  </div>
                </Link>

                <div className="h-20 w-px bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent" />

                <div className="max-w-2xl space-y-2">
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
                <LogoutButton />
              </div>
            </header>

            {/* Zawartość strony — z odpowiednim paddingiem na dole na mobile, aby pasek nawigacji nie zasłaniał treści */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </SessionAuthGate>
      </body>
    </html>
  );
}
