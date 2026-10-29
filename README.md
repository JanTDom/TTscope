# TTscope — System Monitoringu Wywiadowczego i Detekcji Iskrzeń Grupy Orlen

**TTscope** to wyspecjalizowana platforma analityczno-wywiadowcza (OSINT & Media Intelligence) zbudowana w architekturze **Next.js (Vercel) + Supabase (PostgreSQL + pgvector)**, przeznaczona do ciągłego monitoringu ekosystemu informacyjnego **Grupy Orlen** oraz jej podmiotów zależnych.

---

## Główne zadania i moduły operacyjne

1. **Wychwytywanie komunikatów zewnętrznych i wewnętrznych Grupy Orlen**:
   - Komunikaty oficjalne: Biuro Prasowe, Relacje Inwestorskie (ESPI/EBI), BIP, portale zakupowe i przetargowe.
   - Sygnały wewnętrzne i pracownicze: Związki zawodowe (NSZZ „Solidarność” PKN Orlen, MZZPRC, OPZZ), biuletyny zakładowe, fora załóg, zawiadomienia o sporach zbiorowych, komunikaty BHP.
2. **Dyfuzja informacji i detekcja wycieków (Diffusion Matrix)**:
   - Śledzenie przenikania informacji: co z sygnałów wewnętrznych i przecieków przedostaje się do mediów regionalnych i ogólnokrajowych.
   - Badanie opóźnienia (\(\Delta t\)) oraz analiza transformacji narracji przez media.
3. **Radar mediów i mediów społecznościowych**:
   - Agencje informacyjne (PAP) oraz serwisy ogólnopolskie i gospodarcze.
   - Prasa i portale regionalne (rejon Płocka, Trójmiasta, Włocławka, Ostrołęki, Czech, Litwy).
   - Portale branżowe (energetyka, paliwa, chemia) oraz media społecznościowe (X/Twitter, LinkedIn, grupy lokalne mieszkańców).
4. **Wczesne wykrywanie iskrzeń i kryzysów (Sparks & Crisis Index)**:
   - Iskrzenia pracownicze (napięcia płacowe, spory zbiorowe, BHP).
   - Iskrzenia lokalne (flary rafineryjne, uciążliwości zapachowe, protesty samorządowe).
   - Iskrzenia operacyjne i rynkowe (awarie instalacji, anomalie na stacjach paliw, zmiany zarządcze).

---

## Architektura i wdrożenie

- **Frontend**: Next.js App Router, Tailwind CSS (paleta OKLCH, styl Dark Editorial / Situational Room, zero emoji, WCAG 2.2 AA).
- **Backend & Baza Danych**: Supabase PostgreSQL z `pgvector` (analiza semantyczna i dopasowywanie wycieków) oraz `pg_trgm` (fuzzy text search).
- **Hosting & Serverless**: Vercel (Edge & Serverless API Routes z poszanowaniem `force-dynamic`).
- **Integralność danych (Zero Mock Policy)**: Bezwzględny zakaz stosowania fejków, mocków, halucynacji i sztywnych danych demonstracyjnych w jakiejkolwiek wersji aplikacji. Prezentowane są wyłącznie faktyczne sygnały z procesów ingestion; brak danych obsługiwany jest przez produkcyjne stany zerowe (Graceful Zero-States).

---

## Zasady i instrukcje dla agentów

Przed przystąpieniem do prac programistycznych zapoznaj się z:
- [`AGENTS.md`](./AGENTS.md) — reguły kardynalne projektu i standard inżynierski Fable 5.1.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — szczegółowy model bazy danych i potoki przetwarzania.
- [`.agents/skills/`](./.agents/skills/) — dedykowane skille domenowe, kryzysowe, layoutowe i architektoniczne.
- [`.agents/rules/`](./.agents/rules/) — reguły nazewnictwa, interfejsu i integracji Vercel/Supabase.
