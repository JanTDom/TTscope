# Reguły kardynalne i przewodnik projektu TTscope

Niniejszy dokument (`AGENTS.md`) stanowi najwyższy autorytet reguł w repozytorium **TTscope**. Każdy agent pracujący nad projektem musi bezwzględnie przestrzegać poniższych wytycznych, standardu inżynierskiego **Fable 5.1** oraz protokołu operacyjnego.

---

## 1. Misja i domena systemu TTscope

**TTscope** to zaawansowany system monitoringu wywiadowczego (OSINT & Media Intelligence Engine) dedykowany analizie ekosystemu **Grupy Orlen** oraz podmiotów zależnych (m.in. Energa, PGNiG, Anwil, Lotos, Orlen Unipetrol, Orlen Lietuva, Orlen Synthos Green Energy, spółki serwisowe i logistyczne).

### Podstawowe zadania operacyjne systemu:
1. **Wychwytywanie komunikatów zewnętrznych i wewnętrznych Grupy Orlen**:
   - Komunikaty zewnętrzne: Biuro Prasowe, Relacje Inwestorskie (ESPI/EBI), Biuletyn Informacji Publicznej (BIP), oświadczenia zarządu, oficjalne przetargi i ogłoszenia handlowe.
   - Komunikaty i sygnały wewnętrzne: publikacje związków zawodowych (NSZZ „Solidarność” PKN Orlen, Międzyzakładowy Związek Zawodowy Pracowników Ruchu Ciągłego - MZZPRC, OPZZ, kadry inżynieryjne), biuletyny zakładowe, komunikaty BHP, lokalne tablice ogłoszeń, fora załóg, przetargi wewnętrzne i zawiadomienia o sporach zbiorowych.
2. **Dyfuzja informacji (Leakage & Penetration Diff)**:
   - Śledzenie korelacji i przepływu narracji: co z komunikatów wewnętrznych lub nieoficjalnych przecieków przedostaje się do mediów publicznych i w jakim czasie (\(\Delta t\)).
   - Analiza transformacji przekazu: jak oficjalna narracja Orlenu jest reinterpretowana przez media branżowe, ogólnokrajowe oraz regionalne.
3. **Radar mediów i mediów społecznościowych**:
   - Monitoring ciągły: PAP, media ogólnopolskie, prasa i portale regionalne (rejon Płocka, Włocławka, Trójmiasta, Ostrołęki, Czech, Litwy), portale branżowe (energetyka, paliwa, chemia, transport).
   - Social media: X (Twitter), LinkedIn, Facebook (lokalne grupy mieszkańców wokół rafinerii i zakładów produkcyjnych), fora dyskusyjne, serwisy branżowe.
4. **Wczesne wykrywanie iskrzeń i kryzysów (Early Warning Engine)**:
   - **Iskrzenia pracownicze**: spory zbiorowe, postulaty płacowe, napięcia ze związkami zawodowymi, warunki pracy, BHP, reorganizacje kadrowe.
   - **Iskrzenia lokalne**: uciążliwości zapachowe i środowiskowe, awarie instalacji, pochodnie/flary, protesty mieszkańców, relacje z samorządami wokół zakładów produkcyjnych (Płock, Gdańsk, Włocławek, Trzebinia, Jedlicze).
   - **Iskrzenia rynkowe i zarządcze**: anomalie cenowe na stacjach, dostępność paliw, kontrowersje wokół fuzji i dostawców, bezpieczeństwo infrastruktury krytycznej.

---

## 2. Stos technologiczny i zasady infrastruktury

Projekt budowany jest w architekturze **Vercel + Supabase**:

### Frontend & Aplikacja (Vercel):
- **Framework**: Next.js (App Router, Server Components + Suspense dla wydajnego streamingu danych wywiadowczych).
- **Język**: TypeScript w trybie najostrzejszym (`strict: true`, zero `any`).
- **Styling**: Tailwind CSS z paletą barw OKLCH, styl Dark Editorial / Intelligence Room, bez szablonowego wyglądu AI (zakaz typowych gradientów fiolet-cyan).
- **Ikony**: Lucide Icons wyłącznie (bezwzględny zakaz emotikonów w interfejsie).
- **Ruch**: Płynne, fizyczne mikrointerakcje z zachowaniem `prefers-reduced-motion`.
- **Deployment**: Vercel Serverless & Edge. Wymóg deklarowania `export const dynamic = 'force-dynamic'` i `export const revalidate = 0` na trasach API przetwarzających dane czasu rzeczywistego.

