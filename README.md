# TTscope — System Monitoringu Wywiadowczego i Detekcji Iskrzeń Grupy ORLEN

**TTscope** to profesjonalny system OSINT, monitoringu mediów, analizy dyfuzji informacji i wczesnego wykrywania kryzysów związanych z **Grupą ORLEN** oraz jej podmiotami zależnymi (m.in. Energa, PGNiG, ANWIL, Rafineria Gdańska, ORLEN Południe, ORLEN Unipetrol, ORLEN Lietuva).

System działa w pełni lokalnie bez zewnętrznych zależności systemowych (z wbudowaną bazą SQLite na start i przygotowanym kontenerem Docker Compose dla PostgreSQL 16 + pgvector) oraz jest od początku gotowy do wdrożenia na **Vercel** i podłączenia produkcyjnej bazy **Supabase**.

---

## 1. Co zostało zbudowane

1. **Wielomodułowy potok pobierania (Ingestion Pipeline)**:
   - Konektory RSS/Atom z odpornym parserem XML i filtrem encji Grupy ORLEN.
   - Normalizacja treści, usuwanie znaczników HTML i skryptów (ochrona przed XSS).
   - Deterministyczna deduplikacja oparta o sumy kontrolne SHA-256 (`content_hash`) i wersjonowanie zmienionych dokumentów (`document_versions`).
   - Rejestr przebiegów i audyt każdego zapytania w `source_fetch_runs`.

2. **Warstwa AI i Gemini API (`gemini-3.8-flash`)**:
   - Model `gemini-3.8-flash` z parametrem `temperature: 0.1` i wymuszonym schematem JSON (`Structured Outputs`).
   - **Weryfikacja uziemienia (Grounding Verification)**: algorytm sprawdzający, czy każdy fragment dowodowy (`evidence`) podany przez model faktycznie istnieje w tekście źródłowym. Encje i twierdzenia bez potwierdzenia w tekście są bezwzględnie odrzucane.
   - Ochrona przed Prompt Injection: treść artykułów jest separowana w znacznikach `<UNTRUSTED_DOCUMENT_CONTENT>` i traktowana wyłącznie jako dane pasywne.
   - Kontrolowane **Function Calling** w module dialogowym „Zapytaj TTscope” (`search_documents`, `get_document`, `search_events`, `get_event_timeline`, `get_source_health`, `get_location_signals`).
   - Pełna obsługa braku klucza API: aplikacja działa stabilnie, raportując status „Wymagany klucz API”.

3. **Silnik klastrowania wydarzeń i ocena ryzyka (Sparks Score)**:
   - Łączenie artykułów w spójne wątki tematyczne i incydenty.
   - Jawny, w 100% wyjaśnialny model punktacji zagrożenia (0–100 pkt) z rozbiciem na:
     - dynamikę publikacji w czasie (velocity),
     - liczbę niezależnych domen i źródeł,
     - zasięg (media regionalne vs branżowe vs ogólnopolskie),
     - weryfikację sygnałów pracowniczych, awarii i uciążliwości lokalnych,
     - wskaźniki sentymentu i zarzutów.
   - Klasyfikacja etapu: `single_mention`, `verification_signal`, `local_cluster`, `growing_topic`, `media_crisis`, `confirmed_crisis`.
   - Automatyczny generator alertów wczesnego ostrzegania przy przekroczeniu progu ryzyka.

4. **Interfejs użytkownika (Dark Editorial / Situational Room)**:
   - **Kokpit główny (`/`)**: Bento Grid z metrykami na żywo, indeksem iskrzeń, alertami i zestawieniem komunikatów.
   - **Strumień informacji (`/stream`)**: chronologiczny wykaz publikacji z wielokryterialnymi filtrami i przyciskiem analizy faktów AI.
   - **Centrum wydarzeń (`/events` oraz `/events/[id]`)**: zagregowane wątki, status reakcji ORLENU i chronologiczna oś czasu dyfuzji.
   - **Mapa instalacji i ryzyka (`/map`)**: geolokalizacja zakładów (Płock, Gdańsk, Włocławek, Trzebinia, Jedlicze, Ostrołęka, Litvínov, Możejki) z poziomami napięć.
   - **Matryca dyfuzji (`/diffusion`)**: śledzenie przenikania informacji (sygnał pierwotny → prasa lokalna → media ogólnopolskie → social media).
   - **Analiza narracji (`/orlen-diff`)**: zestawienie oficjalnych komunikatów spółki z interpretacjami i nagłówkami medialnymi.
   - **Wyszukiwarka OSINT (`/search`)**: pełnotekstowe przeszukiwanie bazy.
   - **Alerty kryzysowe (`/alerts`)**: powiadomienia z listą twardych dowodów źródłowych.
   - **Raporty analityczne (`/reports`)**: generator biuletynu wywiadowczego z opcją druku i zapisu do PDF.
   - **Zapytaj TTscope (`/ask`)**: asystent AI odpytujący bazę danych przez Function Calling.
   - **Panel administracyjny (`/admin`)**: monitoring zdrowia konektorów, statusy kluczy API i audit log.

