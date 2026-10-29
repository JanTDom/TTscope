import { dbRepo } from "../db";
import type { Document, Event, Facility } from "../db/types";
import { calculateSparksScore } from "../scoring/sparks";

export interface CoherentTopicRule {
  id: string;
  title: string;
  category: "labor" | "local" | "market" | "governance" | "technology";
  facilityLocation?: string;
  matcher: (doc: Document) => boolean;
}

export const COHERENT_TOPIC_RULES: CoherentTopicRule[] = [
  {
    id: "diff_ec_gdynia_moc",
    title: "Rozbudowa mocy Elektrociepłowni Gdyńskiej o 110 MW i dekarbonizacja Trójmiasta",
    category: "local",
    facilityLocation: "Gdańsk",
    matcher: (d) => {
      const text = (d.title + " " + (d.content || "")).toLowerCase();
      const hasGdynia = text.includes("gdyńsk") || text.includes("gdynia");
      const hasPower = text.includes("elektrociepłown") || text.includes("110 mw") || text.includes("ciepłownictw");
      return hasGdynia && hasPower && !text.includes("trefl") && !text.includes("mecz");
    },
  },
  {
    id: "diff_energa_gimnastyka",
    title: "Sponsoring Polskiego Związku Gimnastycznego przez Grupę Energa (2026–2028)",
    category: "governance",
    facilityLocation: "Gdańsk",
    matcher: (d) => {
      const text = (d.title + " " + (d.content || "")).toLowerCase();
      return (
        (text.includes("gimnastycz") || text.includes("gymnastics")) &&
        (text.includes("energa") || text.includes("pzg") || text.includes("sponsorem"))
      );
    },
  },
  {
    id: "diff_norway_afrodyta_gas",
    title: "Odkrycie i podwojenie szacunków złoża gazu Afrodyta na Szelfie Norweskim",
    category: "market",
    facilityLocation: undefined,
    matcher: (d) => {
      const text = (d.title + " " + (d.content || "")).toLowerCase();
      const hasNorway = text.includes("norwegi") || text.includes("norway") || text.includes("afrodyta");
      const hasGas = text.includes("złoż") || text.includes("gaz") || text.includes("odkryc");
      return hasNorway && hasGas && text.includes("orlen");
    },
  },
  {
    id: "diff_prokuratura_dokumenty_zarzad",
    title: "Zawiadomienie do prokuratury ws. ujawnienia poufnych dokumentów koncernu",
    category: "governance",
    facilityLocation: "Płock",
    matcher: (d) => {
      const text = (d.title + " " + (d.content || "")).toLowerCase();
      return (
        (text.includes("prokuratury") || text.includes("prokuratur")) &&
        (text.includes("obajtek") || text.includes("poufne") || text.includes("tajemnic"))
      );
    },
  },
  {
    id: "diff_paliwa_drozyzna_listopad",
    title: "Dynamika cen paliw na stacjach: silny wzrost cen diesla przed 1 listopada",
    category: "market",
    facilityLocation: undefined,
    matcher: (d) => {
      const text = (d.title + " " + (d.content || "")).toLowerCase();
      const hasFuel =
        text.includes("ceny paliw") ||
        text.includes("cena paliw") ||
        (text.includes("diesel") && text.includes("droższy"));
      const hasContext =
        text.includes("stacjach") ||
        text.includes("listopada") ||
        text.includes("reflex") ||
        text.includes("drożyzna") ||
        text.includes("spadną");
      return hasFuel && hasContext;
    },
  },
  {
    id: "diff_baltic_power_turbiny",
    title: "Morska farma wiatrowa Baltic Power — zakończenie montażu 76 turbin na Bałtyku",
    category: "technology",
    facilityLocation: "Gdańsk",
    matcher: (d) => {
      const text = (d.title + " " + (d.content || "")).toLowerCase();
      return (
        text.includes("baltic power") &&
        (text.includes("turbin") ||
          text.includes("zainstalowan") ||
          text.includes("1,2 gw") ||
          text.includes("kampania morska") ||
          text.includes("northland") ||
          text.includes("76"))
      );
    },
  },
  {
    id: "diff_smr_bwrx300_osge",
    title: "Program budowy małych reaktorów jądrowych SMR BWRX-300 przez OSGE",
    category: "technology",
    facilityLocation: "Włocławek",
    matcher: (d) => {
      const text = (d.title + " " + (d.content || "")).toLowerCase();
      return (
        (text.includes("smr") || text.includes("bwrx")) &&
        (text.includes("osge") || text.includes("synthos") || text.includes("reaktor"))
      );
    },
  },
  {
    id: "diff_rebranding_pgnig_orlen",
    title: "Transformacja wizerunkowa: unifikacja marek i zastąpienie PGNiG przez myORLEN",
    category: "governance",
    facilityLocation: undefined,
    matcher: (d) => {
      const text = (d.title + " " + (d.content || "")).toLowerCase();
      return (
        text.includes("pgnig") &&
        (text.includes("zastępuje") ||
          text.includes("zastąpił") ||
          text.includes("rebranding") ||
          text.includes("koniec pgnig") ||
          text.includes("myorlen") ||
          text.includes("marka orlen"))
      );
    },
  },
  {
    id: "diff_solidarnosc_klimat_koszty",
    title: "Stanowisko NSZZ „Solidarność” wobec kosztów unijnej polityki klimatycznej",
    category: "labor",
    facilityLocation: "Gdańsk",
    matcher: (d) => {
      const text = (d.title + " " + (d.content || "")).toLowerCase();
      return (
        (text.includes("solidarność") || text.includes("nszz")) &&
        (text.includes("klimatyczn") ||
          text.includes("opłat") ||
          text.includes("cen prądu") ||
          text.includes("portfel") ||
          text.includes("referendum"))
      );
    },
  },
  {
    id: "diff_kosakowo_kawerny_solne",
    title: "Podziemny Magazyn Gazu Kosakowo — rozbudowa pojemności w kawernach solnych",
    category: "technology",
    facilityLocation: "Gdańsk",
    matcher: (d) => {
      const text = (d.title + " " + (d.content || "")).toLowerCase();
      return (
        (text.includes("kosakow") || text.includes("kawerny")) &&
        (text.includes("magazyn") || text.includes("solne") || text.includes("szansą") || text.includes("gazu"))
      );
    },
  },
  {
    id: "diff_plock_nowa_chemia_olefiny",
    title: "Harmonogram i nakłady inwestycyjne kompleksu Nowa Chemia (Olefiny III) w Płocku",
    category: "technology",
    facilityLocation: "Płock",
    matcher: (d) => {
      const text = (d.title + " " + (d.content || "")).toLowerCase();
      return (
        (text.includes("olefiny") || text.includes("nowa chemia")) &&
        (text.includes("płock") || text.includes("wycen") || text.includes("orlen") || text.includes("zakończenia"))
      );
    },
  },
  {
    id: "diff_energa_women_on_boards",
    title: "Inicjatywa #EnergaWłączaWomenOnBoards — standardy parytetu w organach spółek",
    category: "governance",
    facilityLocation: "Gdańsk",
    matcher: (d) => {
      const text = (d.title + " " + (d.content || "")).toLowerCase();
      return (
        text.includes("womenonboards") ||
        text.includes("women on boards") ||
        text.includes("raportu advantage")
      );
    },
  },
];

