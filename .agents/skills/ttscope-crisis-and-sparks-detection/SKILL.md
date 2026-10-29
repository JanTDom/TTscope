---
name: ttscope-crisis-and-sparks-detection
description: Algorytmy, scoring i wzorce detekcji iskrzeń pracowniczych, lokalnych i technologicznych w Grupie Orlen. Wykorzystuj do analizy ryzyka kryzysowego, kalkulacji Sparks Index i generowania alertów wczesnego ostrzegania.
---

# Silnik Detekcji Iskrzeń i Kryzysów (Sparks & Crisis Early Warning Engine)

Ten skill zawiera reguły analityczne, algorytmy scoringowe i wzorce klasyfikacji sygnałów ostrzegawczych w Grupie Orlen. Stanowi fundament logiki wczesnego ostrzegania przed eskalacją kryzysów.

---

## 1. Typologia Iskrzeń w Grupie Orlen

W systemie TTscope pojęcie „iskrzenia” (Spark) oznacza wczesny, zlokalizowany lub rozproszony sygnał napięcia, który bez odpowiedniej reakcji może przerodzić się w pełnoskalowy kryzys medialno-reputacyjny, operacyjny lub polityczny.

### Kategoria 1: Iskrzenia pracownicze i związkowe (Labor Sparks)
- **Symptomy wczesne**:
  - Zerwanie lub przedłużający się impas w rokowaniach płacowych (wskaźnik inflacji vs oferta pracodawcy).
  - Pisma i uchwały komitetów protestacyjnych (NSZZ „Solidarność”, MZZPRC).
  - Skargi na harmonogramy pracy, nadgodziny, braki kadrowe na instalacjach ciągłego ruchu.
  - Anonimowe wpisy pracowników o mobbingu, faworyzowaniu lub nieprzestrzeganiu procedur BHP.
  - Wejście w formalny spór zbiorowy lub zapowiedź referendum strajkowego.
- **Krytyczność**: Średnia do Wysokiej (może natychmiast wpłynąć na ciągłość produkcji i bezpieczeństwo strategiczne).

### Kategoria 2: Iskrzenia lokalne i środowiskowe (Local & Community Sparks)
- **Symptomy wczesne**:
  - Niekontrolowana praca pochodni (flarowanie) w Płocku lub Gdańsku po zmroku lub w weekendy.
  - Zgłoszenia mieszkańców dotyczące smrodu węglowodorów, uciążliwości pyłowych lub hałasu.
  - Oświadczenia władz samorządowych (prezydent Płocka, prezydent Włocławka, radni miejscy).
  - Protesty wokół inwestycji (np. rozbudowa kompleksu Olefiny III, protesty mieszkańców wobec tras rurociągów lub sieci Energi).
- **Krytyczność**: Średnia do Bardzo Wysokiej (szybka wiralność materiałów wideo w mediach społecznościowych).

### Kategoria 3: Iskrzenia technologiczno-operacyjne (Operational & Plant Sparks)
- **Symptomy wczesne**:
  - Awaryjne postoje instalacji hydrokrakingu, reformingu, instalacji nawozowych w Anwilu.
  - Odnotowanie interwencji Państwowej Straży Pożarnej lub zakładowej straży pożarnej.
  - Przerwy w odbiorze ropy lub gazu, anomalie ciśnieniowe w rurociągach PERN/Gaz-System.
  - Przestoje logistyczne: braki cystern kolejowych Orlen KolTrans, zatory na terminalach morskich.
- **Krytyczność**: Krytyczna (zagrożenie dla łańcucha dostaw i bezpieczeństwa energetycznego kraju).

