// ==============================================================================
// TTscope — Modele Danych i Interfejsy
// ==============================================================================

export type SourceCategory =
  | "official_orlen"
  | "internal_labor"
  | "media_general"
  | "media_regional"
  | "media_industry"
  | "social_media";

export type EventStage =
  | "single_mention"
  | "verification_signal"
  | "local_cluster"
  | "growing_topic"
  | "media_crisis"
  | "multichannel_crisis"
  | "confirmed_crisis";

export type ClaimStatus =
  | "directly_stated"
  | "reported_by_source"
  | "unverified"
  | "opinion"
  | "denied";

export type SentimentLabel =
  | "positive"
  | "neutral"
  | "negative"
  | "mixed"
  | "unclear";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export interface Source {
  id: string;
  name: string;
  category: SourceCategory;
  subgroup?: string | null;
  domain: string;
  url: string;
  feed_url?: string | null;
  scrape_frequency_minutes: number;
  is_active: boolean;
  requires_api_key: boolean;
  api_key_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SourceConnector {
  id: string;
  source_id: string;
  connector_type: string;
  config_json?: Record<string, unknown> | null;
  is_configured: boolean;
  last_success_at?: string | null;
  last_attempt_at?: string | null;
  last_error?: string | null;
  rate_limit_info?: Record<string, unknown> | null;
  created_at: string;
}

export interface SourceFetchRun {
  id: string;
  source_id: string;
  started_at: string;
  finished_at?: string | null;
  status: "success" | "partial" | "failed";
  http_status?: number | null;
  items_found: number;
  items_new: number;
  error_message?: string | null;
  response_hash?: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  source_id?: string | null;
  title: string;
  url: string;
  canonical_url?: string | null;
  source_name: string;
  author?: string | null;
  published_at?: string | null;
  fetched_at: string;
  content: string;
  excerpt?: string | null;
  language: string;
  source_type: string;
  content_hash: string;
  processing_status: "pending" | "parsed" | "analyzed" | "error";
  licensing_status: string;
  error_info?: string | null;
  facility_location?: string | null;
  is_orlen_official: boolean;
  is_labor_signal: boolean;
  is_local_signal: boolean;
  created_at: string;
  updated_at: string;
}

export interface Facility {
  id: string;
  name: string;
  facility_type:
    | "refinery"
    | "petrochemical"
    | "fertilizers"
    | "biorefinery"
    | "terminal"
    | "fuel_station"
    | "nuclear_smr";
  city: string;
  voivodeship: string;
  lat?: number | null;
  lng?: number | null;
  operator_company: string;
  risk_level: string;
}

export interface Event {
  id: string;
  title: string;
  summary?: string | null;
  first_detected_at: string;
  last_signal_at: string;
  event_stage: EventStage;
  origin_source_id?: string | null;
  origin_source_category: string;
  affected_facility_id?: string | null;
  sparks_score: number;
  confidence_level: number;
  has_orlen_responded: boolean;
  orlen_statement_summary?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventDocument {
  id: string;
  event_id: string;
  document_id: string;
  similarity_score?: number | null;
  diffusion_step: string;
  time_delta_seconds: number;
  created_at: string;
}

export interface Claim {
  id: string;
  event_id: string;
  document_id: string;
  claim_text: string;
  status: ClaimStatus;
  confidence: number;
  created_at: string;
}

export interface ClaimEvidence {
  id: string;
  claim_id: string;
  document_id: string;
  exact_fragment: string;
  is_verified_in_source: boolean;
  created_at: string;
}

export interface SentimentAnalysis {
  id: string;
  document_id: string;
  sentiment_label: SentimentLabel;
  score: number;
  evidence: string;
  model_version: string;
  analyzed_at: string;
}

export interface CrisisScore {
  id: string;
  event_id: string;
  calculated_at: string;
  total_score: number;
  velocity_subscore: number;
  sources_count_subscore: number;
  reach_subscore: number;
  verification_subscore: number;
  sentiment_subscore: number;
  explanation_json: Record<string, unknown>;
}

export interface Alert {
  id: string;
  event_id?: string | null;
  document_id?: string | null;
  alert_type: string;
  severity: SeverityLevel;
  title: string;
  message: string;
  evidence_list: string[];
  is_active: boolean;
  acknowledged_at?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id?: string | null;
  user_id?: string | null;
  ip_address?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
}

export interface AiAnalysisRun {
  id: string;
  document_id: string;
  model_name: string;
  prompt_version: string;
  status: "success" | "validation_error" | "api_error" | "grounding_failed";
  raw_response?: unknown;
  validated_response?: unknown;
  grounding_verified: boolean;
  error_message?: string | null;
  tokens_used: number;
  duration_ms: number;
  created_at: string;
}
