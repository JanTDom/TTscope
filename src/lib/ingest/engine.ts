import { createHash } from "node:crypto";
import { dbRepo } from "../db";
import type { Document, Source, SourceFetchRun } from "../db/types";
import { parseRssOrAtom, type ParsedFeedItem } from "./parser";
import { scrapeOrlenNewsroom } from "./orlen-scraper";

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (TTscope-OSINT-Bot/1.0; +https://ttscope.local)";
const FETCH_TIMEOUT_MS = 12000;

export interface IngestRunResult {
  source_id: string;
  source_name: string;
  status: "success" | "partial" | "failed" | "skipped_needs_key";
  items_found: number;
  items_new: number;
  error?: string | null;
}

export function detectFacilityLocation(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes("płock") || lower.includes("plock") || lower.includes("olefiny")) return "Płock";
  if (lower.includes("gdańsk") || lower.includes("gdansk") || lower.includes("lotos")) return "Gdańsk";
  if (lower.includes("włocławek") || lower.includes("wloclawek") || lower.includes("anwil")) return "Włocławek";
  if (lower.includes("trzebinia") || lower.includes("trzebini")) return "Trzebinia";
  if (lower.includes("jedlicze") || lower.includes("jedliczu")) return "Jedlicze";
  if (lower.includes("ostrołęk") || lower.includes("ostrolek") || lower.includes("energa")) return "Ostrołęka";
  if (lower.includes("litvínov") || lower.includes("litvinov") || lower.includes("unipetrol")) return "Litvínov (Czechy)";
  if (lower.includes("możejk") || lower.includes("mazeikiai") || lower.includes("lietuva")) return "Możejki (Litwa)";
  return null;
}

export function isLaborSignal(text: string): boolean {
  const lower = text.toLowerCase();
  const laborKeywords = [
    "związk",
    "solidarność",
    "solidarnosc",
    "mzzprc",
    "spór zbiorowy",
    "spor zbiorowy",
    "płac",
    "podwyżk",
    "wynagrodzen",
    "załog",
    "pracownik",
    "strajk",
    "referendum",
    "postulaty",
    "bhp",
    "inspekcj",
    "zwolnien",
    "układ zbiorowy",
  ];
  return laborKeywords.some((kw) => lower.includes(kw));
}

export function isLocalSignal(text: string): boolean {
  const lower = text.toLowerCase();
  const localKeywords = [
    "smród",
    "zapach",
    "odór",
    "flara",
    "pochodnia",
    "dym",
    "hałas",
    "mieszkańc",
    "prezydent miasta",
    "radni",
    "protest",
    "samorząd",
    "skażeni",
    "ewakuacj",
    "wioś",
    "straż pożarn",
    "awari",
  ];
  return localKeywords.some((kw) => lower.includes(kw));
}

export function isOrlenRelated(title: string, content: string, source: Source): boolean {
  if (source.category === "official_orlen") return true;

  const combined = (title + " " + content).toLowerCase();
  const orlenKeywords = [
    "orlen",
    "pkn",
    "lotos",
    "pgnig",
    "anwil",
    "energa",
    "unipetrol",
    "olefiny",
    "rafineri",
    "obajtek",
    "fąfara",
    "fafara",
    "paliw",
    "stacja benzynowa",
    "stacje paliw",
    "biorafiner",
    "baltic power",
    "osge",
    "mzzprc",
  ];

  return orlenKeywords.some((kw) => combined.includes(kw));
}

