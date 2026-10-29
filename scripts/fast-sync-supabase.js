const Database = require('better-sqlite3');
const { Client } = require('pg');

async function run() {
  const sqlite = new Database('data/ttscope.db');
  const directUrl = 'postgresql://postgres.uprckcoolbidlbtwwlhw:LaLaLaKapturek62%21@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';
  const pg = new Client({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });
  await pg.connect();

  // 1. Znajdź brakujące dokumenty
  const existingRes = await pg.query('SELECT id FROM documents;');
  const existingIds = new Set(existingRes.rows.map(r => r.id));
  const allDocs = sqlite.prepare('SELECT * FROM documents').all();
  const missingDocs = allDocs.filter(d => !existingIds.has(d.id));
  console.log('Missing docs to insert:', missingDocs.length);

  for (const doc of missingDocs) {
    const q = `
      INSERT INTO documents (
        id, source_id, title, url, canonical_url, source_name, author,
        published_at, fetched_at, content, excerpt, language, source_type,
        content_hash, processing_status, licensing_status, error_info,
        facility_location, is_orlen_official, is_labor_signal, is_local_signal,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      ON CONFLICT (id) DO NOTHING;
    `;
    await pg.query(q, [
      doc.id, doc.source_id, doc.title, doc.url, doc.canonical_url, doc.source_name, doc.author,
      doc.published_at, doc.fetched_at, doc.content, doc.excerpt, doc.language, doc.source_type,
      doc.content_hash, doc.processing_status, doc.licensing_status, doc.error_info,
      doc.facility_location, Boolean(doc.is_orlen_official), Boolean(doc.is_labor_signal), Boolean(doc.is_local_signal),
      doc.created_at, doc.updated_at
    ]);
  }
  console.log('Documents synchronized!');

  // 2. Wyczyść i wstaw czyste events
  console.log('Syncing clean events, event_documents and alerts...');
  await pg.query('DELETE FROM alerts;');
  await pg.query('DELETE FROM event_documents;');
  await pg.query('DELETE FROM events;');

  const events = sqlite.prepare('SELECT * FROM events').all();
  for (const e of events) {
    const query = `
      INSERT INTO events (
        id, title, summary, first_detected_at, last_signal_at, event_stage,
        origin_source_id, origin_source_category, affected_facility_id,
        sparks_score, confidence_level, has_orlen_responded, orlen_statement_summary,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15);
    `;
    await pg.query(query, [
      e.id, e.title, e.summary, e.first_detected_at, e.last_signal_at, e.event_stage,
      e.origin_source_id, e.origin_source_category, e.affected_facility_id,
      e.sparks_score, e.confidence_level, Boolean(e.has_orlen_responded),
      e.orlen_statement_summary, e.created_at, e.updated_at,
    ]);
  }
  console.log('Synced events:', events.length);

  // 3. Wstaw event_documents
  const evDocs = sqlite.prepare('SELECT * FROM event_documents').all();
  for (const ed of evDocs) {
    const query = `
      INSERT INTO event_documents (
        id, event_id, document_id, similarity_score, diffusion_step,
        time_delta_seconds, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7);
    `;
    await pg.query(query, [
      ed.id, ed.event_id, ed.document_id, ed.similarity_score,
      ed.diffusion_step, ed.time_delta_seconds, ed.created_at,
    ]);
  }
  console.log('Synced event_documents:', evDocs.length);

  // 4. Wstaw alerts
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
    `;
    await pg.query(query, [
      a.id, a.event_id, a.document_id, a.alert_type, a.severity,
      a.title, a.message, JSON.stringify(evList), Boolean(a.is_active), a.created_at,
    ]);
  }
  console.log('Synced alerts:', alerts.length);

  // Podsumowanie
  const tables = ['sources', 'facilities', 'documents', 'events', 'event_documents', 'alerts'];
  console.log('\n--- Final Supabase counts ---');
  for (const t of tables) {
    const r = await pg.query(`SELECT count(*) FROM ${t};`);
    console.log(t, ':', r.rows[0].count);
  }

  await pg.end();
}

run().catch(console.error);
