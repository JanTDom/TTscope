import { dbRepo } from "../db";
import type { Document, Event, EventDocument, Facility } from "../db/types";
import { calculateSparksScore } from "../scoring/sparks";

interface TopicClusterRule {
  id: string;
  title: string;
  keywords: string[];
  facilityLocation?: string;
}

const TOPIC_RULES: TopicClusterRule[] = [
  {
    id: "cluster_fuel_prices_retail",
    title: "Dynamika cen i dostępności paliw na stacjach w Polsce",
    keywords: ["ceny paliw", "cena paliw", "stacjach", "benzyna", "diesel", "tanieją", "drożeją", "paliwa na stacjach"],
  },
  {
    id: "cluster_energa_sponsorship_comms",
    title: "Komunikacja korporacyjna i sponsoring sportowy Energi",
    keywords: ["energa", "sponsorem", "gimnastyczn", "olimpijsk", "energa gymnastics"],
    facilityLocation: "Ostrołęka",
  },
  {
    id: "cluster_salt_caverns_kosakowo",
    title: "Infrastruktura magazynowa gazu — kawerny solne Kosakowo",
    keywords: ["kawerny", "solne", "kosakow", "magazyn", "pgnig"],
    facilityLocation: "Gdańsk",
  },
  {
    id: "cluster_refinery_operations_plock",
    title: "Ciągłość operacyjna i instalacje rafineryjne w Płocku",
    keywords: ["płock", "olefiny", "instalacj", "flara", "rafineri", "pochodnia"],
    facilityLocation: "Płock",
  },
  {
    id: "cluster_fertilizers_anwil_wloclawek",
    title: "Produkcja nawozów i rynek azotowy ANWIL Włocławek",
    keywords: ["anwil", "włocławek", "wloclawek", "nawoz", "saletra"],
    facilityLocation: "Włocławek",
  },
  {
    id: "cluster_biorefinery_trzebinia",
    title: "Segment biokomponentów i Biorafineria ORLEN Południe",
    keywords: ["trzebinia", "orlen południe", "biodiesel", "biorafiner"],
    facilityLocation: "Trzebinia",
  },
  {
    id: "cluster_baltic_power_offshore",
    title: "Morska energetyka wiatrowa — projekt Baltic Power na Bałtyku",
    keywords: ["baltic power", "morska farma", "turbiny", "wiatrowa", "offshore"],
    facilityLocation: "Gdańsk",
  },
  {
    id: "cluster_osge_smr_nuclear",
    title: "Rozwój małych reaktorów jądrowych SMR — ORLEN Synthos Green Energy",
    keywords: ["osge", "smr", "reaktor", "bwrx-300", "jądrow"],
    facilityLocation: "Włocławek",
  },
  {
    id: "cluster_labor_unions_negotiations",
    title: "Dialog społeczny, postulaty płacowe i aktywność związków zawodowych",
    keywords: ["solidarność", "mzzprc", "związki zawodowe", "związkowcy", "spór zbiorowy", "załoga", "strajk"],
    facilityLocation: "Płock",
  },
  {
    id: "cluster_upstream_norway_lng",
    title: "Wydobycie gazu na Szelfie Norweskim i handel globalny LNG",
    keywords: ["upstream norway", "afrodyta", "morzu północnym", "lng", "singapur", "equinor"],
  },
];

export function clusterDocumentsIntoEvents(): { clustersCreated: number; alertsCreated: number } {
  const { documents } = dbRepo.getDocuments({ limit: 500 });
  const facilities = dbRepo.getAllFacilities();
  const facilityMap = new Map<string, Facility>(facilities.map((f) => [f.city.toLowerCase(), f]));

  let clustersCreated = 0;
  let alertsCreated = 0;

  for (const rule of TOPIC_RULES) {
    const allMatchedDocs = documents.filter((doc) => {
      if (!doc.published_at) return false;
      const combined = (doc.title + " " + doc.content).toLowerCase();
      return rule.keywords.some((kw) => combined.includes(kw));
    });

    if (allMatchedDocs.length === 0) continue;

    // Sortowanie od najnowszych, aby wyznaczyć spójną, bieżącą falę tematyczną (okno 48h od najnowszego artykułu, fallback do 7 dni)
    allMatchedDocs.sort((a, b) => {
      return new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime();
    });

    const latestEpoch = new Date(allMatchedDocs[0].published_at!).getTime();
    const tightWave = allMatchedDocs.filter(
      (d) => latestEpoch - new Date(d.published_at!).getTime() <= 48 * 3600 * 1000
    );
    const mediumWave = allMatchedDocs.filter(
      (d) => latestEpoch - new Date(d.published_at!).getTime() <= 7 * 24 * 3600 * 1000
    );
    const matchedDocs =
      tightWave.length >= 2 ? tightWave : mediumWave.length >= 2 ? mediumWave : allMatchedDocs.slice(0, 6);

    // Sortowanie chronologiczne (od sygnału początkowego tej fali do najnowszego)
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
      summary: `Wydarzenie obejmujące ${matchedDocs.length} publikacji ze źródeł: ${Array.from(new Set(matchedDocs.map((d) => d.source_name))).join(", ")}.`,
      first_detected_at: firstTime,
      last_signal_at: lastTime,
      event_stage: scoring.stage,
      origin_source_id: firstDoc.source_id || null,
      origin_source_category: firstDoc.source_type,
      affected_facility_id: affectedFacilityId,
      sparks_score: scoring.totalScore,
      confidence_level: Math.min(0.60 + matchedDocs.length * 0.05, 0.98),
      has_orlen_responded: hasOrlenOfficial,
      orlen_statement_summary: officialDoc ? `Oficjalne stanowisko w publikacji: "${officialDoc.title}"` : null,
      created_at: firstTime,
      updated_at: new Date().toISOString(),
    };

    dbRepo.upsertEvent(eventRecord);
    clustersCreated++;

    // Wyczyść poprzednie powiązania dokumentów dla tego wydarzenia przed ponownym zbudowaniem fali
    dbRepo.clearEventDocuments(eventRecord.id);

    // Łączenie dokumentów w łańcuch dyfuzji
    for (let i = 0; i < matchedDocs.length; i++) {
      const doc = matchedDocs[i];
      const docTime = doc.published_at ? new Date(doc.published_at).getTime() : new Date(doc.fetched_at).getTime();
      const deltaSec = Math.max(0, Math.floor((docTime - firstEpoch) / 1000));

      let step = "local_pickup";
      if (i === 0) {
        step = "origin";
      } else if (doc.is_orlen_official) {
        step = "rebuttal";
      } else if (doc.is_labor_signal) {
        step = "labor_signal";
      } else if (doc.source_type === "media_industry") {
        step = "industry_media";
      } else if (doc.source_type === "media_general") {
        step = "national_media";
      } else if (doc.source_type === "social_media") {
        step = "social_amplification";
      }

      dbRepo.linkDocumentToEvent({
        id: `ed_${eventRecord.id}_${doc.id}`,
        event_id: eventRecord.id,
        document_id: doc.id,
        similarity_score: 0.85,
        diffusion_step: step,
        time_delta_seconds: deltaSec,
        created_at: new Date().toISOString(),
      });
    }

    // Automatyczny alert przy istotnym iskrzeniu
    if (scoring.totalScore >= 40.0) {
      dbRepo.insertAlert({
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
