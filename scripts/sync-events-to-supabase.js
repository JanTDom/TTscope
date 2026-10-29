const Database = require('better-sqlite3');
const { Client } = require('pg');

async function syncEventsToSupabase() {
  const sqlite = new Database('data/ttscope.db');
  const directUrl = 'postgresql://postgres.uprckcoolbidlbtwwlhw:LaLaLaKapturek62%21@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';
  const pg = new Client({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });
  await pg.connect();

  console.log('Cleaning old events in Supabase...');
  await pg.query('DELETE FROM alerts;');
  await pg.query('DELETE FROM event_documents;');
  await pg.query('DELETE FROM events;');

  // 1. Migracja events
  const events = sqlite.prepare('SELECT * FROM events').all();
  for (const e of events) {
    const query = `
      INSERT INTO events (
        id, title, summary, first_detected_at, last_signal_at, event_stage,
        origin_source_id, origin_source_category, affected_facility_id,
        sparks_score, confidence_level, has_orlen_responded, orlen_statement_summary,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        summary = EXCLUDED.summary,
        first_detected_at = EXCLUDED.first_detected_at,
        last_signal_at = EXCLUDED.last_signal_at,
        event_stage = EXCLUDED.event_stage,
        sparks_score = EXCLUDED.sparks_score,
        confidence_level = EXCLUDED.confidence_level,
        has_orlen_responded = EXCLUDED.has_orlen_responded,
        orlen_statement_summary = EXCLUDED.orlen_statement_summary,
        updated_at = EXCLUDED.updated_at;
    `;
    await pg.query(query, [
      e.id,
      e.title,
      e.summary,
      e.first_detected_at,
      e.last_signal_at,
      e.event_stage,
      e.origin_source_id,
      e.origin_source_category,
      e.affected_facility_id,
      e.sparks_score,
      e.confidence_level,
      Boolean(e.has_orlen_responded),
      e.orlen_statement_summary,
      e.created_at,
      e.updated_at,
    ]);
  }
  console.log('Synced events to Supabase:', events.length);

  // 2. Migracja event_documents
  const evDocs = sqlite.prepare('SELECT * FROM event_documents').all();
  for (const ed of evDocs) {
    const query = `
      INSERT INTO event_documents (
        id, event_id, document_id, similarity_score, diffusion_step,
        time_delta_seconds, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING;
    `;
    await pg.query(query, [
      ed.id,
      ed.event_id,
      ed.document_id,
      ed.similarity_score,
      ed.diffusion_step,
      ed.time_delta_seconds,
      ed.created_at,
    ]);
  }
  console.log('Synced event_documents to Supabase:', evDocs.length);

  // 3. Migracja alerts
  const alerts = sqlite.prepare('SELECT * FROM alerts').all();
  for (const a of alerts) {
    let evList = [];
    try {
      evList = typeof a.evidence_list === 'string' ? JSON.parse(a.evidence_list) : (a.evidence_list || []);
      if (!Array.isArray(evList)) evList = [String(evList)];
    } catch {
      evList = [String(a.evidence_list)];
    }

    const query = `
      INSERT INTO alerts (
        id, event_id, document_id, alert_type, severity, title, message,
        evidence_list, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO NOTHING;
    `;
    await pg.query(query, [
      a.id,
      a.event_id,
      a.document_id,
      a.alert_type,
      a.severity,
      a.title,
      a.message,
      JSON.stringify(evList),
      Boolean(a.is_active),
      a.created_at,
    ]);
  }
  console.log('Synced alerts to Supabase:', alerts.length);

  await pg.end();
}

syncEventsToSupabase().catch(console.error);
