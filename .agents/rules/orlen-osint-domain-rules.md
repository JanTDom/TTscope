# Reguły Domenowe OSINT i Grupy Orlen (TTscope)

Niniejsze reguły obowiązują przy tworzeniu każdego modułu analitycznego, parsera i wizualizacji w systemie TTscope:

1. **Poprawność nazewnictwa jednostek i zakładów**:
   - Zawsze używaj oficjalnych i precyzyjnych nazw zakładów: *Kompleks Rafineryjno-Petrochemiczny w Płocku*, *Rafineria Gdańska*, *Anwil S.A. we Włocławku*, *Orlen Południe (Trzebinia / Jedlicze)*, *Orlen Unipetrol (Litvínov / Kralupy)*, *Orlen Lietuva (Możejki)*.
   - Podmioty segmentowe: *Energa S.A.*, *PGNiG (Grupa PGNiG)*, *Orlen Synthos Green Energy (OSGE)*, *Orlen Paliwa*, *Orlen KolTrans*, *Orlen Serwis*.
2. **Kategoryzacja źródeł**:
   - Każdy materiał musi mieć precyzyjnie określone źródło:
     - `official_orlen`: Biuro prasowe, relacje inwestorskie (ESPI/EBI), BIP.
     - `internal_worker`: Związki zawodowe (NSZZ „Solidarność”, MZZPRC), apele i pisma pracownicze, fora załóg, zawiadomienia o sporach zbiorowych.
     - `media_general`: PAP, ogólnokrajowa prasa i portale.
     - `media_regional`: Lokalne serwisy z Płocka (PetroNews, Tygodnik Płocki), Trójmiasta, Włocławka, Ostrołęki.
     - `media_industry`: Portale paliwowo-energetyczne (WNP, Energetyka24, BiznesAlert, CIRE).
     - `social_media`: Dyskusje na X/Twitter, LinkedIn, grupy lokalne.
3. **Analiza dyfuzji i rozbieżności**:
   - Zawsze mierz różnicę czasu (\(\Delta t\)) między pierwszym sygnałem (zwłaszcza wewnętrznym lub wyciekiem) a jego publikacją w mediach.
   - Oznaczaj zjawisko „reinterpretacji narracji” (gdy wydźwięk oświadczenia spółki zostaje odwrócony przez analityków lub opinię publiczną).
4. **Klasyfikacja iskrzeń**:
   - Każde iskrzenie musi być przypisane do kategorii: `labor_dispute` (spory pracownicze), `local_community` (mieszkańcy i samorządy), `environmental_odor_flare` (instalacje, odory, flary), `plant_outage` (awarie i postoje), `management_conflict` (napięcia zarządcze), `market_supply` (stacje i dostępność paliw).
