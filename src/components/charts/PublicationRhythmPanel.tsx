import Link from "next/link";
import { BarChart3, ChevronRight, Newspaper, Info } from "lucide-react";
import {
  COMMUNICATION_CHANNELS,
  type RhythmBucket,
} from "@/lib/analytics/publication-rhythm";
import { CHANNEL_THEME, streamHref } from "./channel-theme";

interface PublisherStat {
  source_name: string;
  count: number;
  official: number;
}

interface PublicationRhythmPanelProps {
  buckets: readonly RhythmBucket[];
  topPublishers: readonly PublisherStat[];
  timeRangeLabel: string;
  isHourly: boolean;
  totalInWindow: number;
}

export function PublicationRhythmPanel({
  buckets,
  topPublishers,
  timeRangeLabel,
  isHourly,
  totalInWindow,
}: PublicationRhythmPanelProps) {
  const maxDayTotal = Math.max(
    ...buckets.map((b) => b.official + b.labor + b.external),
    1
  );
  const maxPubCount = Math.max(...topPublishers.map((p) => p.count), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Lewa karta: Wykres rytmu publikacji */}
      <div className="lg:col-span-7 bg-gradient-to-b from-[#07162c]/95 to-[#040d1a]/95 rounded-2xl border border-cyan-500/30 p-6 shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/20 pb-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-mono uppercase tracking-wider">
              <BarChart3 className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              Rytm napływu publikacji — {timeRangeLabel}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Podział na oficjalne, sygnały załogi i media ({totalInWindow} publikacji w wybranym oknie).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {COMMUNICATION_CHANNELS.map((ch) => {
              const theme = CHANNEL_THEME[ch];
              return (
                <div
                  key={ch}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#040b16] border border-white/10 text-[11px] text-slate-200"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: theme.fill }}
                    aria-hidden="true"
                  />
                  <span>{theme.shortLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamiczny wykres słupkowy */}
        <div className="pt-6 pb-2">
          {buckets.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-xs text-slate-400 bg-[#040a14]/60 rounded-xl border border-white/5">
              <Info className="w-5 h-5 text-cyan-400 mb-1" />
              <span>Brak zarejestrowanych publikacji w tym przedziale czasu.</span>
            </div>
          ) : (
            <div
              className={`grid gap-1 sm:gap-2 items-end h-44`}
              style={{
                gridTemplateColumns: `repeat(${Math.min(buckets.length, 28)}, minmax(0, 1fr))`,
              }}
            >
              {buckets.slice(0, 28).map((bucket) => {
                const total = bucket.official + bucket.labor + bucket.external;
                const totalHeightPct = Math.max((total / maxDayTotal) * 100, total > 0 ? 12 : 4);
                const officialPct = total > 0 ? (bucket.official / total) * 100 : 0;
                const laborPct = total > 0 ? (bucket.labor / total) * 100 : 0;
                const externalPct = total > 0 ? (bucket.external / total) * 100 : 0;

                return (
                  <Link
                    key={bucket.key}
                    href={streamHref({ from: bucket.fromIso, to: bucket.toIso })}
                    title={`${bucket.fullLabel}: ${total} publ. (ORLEN: ${bucket.official}, Związki: ${bucket.labor}, Media: ${bucket.external})`}
                    className="group flex flex-col items-center justify-end h-full focus:outline-none"
                  >
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-cyan-300 mb-1 transition-colors">
                      {total > 0 ? total : ""}
                    </span>

                    <div className="w-full flex-1 flex items-end justify-center bg-[#040a14]/70 rounded-lg p-0.5 border border-white/5 group-hover:border-cyan-400/60 transition-all">
                      <div
                        className="w-full rounded-md overflow-hidden flex flex-col justify-end animate-bar-grow"
                        style={{ height: `${totalHeightPct}%` }}
                      >
                        {bucket.external > 0 && (
                          <div
                            style={{
                              height: `${externalPct}%`,
                              backgroundColor: CHANNEL_THEME.external.fill,
                            }}
                            className="w-full min-h-[2px]"
                          />
                        )}
                        {bucket.labor > 0 && (
                          <div
                            style={{
                              height: `${laborPct}%`,
                              backgroundColor: CHANNEL_THEME.labor.fill,
                            }}
                            className="w-full min-h-[3px]"
                          />
                        )}
                        {bucket.official > 0 && (
                          <div
                            style={{
                              height: `${officialPct}%`,
                              backgroundColor: CHANNEL_THEME.official.fill,
                            }}
                            className="w-full min-h-[3px]"
                          />
                        )}
                        {total === 0 && (
                          <div className="w-full h-1 bg-slate-800 rounded" />
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-white mt-1.5 truncate max-w-full text-center">
                      {bucket.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-cyan-500/15 flex items-center justify-between text-[11px] text-slate-400">
          <span>{isHourly ? "Każdy słupek reprezentuje 1 godzinę" : "Każdy słupek reprezentuje 1 dobę"}</span>
          <Link
            href="/stream"
            className="text-cyan-300 hover:text-white inline-flex items-center gap-1 font-semibold"
          >
            Pełny strumień <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Prawa karta: Najaktywniejsze redakcje w tym oknie */}
      <div className="lg:col-span-5 bg-gradient-to-b from-[#07162c]/95 to-[#040d1a]/95 rounded-2xl border border-cyan-500/30 p-6 shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex flex-col justify-between">
        <div className="border-b border-cyan-500/20 pb-4">
          <div className="flex items-center gap-2 text-cyan-300 text-xs font-mono uppercase tracking-wider">
            <Newspaper className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            Główne redakcje i nadawcy ({timeRangeLabel})
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Kliknij wybraną redakcję, aby zawęzić wyniki w wybranym horyzoncie.
          </p>
        </div>

        <div className="space-y-2.5 my-4">
          {topPublishers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-[#040b16]/60 rounded-xl border border-white/5">
              Brak publikacji w wybranym oknie czasowym.
            </div>
          ) : (
            topPublishers.map((pub) => {
              const widthPct = Math.max((pub.count / maxPubCount) * 100, 8);
              const isOfficial = pub.official > 0;
              return (
                <Link
                  key={pub.source_name}
                  href={streamHref({ publisher: pub.source_name })}
                  className="group block p-2.5 rounded-xl bg-[#040b16]/90 hover:bg-[#091b34] border border-white/5 hover:border-cyan-400/50 transition-all"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                    <span className="font-semibold text-slate-100 group-hover:text-cyan-300 truncate flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isOfficial ? "bg-cyan-400" : "bg-indigo-400"
                        }`}
                      />
                      <span className="truncate">{pub.source_name}</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-cyan-300 flex items-center gap-1 flex-shrink-0">
                      {pub.count} publ.
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full animate-bar-grow-x ${
                        isOfficial
                          ? "bg-gradient-to-r from-cyan-400 to-sky-400"
                          : "bg-gradient-to-r from-indigo-400 to-cyan-400"
                      }`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </Link>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-cyan-500/15 flex items-center justify-between text-[11px] text-slate-400">
          <span>Liczba publikacji w zadanym horyzoncie</span>
          <Link
            href="/stream"
            className="text-cyan-300 hover:text-white inline-flex items-center gap-1 font-semibold"
          >
            Wszystkie <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
