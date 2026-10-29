import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SQLITE_INIT_SCHEMA } from "./schema";
import type {
  Source,
  SourceConnector,
  SourceFetchRun,
  Document,
  Facility,
  Event,
  EventDocument,
  Claim,
  ClaimEvidence,
  SentimentAnalysis,
  CrisisScore,
  Alert,
  AuditLog,
  AiAnalysisRun,
} from "./types";

let dbInstance: Database.Database | null = null;

// Podstawowe zakłady Grupy Orlen (geolokalizacja i jednostki)
const INITIAL_FACILITIES: Facility[] = [
  {
    id: "fac_plock_refinery",
    name: "Kompleks Rafineryjno-Petrochemiczny w Płocku (Olefiny)",
    facility_type: "refinery",
    city: "Płock",
    voivodeship: "Mazowieckie",
    lat: 52.5583,
    lng: 19.6897,
    operator_company: "ORLEN S.A.",
    risk_level: "routine",
  },
  {
    id: "fac_gdansk_refinery",
    name: "Rafineria Gdańska (d. Lotos)",
    facility_type: "refinery",
    city: "Gdańsk",
    voivodeship: "Pomorskie",
    lat: 54.3414,
    lng: 18.7183,
    operator_company: "Rafineria Gdańska Sp. z o.o. / ORLEN S.A.",
    risk_level: "routine",
  },
  {
    id: "fac_wloclawek_anwil",
    name: "Zakłady Azotowe ANWIL Włocławek",
    facility_type: "fertilizers",
    city: "Włocławek",
    voivodeship: "Kujawsko-Pomorskie",
    lat: 52.6975,
    lng: 19.0494,
    operator_company: "ANWIL S.A. (Grupa ORLEN)",
    risk_level: "routine",
  },
  {
    id: "fac_trzebinia_poludnie",
    name: "Biorafineria ORLEN Południe Trzebinia",
    facility_type: "biorefinery",
    city: "Trzebinia",
    voivodeship: "Małopolskie",
    lat: 50.1594,
    lng: 19.4706,
    operator_company: "ORLEN Południe S.A.",
    risk_level: "routine",
  },
  {
    id: "fac_jedlicze_poludnie",
    name: "Zakład Regeneracji Olejów Jedlicze",
    facility_type: "biorefinery",
    city: "Jedlicze",
    voivodeship: "Podkarpackie",
    lat: 49.7161,
    lng: 21.6447,
    operator_company: "ORLEN Południe S.A.",
    risk_level: "routine",
  },
  {
    id: "fac_ostroleka_energa",
    name: "Elektrownia Ostrołęka (Energa)",
    facility_type: "petrochemical",
    city: "Ostrołęka",
    voivodeship: "Mazowieckie",
    lat: 53.0847,
    lng: 21.5722,
    operator_company: "Energa S.A. (Grupa ORLEN)",
    risk_level: "routine",
  },
  {
    id: "fac_unipetrol_litvinov",
    name: "ORLEN Unipetrol Rafineria Litvínov",
    facility_type: "refinery",
    city: "Litvínov",
    voivodeship: "Uście nad Łabą (Czechy)",
    lat: 50.5986,
    lng: 13.6108,
    operator_company: "ORLEN Unipetrol a.s.",
    risk_level: "routine",
  },
  {
    id: "fac_lietuva_mazeikiai",
    name: "ORLEN Lietuva Rafineria Możejki",
    facility_type: "refinery",
    city: "Możejki (Mažeikiai)",
    voivodeship: "Litwa",
    lat: 56.3125,
    lng: 22.3414,
    operator_company: "AB ORLEN Lietuva",
    risk_level: "routine",
  },
];

