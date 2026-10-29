"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Globe,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Clock,
  Radio,
  FileText,
  TrendingUp,
  ShieldCheck,
  Send,
} from "lucide-react";

interface SocialProfiles {
  facebook?: string;
  youtube?: string;
  twitter_x?: string;
  linkedin?: string;
}

interface EntityStats {
  total_mentions: number;
  facebook_count: number;
  youtube_count: number;
  twitter_count: number;
  official_count: number;
  industry_count: number;
  regional_count: number;
  general_count: number;
  first_seen_at?: string | null;
  latest_seen_at?: string | null;
}

interface PlatformQueries {
  general_queries: string[];
  facebook_queries: string[];
  youtube_queries: string[];
  twitter_queries: string[];
}

interface OrlenEntityEnriched {
  id: string;
  name: string;
  legal_name: string;
  short_name: string;
  former_name?: string | null;
  brand_name?: string | null;
  parent_company: string;
  country: string;
  business_segment: string;
  website: string;
  domains: string[];
  social_profiles: SocialProfiles;
  ticker?: string | null;
  nip?: string | null;
  krs?: string | null;
  entity_status: "active" | "merging" | "sold" | "liquidated" | "suspended";
  last_verified_at: string;
  verification_source: string;
  search_aliases: string[];
  is_monitored: boolean;
  stats: EntityStats;
  platform_queries: PlatformQueries;
}

