# Reguły Rzemiosła Layoutu i Interfejsu (TTscope UI Craft)

Niniejsze reguły obowiązują bezwzględnie przy tworzeniu widoków, komponentów i stylów w TTscope:

1. **Całkowity zakaz emotikonów w UI**:
   - Nigdy nie używaj znaków emoji (🚀, 💡, ⚡, 🔥, ⚠️, 🚨) w interfejsie użytkownika, na kartach, przyciskach, badge'ach ani w nagłówkach.
   - Używaj wyłącznie ikon Lucide SVG oraz typograficznych etykiet statusowych (`font-mono text-[11px] tracking-wider uppercase`).
2. **Polska kultura typograficzna**:
   - Wszystkie nagłówki (H1–H4), tytuły kart i sekcji formatuj według zasad polskiej gramatyki (Sentence case: wielka litera tylko na początku i w nazwach własnych).
   - Skrótowce zawsze wielkimi literami: **ORLEN**, **PAP**, **BIP**, **ESPI**, **EBI**, **TK**, **SN**, **KRS**, **PKW**, **TVP**, **PiS**, **PO**, **UE**, **MSWiA**, **KAS**, **BHP**, **MZZPRC**, **NSZZ**.
3. **Bezwzględny zakaz fejków, mocków, halucynacji i sztywnych danych pokazowych**:
   - Żadna z wersji aplikacji (developerska, staging, produkcyjna) nie może zawierać sfabrykowanych artykułów, fikcyjnych incydentów, halucynowanych cytatów ani sztywno zakodowanych danych demonstracyjnych (`dummy data`, `fixtures`, `mock alerts`).
   - Wszelkie prezentowane dane muszą pochodzić w 100% z rzeczywistych potoków ingestion (baza danych Supabase, rzeczywiste kanały Grupy Orlen, PAP, media, social media).
   - W przypadku braku wpisów dla wybranego filtra lub świeżej bazy, komponent renderuje czysty, produkcyjny stan zerowy (`Graceful Zero-State`) z informacją o monitorowanym obszarze.
   - Każdy komponent posiada 3 pełne stany:
     1. Szkielet ładowania (`Loading Skeleton`).
     2. Pusty stan (`Graceful Zero-State`) z informacją i kontekstem.
     3. Stan błędu (`Error Recovery`) z przyciskiem ponowienia.
4. **Paleta barw i estetyka**:
   - Styl: Dark Editorial / Executive Command Center na bazie przestrzeni barw OKLCH.
   - Tła: głęboki grafit i bazalt zamiast ostrej czerni; brak jaskrawych neonowych gradientów typowych dla szablonów AI.
   - Dostępność: kontrast tekstu i wskaźników zgodny z normą WCAG 2.2 AA / AAA.
   - Płynny ruch i obsługa `prefers-reduced-motion`.
