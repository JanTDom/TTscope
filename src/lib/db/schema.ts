// ==============================================================================
// TTscope — Schemat SQL dla wbudowanego magazynu lokalnego SQLite
// ==============================================================================

export const SQLITE_INIT_SCHEMA = `
CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    subgroup TEXT,
    domain TEXT NOT NULL,
    url TEXT NOT NULL,
    feed_url TEXT,
    scrape_frequency_minutes INTEGER DEFAULT 15,
    is_active INTEGER DEFAULT 1,
    requires_api_key INTEGER DEFAULT 0,
    api_key_name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS source_connectors (
    id TEXT PRIMARY KEY,
    source_id TEXT REFERENCES sources(id) ON DELETE CASCADE,
    connector_type TEXT NOT NULL,
    config_json TEXT DEFAULT '{}',
    is_configured INTEGER DEFAULT 0,
    last_success_at TEXT,
    last_attempt_at TEXT,
    last_error TEXT,
    rate_limit_info TEXT DEFAULT '{}',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS source_fetch_runs (
    id TEXT PRIMARY KEY,
    source_id TEXT REFERENCES sources(id) ON DELETE CASCADE,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    status TEXT NOT NULL,
    http_status INTEGER,
    items_found INTEGER DEFAULT 0,
    items_new INTEGER DEFAULT 0,
    error_message TEXT,
    response_hash TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    canonical_url TEXT,
    source_name TEXT NOT NULL,
    author TEXT,
    published_at TEXT,
    fetched_at TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    language TEXT DEFAULT 'pl',
    source_type TEXT NOT NULL,
    content_hash TEXT NOT NULL UNIQUE,
    processing_status TEXT DEFAULT 'pending',
    licensing_status TEXT DEFAULT 'fair_use_public_osint',
    error_info TEXT,
    facility_location TEXT,
    is_orlen_official INTEGER DEFAULT 0,
    is_labor_signal INTEGER DEFAULT 0,
    is_local_signal INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_versions (
    id TEXT PRIMARY KEY,
    document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    detected_at TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    change_summary TEXT
);

CREATE TABLE IF NOT EXISTS facilities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    facility_type TEXT NOT NULL,
    city TEXT NOT NULL,
    voivodeship TEXT NOT NULL,
    lat REAL,
    lng REAL,
    operator_company TEXT NOT NULL,
    risk_level TEXT DEFAULT 'routine'
);

CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    first_detected_at TEXT NOT NULL,
    last_signal_at TEXT NOT NULL,
    event_stage TEXT NOT NULL,
    origin_source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
    origin_source_category TEXT NOT NULL,
    affected_facility_id TEXT REFERENCES facilities(id) ON DELETE SET NULL,
    sparks_score REAL DEFAULT 0.00,
    confidence_level REAL DEFAULT 0.500,
    has_orlen_responded INTEGER DEFAULT 0,
    orlen_statement_summary TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_documents (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    similarity_score REAL,
    diffusion_step TEXT NOT NULL,
    time_delta_seconds INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, document_id)
);

CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    claim_text TEXT NOT NULL,
    status TEXT NOT NULL,
    confidence REAL DEFAULT 0.500,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS claim_evidence (
    id TEXT PRIMARY KEY,
    claim_id TEXT REFERENCES claims(id) ON DELETE CASCADE,
    document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    exact_fragment TEXT NOT NULL,
    is_verified_in_source INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sentiment_analysis (
    id TEXT PRIMARY KEY,
    document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    sentiment_label TEXT NOT NULL,
    score REAL NOT NULL,
    evidence TEXT NOT NULL,
    model_version TEXT NOT NULL,
    analyzed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS crisis_scores (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    calculated_at TEXT NOT NULL,
    total_score REAL NOT NULL,
    velocity_subscore REAL NOT NULL,
    sources_count_subscore REAL NOT NULL,
    reach_subscore REAL NOT NULL,
    verification_subscore REAL NOT NULL,
    sentiment_subscore REAL NOT NULL,
    explanation_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
    document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    evidence_list TEXT DEFAULT '[]',
    is_active INTEGER DEFAULT 1,
    acknowledged_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_views (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    filter_criteria TEXT NOT NULL,
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'analyst',
    full_name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    user_id TEXT,
    ip_address TEXT,
    details TEXT DEFAULT '{}',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_analysis_runs (
    id TEXT PRIMARY KEY,
    document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    status TEXT NOT NULL,
    raw_response TEXT,
    validated_response TEXT,
    grounding_verified INTEGER DEFAULT 0,
    error_message TEXT,
    tokens_used INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_pub ON documents(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_fetched ON documents(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(content_hash);
CREATE INDEX IF NOT EXISTS idx_events_sparks ON events(sparks_score DESC);
CREATE INDEX IF NOT EXISTS idx_events_stage ON events(event_stage);
`;