export async function clusterDocumentsIntoEvents(): Promise<{ clustersCreated: number; alertsCreated: number }> {
  // Pobieramy wszystkie zindeksowane dokumenty (pełna baza autentyczna)
  const [{ documents }, facilities] = await Promise.all([
    dbRepo.getDocuments({ limit: 1200 }),
    dbRepo.getAllFacilities(),
  ]);
  const facilityMap = new Map<string, Facility>(facilities.map((f) => [f.city.toLowerCase(), f]));

  let clustersCreated = 0;
  let alertsCreated = 0;

  for (const rule of COHERENT_TOPIC_RULES) {
    const matchedDocs = documents.filter((doc) => {
      if (!doc.published_at) return false;
      return rule.matcher(doc);
    });

    if (matchedDocs.length === 0) continue;

    // Chronologiczne sortowanie ścieżki dyfuzji (od sygnału pierwotnego T+0 do najnowszych reakcji)
    matchedDocs.sort((a, b) => {
      const timeA = new Date(a.published_at!).getTime();
      const timeB = new Date(b.published_at!).getTime();
      return timeA - timeB;
    });

    const firstDoc = matchedDocs[0];
    const lastDoc = matchedDocs[matchedDocs.length - 1];

    const firstTime = firstDoc.published_at!;
    const lastTime = lastDoc.published_at!;
    const firstEpoch = new Date(firstTime).getTime();

    // Obliczenie Sparks Score
    const scoring = calculateSparksScore(matchedDocs);

    // Przypisanie zakładu
    let affectedFacilityId: string | null = null;
    if (rule.facilityLocation) {
      const fac = facilityMap.get(rule.facilityLocation.toLowerCase());
      if (fac) affectedFacilityId = fac.id;
    }

    const hasOrlenOfficial = matchedDocs.some((d) => d.is_orlen_official);
    const officialDoc = matchedDocs.find((d) => d.is_orlen_official);

    const eventRecord: Event = {
      id: `evt_${rule.id}`,
      title: rule.title,
      summary: `Ścieżka dyfuzji tematycznej obejmująca ${matchedDocs.length} powiązanych publikacji. Źródła: ${Array.from(
        new Set(matchedDocs.map((d) => d.source_name))
      ).join(", ")}.`,
      first_detected_at: firstTime,
      last_signal_at: lastTime,
      event_stage: scoring.stage,
      origin_source_id: firstDoc.source_id || null,
      origin_source_category: firstDoc.source_type,
      affected_facility_id: affectedFacilityId,
      sparks_score: scoring.totalScore,
      confidence_level: Math.min(0.7 + matchedDocs.length * 0.05, 0.99),
      has_orlen_responded: hasOrlenOfficial,
      orlen_statement_summary: officialDoc ? `Oficjalne stanowisko w publikacji: "${officialDoc.title}"` : null,
      created_at: firstTime,
      updated_at: new Date().toISOString(),
    };

    await dbRepo.upsertEvent(eventRecord);
    clustersCreated++;

    // Wyczyść poprzednie powiązania dokumentów dla tego wydarzenia
    await dbRepo.clearEventDocuments(eventRecord.id);

    // Łączenie dokumentów w łańcuch dyfuzji z precyzyjnymi rolami
    for (let i = 0; i < matchedDocs.length; i++) {
      const doc = matchedDocs[i];
      const docTime = doc.published_at ? new Date(doc.published_at).getTime() : new Date(doc.fetched_at).getTime();
      const deltaSec = Math.max(0, Math.floor((docTime - firstEpoch) / 1000));

      let step = "local_pickup";
      if (i === 0) {
        step = doc.is_orlen_official
          ? "origin_official"
          : doc.source_type === "internal_labor"
          ? "labor_signal"
          : doc.source_type === "media_regional"
          ? "local_pickup"
          : "origin";
      } else if (doc.is_orlen_official) {
        step = "rebuttal";
      } else if (doc.source_type === "internal_labor") {
        step = "labor_signal";
      } else if (doc.source_type === "media_regional") {
        step = "local_pickup";
      } else if (doc.source_type === "media_industry") {
        step = "industry_media";
      } else if (doc.source_type === "media_general") {
        step = "national_media";
      } else if (doc.source_type === "social_media") {
        step = "social_amplification";
      }

      await dbRepo.linkDocumentToEvent({
        id: `ed_${eventRecord.id}_${doc.id}`,
        event_id: eventRecord.id,
        document_id: doc.id,
        similarity_score: 0.92,
        diffusion_step: step,
        time_delta_seconds: deltaSec,
        created_at: new Date().toISOString(),
      });
    }

    // Automatyczny alert przy istotnym iskrzeniu
    if (scoring.totalScore >= 40.0) {
      await dbRepo.insertAlert({
        id: `alt_${eventRecord.id}`,
        event_id: eventRecord.id,
        document_id: firstDoc.id,
        alert_type: scoring.totalScore >= 60 ? "sparks_critical" : "sparks_warning",
        severity: scoring.totalScore >= 60 ? "critical" : "medium",
        title: `Wykryto wzmożoną dynamikę: ${rule.title}`,
        message: `Wskaźnik Iskrzenia osiągnął ${scoring.totalScore}/100. Liczba powiązanych materiałów: ${matchedDocs.length}. ${scoring.explanation.velocityNotes}, ${scoring.explanation.sourcesNotes}.`,
        evidence_list: matchedDocs.slice(0, 3).map((d) => `"${d.title}" (${d.source_name})`),
        is_active: true,
        acknowledged_at: null,
        created_at: lastTime,
      });
      alertsCreated++;
    }
  }

  return { clustersCreated, alertsCreated };
}
