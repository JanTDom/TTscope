---
name: ttscope-perfect-layouts-and-craft
description: Standard budowania perfekcyjnych, luksusowych layoutów stron i komponentów intelligence w TTscope. Anti-generic UI, Dark Editorial, zero emoji, modularny Bento Grid, płynna typografia, OKLCH, stan zero-mock oraz WCAG 2.2 AA.
---

# Perfekcyjne Layouty i Rzemiosło Interfejsu (TTscope Layout & UI Craft)

Ten skill definiuje zasady projektowania i budowy bezbłędnych, maksymalnie ergonomicznych i użytecznych layoutów stron dla systemu wywiadowczego TTscope. Odrzuca szablonowy wygląd AI i tandetne wzorce SaaS na rzecz dopracowanego, luksusowego interfejsu gabinetowego i analitycznego (Command Center / Situational Room).

---

## 1. Filozofia wizualna i kierunek artystyczny (Dark Editorial)

Interfejs TTscope to narzędzie dla analityków ds. ryzyka, menedżerów komunikacji i oficerów bezpieczeństwa korporacyjnego. Musi wzbudzać zaufanie, powagę i maksymalną przejrzystość pod presją czasu.

### Kluczowe zasady estetyczne:
1. **Głęboka, bazaltowa paleta barw (OKLCH)**:
   - Tła: zamiast płaskiej czerni `#000000` stosuj głęboki grafit i bazalt:
     - Tło bazowe: `oklch(0.14 0.015 260)` (bardzo ciemny grafit z chłodnym tonem).
     - Karty i panele bento: `oklch(0.18 0.018 260)` z subtelnym obramowaniem `oklch(0.26 0.02 260)`.
     - Akcent alarmowy / iskrzenia: `oklch(0.62 0.22 25)` (wyrazisty bursztyn/szkarłat dla alertów krytycznych).
     - Akcent stabilny / neutralny: `oklch(0.68 0.14 150)` (subtelny szmaragd dla statusu stabilnego).
2. **Całkowity zakaz emotikonów (Zero Emojis in Professional UI)**:
   - Żadnych ikonek rakiet 🚀, ognia 🔥, ostrzeżeń ⚠️ w tytułach ani kartach.
   - Wszelkie wskaźniki wizualne realizowane są za pomocą precyzyjnych wektorów SVG (Lucide Icons) oraz geometrycznych mikro-badgy typograficznych (`UPPERCASE`, drobny font `text-[11px] font-mono tracking-widest`).
3. **Polska kultura typograficzna**:
   - Nagłówki w stylu zdań: tylko pierwsza litera i nazwy własne wielką literą (np. *„Wykryte iskrzenia w zakładzie produkcyjnym w Płocku”* zamiast błędnego angielskiego Title Case).
   - Skrótowce zawsze wielkimi literami: **ORLEN**, **PAP**, **BIP**, **ESPI**, **BHP**, **MZZPRC**, **NSZZ**.

---

## 2. Architektura Bento Grid dla Centrum Sytuacyjnego

Każdy główny widok dashboardu TTscope budowany jest w modularnej siatce bento o zróżnicowanej wadze informacji:

```
+-------------------------------------------------------------------------------+
| TOPBAR: Status globalny | Wskaźnik Iskrzenia (Sparks Index) | Ostatnia aktualizacja |
+-------------------------------------------------------+-----------------------+
| GŁÓWNY RADAR DYFUZJI (Diffusion Matrix & Live Stream)   | CENTRUM ALERTÓW       |
| - Strumień sygnałów na żywo z filtrami kategoryzacji    | - Pilne iskrzenia     |
| - Wizualizacja przenikania: wewnątrz -> media          | - Zakłady objęte      |
| - Wykres tempa narracji (velocity & sentiment)         |   napięciem (Płock,   |
|                                                       |   Gdańsk, Włocławek)  |
+-------------------------------------------------------+-----------------------+
| ANALIZA RELACJI I PODMIOTÓW                           | KALENDARZ I AGENDY    |
| - Związki zawodowe, zaangażowane media, nazwiska      | - Spory zbiorowe      |
| - Oś czasu incydentów (Interactive Timeline)          | - Posiedzenia zarządu |
+-------------------------------------------------------+-----------------------+
```

### Wzorce implementacji w Tailwind CSS:
- Grid responsywny: `grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-4 lg:gap-6`.
- Panele o zaokrągleniu `rounded-xl` lub `rounded-2xl` z subtelnym wewnętrznym cieniem `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]`.
- Czytelny kontrast tekstu: minimum 7:1 dla tekstu podstawowego (zgodność z WCAG 2.2 AAA dla małych czcionek).

---

## 3. Bezwzględny zakaz fejków i mocków oraz architektura czystego stanu (Zero Mock Policy)

System TTscope jest narzędziem operacyjnym klasy wywiadowczej – **żadna wersja aplikacji (ani deweloperska, ani testowa, ani produkcyjna) nie może zawierać fejków, mocków, halucynacji ani sztywnych danych pokazowych**. Niedopuszczalne jest wstrzykiwanie sztucznych artykułów, zmyślonych cytatów czy sfabrykowanych incydentów kryzysowych.

Każdy komponent widoku musi bezwzględnie posiadać 3 autentyczne stany:

1. **Stan ładowania (Loading Skeleton)**:
   - Dedykowany komponent szkieletowy odzwierciedlający dokładną geometrię karty docelowej z płynną animacją pulsu `animate-pulse bg-white/5`.
2. **Stan pusty (Graceful Zero-State)**:
   - Wyświetlany, gdy baza danych jest świeża lub w danym filtrze/przedziale czasowym nie odnotowano incydentów.
   - Zawiera precyzyjną informację tekstową: co jest monitorowane, jaki jest stan potoku ingestion, kiedy odbyło się ostatnie sprawdzenie i przycisk do wymuszenia odświeżenia lub zmiany kryteriów.
   - Zero dekoracyjnych rysunków komiksowych – ascetyczna, elegancka ikona techniczna z subtelnym, rzeczowym opisem.
3. **Stan błędu (Error Recovery State)**:
   - Rzeczowa informacja o przyczynie problemu (np. brak łączności z potokiem danych Supabase).
   - Dostępny przycisk akcji naprawczej (`Ponów próbę`).
   - Bez wycieku technicznych stack trace'ów do interfejsu użytkownika.

---

## 4. Mikrointerakcje i fizyka interfejsu

- Reakcja na kliknięcie i najechanie kursorem (hover): czas trwania \(\le 120\text{ ms}\) z krzywą `cubic-bezier(0.16, 1, 0.3, 1)`.
- Zmiany stanu filtrów i otwieranie szczegółów incydentu wykorzystują płynne przejścia lub View Transitions API.
- Wszelkie animacje muszą być obudowane w media query `@media (prefers-reduced-motion: reduce)`, wyłączające ruch na rzecz natychmiastowych przejść krycia (opacity fade).
