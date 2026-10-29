import { Pool } from "pg";
import type {
  Source,
  SourceConnector,
  SourceFetchRun,
  Document,
  Facility,
  Event,
  EventDocument,
  Alert,
  AuditLog,
  AiAnalysisRun,
} from "./types";

let pgPoolInstance: Pool | null = null;

export function getPgPool(): Pool {
  if (pgPoolInstance) {
    return pgPoolInstance;
  }

  // W środowisku produkcyjnym i lokalnym pobieramy URL ze zmiennych środowiskowych
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!connectionString) {
    throw new Error("Brak zmiennej środowiskowej DATABASE_URL lub DIRECT_URL dla połączenia z bazą PostgreSQL.");
  }

  pgPoolInstance = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  return pgPoolInstance;
}

export const postgresRepo = {
  // Źródła
  async getAllSources(): Promise<Source[]> {
    const pool = getPgPool();
    const res = await pool.query("SELECT * FROM sources ORDER BY category, name");
    return res.rows.map((r) => ({
      ...r,
      is_active: Boolean(r.is_active),
      requires_api_key: Boolean(r.requires_api_key),
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      updated_at: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
    }));
  },

  async getSourceById(id: string): Promise<Source | null> {
    const pool = getPgPool();
    const res = await pool.query("SELECT * FROM sources WHERE id = $1", [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      is_active: Boolean(r.is_active),
      requires_api_key: Boolean(r.requires_api_key),
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      updated_at: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
    };
  },

  async upsertSource(source: Partial<Source> & { id: string; name: string; category: string; domain: string; url: string }) {
    const pool = getPgPool();
    await pool.query(
      `
      INSERT INTO sources (id, name, category, subgroup, domain, url, feed_url, scrape_frequency_minutes, is_active, requires_api_key, api_key_name, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        subgroup = EXCLUDED.subgroup,
        domain = EXCLUDED.domain,
        url = EXCLUDED.url,
        feed_url = EXCLUDED.feed_url,
        is_active = EXCLUDED.is_active,
        requires_api_key = EXCLUDED.requires_api_key,
        api_key_name = EXCLUDED.api_key_name,
        updated_at = CURRENT_TIMESTAMP
    `,
      [
        source.id,
        source.name,
        source.category,
        source.subgroup || null,
        source.domain,
        source.url,
        source.feed_url || null,
        source.scrape_frequency_minutes || 60,
        source.is_active !== undefined ? Boolean(source.is_active) : true,
        source.requires_api_key !== undefined ? Boolean(source.requires_api_key) : false,
        source.api_key_name || null,
      ]
    );
  },

  async getSourceConnectors(): Promise<(SourceConnector & { source_name: string; source_domain: string })[]> {
    const pool = getPgPool();
    const res = await pool.query(`
      SELECT sc.*, s.name as source_name, s.domain as source_domain
      FROM source_connectors sc
      JOIN sources s ON s.id = sc.source_id
      ORDER BY s.name ASC
    `);
    return res.rows.map((r) => ({
      ...r,
      is_configured: Boolean(r.is_configured),
      config_json: typeof r.config_json === "string" ? JSON.parse(r.config_json) : r.config_json,
      rate_limit_info: typeof r.rate_limit_info === "string" ? JSON.parse(r.rate_limit_info) : r.rate_limit_info,
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    }));
  },

  async upsertSourceConnector(conn: Partial<SourceConnector> & { id: string; source_id: string; connector_type: string }) {
    const pool = getPgPool();
    await pool.query(
      `
      INSERT INTO source_connectors (id, source_id, connector_type, config_json, is_configured, last_success_at, last_attempt_at, last_error, rate_limit_info)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT(id) DO UPDATE SET
        connector_type = EXCLUDED.connector_type,
        config_json = EXCLUDED.config_json,
        is_configured = EXCLUDED.is_configured,
        last_success_at = COALESCE(EXCLUDED.last_success_at, source_connectors.last_success_at),
        last_attempt_at = COALESCE(EXCLUDED.last_attempt_at, source_connectors.last_attempt_at),
        last_error = EXCLUDED.last_error,
        rate_limit_info = EXCLUDED.rate_limit_info
    `,
      [
        conn.id,
        conn.source_id,
        conn.connector_type,
        conn.config_json ? JSON.stringify(conn.config_json) : null,
        conn.is_configured !== undefined ? Boolean(conn.is_configured) : true,
        conn.last_success_at || null,
        conn.last_attempt_at || null,
        conn.last_error || null,
        conn.rate_limit_info ? JSON.stringify(conn.rate_limit_info) : null,
      ]
    );
  },

  async recordFetchRun(run: SourceFetchRun) {
    const pool = getPgPool();
    await pool.query(
      `
      INSERT INTO source_fetch_runs (id, source_id, started_at, finished_at, status, http_status, items_found, items_new, error_message, response_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
      [
        run.id,
        run.source_id,
        run.started_at,
        run.finished_at || null,
        run.status,
        run.http_status || null,
        run.items_found,
        run.items_new,
        run.error_message || null,
        run.response_hash || null,
      ]
    );
  },

  // Dokumenty
  async insertDocument(doc: Document): Promise<{ isNew: boolean }> {
    const pool = getPgPool();
    const existing = await pool.query(
      "SELECT id, content_hash, title, content FROM documents WHERE url = $1 OR content_hash = $2",
      [doc.url, doc.content_hash]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      if (row.content_hash !== doc.content_hash) {
        await pool.query(
          `
          INSERT INTO document_versions (id, document_id, detected_at, title, content, content_hash, change_summary)
          VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, $6)
        `,
          [
            `ver_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            row.id,
            doc.title,
            doc.content,
            doc.content_hash,
            "Wykryto zmianę treści dokumentu w źródle",
          ]
        );

        await pool.query(
          `
          UPDATE documents SET
            title = $1, content = $2, excerpt = $3, content_hash = $4, updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
        `,
          [doc.title, doc.content, doc.excerpt || null, doc.content_hash, row.id]
        );
      }
      return { isNew: false };
    }

    await pool.query(
      `
      INSERT INTO documents (
        id, source_id, title, url, canonical_url, source_name, author,
        published_at, fetched_at, content, excerpt, language, source_type,
        content_hash, processing_status, licensing_status, error_info,
        facility_location, is_orlen_official, is_labor_signal, is_local_signal
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17,
        $18, $19, $20, $21
      )
    `,
      [
        doc.id,
        doc.source_id || null,
        doc.title,
        doc.url,
        doc.canonical_url || null,
        doc.source_name,
        doc.author || null,
        doc.published_at || null,
        doc.fetched_at,
        doc.content,
        doc.excerpt || null,
        doc.language || "pl",
        doc.source_type,
        doc.content_hash,
        doc.processing_status || "pending",
        doc.licensing_status || "fair_use_public_osint",
        doc.error_info || null,
        doc.facility_location || null,
        Boolean(doc.is_orlen_official),
        Boolean(doc.is_labor_signal),
        Boolean(doc.is_local_signal),
      ]
    );

    return { isNew: true };
  },

  async getDocuments(filter: {
    limit?: number;
    offset?: number;
    query?: string;
    sourceType?: string;
    isOrlenOfficial?: boolean;
    isLaborSignal?: boolean;
    facilityLocation?: string;
    channel?: "official" | "labor" | "external";
    sourceName?: string;
    publishedFrom?: string;
    publishedTo?: string;
  } = {}): Promise<{ documents: Document[]; total: number }> {
    const pool = getPgPool();
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (filter.query) {
      conditions.push(`(title ILIKE $${pIdx} OR content ILIKE $${pIdx})`);
      params.push(`%${filter.query}%`);
      pIdx++;
    }
    if (filter.sourceType) {
      conditions.push(`source_type = $${pIdx}`);
      params.push(filter.sourceType);
      pIdx++;
    }
    if (filter.isOrlenOfficial !== undefined) {
      conditions.push(`is_orlen_official = $${pIdx}`);
      params.push(filter.isOrlenOfficial);
      pIdx++;
    }
    if (filter.isLaborSignal !== undefined) {
      conditions.push(`is_labor_signal = $${pIdx}`);
      params.push(filter.isLaborSignal);
      pIdx++;
    }
    if (filter.facilityLocation) {
      conditions.push(`facility_location = $${pIdx}`);
      params.push(filter.facilityLocation);
      pIdx++;
    }
    if (filter.channel === "official") {
      conditions.push("is_orlen_official = true");
    } else if (filter.channel === "labor") {
      conditions.push("is_orlen_official = false AND is_labor_signal = true");
    } else if (filter.channel === "external") {
      conditions.push("is_orlen_official = false AND is_labor_signal = false");
    }
    if (filter.sourceName) {
      conditions.push(`source_name = $${pIdx}`);
      params.push(filter.sourceName);
      pIdx++;
    }
    if (filter.publishedFrom) {
      conditions.push(`published_at >= $${pIdx}`);
      params.push(filter.publishedFrom);
      pIdx++;
    }
    if (filter.publishedTo) {
      conditions.push(`published_at < $${pIdx}`);
      params.push(filter.publishedTo);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const countRes = await pool.query(`SELECT COUNT(*) as count FROM documents ${whereClause}`, params);
    const total = parseInt(countRes.rows[0]?.count || "0", 10);

    const limit = filter.limit || 50;
    const offset = filter.offset || 0;

    const selectParams = [...params, limit, offset];
    const selectQuery = `
      SELECT * FROM documents
      ${whereClause}
      ORDER BY COALESCE(published_at, fetched_at) DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;

    const docRes = await pool.query(selectQuery, selectParams);
    const documents: Document[] = docRes.rows.map((r) => ({
      ...r,
      is_orlen_official: Boolean(r.is_orlen_official),
      is_labor_signal: Boolean(r.is_labor_signal),
      is_local_signal: Boolean(r.is_local_signal),
      published_at: r.published_at instanceof Date ? r.published_at.toISOString() : (r.published_at || null),
      fetched_at: r.fetched_at instanceof Date ? r.fetched_at.toISOString() : String(r.fetched_at),
    }));

    return { documents, total };
  },

  async getDocumentById(id: string): Promise<Document | null> {
    const pool = getPgPool();
    const res = await pool.query("SELECT * FROM documents WHERE id = $1", [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      is_orlen_official: Boolean(r.is_orlen_official),
      is_labor_signal: Boolean(r.is_labor_signal),
      is_local_signal: Boolean(r.is_local_signal),
      published_at: r.published_at instanceof Date ? r.published_at.toISOString() : (r.published_at || null),
      fetched_at: r.fetched_at instanceof Date ? r.fetched_at.toISOString() : String(r.fetched_at),
    };
  },

  // Zakłady
  async getAllFacilities(): Promise<Facility[]> {
    const pool = getPgPool();
    const res = await pool.query("SELECT * FROM facilities ORDER BY name");
    return res.rows.map((r) => ({
      ...r,
      lat: Number(r.lat),
      lng: Number(r.lng),
    }));
  },

  // Wydarzenia (Events)
  async getAllEvents(options?: { from?: string; to?: string }): Promise<Event[]> {
    const pool = getPgPool();
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (options?.from) {
      conditions.push(`last_signal_at >= $${pIdx}`);
      params.push(options.from);
      pIdx++;
    }
    if (options?.to) {
      conditions.push(`last_signal_at <= $${pIdx}`);
      params.push(options.to);
      pIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const res = await pool.query(
      `SELECT * FROM events ${where} ORDER BY sparks_score DESC, last_signal_at DESC`,
      params
    );

    return res.rows.map((r) => ({
      ...r,
      has_orlen_responded: Boolean(r.has_orlen_responded),
      sparks_score: Number(r.sparks_score),
      confidence_level: Number(r.confidence_level),
      first_detected_at: r.first_detected_at instanceof Date ? r.first_detected_at.toISOString() : String(r.first_detected_at),
      last_signal_at: r.last_signal_at instanceof Date ? r.last_signal_at.toISOString() : String(r.last_signal_at),
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      updated_at: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
    }));
  },

  async getEventById(id: string): Promise<(Event & { documents: (Document & { diffusion_step: string; time_delta_seconds: number })[] }) | null> {
    const pool = getPgPool();
    const evRes = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
    if (evRes.rows.length === 0) return null;
    const r = evRes.rows[0];

    const docRes = await pool.query(
      `
      SELECT d.*, ed.diffusion_step, ed.time_delta_seconds
      FROM event_documents ed
      JOIN documents d ON d.id = ed.document_id
      WHERE ed.event_id = $1
      ORDER BY COALESCE(d.published_at, d.fetched_at) ASC
    `,
      [id]
    );

    const docs = docRes.rows.map((d) => ({
      ...d,
      is_orlen_official: Boolean(d.is_orlen_official),
      is_labor_signal: Boolean(d.is_labor_signal),
      is_local_signal: Boolean(d.is_local_signal),
      published_at: d.published_at instanceof Date ? d.published_at.toISOString() : (d.published_at || null),
      fetched_at: d.fetched_at instanceof Date ? d.fetched_at.toISOString() : String(d.fetched_at),
      time_delta_seconds: Number(d.time_delta_seconds || 0),
    }));

    return {
      ...r,
      has_orlen_responded: Boolean(r.has_orlen_responded),
      sparks_score: Number(r.sparks_score),
      confidence_level: Number(r.confidence_level),
      first_detected_at: r.first_detected_at instanceof Date ? r.first_detected_at.toISOString() : String(r.first_detected_at),
      last_signal_at: r.last_signal_at instanceof Date ? r.last_signal_at.toISOString() : String(r.last_signal_at),
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      updated_at: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
      documents: docs,
    };
  },

  async upsertEvent(evt: Event) {
    const pool = getPgPool();
    await pool.query(
      `
      INSERT INTO events (
        id, title, summary, first_detected_at, last_signal_at, event_stage,
        origin_source_id, origin_source_category, affected_facility_id,
        sparks_score, confidence_level, has_orlen_responded, orlen_statement_summary,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9,
        $10, $11, $12, $13,
        $14, CURRENT_TIMESTAMP
      )
      ON CONFLICT(id) DO UPDATE SET
        title = EXCLUDED.title,
        summary = EXCLUDED.summary,
        last_signal_at = EXCLUDED.last_signal_at,
        event_stage = EXCLUDED.event_stage,
        sparks_score = EXCLUDED.sparks_score,
        confidence_level = EXCLUDED.confidence_level,
        has_orlen_responded = EXCLUDED.has_orlen_responded,
        orlen_statement_summary = EXCLUDED.orlen_statement_summary,
        updated_at = CURRENT_TIMESTAMP
    `,
      [
        evt.id,
        evt.title,
        evt.summary || null,
        evt.first_detected_at,
        evt.last_signal_at,
        evt.event_stage,
        evt.origin_source_id || null,
        evt.origin_source_category,
        evt.affected_facility_id || null,
        evt.sparks_score,
        evt.confidence_level,
        Boolean(evt.has_orlen_responded),
        evt.orlen_statement_summary || null,
        evt.created_at || new Date().toISOString(),
      ]
    );
  },

  async clearEventDocuments(eventId: string) {
    const pool = getPgPool();
    await pool.query("DELETE FROM event_documents WHERE event_id = $1", [eventId]);
  },

  async linkDocumentToEvent(eventDoc: EventDocument) {
    const pool = getPgPool();
    await pool.query(
      `
      INSERT INTO event_documents (id, event_id, document_id, similarity_score, diffusion_step, time_delta_seconds)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
    `,
      [
        eventDoc.id,
        eventDoc.event_id,
        eventDoc.document_id,
        eventDoc.similarity_score || null,
        eventDoc.diffusion_step,
        eventDoc.time_delta_seconds,
      ]
    );
  },

  // Alerty
  async getActiveAlerts(options?: { from?: string; to?: string }): Promise<Alert[]> {
    const pool = getPgPool();
    const conditions: string[] = ["is_active = true"];
    const params: any[] = [];
    let pIdx = 1;

    if (options?.from) {
      conditions.push(`created_at >= $${pIdx}`);
      params.push(options.from);
      pIdx++;
    }
    if (options?.to) {
      conditions.push(`created_at <= $${pIdx}`);
      params.push(options.to);
      pIdx++;
    }

    const where = `WHERE ${conditions.join(" AND ")}`;
    const res = await pool.query(`SELECT * FROM alerts ${where} ORDER BY created_at DESC`, params);

    return res.rows.map((r) => {
      let evidence: string[] = [];
      try {
        evidence = typeof r.evidence_list === "string" ? JSON.parse(r.evidence_list) : (r.evidence_list || []);
        if (!Array.isArray(evidence)) evidence = [String(evidence)];
      } catch {
        evidence = [String(r.evidence_list)];
      }

      return {
        ...r,
        is_active: Boolean(r.is_active),
        evidence_list: evidence,
        created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      };
    });
  },

  async insertAlert(alert: Alert) {
    const pool = getPgPool();
    await pool.query(
      `
      INSERT INTO alerts (id, event_id, document_id, alert_type, severity, title, message, evidence_list, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT(id) DO UPDATE SET
        alert_type = EXCLUDED.alert_type,
        severity = EXCLUDED.severity,
        title = EXCLUDED.title,
        message = EXCLUDED.message,
        evidence_list = EXCLUDED.evidence_list,
        is_active = EXCLUDED.is_active,
        created_at = EXCLUDED.created_at
    `,
      [
        alert.id,
        alert.event_id || null,
        alert.document_id || null,
        alert.alert_type,
        alert.severity,
        alert.title,
        alert.message,
        JSON.stringify(alert.evidence_list || []),
        alert.is_active !== undefined ? Boolean(alert.is_active) : true,
        alert.created_at || new Date().toISOString(),
      ]
    );
  },

  // Logi audytowe
  async logAudit(log: AuditLog): Promise<void> {
    const pool = getPgPool();
    await pool.query(
      `
      INSERT INTO audit_logs (id, action_type, entity_type, entity_id, user_id, ip_address, details)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      [
        log.id,
        log.action_type,
        log.entity_type,
        log.entity_id || null,
        log.user_id || null,
        log.ip_address || null,
        log.details ? JSON.stringify(log.details) : "{}",
      ]
    );
  },

  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    const pool = getPgPool();
    const res = await pool.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1", [limit]);
    return res.rows.map((r) => ({
      ...r,
      details: typeof r.details === "string" ? JSON.parse(r.details) : r.details,
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    }));
  },

  // AI Analysis Runs
  async recordAiRun(run: AiAnalysisRun) {
    const pool = getPgPool();
    await pool.query(
      `
      INSERT INTO ai_analysis_runs (
        id, document_id, model_name, prompt_version, status,
        raw_response, validated_response, grounding_verified,
        error_message, tokens_used, duration_ms
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11
      )
    `,
      [
        run.id,
        run.document_id,
        run.model_name,
        run.prompt_version,
        run.status,
        run.raw_response ? JSON.stringify(run.raw_response) : null,
        run.validated_response ? JSON.stringify(run.validated_response) : null,
        Boolean(run.grounding_verified),
        run.error_message || null,
        run.tokens_used,
        run.duration_ms,
      ]
    );
  },

  async getLatestAiRunForDocument(docId: string): Promise<AiAnalysisRun | null> {
    const pool = getPgPool();
    const res = await pool.query(
      "SELECT * FROM ai_analysis_runs WHERE document_id = $1 ORDER BY created_at DESC LIMIT 1",
      [docId]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      ...row,
      grounding_verified: Boolean(row.grounding_verified),
      raw_response: typeof row.raw_response === "string" ? JSON.parse(row.raw_response) : row.raw_response,
      validated_response: typeof row.validated_response === "string" ? JSON.parse(row.validated_response) : row.validated_response,
    };
  },

  // Wykres rytmu publikacji
  async getPublicationRhythmRows(
    publishedFrom: string,
    publishedTo?: string
  ): Promise<{ published_at: string; is_orlen_official: boolean; is_labor_signal: boolean }[]> {
    const pool = getPgPool();
    const conditions = ["published_at >= $1"];
    const params: any[] = [publishedFrom];
    if (publishedTo) {
      conditions.push("published_at <= $2");
      params.push(publishedTo);
    }
    const res = await pool.query(
      `SELECT published_at, is_orlen_official, is_labor_signal FROM documents WHERE ${conditions.join(" AND ")}`,
      params
    );
    return res.rows.map((r) => ({
      published_at: r.published_at instanceof Date ? r.published_at.toISOString() : String(r.published_at),
      is_orlen_official: Boolean(r.is_orlen_official),
      is_labor_signal: Boolean(r.is_labor_signal),
    }));
  },

  // Wydawcy z największą liczbą publikacji
  async getTopPublishers(
    publishedFrom: string,
    limit: number,
    publishedTo?: string
  ): Promise<{ source_name: string; count: number; official: number }[]> {
    const pool = getPgPool();
    const conditions = ["published_at >= $1"];
    const params: any[] = [publishedFrom];
    let pIdx = 2;
    if (publishedTo) {
      conditions.push(`published_at <= $${pIdx}`);
      params.push(publishedTo);
      pIdx++;
    }
    params.push(limit);

    const res = await pool.query(
      `
      SELECT source_name, COUNT(*) AS count, COUNT(*) FILTER (WHERE is_orlen_official = true) AS official
      FROM documents
      WHERE ${conditions.join(" AND ")}
      GROUP BY source_name
      ORDER BY count DESC, source_name ASC
      LIMIT $${pIdx}
    `,
      params
    );

    return res.rows.map((r) => ({
      source_name: String(r.source_name),
      count: parseInt(r.count, 10),
      official: parseInt(r.official, 10),
    }));
  },

  // Statystyki dla kokpitu
  async getDashboardStats(options?: { from?: string; to?: string }) {
    const pool = getPgPool();
    const docConditions: string[] = [];
    const docParams: any[] = [];
    let pIdx = 1;

    if (options?.from) {
      docConditions.push(`published_at >= $${pIdx}`);
      docParams.push(options.from);
      pIdx++;
    }
    if (options?.to) {
      docConditions.push(`published_at <= $${pIdx}`);
      docParams.push(options.to);
      pIdx++;
    }
    const docWhere = docConditions.length > 0 ? `WHERE ${docConditions.join(" AND ")}` : "";
    const andDoc = docConditions.length > 0 ? `AND ${docConditions.join(" AND ")}` : "";

    const [totalDocsRes, officialDocsRes, laborDocsRes, laborSignalRes, externalRes, localRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) as c FROM documents ${docWhere}`, docParams),
      pool.query(`SELECT COUNT(*) as c FROM documents WHERE is_orlen_official = true ${andDoc}`, docParams),
      pool.query(`SELECT COUNT(*) as c FROM documents WHERE is_labor_signal = true ${andDoc}`, docParams),
      pool.query(`SELECT COUNT(*) as c FROM documents WHERE is_orlen_official = false AND is_labor_signal = true ${andDoc}`, docParams),
      pool.query(`SELECT COUNT(*) as c FROM documents WHERE is_orlen_official = false AND is_labor_signal = false ${andDoc}`, docParams),
      pool.query(`SELECT COUNT(*) as c FROM documents WHERE is_local_signal = true ${andDoc}`, docParams),
    ]);

    const eventConditions: string[] = [];
    const eventParams: any[] = [];
    let epIdx = 1;
    if (options?.from) {
      eventConditions.push(`last_signal_at >= $${epIdx}`);
      eventParams.push(options.from);
      epIdx++;
    }
    if (options?.to) {
      eventConditions.push(`last_signal_at <= $${epIdx}`);
      eventParams.push(options.to);
      epIdx++;
    }
    const eventWhere = eventConditions.length > 0 ? `WHERE ${eventConditions.join(" AND ")}` : "";
    const totalEventsRes = await pool.query(`SELECT COUNT(*) as c FROM events ${eventWhere}`, eventParams);

    const alertConditions: string[] = ["is_active = true"];
    const alertParams: any[] = [];
    let apIdx = 1;
    if (options?.from) {
      alertConditions.push(`created_at >= $${apIdx}`);
      alertParams.push(options.from);
      apIdx++;
    }
    if (options?.to) {
      alertConditions.push(`created_at <= $${apIdx}`);
      alertParams.push(options.to);
      apIdx++;
    }
    const alertWhere = `WHERE ${alertConditions.join(" AND ")}`;
    const activeAlertsRes = await pool.query(`SELECT COUNT(*) as c FROM alerts ${alertWhere}`, alertParams);

    const [totalSourcesRes, activeSourcesRes, latestPublishedRes] = await Promise.all([
      pool.query("SELECT COUNT(*) as c FROM sources"),
      pool.query("SELECT COUNT(*) as c FROM sources WHERE is_active = true"),
      pool.query("SELECT published_at FROM documents WHERE published_at IS NOT NULL ORDER BY published_at DESC LIMIT 1"),
    ]);

    const rawLatest = latestPublishedRes.rows[0]?.published_at;
    const latestPublished = rawLatest instanceof Date ? rawLatest.toISOString() : (rawLatest || null);

    return {
      totalDocs: parseInt(totalDocsRes.rows[0]?.c || "0", 10),
      officialDocs: parseInt(officialDocsRes.rows[0]?.c || "0", 10),
      laborDocs: parseInt(laborDocsRes.rows[0]?.c || "0", 10),
      laborSignalDocs: parseInt(laborSignalRes.rows[0]?.c || "0", 10),
      externalDocs: parseInt(externalRes.rows[0]?.c || "0", 10),
      localDocs: parseInt(localRes.rows[0]?.c || "0", 10),
      totalEvents: parseInt(totalEventsRes.rows[0]?.c || "0", 10),
      activeAlerts: parseInt(activeAlertsRes.rows[0]?.c || "0", 10),
      totalSources: parseInt(totalSourcesRes.rows[0]?.c || "0", 10),
      activeSources: parseInt(activeSourcesRes.rows[0]?.c || "0", 10),
      lastFetch: null,
      latestPublished,
    };
  },

  // ==============================================================================
  // METODY REJESTRU PODMIOTÓW GRUPY ORLEN (OrlenEntityRegistry)
  // ==============================================================================

  async getOrlenEntities(filter?: {
    segment?: string;
    status?: string;
    country?: string;
    is_monitored?: boolean;
    query?: string;
  }): Promise<any[]> {
    const pool = getPgPool();
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (filter?.segment && filter.segment !== "all") {
      conditions.push(`business_segment = $${pIdx}`);
      params.push(filter.segment);
      pIdx++;
    }
    if (filter?.status && filter.status !== "all") {
      conditions.push(`entity_status = $${pIdx}`);
      params.push(filter.status);
      pIdx++;
    }
    if (filter?.country && filter.country !== "all") {
      conditions.push(`country = $${pIdx}`);
      params.push(filter.country);
      pIdx++;
    }
    if (filter?.is_monitored !== undefined) {
      conditions.push(`is_monitored = $${pIdx}`);
      params.push(filter.is_monitored);
      pIdx++;
    }
    if (filter?.query && filter.query.trim()) {
      const q = `%${filter.query.trim()}%`;
      conditions.push(`(name ILIKE $${pIdx} OR legal_name ILIKE $${pIdx} OR short_name ILIKE $${pIdx} OR brand_name ILIKE $${pIdx})`);
      params.push(q);
      pIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const res = await pool.query(
      `SELECT * FROM entities ${where} ORDER BY is_monitored DESC, name ASC`,
      params
    );

    return res.rows.map((r) => ({
      ...r,
      domains: typeof r.domains === "string" ? JSON.parse(r.domains) : r.domains || [],
      social_profiles: typeof r.social_profiles === "string" ? JSON.parse(r.social_profiles) : r.social_profiles || {},
      search_aliases: typeof r.search_aliases === "string" ? JSON.parse(r.search_aliases) : r.search_aliases || [],
      is_monitored: Boolean(r.is_monitored),
      last_verified_at: r.last_verified_at instanceof Date ? r.last_verified_at.toISOString() : String(r.last_verified_at || ""),
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at || ""),
      updated_at: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at || ""),
    }));
  },

  async getOrlenEntityById(id: string): Promise<any | null> {
    const pool = getPgPool();
    const res = await pool.query("SELECT * FROM entities WHERE id = $1", [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      domains: typeof r.domains === "string" ? JSON.parse(r.domains) : r.domains || [],
      social_profiles: typeof r.social_profiles === "string" ? JSON.parse(r.social_profiles) : r.social_profiles || {},
      search_aliases: typeof r.search_aliases === "string" ? JSON.parse(r.search_aliases) : r.search_aliases || [],
      is_monitored: Boolean(r.is_monitored),
      last_verified_at: r.last_verified_at instanceof Date ? r.last_verified_at.toISOString() : String(r.last_verified_at || ""),
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at || ""),
      updated_at: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at || ""),
    };
  },

  async upsertOrlenEntity(entity: any): Promise<any> {
    const pool = getPgPool();
    const now = new Date().toISOString();
    await pool.query(
      `
      INSERT INTO entities (
        id, name, entity_type, description, canonical_name, legal_name, short_name, former_name,
        brand_name, parent_company, country, business_segment, website, domains, social_profiles,
        ticker, nip, krs, entity_status, last_verified_at, verification_source, search_aliases,
        is_monitored, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        canonical_name = EXCLUDED.canonical_name,
        legal_name = EXCLUDED.legal_name,
        short_name = EXCLUDED.short_name,
        former_name = EXCLUDED.former_name,
        brand_name = EXCLUDED.brand_name,
        parent_company = EXCLUDED.parent_company,
        country = EXCLUDED.country,
        business_segment = EXCLUDED.business_segment,
        website = EXCLUDED.website,
        domains = EXCLUDED.domains,
        social_profiles = EXCLUDED.social_profiles,
        ticker = EXCLUDED.ticker,
        nip = EXCLUDED.nip,
        krs = EXCLUDED.krs,
        entity_status = EXCLUDED.entity_status,
        last_verified_at = EXCLUDED.last_verified_at,
        verification_source = EXCLUDED.verification_source,
        search_aliases = EXCLUDED.search_aliases,
        is_monitored = EXCLUDED.is_monitored,
        updated_at = $25
    `,
      [
        entity.id,
        entity.name,
        entity.entity_type || "company",
        entity.description || entity.legal_name || "",
        entity.canonical_name || entity.name,
        entity.legal_name || entity.name,
        entity.short_name || entity.name,
        entity.former_name || null,
        entity.brand_name || null,
        entity.parent_company || "ORLEN S.A.",
        entity.country || "PL",
        entity.business_segment || "Inne",
        entity.website || "",
        JSON.stringify(entity.domains || []),
        JSON.stringify(entity.social_profiles || {}),
        entity.ticker || null,
        entity.nip || null,
        entity.krs || null,
        entity.entity_status || "active",
        entity.last_verified_at || now,
        entity.verification_source || "Oficjalny rejestr",
        JSON.stringify(entity.search_aliases || []),
        entity.is_monitored !== undefined ? Boolean(entity.is_monitored) : true,
        entity.created_at || now,
        now,
      ]
    );

    return await this.getOrlenEntityById(entity.id);
  },

  async updateOrlenEntityMonitored(id: string, is_monitored: boolean): Promise<void> {
    const pool = getPgPool();
    await pool.query(
      "UPDATE entities SET is_monitored = $1, updated_at = now() WHERE id = $2",
      [is_monitored, id]
    );
  },

  async updateOrlenEntityAliases(id: string, aliases: string[]): Promise<void> {
    const pool = getPgPool();
    await pool.query(
      "UPDATE entities SET search_aliases = $1, updated_at = now() WHERE id = $2",
      [JSON.stringify(aliases), id]
    );
  },

  async updateOrlenEntitySocialProfiles(id: string, social_profiles: any): Promise<void> {
    const pool = getPgPool();
    await pool.query(
      "UPDATE entities SET social_profiles = $1, updated_at = now() WHERE id = $2",
      [JSON.stringify(social_profiles), id]
    );
  },

  async insertEntityAudit(audit: any): Promise<void> {
    const pool = getPgPool();
    await pool.query(
      `
      INSERT INTO entity_registry_audit (
        id, entity_id, field_name, old_value, new_value, change_type, confidence, source, confirmed_by_human, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
      [
        audit.id,
        audit.entity_id,
        audit.field_name,
        audit.old_value || null,
        audit.new_value || null,
        audit.change_type,
        audit.confidence || 1.0,
        audit.source,
        Boolean(audit.confirmed_by_human),
        audit.created_at || new Date().toISOString(),
      ]
    );
  },

  async getEntityAuditLogs(entityId?: string): Promise<any[]> {
    const pool = getPgPool();
    const where = entityId ? "WHERE entity_id = $1" : "";
    const params = entityId ? [entityId] : [];
    const res = await pool.query(
      `SELECT * FROM entity_registry_audit ${where} ORDER BY created_at DESC LIMIT 100`,
      params
    );
    return res.rows.map((r) => ({
      ...r,
      confidence: parseFloat(r.confidence || "1.0"),
      confirmed_by_human: Boolean(r.confirmed_by_human),
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    }));
  },

  async upsertDocumentEntity(docEntity: any): Promise<void> {
    const pool = getPgPool();
    await pool.query(
      `
      INSERT INTO document_entities (
        id, document_id, entity_id, entity_match_confidence, match_rationale, matched_text,
        review_status, reviewed_by, reviewed_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (document_id, entity_id) DO UPDATE SET
        entity_match_confidence = EXCLUDED.entity_match_confidence,
        match_rationale = EXCLUDED.match_rationale,
        matched_text = EXCLUDED.matched_text,
        review_status = EXCLUDED.review_status,
        reviewed_by = EXCLUDED.reviewed_by,
        reviewed_at = EXCLUDED.reviewed_at
    `,
      [
        docEntity.id,
        docEntity.document_id,
        docEntity.entity_id,
        docEntity.entity_match_confidence,
        docEntity.match_rationale,
        docEntity.matched_text || null,
        docEntity.review_status || "auto_matched",
        docEntity.reviewed_by || null,
        docEntity.reviewed_at || null,
        docEntity.created_at || new Date().toISOString(),
      ]
    );
  },

  async getDocumentEntities(filter?: {
    documentId?: string;
    entityId?: string;
    reviewStatus?: string;
    limit?: number;
  }): Promise<any[]> {
    const pool = getPgPool();
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (filter?.documentId) {
      conditions.push(`de.document_id = $${pIdx}`);
      params.push(filter.documentId);
      pIdx++;
    }
    if (filter?.entityId) {
      conditions.push(`de.entity_id = $${pIdx}`);
      params.push(filter.entityId);
      pIdx++;
    }
    if (filter?.reviewStatus && filter.reviewStatus !== "all") {
      conditions.push(`de.review_status = $${pIdx}`);
      params.push(filter.reviewStatus);
      pIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limitClause = `LIMIT $${pIdx}`;
    params.push(filter?.limit || 50);

    const res = await pool.query(
      `
      SELECT de.*, d.title as document_title, d.url as document_url, d.source_name, d.published_at, d.source_type,
             e.name as entity_name, e.short_name as entity_short_name
      FROM document_entities de
      JOIN documents d ON de.document_id = d.id
      JOIN entities e ON de.entity_id = e.id
      ${where}
      ORDER BY de.created_at DESC
      ${limitClause}
    `,
      params
    );

    return res.rows.map((r) => ({
      ...r,
      entity_match_confidence: parseFloat(r.entity_match_confidence || "0"),
      published_at: r.published_at instanceof Date ? r.published_at.toISOString() : String(r.published_at || ""),
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at || ""),
      reviewed_at: r.reviewed_at instanceof Date ? r.reviewed_at.toISOString() : (r.reviewed_at ? String(r.reviewed_at) : null),
    }));
  },

  async updateDocumentEntityReview(
    id: string,
    review_status: string,
    reviewed_by = "Analityk Dyżurny TTscope"
  ): Promise<void> {
    const pool = getPgPool();
    await pool.query(
      `
      UPDATE document_entities 
      SET review_status = $1, reviewed_by = $2, reviewed_at = now()
      WHERE id = $3
    `,
      [review_status, reviewed_by, id]
    );
  },

  async getEntityPublicationStats(): Promise<any[]> {
    const pool = getPgPool();
    const res = await pool.query(`
      SELECT 
        e.id, e.name, e.short_name, e.business_segment, e.country, e.is_monitored,
        COUNT(de.id) as total_mentions,
        COUNT(de.id) FILTER (WHERE d.source_type = 'social_media' AND d.source_name ILIKE '%Facebook%') as facebook_count,
        COUNT(de.id) FILTER (WHERE d.source_type = 'social_media' AND d.source_name ILIKE '%YouTube%') as youtube_count,
        COUNT(de.id) FILTER (WHERE d.source_type = 'social_media' AND (d.source_name ILIKE '%Twitter%' OR d.source_name ILIKE '% X %' OR d.source_name ILIKE '%X.com%')) as twitter_count,
        COUNT(de.id) FILTER (WHERE d.source_type = 'official_orlen') as official_count,
        COUNT(de.id) FILTER (WHERE d.source_type = 'media_industry') as industry_count,
        COUNT(de.id) FILTER (WHERE d.source_type = 'media_regional') as regional_count,
        COUNT(de.id) FILTER (WHERE d.source_type = 'media_general') as general_count,
        MIN(d.published_at) as first_seen_at,
        MAX(d.published_at) as latest_seen_at
      FROM entities e
      LEFT JOIN document_entities de ON e.id = de.entity_id AND de.review_status != 'rejected'
      LEFT JOIN documents d ON de.document_id = d.id
      GROUP BY e.id, e.name, e.short_name, e.business_segment, e.country, e.is_monitored
      ORDER BY total_mentions DESC, e.name ASC
    `);

    return res.rows.map((r) => ({
      ...r,
      total_mentions: parseInt(r.total_mentions || "0", 10),
      facebook_count: parseInt(r.facebook_count || "0", 10),
      youtube_count: parseInt(r.youtube_count || "0", 10),
      twitter_count: parseInt(r.twitter_count || "0", 10),
      official_count: parseInt(r.official_count || "0", 10),
      industry_count: parseInt(r.industry_count || "0", 10),
      regional_count: parseInt(r.regional_count || "0", 10),
      general_count: parseInt(r.general_count || "0", 10),
      first_seen_at: r.first_seen_at instanceof Date ? r.first_seen_at.toISOString() : (r.first_seen_at || null),
      latest_seen_at: r.latest_seen_at instanceof Date ? r.latest_seen_at.toISOString() : (r.latest_seen_at || null),
    }));
  },
};
