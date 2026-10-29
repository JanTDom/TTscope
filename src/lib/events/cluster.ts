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
];

export function clusterDocumentsIntoEvents(): { clustersCreated: number; alertsCreated: number } {
  const { documents } = dbRepo.getDocuments({ limit: 500 });
  const facilities = dbRepo.getAllFacilities();
  const facilityMap = new Map<string, Facility>(facilities.map((f) => [f.city.toLowerCase(), f]));

  let clustersCreated = 0;
  let alertsCreated = 0;

  for (const rule of TOPIC_RULES) {
    const matchedDocs = documents.filter((doc) => {
      const combined = (doc.title + " " + doc.content).toLowerCase();
      const matchesKeyword = rule.keywords.some((kw) => combined.includes(kw));
      const matchesFacility = rule.facilityLocation
        ? doc.facility_location?.toLowerCase() === rule.facilityLocation.toLowerCase()
        : true;
      return matchesKeyword || (rule.facilityLocation && doc.facility_location === rule.facilityLocation);
    });

    if (matchedDocs.length === 0) continue;

    // Sortowanie chronologiczne
    matchedDocs.sort((a, b) => {
      const timeA = a.published_at ? new Date(a.published_at).getTime() : new Date(a.fetched_at).getTime();
      const timeB = b.published_at ? new Date(b.published_at).getTime() : new Date(b.fetched_at).getTime();
      return timeA - timeB;
    });

    const firstDoc = matchedDocs[0];
    const lastDoc = matchedDocs[matchedDocs.length - 1];

    const firstTime = firstDoc.published_at || firstDoc.fetched_at;
    const lastTime = lastDoc.published_at || lastDoc.fetched_at;
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
        created_at: new Date().toISOString(),
      });
      alertsCreated++;
    }
  }

  return { clustersCreated, alertsCreated };
}