---

## 2. Rzeczywiste źródła danych i status konfiguracji

System działa w oparciu o zasadę **Zero Mock Policy** — od pierwszego uruchomienia przetwarza autentyczne materiały z publicznej sieci:

| Kategoria | Nazwa źródła | Status | Typ konektora | Wymagany klucz |
|---|---|---|---|---|
| **Oficjalne ORLEN** | ORLEN S.A. Relacje Inwestorskie i ESPI | DZIAŁA | `rss_atom` | Brak (otwarty) |
| **Oficjalne ORLEN** | Energa S.A. Biuro Prasowe | DZIAŁA | `rss_atom` | Brak (otwarty) |
| **Oficjalne ORLEN** | ANWIL S.A. Komunikaty | DZIAŁA (oczekuje na publikacje) | `html_cheerio` | Brak |
| **Media Regionalne** | PetroNews Płock (serce petrochemii) | DZIAŁA | `rss_atom` | Brak |
| **Media Regionalne** | Trójmiasto.pl (Gdańsk / Rafineria) | DZIAŁA | `rss_atom` | Brak |
| **Media Regionalne** | Dziennik Bałtycki (Pomorze) | DZIAŁA | `rss_atom` | Brak |
| **Media Regionalne** | Nasze Miasto (Płock, Włocławek, Trzebinia) | DZIAŁA | `rss_atom` | Brak |
| **Media Branżowe** | Energetyka24 | DZIAŁA | `rss_atom` | Brak |
| **Media Branżowe** | BiznesAlert.pl | DZIAŁA | `rss_atom` | Brak |
| **Media Ogólne** | Bankier.pl Wiadomości Gospodarcze | DZIAŁA | `rss_atom` | Brak |
| **Social Media** | X (Twitter) @GrupaORLEN | Wymaga klucza | `twitter_api` | `TWITTER_BEARER_TOKEN` |
| **Social Media** | Facebook Strona ORLEN | Wymaga klucza | `facebook_graph` | `FACEBOOK_GRAPH_TOKEN` |
| **Social Media** | YouTube Grupa ORLEN | DZIAŁA (kanał publiczny) | `rss_atom` | Brak |

> **Zasada uczciwego statusu**: Źródła wymagające płatnych lub autoryzowanych kluczy API pokazują w panelu administracyjnym rzeczywisty stan: *„Wymagany klucz API (nie skonfigurowano)”*. Żadne dane nie są symulowane ani zmyślane.

---

## 3. Wykorzystanie rozwiązań z projektów PPGscope i MAPscope

Przed przystąpieniem do budowy przeanalizowano istniejące projekty `PPGscope` i `MAPscope`:

1. **Rejestr źródeł regionalnych**:
   - Wykorzystano zweryfikowane adresy kanałów RSS mediów lokalnych z bazy Polska Press (PetroNews Płock, Nasze Miasto, Dziennik Bałtycki), dostosowując filtry do specyfiki zakładów petrochemicznych i rafineryjnych.
2. **Architektura ingestu i deduplikacji**:
   - Zaadaptowano sprawdzony wzorzec generowania sum kontrolnych SHA-256 z normalizowanego tytułu i treści oraz rejestrowania przebiegów pobierania (`source_fetch_runs`).
3. **Wzorce wnioskowania Gemini i Grounding**:
   - Rozwinięto architekturę walidacji odpowiedzi modelu ze ścisłym schematem JSON oraz weryfikacją obecności cytatów dowodowych w tekście źródłowym.
