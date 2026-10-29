---
name: ttscope-architecture-and-stack
description: Standard implementacji Next.js 15, Vercel Serverless/Edge oraz Supabase PostgreSQL z pgvector dla TTscope. Wzorce wydajnościowe, ochrona przed N+1, bezpieczne RLS, obsługa limitów Vercel i czysty kod.
---

# Architektura Systemowa i Stos Technologiczny (Vercel & Supabase)

Ten skill zawiera wzorce inżynieryjne, reguły konfiguracji oraz dobre praktyki wdrożeniowe dla aplikacji TTscope na platformach **Vercel** (Next.js 15 App Router) i **Supabase** (PostgreSQL, pgvector, Realtime, Storage).

---

## 1. Architektura Next.js 15 na platformie Vercel

### Server Components vs Client Components:
- **Domyślnie Server Components**:
  Wszystkie strony dashboardu (`page.tsx`), panele analityczne i wstępne zapytania do bazy danych wykonują się na serwerze (zero JavaScriptu klienckiego dla samego pobrania danych).
- **Client Components (`'use client'`)**:
  Używane wyłącznie na liściach drzewa komponentów, gdzie wymagana jest interakcja:
  - Przełączniki filtrów czasowych i kategorii.
  - Subskrypcje Realtime WebSocket z Supabase.
  - Interaktywne wykresy i osie czasu.
- **Streaming z React Suspense**:
  Główny układ strony ładuje się natychmiast, a cięższe zapytania (np. wektorowe dopasowania dyfuzji czy pełne raporty sentymentu) opakowane są w `<Suspense fallback={<CardSkeleton />}>`.

### Wymagane reguły dla API i Ingestion Handlers:
Każda trasa API wykonująca operacje dynamiczne, crony lub zapytania do bazy Supabase musi posiadać explicite deklaracje segmentu trasy:
```typescript
// app/api/ingestion/route.ts
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60; // 60 sekund dla planu Vercel Pro przy zadaniach batchowych
```

### Ograniczenia i zasady Serverless:
1. **Zakaz Puppeteer/Chromium w lambdach Vercel**:
   Nie instaluj headless Chrome w środowisku serverless (przekroczenie limitów pamięci, cold starty > 10s).
   Scraping serwisów realizuj za pomocą:
   - Oficjalnych kanałów RSS/Atom.
   - Standardowego `fetch()` z nagłówkami User-Agent.
   - Parsowania HTML przez `cheerio` i biblioteki ekstrakcji tekstu (`@extractus/article-extractor`).
2. **Ochrona przed przekroczeniem limitu bundla**:
   Pamiętaj o pliku `.vercelignore` na katalogi testowe, dokumentację i skille `.agents/`.

---

## 2. Architektura Danych i Supabase PostgreSQL

### Wzorce dostępu do bazy (Supabase Client):
- **Klient przeglądarkowy / publiczny**:
  Inicjalizowany za pomocą `createBrowserClient` z `@supabase/ssr`. Korzysta wyłącznie z klucza `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Wszystkie operacje podlegają rygorystycznemu RLS.
- **Klient serwerowy (Server Components / Actions)**:
  Inicjalizowany przez `createServerClient` z `@supabase/ssr` z obsługą cookies.
- **Klient administracyjny / Ingestion (Worker Client)**:
  Wykonywany w chronionych endpointach cron/webhook z użyciem `SUPABASE_SERVICE_ROLE_KEY`. Nigdy nie może być zaimportowany do komponentu klienta (`'use client'`).

### Zapobieganie problemom wydajnościowym N+1:
Nigdy nie pobieraj listy wątków narracyjnych, a następnie w pętli sygnałów składowych. Korzystaj z zaawansowanych relacyjnych zapytań PostgREST:
```typescript
const { data, error } = await supabase
  .from('narrative_threads')
  .select(`
    id,
    title,
    sparks_score,
    penetration_level,
    first_detected_at,
    diffusion_links (
      similarity_score,
      diffusion_step,
      signal:signals (
        id,
        title,
        url,
        published_at,
        source:sources (
          name,
          category
        )
      )
    )
  `)
  .order('last_signal_at', { ascending: false })
  .limit(20);
```

---

## 3. Przeszukiwanie Wektorowe i Semantyczne z pgvector

Do analizy powiązań wycieków z doniesieniami medialnymi wykorzystywana jest funkcja RPC w PostgreSQL:
```sql
CREATE OR REPLACE FUNCTION match_signals(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  title text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    signals.id,
    signals.title,
    1 - (signals.embedding <=> query_embedding) AS similarity
  FROM signals
  WHERE 1 - (signals.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

---

## 4. Subskrypcje Realtime dla Alertyzacji Kryzysowej

Klient nasłuchuje na nowe rekordy o statusie `sparks` lub `critical_crisis` w tabeli `signals` lub `crisis_incidents`:
```typescript
const channel = supabase
  .channel('crisis-alerts')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'crisis_incidents',
    },
    (payload) => {
      // Wyświetlenie dyskretnego powiadomienia radarowego na żywo
      onNewCrisisIncident(payload.new);
    }
  )
  .subscribe();
```
Każda subskrypcja musi posiadać czyszczenie zasobów (`channel.unsubscribe()`) przy odmontowywaniu komponentu.
