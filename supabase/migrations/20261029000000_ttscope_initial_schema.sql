-- TTscope: Baza Danych i Model Relacyjno-Wektorowy
-- Wersja: 20261029000000_ttscope_initial_schema.sql
-- Kompatybilność: PostgreSQL 16+, pgvector, pg_trgm, Supabase

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. Rejestr Źródeł (sources, source_connectors, source_fetch_runs)
CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'official_orlen', 'internal_labor', 'media_general', 'media_regional', 'media_industry', 'social_media'
    subgroup TEXT,          -- np. 'plock', 'gdansk', 'wloclawek', 'espi', 'zwiazki_zawodowe'
    domain TEXT NOT NULL,
    url TEXT NOT NULL,
    feed_url TEXT,
    scrape_frequency_minutes INT DEFAULT 15,
    is_active BOOLEAN DEFAULT TRUE,
    requires_api_key BOOLEAN DEFAULT FALSE,
    api_key_name TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS source_connectors (
    id TEXT PRIMARY KEY,
    source_id TEXT REFERENCES sources(id) ON DELETE CASCADE,
    connector_type TEXT NOT NULL, -- 'rss_atom', 'html_cheerio', 'twitter_api', 'facebook_graph', 'youtube_api', 'bip_scraper'
    config_json JSONB DEFAULT '{}'::jsonb,
    is_configured BOOLEAN DEFAULT FALSE,
    last_success_at TIMESTAMPTZ,
    last_attempt_at TIMESTAMPTZ,
    last_error TEXT,
    rate_limit_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS source_fetch_runs (
    id TEXT PRIMARY KEY,
    source_id TEXT REFERENCES sources(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ,
    status TEXT NOT NULL, -- 'success', 'partial', 'failed'
    http_status INT,
    items_found INT DEFAULT 0,
    items_new INT DEFAULT 0,
    error_message TEXT,
    response_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Dokumenty i Wersje (documents, document_versions)
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    canonical_url TEXT,
    source_name TEXT NOT NULL,
    author TEXT,
    published_at TIMESTAMPTZ,
    fetched_at TIMESTAMPTZ NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    language TEXT DEFAULT 'pl',
    source_type TEXT NOT NULL,
    content_hash TEXT NOT NULL UNIQUE,
    processing_status TEXT DEFAULT 'pending', -- 'pending', 'parsed', 'analyzed', 'error'
    licensing_status TEXT DEFAULT 'fair_use_public_osint',
    error_info TEXT,
    facility_location TEXT, -- np. 'Płock', 'Gdańsk', 'Włocławek', 'Trzebinia'
    is_orlen_official BOOLEAN DEFAULT FALSE,
    is_labor_signal BOOLEAN DEFAULT FALSE,
    is_local_signal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_versions (
    id TEXT PRIMARY KEY,
    document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    detected_at TIMESTAMPTZ NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    change_summary TEXT
);

-- 3. Słowniki Encji (entities, organizations, locations, people, facilities)
CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'organization', 'facility', 'person', 'location', 'union', 'authority'
    description TEXT,
    canonical_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS entity_aliases (
    id TEXT PRIMARY KEY,
    entity_id TEXT REFERENCES entities(id) ON DELETE CASCADE,
    alias TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS facilities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    facility_type TEXT NOT NULL, -- 'refinery', 'petrochemical', 'fertilizers', 'biorefinery', 'terminal', 'fuel_station', 'nuclear_smr'
    city TEXT NOT NULL,
    voivodeship TEXT NOT NULL,
    lat NUMERIC(9,6),
    lng NUMERIC(9,6),
    operator_company TEXT NOT NULL,
    risk_level TEXT DEFAULT 'routine'
);

-- 4. Tematy i Wydarzenia (topics, events, event_documents, event_locations, event_entities)
CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    category TEXT NOT NULL,
    is_crisis_indicator BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    first_detected_at TIMESTAMPTZ NOT NULL,
    last_signal_at TIMESTAMPTZ NOT NULL,
    event_stage TEXT NOT NULL, -- 'single_mention', 'verification_signal', 'local_cluster', 'growing_topic', 'media_crisis', 'multichannel_crisis', 'confirmed_crisis'
    origin_source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
    origin_source_category TEXT NOT NULL,
    affected_facility_id TEXT REFERENCES facilities(id) ON DELETE SET NULL,
    sparks_score NUMERIC(5,2) DEFAULT 0.00,
    confidence_level NUMERIC(4,3) DEFAULT 0.500,
    has_orlen_responded BOOLEAN DEFAULT FALSE,
    orlen_statement_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_documents (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    similarity_score NUMERIC(4,3),
    diffusion_step TEXT NOT NULL, -- 'origin', 'local_pickup', 'national_media', 'social_amplification', 'rebuttal'
    time_delta_seconds BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, document_id)
);

-- 5. Twierdzenia i Dowody (claims, claim_evidence)
CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    claim_text TEXT NOT NULL,
    status TEXT NOT NULL, -- 'directly_stated', 'reported_by_source', 'unverified', 'opinion', 'denied'
    confidence NUMERIC(4,3) DEFAULT 0.500,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS claim_evidence (
    id TEXT PRIMARY KEY,
    claim_id TEXT REFERENCES claims(id) ON DELETE CASCADE,
    document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    exact_fragment TEXT NOT NULL,
    is_verified_in_source BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Analizy Sentymentu, Narracji i Oceny Ryzyka
CREATE TABLE IF NOT EXISTS sentiment_analysis (
    id TEXT PRIMARY KEY,
    document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    sentiment_label TEXT NOT NULL, -- 'positive', 'neutral', 'negative', 'mixed', 'unclear'
    score NUMERIC(4,3) NOT NULL,
    evidence TEXT NOT NULL,
    model_version TEXT NOT NULL,
    analyzed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS narratives (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    narrative_type TEXT NOT NULL, -- 'company_statement', 'union_demands', 'local_grievance', 'critical_investigation', 'market_reaction'
    key_theme TEXT NOT NULL,
    description TEXT,
    prevalence_score NUMERIC(4,3) DEFAULT 0.500
);

CREATE TABLE IF NOT EXISTS crisis_scores (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    calculated_at TIMESTAMPTZ NOT NULL,
    total_score NUMERIC(5,2) NOT NULL,
    velocity_subscore NUMERIC(5,2) NOT NULL,
    sources_count_subscore NUMERIC(5,2) NOT NULL,
    reach_subscore NUMERIC(5,2) NOT NULL,
    verification_subscore NUMERIC(5,2) NOT NULL,
    sentiment_subscore NUMERIC(5,2) NOT NULL,
    explanation_json JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
    document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    evidence_list JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Widoki Zapisane, Użytkownicy i Audit Logs
CREATE TABLE IF NOT EXISTS saved_views (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    filter_criteria JSONB NOT NULL,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'analyst', -- 'admin', 'analyst', 'reader'
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    user_id TEXT,
    ip_address TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_analysis_runs (
    id TEXT PRIMARY KEY,
    document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success', 'validation_error', 'api_error', 'grounding_failed'
    raw_response JSONB,
    validated_response JSONB,
    grounding_verified BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    tokens_used INT DEFAULT 0,
    duration_ms INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indeksy wydajnościowe
CREATE INDEX IF NOT EXISTS idx_documents_published_at ON documents(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_fetched_at ON documents(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_content_hash ON documents(content_hash);
CREATE INDEX IF NOT EXISTS idx_events_sparks_score ON events(sparks_score DESC);
CREATE INDEX IF NOT EXISTS idx_events_stage ON events(event_stage);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
