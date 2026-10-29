# Architektura techniczna systemu TTscope

Niniejsza dokumentacja określa architekturę techniczną, model danych, potoki przetwarzania danych wywiadowczych (ingestion pipeline) oraz standardy wdrożenia aplikacji **TTscope** na platformach **Vercel** i **Supabase**.

---

## 1. Topologia systemu i przepływ danych

System TTscope operuje w architekturze rozproszonego monitoringu zdarzeń i analizy dyfuzji narracji:

```
[ŹRÓDŁA DANYCH]
  ├── Wewnętrzne i pracownicze (Związki, fora załóg, BIP, biuletyny)
  ├── Zewnętrzne Grupy Orlen (Biuro prasowe, relacje inwestorskie, ESPI)
  ├── Media tradycyjne i branżowe (PAP, serwisy ogólne, regionalne, branżowe)
  └── Social media i społeczności (X/Twitter, LinkedIn, grupy lokalne)
             │
             ▼
[INGESTION & NORMALIZATION PIPELINE] (Vercel Cron / Edge Functions)
  ├── Pobieranie i weryfikacja źródła (RSS, Scrapery Cheerio/Readability, API)
  ├── Ekstrakcja treści, metadanych i sygnatur czasowych (t_published)
  └── Normalizacja formatu i deduplikacja (hashe MinHash / sha256)
             │
             ▼
[AI ANALYSIS & VECTOR ENRICHMENT] (Edge Ingestion + Embeddings)
  ├── Ekstrakcja encji (podmioty Grupy Orlen, zakłady, nazwiska, lokalizacje)
  ├── Klasyfikacja tematyczna (pracownicze, lokalne, technologiczne, zarządcze)
  ├── Scoring sentymentu i potencjału kryzysowego (Virality & Escalation Score)
  └── Wektorowanie treści (`text-embedding-3-small` / Supabase pgvector)
             │
             ▼
[STORAGE & REALTIME ENGINE] (Supabase PostgreSQL)
  ├── Relacyjna baza danych z politykami Row Level Security (RLS)
  ├── Przeszukiwanie wektorowe HNSW i pełnotekstowe `pg_trgm`
  └── Supabase Realtime (strumieniowanie nowych alertów do analityków)
             │
             ▼
[INTELLIGENCE DASHBOARD] (Next.js App Router na Vercel)
  ├── Centrum Sytuacyjne (Executive Radar na żywo)
  ├── Matryca Dyfuzji (Śledzenie przecieków i reakcji mediów)
  ├── Rejestr Iskrzeń i Kryzysów (Sparks Index z geolokalizacją zakładów)
  └── Oś Czasu Incydentu (Deep-dive, cytowania, aktorzy)
```

---

## 2. Model danych Supabase PostgreSQL

### Schemat bazy danych:

```sql
-- 1. Rozszerzenia niezbędne do wyszukiwania semantycznego i pełnotekstowego
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Źródła monitoringu (Sources)
CREATE TABLE public.sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('internal_worker', 'official_orlen', 'media_general', 'media_regional', 'media_industry', 'social_media')),
    subgroup TEXT, -- np. 'plock_refinery', 'zwiazki_zawodowe', 'trojmiasto', 'espi'
    url TEXT,
    feed_url TEXT,
    scrape_frequency_minutes INT DEFAULT 15,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Znormalizowane wpisy i materiały źródłowe (Signals / Raw Ingestions)
CREATE TABLE public.signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES public.sources(id) ON DELETE CASCADE,
    external_id TEXT, -- unikalny identyfikator w serwisie źródłowym
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    url TEXT,
    author TEXT,
    published_at TIMESTAMPTZ NOT NULL,
    ingested_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    content_hash TEXT NOT NULL UNIQUE, -- do szybkiej deduplikacji
    
    -- Wzbogacenie analityczne
    category TEXT CHECK (category IN ('worker_relations', 'local_community', 'environment_hazard', 'executive_governance', 'market_supply', 'general_pr')),
    facility_location TEXT, -- np. 'Plock', 'Gdansk', 'Wloclawek', 'Trzebinia', 'Jedlicze', 'Unipetrol', 'Lietuva'
    sentiment_score NUMERIC(4,3), -- od -1.000 do +1.000
    urgency_level TEXT CHECK (urgency_level IN ('routine', 'monitored', 'sparks', 'critical_crisis')) DEFAULT 'routine',
    
    -- Wektor semantyczny (1536 wymiarów)
    embedding vector(1536),
    raw_metadata JSONB DEFAULT '{}'::jsonb
);

-- Indeksy wydajnościowe
CREATE INDEX idx_signals_published_at ON public.signals(published_at DESC);
CREATE INDEX idx_signals_category ON public.signals(category);
CREATE INDEX idx_signals_urgency ON public.signals(urgency_level);
CREATE INDEX idx_signals_trgm ON public.signals USING gin (title gin_trgm_ops, content gin_trgm_ops);
CREATE INDEX idx_signals_embedding ON public.signals USING hnsw (embedding vector_cosine_ops);

-- 4. Wątki narracyjne i wykrywanie dyfuzji (Narrative Threads & Diffusion)
CREATE TABLE public.narrative_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    summary TEXT,
    first_detected_at TIMESTAMPTZ NOT NULL,
    last_signal_at TIMESTAMPTZ NOT NULL,
    origin_source_category TEXT NOT NULL, -- czy zaczęło się wewnątrz, czy w mediach
    penetration_level TEXT CHECK (penetration_level IN ('internal_only', 'leaked_to_regional', 'national_media_pickup', 'viral_social')),
    is_active_crisis BOOLEAN DEFAULT FALSE,
    sparks_score NUMERIC(5,2) DEFAULT 0.00, -- 0-100 wskaźnik zapalny
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Powiązania sygnałów z wątkami (Diffusion Graph Links)
CREATE TABLE public.diffusion_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES public.narrative_threads(id) ON DELETE CASCADE,
    signal_id UUID REFERENCES public.signals(id) ON DELETE CASCADE,
    similarity_score NUMERIC(4,3),
    diffusion_step TEXT CHECK (diffusion_step IN ('origin_signal', 'internal_circulation', 'leak_or_statement', 'media_coverage', 'social_amplification')),
    time_delta_seconds BIGINT, -- opóźnienie względem pierwszego wykrycia
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(thread_id, signal_id)
);

-- 6. Rejestr incydentów i alertów kryzysowych (Crisis & Sparks Incidents)
CREATE TABLE public.crisis_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES public.narrative_threads(id) ON DELETE SET NULL,
    headline TEXT NOT NULL,
    incident_type TEXT CHECK (incident_type IN ('labor_dispute', 'local_protest', 'environmental_odor_flare', 'plant_outage', 'management_conflict', 'fuel_shortage')),
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
    affected_facility TEXT, -- zakład / podmiot Grupy Orlen
    involved_unions TEXT[], -- np. ['NSZZ Solidarność', 'MZZPRC']
    summary TEXT NOT NULL,
    action_status TEXT CHECK (action_status IN ('detected', 'investigating', 'escalating', 'deescalating', 'resolved')) DEFAULT 'detected',
    detected_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMPTZ
);
```

