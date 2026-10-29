import Link from "next/link";
import { dbRepo } from "@/lib/db";
import {
  Building2,
  Flame,
  ChevronRight,
  TrendingUp,
  Clock,
  ShieldAlert,
  GitFork,
  Newspaper,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { DiffusionFlowGraph } from "@/components/DiffusionFlowGraph";
import { formatEventStage, formatPublicationTime } from "@/lib/format/publication";
import { DualCommunicationZone } from "@/components/DualCommunicationZone";
import {
  buildDailyRhythm,
  lastDayKeys,
  warsawDayBoundsUtc,
  warsawDayKey,
} from "@/lib/analytics/publication-rhythm";
import { Sparkline } from "@/components/charts/Sparkline";
import { CHANNEL_THEME, streamHref } from "@/components/charts/channel-theme";
import { PublicationRhythmPanel } from "@/components/charts/PublicationRhythmPanel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const stats = dbRepo.getDashboardStats();
  const events = dbRepo.getAllEvents();
  const alerts = dbRepo.getActiveAlerts();
  const { documents: allRecentDocs } = dbRepo.getDocuments({ limit: 250 });

  const officialDocs = allRecentDocs.filter((d) => d.is_orlen_official);
  const laborDocs = allRecentDocs.filter((d) => d.is_labor_signal && !d.is_orlen_official);
  const externalMediaDocs = allRecentDocs.filter((d) => !d.is_orlen_official && !d.is_labor_signal);

  const anchorDay =
    (stats.latestPublished && warsawDayKey(stats.latestPublished)) ||
    warsawDayKey(new Date().toISOString())!;
  const dayKeys = lastDayKeys(anchorDay, 14);
  const windowStartIso = warsawDayBoundsUtc(dayKeys[0]).from;
  const rhythmRows = dbRepo.getPublicationRhythmRows(windowStartIso);
  const dailyBuckets = buildDailyRhythm(rhythmRows, dayKeys);
  const topPublishers = dbRepo.getTopPublishers(windowStartIso, 6);

  const officialSeries = dailyBuckets.map((b) => b.official);
  const laborSeries = dailyBuckets.map((b) => b.labor);
  const externalSeries = dailyBuckets.map((b) => b.external);
  const eventSparksSeries = events
    .slice(0, 10)
    .reverse()
    .map((e) => Math.round(e.sparks_score));

  const featuredEventMeta =
    events.find((e) => e.id === "evt_cluster_upstream_norway_lng") || events[0];
  const featuredEvent = featuredEventMeta ? dbRepo.getEventById(featuredEventMeta.id) : null;

  return (
    <div className="space-y-8">
      {/* Pasek statusowy na górze strony */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Centrum sytuacyjne i radar wywiadowczy Grupy ORLEN
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Zintegrowany obraz komunikatów wewnętrznych, aktywności związkowej oraz publikacji w mediach zewnętrznych wg godziny ich ukazania się.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/stream"
            className="bg-[#07162c] hover:bg-[#0b2140] px-3.5 py-2 rounded-xl border border-cyan-500/30 hover:border-cyan-400/60 flex items-center gap-2 shadow-sm transition-all"
          >
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-200">
              Najnowsza publikacja:{" "}
              <strong className="text-cyan-300 font-mono">
                {stats.latestPublished
                  ? formatPublicationTime(stats.latestPublished)
                  : "Brak danych"}
              </strong>
            </span>
          </Link>

          <Link
            href="/alerts"
            className="bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/45 px-3.5 py-2 rounded-xl flex items-center gap-2 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.2)] transition-all"
          >
            <Flame className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-semibold">
              Alerty wczesnego ostrzegania: <strong>{stats.activeAlerts}</strong>
            </span>
          </Link>
        </div>
      </div>

      {/* 4 klikalne karty analityczne z wykresami przebiegu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <Link
          href={streamHref({ channel: "official" })}
          className="group bg-gradient-to-br from-[#081a34] via-[#061326] to-[#040c18] p-5 rounded-2xl border border-cyan-400/35 hover:border-cyan-300 shadow-[0_8px_30px_rgba(0,0,0,0.45)] hover:shadow-[0_0_28px_rgba(0,229,255,0.25)] flex flex-col justify-between relative overflow-hidden transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-cyan-300">
            <span className="text-xs font-semibold tracking-wide">
              Oficjalne komunikaty ORLEN
            </span>
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <div className="text-3xl font-bold font-mono text-white drop-shadow-[0_0_12px_rgba(0,229,255,0.25)]">
                {stats.officialDocs}
              </div>
              <div className="text-[11px] text-slate-300 mt-1.5">
                Biuro Prasowe ORLEN S.A., raporty ESPI, Energa i OSGE
              </div>
            </div>
            <Sparkline values={officialSeries} stroke={CHANNEL_THEME.official.fill} />
          </div>

          <div className="mt-3 pt-2.5 border-t border-cyan-500/20 flex items-center justify-between text-[11px] font-semibold text-cyan-300 group-hover:text-white">
            <span>Otwórz komunikaty ORLEN</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </Link>

        <Link
          href={streamHref({ channel: "labor" })}
          className="group bg-gradient-to-br from-[#1c1508] via-[#12100c] to-[#060c18] p-5 rounded-2xl border border-amber-400/35 hover:border-amber-300 shadow-[0_8px_30px_rgba(0,0,0,0.45)] hover:shadow-[0_0_28px_rgba(251,191,36,0.22)] flex flex-col justify-between relative overflow-hidden transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-xs font-semibold tracking-wide">
              Sygnały związkowe i załogi
            </span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <div className="text-3xl font-bold font-mono text-amber-300">
                {stats.laborSignalDocs}
              </div>
              <div className="text-[11px] text-slate-300 mt-1.5">
                NSZZ „Solidarność”, MZZPRC, spory zbiorowe i BHP
              </div>
            </div>
            <Sparkline values={laborSeries} stroke={CHANNEL_THEME.labor.fill} />
          </div>

          <div className="mt-3 pt-2.5 border-t border-amber-500/20 flex items-center justify-between text-[11px] font-semibold text-amber-300 group-hover:text-white">
            <span>Otwórz sygnały związkowe</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </Link>

        <Link
          href={streamHref({ channel: "external" })}
          className="group bg-gradient-to-br from-[#0a1632] via-[#071126] to-[#040b18] p-5 rounded-2xl border border-indigo-400/35 hover:border-indigo-300 shadow-[0_8px_30px_rgba(0,0,0,0.45)] hover:shadow-[0_0_28px_rgba(129,140,248,0.25)] flex flex-col justify-between relative overflow-hidden transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-indigo-300">
            <span className="text-xs font-semibold tracking-wide">
              Publikacje w mediach zewnętrznych
            </span>
            <Newspaper className="w-4 h-4 text-indigo-400" />
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <div className="text-3xl font-bold font-mono text-indigo-200">
                {stats.externalDocs}
              </div>
              <div className="text-[11px] text-slate-300 mt-1.5">
                Prasa ogólnopolska, portale energetyczne i media lokalne
              </div>
            </div>
            <Sparkline values={externalSeries} stroke={CHANNEL_THEME.external.fill} />
          </div>

          <div className="mt-3 pt-2.5 border-t border-indigo-500/20 flex items-center justify-between text-[11px] font-semibold text-indigo-300 group-hover:text-white">
            <span>Otwórz publikacje prasowe</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </Link>

        <Link
          href="/events"
          className="group bg-gradient-to-br from-[#1f0a14] via-[#140812] to-[#060b16] p-5 rounded-2xl border border-rose-500/35 hover:border-rose-400 shadow-[0_8px_30px_rgba(0,0,0,0.45)] hover:shadow-[0_0_28px_rgba(244,63,94,0.25)] flex flex-col justify-between relative overflow-hidden transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-rose-300">
            <span className="text-xs font-semibold tracking-wide">
              Wykryte ogniska i tematy
            </span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <div className="text-3xl font-bold font-mono text-rose-400">
                {stats.totalEvents}{" "}
                <span className="text-xs font-normal text-slate-300">
                  ({stats.activeAlerts} pilnych)
                </span>
              </div>
              <div className="text-[11px] text-slate-300 mt-1.5">
                Ciągły monitoring {stats.activeSources} aktywnych kanałów informacyjnych
              </div>
            </div>
            <Sparkline values={eventSparksSeries} stroke="oklch(0.68 0.22 20)" />
          </div>

          <div className="mt-3 pt-2.5 border-t border-rose-500/20 flex items-center justify-between text-[11px] font-semibold text-rose-300 group-hover:text-white">
            <span>Otwórz oś ognisk i kryzysów</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </Link>
      </div>

      {/* 14-dniowy rytm publikacji oraz najaktywniejsze redakcje */}
      <PublicationRhythmPanel
        buckets={dailyBuckets}
        topPublishers={topPublishers}
        windowStartIso={windowStartIso}
      />

      {/* Graficzna, animowana ścieżka od komunikatu do publikacji prasowych */}
      {featuredEvent && featuredEvent.documents.length > 0 && (
        <div className="bg-gradient-to-b from-[#07162c]/95 to-[#040d1a]/95 rounded-2xl border border-cyan-400/40 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.55)] space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-cyan-500/20 pb-4">
            <div>
              <div className="flex items-center gap-2 text-cyan-300 text-xs font-mono uppercase tracking-wider mb-1">
                <GitFork className="w-4 h-4 text-cyan-400" />
                Ścieżka przenikania informacji (Komunikat → Publikacje prasowe)
              </div>
              <Link
                href={`/events/${featuredEvent.id}`}
                className="text-base font-bold text-white hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5"
              >
                <span>{featuredEvent.title}</span>
                <ArrowUpRight className="w-4 h-4 text-cyan-400" />
              </Link>
            </div>
            <div className="flex items-center gap-2 self-start lg:self-center">
              <Link
                href={`/events/${featuredEvent.id}`}
                className="px-3.5 py-2 rounded-xl bg-surface-muted hover:bg-cyan-950/70 border border-cyan-500/30 text-xs text-slate-200 hover:text-white font-semibold transition-all"
              >
                Oś czasu tego tematu
              </Link>
              <Link
                href="/diffusion"
                className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-xs text-cyan-200 hover:text-white flex items-center gap-1.5 font-semibold transition-all"
              >
                Wszystkie ścieżki ({events.length}) <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <DiffusionFlowGraph documents={featuredEvent.documents} maxNodes={4} />
        </div>
      )}

      {/* Synchronizowany rozdział: Komunikacja Wewnętrzna i Korporacyjna vs Media Zewnętrzne */}
      <DualCommunicationZone
        officialDocs={officialDocs}
        laborDocs={laborDocs}
        mediaDocs={externalMediaDocs}
      />

      {/* Dolna sekcja: Wątki tematyczne (Sparks Index) oraz Alerty Kryzysowe */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lewa kolumna: Zagregowane wątki */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Monitorowane wątki tematyczne i wskaźnik napięcia (Sparks Score)
            </h3>
            <Link
              href="/events"
              className="text-xs text-cyan-300 hover:text-white flex items-center gap-1 font-medium"
            >
              Pełna lista ({events.length}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {events.slice(0, 6).map((evt) => (
              <Link
                key={evt.id}
                href={`/events/${evt.id}`}
                className="block bg-surface/90 hover:bg-surface-muted transition-all p-4 rounded-2xl border border-surface-border hover:border-cyan-400/50 shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono uppercase bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 px-2 py-0.5 rounded">
                        {formatEventStage(evt.event_stage)}
                      </span>
                      {evt.has_orlen_responded ? (
                        <span className="text-[10px] font-mono uppercase bg-emerald-950/80 border border-emerald-400/40 text-emerald-200 px-2 py-0.5 rounded">
                          Wydano oficjalny komunikat ORLEN
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono uppercase bg-slate-800/90 border border-white/10 text-slate-300 px-2 py-0.5 rounded">
                          Tylko doniesienia zewnętrzne
                        </span>
                      )}
                      <span className="text-[11px] text-slate-300 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        Ostatnia publikacja: {formatPublicationTime(evt.last_signal_at)}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{evt.title}</h4>
                    {evt.summary && (
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{evt.summary}</p>
                    )}
                  </div>

                  <div className="text-right flex flex-col items-end flex-shrink-0 bg-[#040b16] px-3 py-2 rounded-xl border border-white/10">
                    <div className="text-[9px] uppercase font-mono text-slate-400">Napięcie</div>
                    <div
                      className={`text-xl font-bold font-mono ${
                        evt.sparks_score >= 60
                          ? "text-rose-400"
                          : evt.sparks_score >= 40
                          ? "text-amber-300"
                          : "text-emerald-400"
                      }`}
                    >
                      {evt.sparks_score.toFixed(0)}
                      <span className="text-xs text-slate-500">/100</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Prawa kolumna: Alerty Wczesnego Ostrzegania */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Aktywne alerty wczesnego ostrzegania
            </h3>
            <Link
              href="/alerts"
              className="text-xs text-rose-300 hover:text-white flex items-center gap-1 font-medium"
            >
              Wszystkie ({alerts.length}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => {
              const targetHref = alert.event_id ? `/events/${alert.event_id}` : "/alerts";
              return (
                <Link
                  key={alert.id}
                  href={targetHref}
                  className="group block bg-gradient-to-br from-rose-950/30 via-[#120914] to-[#060c18] border border-rose-500/35 hover:border-rose-400 p-4 rounded-2xl space-y-2 shadow-md transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase bg-rose-500/20 border border-rose-500/40 text-rose-200 px-2 py-0.5 rounded font-bold">
                      Poziom: {alert.severity === "critical" ? "Krytyczny" : "Podwyższony"}
                    </span>
                    <span className="text-[11px] text-slate-300 font-mono">
                      {formatPublicationTime(alert.created_at)}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-rose-200 leading-snug flex items-center justify-between gap-2">
                    <span>{alert.title}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">{alert.message}</p>
                  {alert.evidence_list && alert.evidence_list.length > 0 && (
                    <div className="pt-2 border-t border-rose-500/20 text-[10px] text-rose-200/80 truncate">
                      Źródło: {alert.evidence_list[0]}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