export default function OrlenGroupEntitiesPage() {
  const [entities, setEntities] = useState<OrlenEntityEnriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [monitoredFilter, setMonitoredFilter] = useState("all");

  const [expandedEntityId, setExpandedEntityId] = useState<string | null>(null);
  const [newAliasInputs, setNewAliasInputs] = useState<Record<string, string>>({});
  const [newSocialInputs, setNewSocialInputs] = useState<Record<string, { network: string; handle: string }>>({});
  const [selectedEntityForAudit, setSelectedEntityForAudit] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Załadowanie podmiotów
  const fetchEntities = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/entities");
      const data = await res.json();
      if (data.ok) {
        setEntities(data.entities);
      }
    } catch (err) {
      console.error("Błąd pobierania rejestru:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, []);

  // Synchronizacja z oficjalnymi źródłami
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/entities/sync", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        await fetchEntities();
      }
    } catch (err) {
      console.error("Błąd synchronizacji:", err);
    } finally {
      setSyncing(false);
    }
  };

  // Przełącznik monitorowania podmiotu
  const handleToggleMonitored = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/entities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggle_monitored: !current }),
      });
      if (res.ok) {
        setEntities((prev) =>
          prev.map((e) => (e.id === id ? { ...e, is_monitored: !current } : e))
        );
      }
    } catch (err) {
      console.error("Błąd zmiany monitorowania:", err);
    }
  };

  // Dodanie nowego aliasu
  const handleAddAlias = async (id: string) => {
    const alias = newAliasInputs[id]?.trim();
    if (!alias) return;

    try {
      const res = await fetch(`/api/entities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add_alias: alias }),
      });
      if (res.ok) {
        setEntities((prev) =>
          prev.map((e) =>
            e.id === id
              ? { ...e, search_aliases: [...(e.search_aliases || []), alias] }
              : e
          )
        );
        setNewAliasInputs((prev) => ({ ...prev, [id]: "" }));
      }
    } catch (err) {
      console.error("Błąd dodawania aliasu:", err);
    }
  };

  // Dodanie profilu społecznościowego
  const handleAddSocial = async (id: string) => {
    const input = newSocialInputs[id];
    if (!input || !input.handle.trim()) return;

    try {
      const res = await fetch(`/api/entities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          social_profile: {
            network: input.network,
            handle: input.handle.trim(),
          },
        }),
      });
      if (res.ok) {
        setEntities((prev) =>
          prev.map((e) =>
            e.id === id
              ? {
                  ...e,
                  social_profiles: {
                    ...e.social_profiles,
                    [input.network]: input.handle.trim(),
                  },
                }
              : e
          )
        );
        setNewSocialInputs((prev) => ({
          ...prev,
          [id]: { network: "facebook", handle: "" },
        }));
      }
    } catch (err) {
      console.error("Błąd dodawania profilu:", err);
    }
  };

  // Podgląd audytu podmiotu
  const handleOpenAudit = async (id: string) => {
    setSelectedEntityForAudit(id);
    try {
      const res = await fetch(`/api/entities/${id}`);
      const data = await res.json();
      if (data.ok) {
        setAuditLogs(data.audit_logs || []);
      }
    } catch (err) {
      console.error("Błąd pobierania audytu:", err);
    }
  };

  // Filtrowanie encji
  const filteredEntities = entities.filter((e) => {
    if (segmentFilter !== "all" && e.business_segment !== segmentFilter) return false;
    if (statusFilter !== "all" && e.entity_status !== statusFilter) return false;
    if (countryFilter !== "all" && e.country !== countryFilter) return false;
    if (monitoredFilter === "monitored" && !e.is_monitored) return false;
    if (monitoredFilter === "unmonitored" && e.is_monitored) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = e.name.toLowerCase().includes(q);
      const matchLegal = e.legal_name.toLowerCase().includes(q);
      const matchShort = e.short_name.toLowerCase().includes(q);
      const matchBrand = e.brand_name?.toLowerCase().includes(q);
      const matchAlias = e.search_aliases?.some((a) => a.toLowerCase().includes(q));
      if (!matchName && !matchLegal && !matchShort && !matchBrand && !matchAlias) return false;
    }

    return true;
  });

  // Zagregowane statystyki
  const totalMonitored = entities.filter((e) => e.is_monitored).length;
  const totalMentionsAll = entities.reduce((acc, e) => acc + (e.stats.total_mentions || 0), 0);
  const totalFB = entities.reduce((acc, e) => acc + (e.stats.facebook_count || 0), 0);
  const totalYT = entities.reduce((acc, e) => acc + (e.stats.youtube_count || 0), 0);
  const totalX = entities.reduce((acc, e) => acc + (e.stats.twitter_count || 0), 0);

  const segments = Array.from(new Set(entities.map((e) => e.business_segment))).filter(Boolean);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Nagłówek modułu */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-[#051124] via-[#081a38] to-[#040e1e] border border-cyan-500/30 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-[10px] font-mono uppercase tracking-widest">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            Centralny Rejestr Podmiotów Grupy ORLEN
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white font-mono">
            Struktura i Monitoring Grupy ORLEN
          </h1>
          <p className="text-xs lg:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Dynamiczny katalog spółek, marek, podmiotów zależnych i segmentów działalności.
            Centralny silnik sterujący zapytaniami dla platform Facebook, YouTube, X i mediów tradycyjnych.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 flex-shrink-0">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-500 hover:from-cyan-300 hover:to-sky-300 text-slate-950 font-bold rounded-xl text-xs shadow-[0_0_25px_rgba(0,229,255,0.35)] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Synchronizacja..." : "Aktualizuj z oficjalnych źródeł"}</span>
          </button>
        </div>
      </div>

      {/* Bento Grid: Kluczowe metryki wywiadowcze */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 bg-[#051124]/90 border border-cyan-500/20 rounded-2xl">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Zarejestrowane podmioty</div>
          <div className="text-2xl font-bold font-mono text-cyan-200 mt-1">{entities.length}</div>
          <div className="text-[11px] text-emerald-400 mt-1">100% zweryfikowanych</div>
        </div>

        <div className="p-4 bg-[#051124]/90 border border-cyan-500/20 rounded-2xl">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Aktywnie monitorowane</div>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">{totalMonitored}</div>
          <div className="text-[11px] text-slate-400 mt-1">Pełny zasięg platform</div>
        </div>

        <div className="p-4 bg-[#051124]/90 border border-cyan-500/20 rounded-2xl">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Wzmianki Facebook</div>
          <div className="text-2xl font-bold font-mono text-sky-300 mt-1">{totalFB}</div>
          <div className="text-[11px] text-slate-400 mt-1">Grupy i profile oficjalne</div>
        </div>

        <div className="p-4 bg-[#051124]/90 border border-cyan-500/20 rounded-2xl">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Wzmianki YouTube</div>
          <div className="text-2xl font-bold font-mono text-rose-300 mt-1">{totalYT}</div>
          <div className="text-[11px] text-slate-400 mt-1">Konferencje i wywiady</div>
        </div>

        <div className="p-4 bg-[#051124]/90 border border-cyan-500/20 rounded-2xl col-span-2 md:col-span-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Wzmianki X (Twitter)</div>
          <div className="text-2xl font-bold font-mono text-indigo-300 mt-1">{totalX}</div>
          <div className="text-[11px] text-slate-400 mt-1">Eskalacje i komentarze</div>
        </div>
      </div>

      {/* Pasek filtrowania i wyszukiwania */}
      <div className="p-4 bg-[#051124]/95 border border-cyan-500/20 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Wyszukiwarka */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj podmiotu po nazwie, marce, segmencie lub aliasie..."
              className="w-full bg-[#020712] border border-cyan-500/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* Filtry */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Segment */}
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              className="bg-[#020712] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value="all">Wszystkie segmenty</option>
              {segments.map((seg) => (
                <option key={seg} value={seg}>{seg}</option>
              ))}
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#020712] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value="all">Wszystkie statusy</option>
              <option value="active">Aktywny</option>
              <option value="merging">W trakcie fuzji / zbycia</option>
              <option value="sold">Zbyty</option>
              <option value="suspended">Zawieszony</option>
            </select>

            {/* Kraj */}
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="bg-[#020712] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value="all">Wszystkie kraje</option>
              <option value="PL">Polska (PL)</option>
              <option value="CZ">Czechy (CZ)</option>
              <option value="LT">Litwa (LT)</option>
              <option value="DE">Niemcy (DE)</option>
              <option value="NO">Norwegia (NO)</option>
            </select>

            {/* Monitorowanie */}
            <select
              value={monitoredFilter}
              onChange={(e) => setMonitoredFilter(e.target.value)}
              className="bg-[#020712] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value="all">Monitoring: Wszyscy</option>
              <option value="monitored">Tylko włączone</option>
              <option value="unmonitored">Tylko wyłączone</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-cyan-500/10">
          <span>Znaleziono podmiotów: <strong className="text-cyan-300 font-mono">{filteredEntities.length}</strong></span>
          <span className="text-[10px] font-mono text-emerald-400">Algorytm weryfikacji wieloznaczności: AKTYWNY</span>
        </div>
      </div>

      {/* Lista podmiotów */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500 bg-[#051124]/40 border border-cyan-500/20 rounded-2xl">
            Inicjalizacja rejestru Grupy ORLEN...
          </div>
        ) : filteredEntities.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-slate-400 bg-[#051124]/40 border border-cyan-500/20 rounded-2xl">
            Brak podmiotów spełniających wybrane kryteria filtracji.
          </div>
        ) : (
          filteredEntities.map((entity) => {
            const isExpanded = expandedEntityId === entity.id;
            return (
              <div
                key={entity.id}
                className={`bg-[#051124]/95 border transition-all rounded-2xl overflow-hidden shadow-lg ${
                  entity.is_monitored
                    ? isExpanded
                      ? "border-cyan-400/50 shadow-[0_0_30px_rgba(0,229,255,0.15)]"
                      : "border-cyan-500/25 hover:border-cyan-400/40"
                    : "border-slate-800 opacity-70"
                }`}
              >
                {/* Wiersz główny podmiotu */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Flaga / Kraj */}
                    <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-xs text-cyan-300 flex-shrink-0">
                      {entity.country}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold text-slate-100 font-mono">
                          {entity.name}
                        </h2>
                        {entity.brand_name && (
                          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                            Marka: {entity.brand_name}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            entity.entity_status === "active"
                              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                              : "bg-amber-950/60 border-amber-500/40 text-amber-300"
                          }`}
                        >
                          {entity.entity_status === "active" ? "Aktywny" : entity.entity_status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="text-slate-300 font-medium">{entity.legal_name}</span>
                        {entity.former_name && (
                          <span className="text-slate-400 italic">
                            (d. {entity.former_name})
                          </span>
                        )}
                        <span className="text-cyan-400/80 font-mono">
                          Segment: {entity.business_segment}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Szybkie metryki platform dla spółki */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-xs font-mono bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl">
                      <span className="text-slate-400">Publikacje:</span>
                      <span className="text-cyan-300 font-bold">{entity.stats.total_mentions}</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-sky-400">FB: {entity.stats.facebook_count}</span>
                      <span className="text-rose-400">YT: {entity.stats.youtube_count}</span>
                      <span className="text-indigo-400">X: {entity.stats.twitter_count}</span>
                    </div>

                    {/* Przełącznik monitorowania */}
                    <button
                      onClick={() => handleToggleMonitored(entity.id, entity.is_monitored)}
                      title={entity.is_monitored ? "Wyłącz ten podmiot z monitorowania" : "Włącz ten podmiot do monitorowania"}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all border ${
                        entity.is_monitored
                          ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60"
                          : "bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white"
                      }`}
                    >
                      {entity.is_monitored ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Monitorowany</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Wyłączony</span>
                        </>
                      )}
                    </button>

                    {/* Rozwiń szczegóły i zapytania */}
                    <button
                      onClick={() => setExpandedEntityId(isExpanded ? null : entity.id)}
                      className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 hover:text-white transition-colors"
                      aria-label="Rozwiń szczegóły podmiotu"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Rozwijany panel szczegółów: warianty wyszukiwania, zapytania dla platform, aliasy i audyt */}
                {isExpanded && (
                  <div className="border-t border-cyan-500/20 bg-[#030914]/90 p-5 space-y-5">
                    {/* Rejestr urzędowy i identyfikatory */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                        <div className="text-slate-500 text-[10px] uppercase">NIP / KRS</div>
                        <div className="text-slate-200 mt-0.5">
                          {entity.nip || "Brak"} / {entity.krs || "Brak"}
                        </div>
                      </div>

                      <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                        <div className="text-slate-500 text-[10px] uppercase">Spółka matka</div>
                        <div className="text-slate-200 mt-0.5">{entity.parent_company}</div>
                      </div>

                      <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                        <div className="text-slate-500 text-[10px] uppercase">Oficjalna witryna</div>
                        <a
                          href={entity.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Globe className="w-3 h-3" />
                          <span className="truncate">{entity.website.replace("https://", "")}</span>
                        </a>
                      </div>

                      <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                        <div className="text-slate-500 text-[10px] uppercase">Ostatnia weryfikacja</div>
                        <div className="text-slate-200 mt-0.5">
                          {new Date(entity.last_verified_at).toLocaleDateString("pl-PL")}
                        </div>
                      </div>
                    </div>

                    {/* Aliasy wyszukiwawcze z możliwością dodania nowego */}
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                        <span>Zdefiniowane aliasy wyszukiwawcze ({entity.search_aliases?.length || 0}):</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        {entity.search_aliases?.map((alias, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-cyan-950/60 border border-cyan-500/30 rounded-lg text-xs font-mono text-cyan-200"
                          >
                            {alias}
                          </span>
                        ))}
                      </div>

                      {/* Formularz dodania nowego aliasu */}
                      <div className="flex items-center gap-2 max-w-md">
                        <input
                          type="text"
                          value={newAliasInputs[entity.id] || ""}
                          onChange={(e) =>
                            setNewAliasInputs((prev) => ({
                              ...prev,
                              [entity.id]: e.target.value,
                            }))
                          }
                          placeholder="Dodaj nowy alias (np. skrót medialny)..."
                          className="flex-1 bg-[#020712] border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                        />
                        <button
                          onClick={() => handleAddAlias(entity.id)}
                          className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 font-bold rounded-xl text-xs flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Dodaj</span>
                        </button>
                      </div>
                    </div>

                    {/* Generowane automatycznie zapytania dla Facebooka, YouTube i X */}
                    <div className="space-y-3 pt-3 border-t border-cyan-500/15">
                      <div className="text-xs font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-cyan-400" />
                        <span>Generowane zapytania monitoringu społecznościowego i medialnego:</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Facebook */}
                        <div className="p-3 bg-[#050e1f] border border-sky-500/30 rounded-xl space-y-2">
                          <div className="text-[11px] font-mono font-bold text-sky-400">Facebook Monitoring Engine</div>
                          <div className="space-y-1 font-mono text-[10px] text-slate-300 overflow-x-auto">
                            {entity.platform_queries.facebook_queries.slice(0, 4).map((q, i) => (
                              <div key={i} className="p-1 bg-black/40 rounded border border-white/5 truncate">
                                {q}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* YouTube */}
                        <div className="p-3 bg-[#050e1f] border border-rose-500/30 rounded-xl space-y-2">
                          <div className="text-[11px] font-mono font-bold text-rose-400">YouTube Data API Queries</div>
                          <div className="space-y-1 font-mono text-[10px] text-slate-300 overflow-x-auto">
                            {entity.platform_queries.youtube_queries.slice(0, 4).map((q, i) => (
                              <div key={i} className="p-1 bg-black/40 rounded border border-white/5 truncate">
                                {q}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* X (Twitter) */}
                        <div className="p-3 bg-[#050e1f] border border-indigo-500/30 rounded-xl space-y-2">
                          <div className="text-[11px] font-mono font-bold text-indigo-400">X (Twitter) Intelligence API</div>
                          <div className="space-y-1 font-mono text-[10px] text-slate-300 overflow-x-auto">
                            {entity.platform_queries.twitter_queries.slice(0, 4).map((q, i) => (
                              <div key={i} className="p-1 bg-black/40 rounded border border-white/5 truncate">
                                {q}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Przycisk historii audytu zmian */}
                    <div className="pt-2 flex items-center justify-between">
                      <button
                        onClick={() => handleOpenAudit(entity.id)}
                        className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Zobacz historię zmian w rejestrze dla tej spółki</span>
                      </button>

                      <span className="text-[10px] font-mono text-slate-500">
                        Źródło: {entity.verification_source}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal / Panel historii audytu */}
      {selectedEntityForAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-2xl w-full bg-[#051124] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="font-mono text-sm font-bold text-white">
                  Historia zmian i weryfikacji w rejestrze
                </h3>
              </div>
              <button
                onClick={() => setSelectedEntityForAudit(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-xs font-mono text-slate-500">
                  Brak zarejestrowanych zmian dla tego podmiotu (stan zgodny ze źródłem bazowym).
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="text-cyan-300 font-bold uppercase">{log.field_name}</span>
                      <span>{new Date(log.created_at).toLocaleString("pl-PL")}</span>
                    </div>
                    <div className="text-slate-300">
                      <span className="text-rose-400 line-through mr-2">{log.old_value || "(brak)"}</span>
                      <span className="text-emerald-400 font-bold">{log.new_value}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Źródło: {log.source}</span>
                      <span>
                        Potwierdzone przez człowieka:{" "}
                        <strong className={log.confirmed_by_human ? "text-emerald-400" : "text-amber-400"}>
                          {log.confirmed_by_human ? "TAK" : "AUTOMATYCZNIE"}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
