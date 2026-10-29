const Database = require('better-sqlite3');
const { Client } = require('pg');

async function migrate() {
  const sqlite = new Database('data/ttscope.db');
  const directUrl = 'postgresql://postgres.uprckcoolbidlbtwwlhw:LaLaLaKapturek62%21@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';
  const pg = new Client({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });
  await pg.connect();

  console.log('Migrating sources...');
  const sources = sqlite.prepare('SELECT * FROM sources').all();
  for (const s of sources) {
    await pg.query(
      'INSERT INTO sources (id, name, category, subgroup, domain, url, feed_url, scrape_frequency_minutes, is_active, requires_api_key, api_key_name, created_at, updated_at) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (id) DO NOTHING',
      [s.id, s.name, s.category, s.subgroup, s.domain, s.url, s.feed_url, s.scrape_frequency_minutes, Boolean(s.is_active), Boolean(s.requires_api_key), s.api_key_name, s.created_at, s.updated_at]
    );
  }
  console.log(`Sources: ${sources.length}`);

  console.log('Migrating facilities...');
  const facilities = sqlite.prepare('SELECT * FROM facilities').all();
  for (const f of facilities) {
    await pg.query(
      'INSERT INTO facilities (id, name, facility_type, city, voivodeship, lat, lng, operator_company, risk_level) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING',
      [f.id, f.name, f.facility_type, f.city, f.voivodeship, f.lat, f.lng, f.operator_company, f.risk_level]
    );
  }
  console.log(`Facilities: ${facilities.length}`);

  console.log('Migrating documents (1142 records)...');
  const docs = sqlite.prepare('SELECT * FROM documents').all();
  for (const d of docs) {
    await pg.query(
      'INSERT INTO documents (id, source_id, title, url, canonical_url, source_name, author, published_at, fetched_at, content, excerpt, language, source_type, content_hash, processing_status, licensing_status, error_info, facility_location, is_orlen_official, is_labor_signal, is_local_signal, created_at, updated_at) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) ON CONFLICT (id) DO NOTHING',
      [d.id, d.source_id, d.title, d.url, d.canonical_url, d.source_name, d.author, d.published_at, d.fetched_at, d.content, d.excerpt, d.language, d.source_type, d.content_hash, d.processing_status, d.licensing_status, d.error_info, d.facility_location, Boolean(d.is_orlen_official), Boolean(d.is_labor_signal), Boolean(d.is_local_signal), d.created_at, d.updated_at]
    );
  }
  console.log(`Documents: ${docs.length}`);

  console.log('Migrating events...');
  const events = sqlite.prepare('SELECT * FROM events').all();
  for (const e of events) {
    await pg.query(
      'INSERT INTO events (id, title, summary, first_detected_at, last_signal_at, event_stage, origin_source_id, origin_source_category, affected_facility_id, sparks_score, has_orlen_responded, orlen_statement_summary, created_at, updated_at) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT (id) DO NOTHING',
      [e.id, e.title, e.summary, e.first_detected_at, e.last_signal_at, e.event_stage, e.origin_source_id, e.origin_source_category, e.affected_facility_id, e.sparks_score, Boolean(e.has_orlen_responded), e.orlen_statement_summary, e.created_at, e.updated_at]
    );
  }
  console.log(`Events: ${events.length}`);

  console.log('Migrating event_documents...');
  const edocs = sqlite.prepare('SELECT * FROM event_documents').all();
  for (const ed of edocs) {
    await pg.query(
      'INSERT INTO event_documents (id, event_id, document_id, similarity_score, diffusion_step, time_delta_seconds, created_at) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
      [ed.id, ed.event_id, ed.document_id, ed.similarity_score, ed.diffusion_step, ed.time_delta_seconds, ed.created_at]
    );
  }
  console.log(`Event Documents: ${edocs.length}`);

  console.log('Migrating alerts...');
  const alerts = sqlite.prepare('SELECT * FROM alerts').all();
  for (const a of alerts) {
    await pg.query(
      'INSERT INTO alerts (id, event_id, document_id, alert_type, severity, title, message, evidence_list, is_active, created_at) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING',
      [a.id, a.event_id, a.document_id, a.alert_type, a.severity, a.title, a.message, a.evidence_list ? JSON.parse(a.evidence_list) : [], Boolean(a.is_active), a.created_at]
    );
  }
  console.log(`Alerts: ${alerts.length}`);

  await pg.end();
  console.log('SUCCESS: All real OSINT data migrated to Supabase PostgreSQL!');
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
