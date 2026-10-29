# Reguły Vercel i Supabase dla TTscope

Niniejsze reguły obowiązują przy tworzeniu endpointów API, logiki bazodanowej i konfiguracji infrastruktury:

1. **Next.js App Router API Routes**:
   - Każda trasa API wykonująca operacje na bazie danych w czasie rzeczywistym, polling lub obsługę webhooków musi zawierać:
     ```typescript
     export const dynamic = 'force-dynamic';
     export const revalidate = 0;
     ```
2. **Bezpieczeństwo kluczy i RLS**:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: dopuszczalny w przeglądarce, chroniony przez RLS na każdej tabeli.
   - `SUPABASE_SERVICE_ROLE_KEY`: wykorzystywany wyłącznie w chronionych procesach backendowych (ingestion cron, webhooki), nigdy w kodzie klienta ani zmiennych publicznych.
   - Każda tabela w schemacie `public` musi mieć włączone Row Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
3. **Optymalizacja Serverless na Vercel**:
   - Zakaz instalowania Puppeteer / Playwright w funkcjach serverless Vercel (zgodnie z lekcją z pamięci trwałej: cold-starty, limity pamięci). Parsowanie stron wyłącznie przez `fetch` + `cheerio` / biblioteki ekstrakcji tekstu.
   - Przestrzegaj limitu bundla: utrzymuj aktualny `.vercelignore`.
4. **Wydajność zapytań (Zero N+1)**:
   - Zawsze pobieraj powiązane relacje (np. wątek narracyjny + sygnały składowe + źródła) w pojedynczym zapytaniu PostgREST.
   - Twórz i wykorzystuj indeksy HNSW na wektorach embeddings oraz GIN na polach tekstowych (`pg_trgm`).