export async function ingestSource(source: Source): Promise<IngestRunResult> {
  const startedAt = new Date().toISOString();
  const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Obsługa źródeł wymagających klucza API, którego brak w środowisku
  if (source.requires_api_key) {
    const keyEnvName = source.api_key_name || "";
    const keyVal = keyEnvName ? process.env[keyEnvName] : null;

    if (!keyVal) {
      const errMsg = `Źródło wymaga klucza API (${keyEnvName}), który nie został skonfigurowany w zmiennych środowiskowych.`;
      dbRepo.upsertSourceConnector({
        id: `conn_${source.id}`,
        source_id: source.id,
        connector_type: source.category === "social_media" ? "api_connector" : "unknown",
        is_configured: false,
        last_attempt_at: startedAt,
        last_error: errMsg,
      });

      dbRepo.recordFetchRun({
        id: runId,
        source_id: source.id,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        status: "failed",
        http_status: 401,
        items_found: 0,
        items_new: 0,
        error_message: errMsg,
        created_at: startedAt,
      });

      return {
        source_id: source.id,
        source_name: source.name,
        status: "skipped_needs_key",
        items_found: 0,
        items_new: 0,
        error: errMsg,
      };
    }
  }

  // 2. Dedykowany Scraper dla oficjalnego Newsroomu ORLEN S.A.
  if (source.id === "src_orlen_newsroom") {
    try {
      const items = await scrapeOrlenNewsroom();
      let itemsNew = 0;

      for (const item of items) {
        const combinedText = item.title + " " + item.content;
        const contentHash = createHash("sha256")
          .update(item.title.trim().toLowerCase() + "\n" + item.content.trim().slice(0, 1000))
          .digest("hex");

        const doc: Document = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          source_id: source.id,
          title: item.title,
          url: item.link,
          canonical_url: item.link,
          source_name: source.name,
          author: item.author || "Biuro Prasowe ORLEN S.A.",
          published_at: item.pubDate || new Date().toISOString(),
          fetched_at: new Date().toISOString(),
          content: item.content,
          excerpt: item.excerpt || null,
          language: "pl",
          source_type: "official_orlen",
          content_hash: contentHash,
          processing_status: "parsed",
          licensing_status: "fair_use_public_osint",
          error_info: null,
          facility_location: detectFacilityLocation(combinedText) || "Płock",
          is_orlen_official: true,
          is_labor_signal: isLaborSignal(combinedText),
          is_local_signal: isLocalSignal(combinedText),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { isNew } = dbRepo.insertDocument(doc);
        if (isNew) itemsNew++;
      }

      const finishedAt = new Date().toISOString();
      dbRepo.recordFetchRun({
        id: runId,
        source_id: source.id,
        started_at: startedAt,
        finished_at: finishedAt,
        status: "success",
        http_status: 200,
        items_found: items.length,
        items_new: itemsNew,
        error_message: null,
        created_at: startedAt,
      });

      dbRepo.upsertSourceConnector({
        id: `conn_${source.id}`,
        source_id: source.id,
        connector_type: "html_cheerio",
        is_configured: true,
        last_success_at: finishedAt,
        last_attempt_at: finishedAt,
        last_error: null,
      });

      return {
        source_id: source.id,
        source_name: source.name,
        status: "success",
        items_found: items.length,
        items_new: itemsNew,
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Błąd scrapowania newsroomu ORLEN";
      return {
        source_id: source.id,
        source_name: source.name,
        status: "failed",
        items_found: 0,
        items_new: 0,
        error: errMsg,
      };
    }
  }

  // 3. Pobieranie z kanału RSS/Atom
  const targetUrl = source.feed_url || source.url;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/rss+xml, application/atom+xml, text/xml, application/xml, text/html;q=0.9",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errMsg = `Błąd HTTP ${response.status} (${response.statusText}) podczas pobierania ze źródła`;
      dbRepo.recordFetchRun({
        id: runId,
        source_id: source.id,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        status: "failed",
        http_status: response.status,
        items_found: 0,
        items_new: 0,
        error_message: errMsg,
        created_at: startedAt,
      });

      dbRepo.upsertSourceConnector({
        id: `conn_${source.id}`,
        source_id: source.id,
        connector_type: "rss_atom",
        is_configured: true,
        last_attempt_at: startedAt,
        last_error: errMsg,
      });

      return {
        source_id: source.id,
        source_name: source.name,
        status: "failed",
        items_found: 0,
        items_new: 0,
        error: errMsg,
      };
    }

    const xmlText = await response.text();
    const items = parseRssOrAtom(xmlText);

    let itemsNew = 0;
    let itemsFound = items.length;

    for (const item of items) {
      // Filtracja domenowa – czy artykuł dotyczy Orlenu lub pochodzi z oficjalnego biura Orlenu
      if (!isOrlenRelated(item.title, item.content, source)) {
        continue;
      }

      const combinedText = item.title + " " + item.content;
      const contentHash = createHash("sha256")
        .update(item.title.trim().toLowerCase() + "\n" + item.content.trim().slice(0, 1000))
        .digest("hex");

      const doc: Document = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        source_id: source.id,
        title: item.title,
        url: item.link,
        canonical_url: item.link,
        source_name: source.name,
        author: item.author || null,
        published_at: item.pubDate || null,
        fetched_at: new Date().toISOString(),
        content: item.content,
        excerpt: item.excerpt || null,
        language: "pl",
        source_type: source.category,
        content_hash: contentHash,
        processing_status: "parsed",
        licensing_status: "fair_use_public_osint",
        error_info: null,
        facility_location: detectFacilityLocation(combinedText),
        is_orlen_official: source.category === "official_orlen",
        is_labor_signal: isLaborSignal(combinedText),
        is_local_signal: isLocalSignal(combinedText),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { isNew } = dbRepo.insertDocument(doc);
      if (isNew) {
        itemsNew++;
      }
    }

    const finishedAt = new Date().toISOString();

    dbRepo.recordFetchRun({
      id: runId,
      source_id: source.id,
      started_at: startedAt,
      finished_at: finishedAt,
      status: "success",
      http_status: 200,
      items_found: itemsFound,
      items_new: itemsNew,
      error_message: null,
      response_hash: createHash("sha256").update(xmlText).digest("hex"),
      created_at: startedAt,
    });

    dbRepo.upsertSourceConnector({
      id: `conn_${source.id}`,
      source_id: source.id,
      connector_type: "rss_atom",
      is_configured: true,
      last_success_at: finishedAt,
      last_attempt_at: finishedAt,
      last_error: null,
    });

    return {
      source_id: source.id,
      source_name: source.name,
      status: "success",
      items_found: itemsFound,
      items_new: itemsNew,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Nieznany błąd sieci lub parsowania";
    const finishedAt = new Date().toISOString();

    dbRepo.recordFetchRun({
      id: runId,
      source_id: source.id,
      started_at: startedAt,
      finished_at: finishedAt,
      status: "failed",
      http_status: null,
      items_found: 0,
      items_new: 0,
      error_message: errMsg,
      created_at: startedAt,
    });

    dbRepo.upsertSourceConnector({
      id: `conn_${source.id}`,
      source_id: source.id,
      connector_type: "rss_atom",
      is_configured: true,
      last_attempt_at: finishedAt,
      last_error: errMsg,
    });

    return {
      source_id: source.id,
      source_name: source.name,
      status: "failed",
      items_found: 0,
      items_new: 0,
      error: errMsg,
    };
  }
}

export async function ingestAllActiveSources(): Promise<IngestRunResult[]> {
  const sources = dbRepo.getAllSources().filter((s) => s.is_active);
  const results: IngestRunResult[] = [];

  for (const s of sources) {
    const res = await ingestSource(s);
    results.push(res);
  }

  return results;
}