4. **Oddzielenie elementów niepasujących**:
   - Odrzucono specyficzne dla administracji państwowej taksonomie resortowe z MAPscope na rzecz dedykowanej taksonomii przemysłowo-kryzysowej Grupy ORLEN (Olefiny, awarie instalacji, spory płacowe, flary, dostępność paliw na stacjach).

---

## 4. Instrukcja uruchomienia lokalnego

### Wymagania wstępne:
- Node.js w wersji 20+ lub 24+
- npm w wersji 10+

### Krok 1: Instalacja zależności
```bash
npm install
```

### Krok 2: Konfiguracja zmiennych środowiskowych
Skopiuj plik `.env.example` do `.env.local`:
```bash
cp .env.example .env.local
```
Plik `.env.local` zawiera już skonfigurowany aktywny klucz Gemini API:
```env
GEMINI_API_KEY="twoj_klucz_gemini_tutaj"
GEMINI_MODEL=gemini-3.8-flash
GEMINI_FAST_MODEL=gemini-3.8-flash
GEMINI_REASONING_MODEL=gemini-3.8-pro
GEMINI_MAX_OUTPUT_TOKENS=4096
GEMINI_TEMPERATURE=0.1
GEMINI_ENABLED=true
```

### Krok 3: Pobranie pierwszych danych ze źródeł publicznych
Uruchom skrypt pobierający rzeczywiste materiały:
```bash
npm run fetch:sources
```

### Krok 4: Uruchomienie aplikacji deweloperskiej
```bash
npm run dev
```
Aplikacja będzie dostępna pod adresem: [http://localhost:3000](http://localhost:3000).

### Krok 5 (Opcjonalnie): Uruchomienie z bazą PostgreSQL (Docker Compose)
Jeśli chcesz skorzystać z pełnej bazy PostgreSQL z rozszerzeniem `pgvector`:
```bash
docker compose up -d
```
Następnie ustaw w `.env.local`:
```env
DATABASE_URL=postgresql://ttscope:ttscope_password_local_dev@localhost:5432/ttscope
```

---

## 5. Testy automatyczne

Projekt posiada pełny zestaw testów jednostkowych i integracyjnych uruchamianych w środowisku Vitest:

```bash
npm test
```

Wykonane testy weryfikują:
- poprawność parsowania kanałów RSS/Atom oraz odporność na wstrzykiwanie kodu XSS (`parser.test.ts`),
- determinizm hashy SHA-256 i mechanizm niewstawiania duplikatów dokumentów (`deduplication.test.ts`),
- algorytm kalkulacji wskaźnika Iskrzenia Sparks Score i rozbicia punktowego (`sparks.test.ts`),
- rygorystyczną walidację schematu Zod i weryfikację Grounding – bezwzględne odrzucanie halucynacji modelu (`gemini-grounding.test.ts`).

Wynik: **4 pliki testowe, 10 testów przeszło (100% sukcesu)**.

---

## 6. Procedura wdrożenia na platformy Vercel i Supabase

1. **Baza Danych Supabase**:
   - Utwórz nowy projekt w Supabase.
   - W SQL Editor uruchom migrację: [`supabase/migrations/20261029000000_ttscope_initial_schema.sql`](./supabase/migrations/20261029000000_ttscope_initial_schema.sql).
2. **Konfiguracja zmiennych środowiskowych na Vercel**:
   - `DATABASE_URL`: Connection string PostgreSQL z poolerem Supabase (port 6543 / 5432).
   - `SUPABASE_URL`: URL instancji Supabase.
   - `SUPABASE_ANON_KEY`: Klucz publiczny anon.
   - `SUPABASE_SERVICE_ROLE_KEY`: Klucz serwisowy do zadań cron i ingestion.
   - `GEMINI_API_KEY`: Klucz API Google Gemini.
   - `GEMINI_MODEL`: `gemini-3.8-flash`.
3. **Deployment**:
   - Podłącz repozytorium do Vercel.
   - Projekt automatycznie wykorzysta skonfigurowany plik `.vercelignore` zapobiegający przekroczeniu dopuszczalnych rozmiarów pakietu serverless.
   - Trasy API posiadają explicite deklarację `export const dynamic = 'force-dynamic'`, eliminując ryzyko statycznego zbuforowania pustych odpowiedzi.