---

## 3. Polityki bezpieczeństwa Row Level Security (RLS)

Wszystkie tabele mają domyślnie włączone RLS:
```sql
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diffusion_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_incidents ENABLE ROW LEVEL SECURITY;

-- Odczyt dla uwierzytelnionych analityków
CREATE POLICY "Authenticated users can view intelligence data"
ON public.signals FOR SELECT
TO authenticated
USING (true);

-- Bezpieczne operacje zapisu i ingestion wyłącznie dla roli serwisowej (service_role)
CREATE POLICY "Service role full access on signals"
ON public.signals FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

---

## 4. Wytyczne implementacji Vercel

1. **API Routes i Ingestion Handlers**:
   - Każda trasa API z dynamicznym odczytem z bazy lub obsługą webhooka musi zawierać:
     ```typescript
     export const dynamic = 'force-dynamic';
     export const revalidate = 0;
     ```
2. **Ograniczenia Serverless**:
   - Zero ciężkich bibliotek przeglądarkowych typu Puppeteer w lambdach Vercel (zgodnie z `FAILED_APPROACHES.md`). Scraping i parsowanie realizowane wyłącznie za pomocą lekkich narzędzi: `fetch`, parserów RSS (`rss-parser`), lekkiego parsera DOM (`cheerio` / `@extractus/article-extractor`).
   - Czas wykonywania skomplikowanych zadań batchowych ograniczony z poszanowaniem `maxDuration` oraz mechanizm chunkingu (przetwarzanie w partiach po 10-20 źródeł).
3. **Optymalizacja bundla**:
   - Aktywny `.vercelignore` chroniący przed przekroczeniem limitu 50MB zip / 250MB rozpakowanego kodu.

---

## 5. Zasada Integralności Danych i Bezwzględny Zakaz Danych Próbnych (Zero Mock Policy)

1. **Bezwzględny zakaz wprowadzania fejków, mocków i halucynacji**:
   - Żadna wersja aplikacji TTscope (deweloperska, preview, produkcyjna) nie może zawierać na stałe zakodowanych fałszywych artykułów, sztucznych incydentów kryzysowych ani zmyślonych wskaźników sentymentu.
   - Wszelkie dane prezentowane analitykowi muszą być wynikiem realnych procesów ingestion ze zweryfikowanych kanałów (biuletyny, relacje inwestorskie, media, social media).
2. **Zachowanie w przypadku pustej bazy lub braku wyników**:
   - Gdy potok nie zarejestrował zdarzeń w zadanym oknie czasowym lub baza jest czysta, widok prezentuje elegancki, rzetelny stan zerowy (`Graceful Zero-State`). Informuje on o statusie procesów nasłuchu, monitorowanych kategoriach i ostatniej dacie pomyślnej synchronizacji.
   - Niedopuszczalne jest „wypełnianie pustki” zmyślonymi rekordami na potrzeby demonstracji.
