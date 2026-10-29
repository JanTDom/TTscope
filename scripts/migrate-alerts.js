const Database = require('better-sqlite3');
const { Client } = require('pg');

async function migrateAlerts() {
  const sqlite = new Database('data/ttscope.db');
  const directUrl = 'postgresql://postgres.uprckcoolbidlbtwwlhw:LaLaLaKapturek62%21@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';
  const pg = new Client({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });
  await pg.connect();

  const alerts = sqlite.prepare('SELECT * FROM alerts').all();
  for (const a of alerts) {
    let evList = [];
    try {
      evList = typeof a.evidence_list === 'string' ? JSON.parse(a.evidence_list) : (a.evidence_list || []);
      if (!Array.isArray(evList)) evList = [String(evList)];
    } catch {
      evList = [String(a.evidence_list)];
    }

    const query = 'INSERT INTO alerts (id, event_id, document_id, alert_type, severity, title, message, evidence_list, is_active, created_at) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING';

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
      a.created_at
    ]);
  }

  const count = await pg.query('SELECT count(*) FROM alerts;');
  console.log('Alerts successfully migrated to Supabase:', count.rows[0].count);
  await pg.end();
}

migrateAlerts().catch(console.error);