### Kategoria 4: Iskrzenia zarządcze, audytowe i rynkowe (Governance & Market Sparks)
- **Symptomy wczesne**:
  - Publikacje dziennikarzy śledczych dotyczące przeszłych lub bieżących kontraktów i fuzji.
  - Niespodziewane dymisje w zarządach spółek zależnych (Energa, Anwil, PGNiG).
  - Doniesienia o brakach paliwa na stacjach, tzw. awariach dystrybutorów lub sztucznym kształtowaniu cen.
  - Działania organów regulacyjnych (UOKiK, URE, KNF, NIK, prokuratura).
- **Krytyczność**: Wysoka do Krytycznej.

---

## 2. Wskaźnik Zagrożenia i Iskrzenia (Sparks Score)

Dla każdego sygnału i wątku narracyjnego obliczany jest wielowymiarowy wskaźnik zagrożenia `Sparks Score` (skala 0.00 – 100.00):

\[
\text{Sparks Score} = w_s \cdot S_{\text{sentiment}} + w_v \cdot S_{\text{virality}} + w_a \cdot S_{\text{authority}} + w_t \cdot S_{\text{topic\_weight}}
\]

Gdzie:
- \(S_{\text{sentiment}}\) (0–100): Odwrócony wskaźnik sentymentu (im bardziej negatywny, tym wyższy wynik).
- \(S_{\text{virality}}\) (0–100): Tempo przyrostu wzmianek, udostępnień i komentarzy w jednostce czasu.
- \(S_{\text{authority}}\) (0–100): Waga źródła (np. oficjalny komunikat lidera związku = 85, anonimowy komentarz = 25, publikacja PAP = 95).
- \(S_{\text{topic\_weight}}\) (0–100): Waga kategorii tematycznej (BHP/Wypadek = 100, Spór zbiorowy = 85, Uciążliwość zapachowa = 65, Rutynowy komunikat = 10).
- Wagi: \(w_s = 0.25\), \(w_v = 0.30\), \(w_a = 0.20\), \(w_t = 0.25\).

### Progi alarmowe:
| Zakres Sparks Score | Poziom (Severity) | Status operacyjny | Wymagane działanie |
|---|---|---|---|
| **0.00 – 29.99** | Rutynowy (Routine) | Tło informacyjne | Archiwizacja i monitoring pasywny |
| **30.00 – 59.99** | Monitorowany (Monitored) | Potencjalne zarzewie | Obserwacja dynamiki co 30 min |
| **60.00 – 84.99** | Iskrzenie (Sparks Alert) | Aktywne iskrzenie | Wpis do rejestru incydentów, alert do analityka |
| **85.00 – 100.00** | Kryzys krytyczny (Critical Crisis) | Eskalacja kryzysowa | Natychmiastowy alert PUSh/SMS, generowanie briefu kryzysowego |

---

## 3. Algorytm Badania Dyfuzji (Leakage & Penetration Diff)

Dyfuzja śledzi, jak sygnał wewnętrzny przechodzi do sfery publicznej:
1. **Identyfikacja Sygnału Pierwotnego (\(S_0\))**:
   - Wykrycie sygnału o kategorii `internal_worker` lub nieoficjalnego dokumentu w chwili \(t_0\).
2. **Korelacja Wektorowa i Pełnotekstowa**:
   - Dla każdego nowego artykułu prasowego lub wpisu w social media w chwili \(t_i\) wyliczane jest podobieństwo cosinusowe:
     \[
     \text{Similarity}(E_{S_0}, E_{S_i}) = \frac{E_{S_0} \cdot E_{S_i}}{\|E_{S_0}\| \|E_{S_i}\|}
     \]
   - Jeśli \(\text{Similarity} > 0.82\), artykuł zostaje przypisany jako punkt w łańcuchu dyfuzji.
3. **Kalkulacja Opóźnienia i Wektora Penetracji**:
   - Obliczenie \(\Delta t = t_i - t_0\) (czas, po jakim wyciek trafił do mediów).
   - Oznaczenie etapu penetracji: `internal_only` \(\rightarrow\) `regional_press` \(\rightarrow\) `national_media` \(\rightarrow\) `viral_social`.