### Backend & Baza Danych (Supabase):
- **Baza danych**: PostgreSQL z rozszerzeniami:
  - `pgvector` do semantycznego wyszukiwania narracji, wykrywania duplikatów i badania wektorowego podobieństwa przecieków do artykułów prasowych.
  - `pg_trgm` do błyskawicznego wyszukiwania pełnotekstowego i fuzzy matching podmiotów, nazwisk i fraz kluczowych.
- **Bezpieczeństwo danych (RLS)**: Row Level Security włączone na każdej tabeli. Klucz `service_role` używany wyłącznie po stronie bezpiecznego backendu i zadań ingestion, nigdy nieeksponowany w przeglądarce.
- **Realtime**: Supabase Realtime do natychmiastowego strumieniowania pojawiających się alertów kryzysowych i nowych materiałów na żywo w interfejsie analityka.
- **Ingestion Pipeline**: Asynchroniczne zadania pobierania danych (Vercel Cron / Supabase Webhooks) z wbudowanym mechanizmem ponawiania prób (exponential backoff) i poszanowaniem limitów zapytań (rate limiting).

---

## 3. Rygorystyczny standard jakości (Fable 5.1)

1. **Prawda w faktach i dowodach**:
   - Status zadania raportowany tylko na podstawie wykonanych testów i komend w bieżącej sesji.
   - Żadnych deklaracji „działa” bez podania komendy i jej wyniku liczbowego.
2. **Czystość kodu i zero śmieci**:
   - Żadnych placeholderów, `TODO`, zakomentowanego kodu ani wersji roboczych.
   - Żadnych danych próbnych (mocków) w widokach produkcyjnych. Interfejs implementuje trzy pełne stany: ładowania (szkielety), pusty (elegancki zero-state z kontekstem) oraz błędu (zrozumiały komunikat i opcja ponowienia).
3. **Polska kultura językowa i typograficzna**:
   - Zero emoji w całym interfejsie użytkownika, nagłówkach, raportach i powiadomieniach.
   - Polskie nagłówki formatowane jako zdania (Sentence case: tylko pierwsza litera i nazwy własne wielką literą).
   - Skrótowce zawsze wielkimi literami: **ORLEN**, **PAP**, **BIP**, **ESPI**, **EBI**, **TK**, **SN**, **KRS**, **PKW**, **TVP**, **PiS**, **PO**, **UE**, **MSWiA**, **KAS**, **BHP**, **MZZPRC**, **NSZZ**.

---

## 4. Architektura interfejsu (UX/UI Intelligence Room)

Układ stron TTscope musi oferować maksymalną ergonomię poznawczą dla analityka kryzysowego i decydenta:
- **Widok 1: Executive Dashboard (Centrum Sytuacyjne)**:
  - Indeks Iskrzeń (Sparks Index) – zagregowany wskaźnik napięcia w podziale na obszary: pracownicze, lokalne, środowiskowe, rynkowe.
  - Dynamiczny Radar Narracji (Live Stream) z filtrami źródła (wewnętrzne, oficjalne, media, social).
- **Widok 2: Diffusion Matrix (Matryca Dyfuzji)**:
  - Wizualizacja rozprzestrzeniania się komunikatów: od wewnętrznych sygnałów, przez oświadczenia spółki, po artykuły w prasie i dyskusje w social media.
  - Wykrywanie wycieków i opóźnienia reakcji komunikacyjnej.
- **Widok 3: Crisis & Sparks Deep-Dive (Analiza Incydentu)**:
  - Oś czasu (Timeline) incydentu z przypisanymi cytowaniami, aktorami i dynamiką sentymentu.
  - Kluczowe cytaty, podmioty zaangażowane i poziom ryzyka eskalacji.

---

## 5. Protokół startu każdej sesji

Zanim przystąpisz do realizacji zadania:
1. Sprawdź status repozytorium (`git status`) i upewnij się, że pracujesz na czystej gałęzi roboczej.
2. Przeczytaj pliki specyfikacji w katalogu `docs/` oraz dedykowane skille w `.agents/skills/`.
3. Uruchom istniejące testy przed wprowadzeniem zmian.
4. Zmiany wdrażaj atomowo, z dokładną weryfikacją kompilacji i testów.