export function getSqliteDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbDir = path.resolve(process.cwd(), "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath =
    process.env.NODE_ENV === "test" || process.env.VITEST
      ? ":memory:"
      : path.join(dbDir, "ttscope.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Inicjalizacja schematu
  db.exec(SQLITE_INIT_SCHEMA);

  // Seed początkowych zakładów
  const insertFac = db.prepare(`
    INSERT OR IGNORE INTO facilities (id, name, facility_type, city, voivodeship, lat, lng, operator_company, risk_level)
    VALUES (@id, @name, @facility_type, @city, @voivodeship, @lat, @lng, @operator_company, @risk_level)
  `);

  const tx = db.transaction((facilities: Facility[]) => {
    for (const f of facilities) {
      insertFac.run(f);
    }
  });
  tx(INITIAL_FACILITIES);

  dbInstance = db;
  return db;
}

// Repozytorium pomocnicze
export const dbRepo = {
  // Źródła
  getAllSources(): Source[] {
    const db = getSqliteDb();
    const rows = db.prepare("SELECT * FROM sources ORDER BY category, name").all() as any[];
    return rows.map((r) => ({
      ...r,
      is_active: Boolean(r.is_active),
      requires_api_key: Boolean(r.requires_api_key),
    }));
  },

  getSourceById(id: string): Source | null {
    const db = getSqliteDb();
    const row = db.prepare("SELECT * FROM sources WHERE id = ?").get(id) as any;
    if (!row) return null;
    return {
      ...row,
      is_active: Boolean(row.is_active),
      requires_api_key: Boolean(row.requires_api_key),
    };
  },

  upsertSource(source: Partial<Source> & { id: string; name: string; category: string; domain: string; url: string }) {
    const db = getSqliteDb();
    const stmt = db.prepare(`
      INSERT INTO sources (id, name, category, subgroup, domain, url, feed_url, scrape_frequency_minutes, is_active, requires_api_key, api_key_name, updated_at)
      VALUES (@id, @name, @category, @subgroup, @domain, @url, @feed_url, @scrape_frequency_minutes, @is_active, @requires_api_key, @api_key_name, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        category = excluded.category,
        subgroup = excluded.subgroup,
        domain = excluded.domain,
        url = excluded.url,
        feed_url = excluded.feed_url,
        is_active = excluded.is_active,
        requires_api_key = excluded.requires_api_key,
        api_key_name = excluded.api_key_name,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run({
      id: source.id,
      name: source.name,
      category: source.category,
      subgroup: source.subgroup || null,
      domain: source.domain,
      url: source.url,
      feed_url: source.feed_url || null,
      scrape_frequency_minutes: source.scrape_frequency_minutes || 15,
      is_active: source.is_active !== undefined ? (source.is_active ? 1 : 0) : 1,
      requires_api_key: source.requires_api_key ? 1 : 0,
      api_key_name: source.api_key_name || null,
    });
  },

  // Konektory
  getSourceConnectors(): (SourceConnector & { source_name: string; source_domain: string })[] {
    const db = getSqliteDb();
    const rows = db.prepare(`
      SELECT sc.*, s.name as source_name, s.domain as source_domain
      FROM source_connectors sc
      JOIN sources s ON s.id = sc.source_id
      ORDER BY s.name
    `).all() as any[];

    return rows.map((r) => ({
      ...r,
      is_configured: Boolean(r.is_configured),
      config_json: r.config_json ? JSON.parse(r.config_json) : null,
      rate_limit_info: r.rate_limit_info ? JSON.parse(r.rate_limit_info) : null,
    }));
  },

  upsertSourceConnector(conn: Partial<SourceConnector> & { id: string; source_id: string; connector_type: string }) {
    const db = getSqliteDb();
    const stmt = db.prepare(`
      INSERT INTO source_connectors (id, source_id, connector_type, config_json, is_configured, last_success_at, last_attempt_at, last_error, rate_limit_info)
      VALUES (@id, @source_id, @connector_type, @config_json, @is_configured, @last_success_at, @last_attempt_at, @last_error, @rate_limit_info)
      ON CONFLICT(id) DO UPDATE SET
        connector_type = excluded.connector_type,
        config_json = excluded.config_json,
        is_configured = excluded.is_configured,
        last_success_at = excluded.last_success_at,
        last_attempt_at = excluded.last_attempt_at,
        last_error = excluded.last_error,
        rate_limit_info = excluded.rate_limit_info
    `);

    stmt.run({
      id: conn.id,
      source_id: conn.source_id,
      connector_type: conn.connector_type,
      config_json: conn.config_json ? JSON.stringify(conn.config_json) : "{}",
      is_configured: conn.is_configured ? 1 : 0,
      last_success_at: conn.last_success_at || null,
      last_attempt_at: conn.last_attempt_at || null,
      last_error: conn.last_error || null,
      rate_limit_info: conn.rate_limit_info ? JSON.stringify(conn.rate_limit_info) : "{}",
    });
  },

  // Przebiegi pobierania (Fetch Runs)
  recordFetchRun(run: SourceFetchRun) {
    const db = getSqliteDb();
    const stmt = db.prepare(`
      INSERT INTO source_fetch_runs (id, source_id, started_at, finished_at, status, http_status, items_found, items_new, error_message, response_hash)
      VALUES (@id, @source_id, @started_at, @finished_at, @status, @http_status, @items_found, @items_new, @error_message, @response_hash)
    `);
    stmt.run({
      ...run,
      finished_at: run.finished_at || null,
      http_status: run.http_status || null,
      error_message: run.error_message || null,
      response_hash: run.response_hash || null,
    });
  },

  // Dokumenty
  insertDocument(doc: Document): { isNew: boolean } {
    const db = getSqliteDb();
    const existing = db.prepare("SELECT id, content_hash, title, content FROM documents WHERE url = ? OR content_hash = ?").get(doc.url, doc.content_hash) as any;

    if (existing) {
      // Wykrywanie aktualizacji treści dokumentu (wersjonowanie)
      if (existing.content_hash !== doc.content_hash) {
        db.prepare(`
          INSERT INTO document_versions (id, document_id, detected_at, title, content, content_hash, change_summary)
          VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?)
        `).run(
          `ver_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          existing.id,
          doc.title,
          doc.content,
          doc.content_hash,
          "Wykryto zmianę treści dokumentu w źródle"
        );

        db.prepare(`
          UPDATE documents SET
            title = ?,
            content = ?,
            excerpt = ?,
            content_hash = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(doc.title, doc.content, doc.excerpt || null, doc.content_hash, existing.id);
      }
      return { isNew: false };
    }

    const stmt = db.prepare(`
      INSERT INTO documents (
        id, source_id, title, url, canonical_url, source_name, author,
        published_at, fetched_at, content, excerpt, language, source_type,
        content_hash, processing_status, licensing_status, error_info,
        facility_location, is_orlen_official, is_labor_signal, is_local_signal
      ) VALUES (
        @id, @source_id, @title, @url, @canonical_url, @source_name, @author,
        @published_at, @fetched_at, @content, @excerpt, @language, @source_type,
        @content_hash, @processing_status, @licensing_status, @error_info,
        @facility_location, @is_orlen_official, @is_labor_signal, @is_local_signal
      )
    `);

    stmt.run({
      id: doc.id,
      source_id: doc.source_id || null,
      title: doc.title,
      url: doc.url,
      canonical_url: doc.canonical_url || null,
      source_name: doc.source_name,
      author: doc.author || null,
      published_at: doc.published_at || null,
      fetched_at: doc.fetched_at,
      content: doc.content,
      excerpt: doc.excerpt || null,
      language: doc.language || "pl",
      source_type: doc.source_type,
      content_hash: doc.content_hash,
      processing_status: doc.processing_status || "pending",
      licensing_status: doc.licensing_status || "fair_use_public_osint",
      error_info: doc.error_info || null,
      facility_location: doc.facility_location || null,
      is_orlen_official: doc.is_orlen_official ? 1 : 0,
      is_labor_signal: doc.is_labor_signal ? 1 : 0,
      is_local_signal: doc.is_local_signal ? 1 : 0,
    });

    return { isNew: true };
  },

  getDocuments(filter: {
    limit?: number;
    offset?: number;
    query?: string;
    sourceType?: string;
    isOrlenOfficial?: boolean;
    isLaborSignal?: boolean;
    facilityLocation?: string;
    /** Kanał komunikacji w tym samym podziale co strefy na kokpicie. */
    channel?: "official" | "labor" | "external";
    /** Nazwa wydawcy zapisana w dokumencie (np. „Bankier.pl”). */
    sourceName?: string;
    /** Granice daty publikacji w ISO UTC: od włącznie, do wyłącznie. */
    publishedFrom?: string;
    publishedTo?: string;
  } = {}): { documents: Document[]; total: number } {
    const db = getSqliteDb();
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter.query) {
      conditions.push("(title LIKE ? OR content LIKE ?)");
      params.push(`%${filter.query}%`, `%${filter.query}%`);
    }
    if (filter.sourceType) {
      conditions.push("source_type = ?");
      params.push(filter.sourceType);
    }
    if (filter.isOrlenOfficial !== undefined) {
      conditions.push("is_orlen_official = ?");
      params.push(filter.isOrlenOfficial ? 1 : 0);
    }
    if (filter.isLaborSignal !== undefined) {
      conditions.push("is_labor_signal = ?");
      params.push(filter.isLaborSignal ? 1 : 0);
    }
    if (filter.facilityLocation) {
      conditions.push("facility_location = ?");
      params.push(filter.facilityLocation);
    }
    if (filter.channel === "official") {
      conditions.push("is_orlen_official = 1");
    } else if (filter.channel === "labor") {
      conditions.push("is_orlen_official = 0 AND is_labor_signal = 1");
    } else if (filter.channel === "external") {
      conditions.push("is_orlen_official = 0 AND is_labor_signal = 0");
    }
    if (filter.sourceName) {
      conditions.push("source_name = ?");
      params.push(filter.sourceName);
    }
    if (filter.publishedFrom) {
      conditions.push("published_at >= ?");
      params.push(filter.publishedFrom);
    }
    if (filter.publishedTo) {
      conditions.push("published_at < ?");
      params.push(filter.publishedTo);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const totalRow = db.prepare(`SELECT COUNT(*) as count FROM documents ${whereClause}`).get(...params) as any;
    const total = totalRow ? totalRow.count : 0;

    const limit = filter.limit || 50;
    const offset = filter.offset || 0;
    const rows = db.prepare(`
      SELECT * FROM documents
      ${whereClause}
      ORDER BY COALESCE(published_at, fetched_at) DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    const documents = rows.map((r) => ({
      ...r,
      is_orlen_official: Boolean(r.is_orlen_official),
      is_labor_signal: Boolean(r.is_labor_signal),
      is_local_signal: Boolean(r.is_local_signal),
    }));

    return { documents, total };
  },

  getDocumentById(id: string): Document | null {
    const db = getSqliteDb();
    const row = db.prepare("SELECT * FROM documents WHERE id = ?").get(id) as any;
    if (!row) return null;
    return {
      ...row,
      is_orlen_official: Boolean(row.is_orlen_official),
      is_labor_signal: Boolean(row.is_labor_signal),
      is_local_signal: Boolean(row.is_local_signal),
    };
  },

  // Zakłady i Infrastruktura
  getAllFacilities(): Facility[] {
    const db = getSqliteDb();
    return db.prepare("SELECT * FROM facilities ORDER BY name").all() as Facility[];
  },

  // Wydarzenia (Events)
  getAllEvents(): Event[] {
    const db = getSqliteDb();
    const rows = db.prepare("SELECT * FROM events ORDER BY sparks_score DESC, last_signal_at DESC").all() as any[];
    return rows.map((r) => ({
      ...r,
      has_orlen_responded: Boolean(r.has_orlen_responded),
    }));
  },

  getEventById(id: string): (Event & { documents: (Document & { diffusion_step: string; time_delta_seconds: number })[] }) | null {
    const db = getSqliteDb();
    const row = db.prepare("SELECT * FROM events WHERE id = ?").get(id) as any;
    if (!row) return null;

    const docRows = db.prepare(`
      SELECT d.*, ed.diffusion_step, ed.time_delta_seconds
      FROM event_documents ed
      JOIN documents d ON d.id = ed.document_id
      WHERE ed.event_id = ?
      ORDER BY COALESCE(d.published_at, d.fetched_at) ASC
    `).all(id) as any[];

    const docs = docRows.map((d) => ({
      ...d,
      is_orlen_official: Boolean(d.is_orlen_official),
      is_labor_signal: Boolean(d.is_labor_signal),
      is_local_signal: Boolean(d.is_local_signal),
    }));

    return {
      ...row,
      has_orlen_responded: Boolean(row.has_orlen_responded),
      documents: docs,
    };
  },

  upsertEvent(evt: Event) {
    const db = getSqliteDb();
    const stmt = db.prepare(`
      INSERT INTO events (
        id, title, summary, first_detected_at, last_signal_at, event_stage,
        origin_source_id, origin_source_category, affected_facility_id,
        sparks_score, confidence_level, has_orlen_responded, orlen_statement_summary,
        updated_at
      ) VALUES (
        @id, @title, @summary, @first_detected_at, @last_signal_at, @event_stage,
        @origin_source_id, @origin_source_category, @affected_facility_id,
        @sparks_score, @confidence_level, @has_orlen_responded, @orlen_statement_summary,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        summary = excluded.summary,
        last_signal_at = excluded.last_signal_at,
        event_stage = excluded.event_stage,
        sparks_score = excluded.sparks_score,
        confidence_level = excluded.confidence_level,
        has_orlen_responded = excluded.has_orlen_responded,
        orlen_statement_summary = excluded.orlen_statement_summary,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run({
      id: evt.id,
      title: evt.title,
      summary: evt.summary || null,
      first_detected_at: evt.first_detected_at,
      last_signal_at: evt.last_signal_at,
      event_stage: evt.event_stage,
      origin_source_id: evt.origin_source_id || null,
      origin_source_category: evt.origin_source_category,
      affected_facility_id: evt.affected_facility_id || null,
      sparks_score: evt.sparks_score,
      confidence_level: evt.confidence_level,
      has_orlen_responded: evt.has_orlen_responded ? 1 : 0,
      orlen_statement_summary: evt.orlen_statement_summary || null,
    });
  },

  clearEventDocuments(eventId: string) {
    const db = getSqliteDb();
    db.prepare("DELETE FROM event_documents WHERE event_id = ?").run(eventId);
  },

  linkDocumentToEvent(eventDoc: EventDocument) {
    const db = getSqliteDb();
    db.prepare(`
      INSERT OR IGNORE INTO event_documents (id, event_id, document_id, similarity_score, diffusion_step, time_delta_seconds)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      eventDoc.id,
      eventDoc.event_id,
      eventDoc.document_id,
      eventDoc.similarity_score || null,
      eventDoc.diffusion_step,
      eventDoc.time_delta_seconds
    );
  },

  // Alerty
  getActiveAlerts(): Alert[] {
    const db = getSqliteDb();
    const rows = db.prepare("SELECT * FROM alerts WHERE is_active = 1 ORDER BY created_at DESC").all() as any[];
    return rows.map((r) => ({
      ...r,
      is_active: Boolean(r.is_active),
      evidence_list: r.evidence_list ? JSON.parse(r.evidence_list) : [],
    }));
  },

  insertAlert(alert: Alert) {
    const db = getSqliteDb();
    db.prepare(`
      INSERT INTO alerts (id, event_id, document_id, alert_type, severity, title, message, evidence_list, is_active, created_at)
      VALUES (@id, @event_id, @document_id, @alert_type, @severity, @title, @message, @evidence_list, @is_active, @created_at)
      ON CONFLICT(id) DO UPDATE SET
        alert_type = excluded.alert_type,
        severity = excluded.severity,
        title = excluded.title,
        message = excluded.message,
        evidence_list = excluded.evidence_list,
        is_active = excluded.is_active,
        created_at = excluded.created_at
    `).run({
      id: alert.id,
      event_id: alert.event_id || null,
      document_id: alert.document_id || null,
      alert_type: alert.alert_type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      evidence_list: JSON.stringify(alert.evidence_list || []),
      is_active: alert.is_active ? 1 : 0,
      created_at: alert.created_at || new Date().toISOString(),
    });
  },

  // Audit Logs
  logAudit(log: AuditLog) {
    const db = getSqliteDb();
    db.prepare(`
      INSERT INTO audit_logs (id, action_type, entity_type, entity_id, user_id, ip_address, details)
      VALUES (@id, @action_type, @entity_type, @entity_id, @user_id, @ip_address, @details)
    `).run({
      id: log.id,
      action_type: log.action_type,
      entity_type: log.entity_type,
      entity_id: log.entity_id || null,
      user_id: log.user_id || null,
      ip_address: log.ip_address || null,
      details: log.details ? JSON.stringify(log.details) : "{}",
    });
  },

  getAuditLogs(limit = 100): AuditLog[] {
    const db = getSqliteDb();
    const rows = db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?").all(limit) as any[];
    return rows.map((r) => ({
      ...r,
      details: r.details ? JSON.parse(r.details) : null,
    }));
  },

  // AI Analysis Runs
  recordAiRun(run: AiAnalysisRun) {
    const db = getSqliteDb();
    db.prepare(`
      INSERT INTO ai_analysis_runs (
        id, document_id, model_name, prompt_version, status,
        raw_response, validated_response, grounding_verified,
        error_message, tokens_used, duration_ms
      ) VALUES (
        @id, @document_id, @model_name, @prompt_version, @status,
        @raw_response, @validated_response, @grounding_verified,
        @error_message, @tokens_used, @duration_ms
      )
    `).run({
      id: run.id,
      document_id: run.document_id,
      model_name: run.model_name,
      prompt_version: run.prompt_version,
      status: run.status,
      raw_response: run.raw_response ? JSON.stringify(run.raw_response) : null,
      validated_response: run.validated_response ? JSON.stringify(run.validated_response) : null,
      grounding_verified: run.grounding_verified ? 1 : 0,
      error_message: run.error_message || null,
      tokens_used: run.tokens_used,
      duration_ms: run.duration_ms,
    });
  },

  getLatestAiRunForDocument(docId: string): AiAnalysisRun | null {
    const db = getSqliteDb();
    const row = db.prepare("SELECT * FROM ai_analysis_runs WHERE document_id = ? ORDER BY created_at DESC LIMIT 1").get(docId) as any;
    if (!row) return null;
    return {
      ...row,
      grounding_verified: Boolean(row.grounding_verified),
      raw_response: row.raw_response ? JSON.parse(row.raw_response) : null,
      validated_response: row.validated_response ? JSON.parse(row.validated_response) : null,
    };
  },

  /** Surowe znaczniki do wykresu rytmu publikacji (bez treści dokumentów). */
  getPublicationRhythmRows(publishedFrom: string): { published_at: string; is_orlen_official: boolean; is_labor_signal: boolean }[] {
    const db = getSqliteDb();
    const rows = db
      .prepare("SELECT published_at, is_orlen_official, is_labor_signal FROM documents WHERE published_at >= ?")
      .all(publishedFrom) as { published_at: string; is_orlen_official: number; is_labor_signal: number }[];
    return rows.map((r) => ({
      published_at: r.published_at,
      is_orlen_official: Boolean(r.is_orlen_official),
      is_labor_signal: Boolean(r.is_labor_signal),
    }));
  },

  /** Wydawcy z największą liczbą publikacji od podanej daty. */
  getTopPublishers(publishedFrom: string, limit: number): { source_name: string; count: number; official: number }[] {
    const db = getSqliteDb();
    return db
      .prepare(`
        SELECT source_name, COUNT(*) AS count, SUM(is_orlen_official) AS official
        FROM documents
        WHERE published_at >= ?
        GROUP BY source_name
        ORDER BY count DESC, source_name ASC
        LIMIT ?
      `)
      .all(publishedFrom, limit) as { source_name: string; count: number; official: number }[];
  },

  // Statystyki systemu dla kokpitu
  getDashboardStats() {
    const db = getSqliteDb();
    const totalDocs = (db.prepare("SELECT COUNT(*) as c FROM documents").get() as any).c;
    const officialDocs = (db.prepare("SELECT COUNT(*) as c FROM documents WHERE is_orlen_official = 1").get() as any).c;
    const laborDocs = (db.prepare("SELECT COUNT(*) as c FROM documents WHERE is_labor_signal = 1").get() as any).c;
    const laborSignalDocs = (db.prepare("SELECT COUNT(*) as c FROM documents WHERE is_orlen_official = 0 AND is_labor_signal = 1").get() as { c: number }).c;
    const externalDocs = (db.prepare("SELECT COUNT(*) as c FROM documents WHERE is_orlen_official = 0 AND is_labor_signal = 0").get() as { c: number }).c;
    const localDocs = (db.prepare("SELECT COUNT(*) as c FROM documents WHERE is_local_signal = 1").get() as any).c;
    const totalEvents = (db.prepare("SELECT COUNT(*) as c FROM events").get() as any).c;
    const activeAlerts = (db.prepare("SELECT COUNT(*) as c FROM alerts WHERE is_active = 1").get() as any).c;
    const totalSources = (db.prepare("SELECT COUNT(*) as c FROM sources").get() as any).c;
    const activeSources = (db.prepare("SELECT COUNT(*) as c FROM sources WHERE is_active = 1").get() as any).c;

    const lastFetch = (db.prepare("SELECT finished_at FROM source_fetch_runs WHERE status = 'success' ORDER BY finished_at DESC LIMIT 1").get() as any)?.finished_at || null;
    const latestPublished = (db.prepare("SELECT published_at FROM documents WHERE published_at IS NOT NULL ORDER BY published_at DESC LIMIT 1").get() as any)?.published_at || null;

    return {
      totalDocs,
      officialDocs,
      laborDocs,
      laborSignalDocs,
      externalDocs,
      localDocs,
      totalEvents,
      activeAlerts,
      totalSources,
      activeSources,
      lastFetch,
      latestPublished,
    };
  },
};
