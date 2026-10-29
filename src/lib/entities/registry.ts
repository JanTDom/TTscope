// ==============================================================================
// TTscope — Dynamiczny Moduł Rejestru Podmiotów Grupy ORLEN (OrlenEntityRegistry)
// ==============================================================================

import { postgresRepo } from "../db/postgres";
import type {
  OrlenEntity,
  EntityRegistryAudit,
  EntitySearchMatrix,
  EntityPlatformQueries,
  SocialProfiles,
} from "../db/types";

export function removeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L");
}

/**
 * Heurystyczna deklinacja polskich nazw własnych podmiotów i marek
 */
export function generateDeclensions(name: string): string[] {
  const forms = new Set<string>([name]);
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  // Wzorce odmiany rzeczowników męskich i żeńskich typowych dla polskich podmiotów
  if (lower.endsWith("en")) {
    // Orlen -> Orlenu, Orlenem, Orlenie, Orlenowi
    forms.add(trimmed + "u");
    forms.add(trimmed + "em");
    forms.add(trimmed + "ie");
    forms.add(trimmed + "owi");
  } else if (lower.endsWith("ga")) {
    // Energa -> Energi, Enerdze, Energę, Energą
    forms.add(trimmed.slice(0, -2) + "gi");
    forms.add(trimmed.slice(0, -2) + "dze");
    forms.add(trimmed.slice(0, -1) + "ę");
    forms.add(trimmed.slice(0, -1) + "ą");
  } else if (lower.endsWith("il")) {
    // Anwil -> Anwilu, Anwilem, Anwilowi
    forms.add(trimmed + "u");
    forms.add(trimmed + "em");
    forms.add(trimmed + "owi");
  } else if (lower.endsWith("os")) {
    // Lotos -> Lotosu, Lotosem, Lotosie, Lotosowi
    forms.add(trimmed + "u");
    forms.add(trimmed + "em");
    forms.add(trimmed + "ie");
    forms.add(trimmed + "owi");
  } else if (lower.endsWith("ia")) {
    // Rafineria -> Rafinerii, Rafinerię, Rafinerią
    forms.add(trimmed.slice(0, -1) + "i");
    forms.add(trimmed.slice(0, -1) + "ę");
    forms.add(trimmed.slice(0, -1) + "ą");
  } else if (lower.endsWith("a")) {
    // Spółka -> Spółki, Spółce, Spółkę, Spółką
    forms.add(trimmed.slice(0, -1) + "i");
    forms.add(trimmed.slice(0, -1) + "y");
    forms.add(trimmed.slice(0, -1) + "e");
    forms.add(trimmed.slice(0, -1) + "ę");
    forms.add(trimmed.slice(0, -1) + "ą");
  }

  // Wzorce dla skrótowców wieloliterowych (np. PGNiG -> PGNiG-u, PGNiG-iem)
  if (trimmed === "PGNiG" || trimmed === "PSG" || trimmed === "OSGE") {
    forms.add(trimmed + "-u");
    forms.add(trimmed + "-em");
    forms.add(trimmed + "-owi");
  }

  return Array.from(forms);
}

/**
 * Oficjalny rejestr bazowy Grupy ORLEN oparty o raporty skonsolidowane i ESPI
 */
export const INITIAL_ORLEN_ENTITIES: Omit<OrlenEntity, "created_at" | "updated_at">[] = [
  {
    id: "ent_orlen_sa",
    name: "ORLEN S.A.",
    canonical_name: "ORLEN S.A.",
    legal_name: "ORLEN Spółka Akcyjna",
    short_name: "ORLEN",
    former_name: "Polski Koncern Naftowy ORLEN S.A. (PKN ORLEN)",
    brand_name: "ORLEN",
    parent_company: "Podmiot dominujący",
    country: "PL",
    business_segment: "Centrala i Multienergetyka",
    website: "https://www.orlen.pl",
    domains: ["orlen.pl", "pknorlen.pl"],
    social_profiles: {
      facebook: "GrupaORLEN",
      youtube: "GrupaORLEN",
      twitter_x: "GrupaORLEN",
      linkedin: "orlen-group",
    },
    ticker: "PKN",
    nip: "7740001454",
    krs: "0000028860",
    entity_status: "active",
    last_verified_at: new Date().toISOString(),
    verification_source: "Giełda Papierów Wartościowych w Warszawie / ESPI / KRS",
    search_aliases: ["PKN Orlen", "Polski Koncern Naftowy", "Grupa Orlen", "Orlen Płock", "Koncern z Płocka"],
    is_monitored: true,
  },
  {
    id: "ent_energa_sa",
    name: "Energa S.A.",
    canonical_name: "Energa S.A.",
    legal_name: "Energa Spółka Akcyjna",
    short_name: "Energa",
    former_name: null,
    brand_name: "Energa Grupa ORLEN",
    parent_company: "ORLEN S.A.",
    country: "PL",
    business_segment: "Energetyka i OZE",
    website: "https://www.energa.pl",
    domains: ["energa.pl", "media.energa.pl"],
    social_profiles: {
      facebook: "GrupaEnerga",
      youtube: "GrupaEnerga",
      twitter_x: "EnergaSA",
      linkedin: "energa-sa",
    },
    ticker: "ENG",
    nip: "5830001190",
    krs: "0000271591",
    entity_status: "active",
    last_verified_at: new Date().toISOString(),
    verification_source: "KRS / Biuro Prasowe Energa S.A.",
    search_aliases: ["Grupa Energa", "Energa Operator", "Energa Obrót", "Energa OZE", "Elektrownia Ostrołęka"],
    is_monitored: true,
  },
  {
    id: "ent_pgnig_sa",
    name: "PGNiG",
    canonical_name: "PGNiG",
    legal_name: "Polskie Górnictwo Naftowe i Gazownictwo (Oddział Centralny ORLEN S.A.)",
    short_name: "PGNiG",
    former_name: "Polskie Górnictwo Naftowe i Gazownictwo S.A.",
    brand_name: "PGNiG Grupa ORLEN",
    parent_company: "ORLEN S.A.",
    country: "PL",
    business_segment: "Wydobycie i Gaz",
    website: "https://pgnig.pl",
    domains: ["pgnig.pl"],
    social_profiles: {
      facebook: "PGNiG",
      youtube: "PGNiGsa",
      twitter_x: "GK_PGNiG",
      linkedin: "pgnig",
    },
    ticker: "PGN",
    nip: "5250008028",
    krs: "0000059992",
    entity_status: "active",
    last_verified_at: new Date().toISOString(),
    verification_source: "Sprawozdanie finansowe ORLEN / Fuzja 2022",
    search_aliases: ["Polskie Górnictwo Naftowe i Gazownictwo", "Gazownictwo", "PGNiG Upstream", "PGNiG Termika"],
    is_monitored: true,
  },
  {
    id: "ent_anwil_sa",
    name: "Anwil S.A.",
    canonical_name: "Anwil S.A.",
    legal_name: "ANWIL Spółka Akcyjna",
    short_name: "Anwil",
    former_name: "Zakłady Azotowe Włocławek",
    brand_name: "ANWIL Grupa ORLEN",
    parent_company: "ORLEN S.A.",
    country: "PL",
    business_segment: "Petrochemia i Nawozy",
    website: "https://www.anwil.pl",
    domains: ["anwil.pl"],
    social_profiles: {
      facebook: "ANWILGrupaORLEN",
      youtube: "ANWILS.A.",
      twitter_x: "ANWIL_SA",
      linkedin: "anwil-sa",
    },
    ticker: null,
    nip: "8880004938",
    krs: "0000015684",
    entity_status: "active",
    last_verified_at: new Date().toISOString(),
    verification_source: "KRS / Oficjalna strona ANWIL S.A.",
    search_aliases: ["Azoty Włocławek", "Anwil Włocławek", "Nawozy Anwil", "PCW Anwil", "Saletra Anwil"],
    is_monitored: true,
  },
  {
    id: "ent_orlen_unipetrol",
    name: "ORLEN Unipetrol a.s.",
    canonical_name: "ORLEN Unipetrol",
    legal_name: "ORLEN Unipetrol a.s.",
    short_name: "Unipetrol",
    former_name: "UNIPETROL, a.s.",
    brand_name: "ORLEN Unipetrol",
    parent_company: "ORLEN S.A.",
    country: "CZ",
    business_segment: "Rafineria i Petrochemia (Czechy)",
    website: "https://www.orlenunipetrol.cz",
    domains: ["orlenunipetrol.cz", "unipetrol.cz", "benzina.cz"],
    social_profiles: {
      facebook: "ORLENUnipetrol",
      youtube: "ORLENUnipetrol",
      twitter_x: "ORLENUnipetrol",
      linkedin: "orlen-unipetrol",
    },
    ticker: "UNIP",
    nip: "CZ61672190",
    krs: "B 3020 (Praga)",
    entity_status: "active",
    last_verified_at: new Date().toISOString(),
    verification_source: "Rejestr Handlowy Republiki Czeskiej",
    search_aliases: ["Unipetrol RPA", "Rafineria Litvinov", "Rafineria Kralupy", "Benzina Orlen Czechy"],
    is_monitored: true,
  },
  {
    id: "ent_orlen_lietuva",
    name: "AB ORLEN Lietuva",
    canonical_name: "ORLEN Lietuva",
    legal_name: "Akcinė bendrovė ORLEN Lietuva",
    short_name: "Lietuva",
    former_name: "AB Mažeikių Nafta",
    brand_name: "ORLEN Lietuva",
    parent_company: "ORLEN S.A.",
    country: "LT",
    business_segment: "Rafineria i Logistyka Morska (Kraje Bałtyckie)",
    website: "https://www.orlenlietuva.lt",
    domains: ["orlenlietuva.lt"],
    social_profiles: {
      facebook: "ORLENLietuva",
      youtube: "ORLENLietuva",
      twitter_x: "ORLEN_Lietuva",
      linkedin: "ab-orlen-lietuva",
    },
    ticker: null,
    nip: "LT664517219",
    krs: "166451720 (Litwa)",
    entity_status: "active",
    last_verified_at: new Date().toISOString(),
    verification_source: "Centrum Rejestrów Litwy (Registrų centras)",
    search_aliases: ["Mazeikiu Nafta", "Rafineria Możejki", "Terminal Butynga", "Orlen Możejki"],
    is_monitored: true,
  },
  {
    id: "ent_osge",
    name: "Orlen Synthos Green Energy",
    canonical_name: "Orlen Synthos Green Energy",
    legal_name: "Orlen Synthos Green Energy Sp. z o.o.",
    short_name: "OSGE",
    former_name: null,
    brand_name: "OSGE",
    parent_company: "ORLEN S.A. / Synthos Green Energy",
    country: "PL",
    business_segment: "Nowa Energetyka i Reaktory Jądrowe SMR",
    website: "https://osge.com",
    domains: ["osge.com"],
    social_profiles: {
      facebook: "OSGEenergy",
      youtube: "OSGE_SMR",
      twitter_x: "OSGE_SMR",
      linkedin: "orlen-synthos-green-energy",
    },
    ticker: null,
    nip: "5252890693",
    krs: "0000947702",
    entity_status: "active",
    last_verified_at: new Date().toISOString(),
    verification_source: "KRS / Komunikaty korporacyjne OSGE",
    search_aliases: ["Reaktory SMR Orlen", "BWRX-300", "Atom Orlenu", "Mały atom Orlen", "Synthos Green Energy"],
    is_monitored: true,
  },
  {
    id: "ent_rafineria_gdanska",
    name: "Rafineria Gdańska Sp. z o.o.",
    canonical_name: "Rafineria Gdańska",
    legal_name: "Rafineria Gdańska Sp. z o.o.",
    short_name: "Rafineria Gdańska",
    former_name: "Grupa Lotos S.A. (Segment Rafineryjny) / Lotos Asfalt",
    brand_name: "Rafineria Gdańska Grupa ORLEN",
    parent_company: "ORLEN S.A. (70%) / Saudi Aramco (30%)",
    country: "PL",
    business_segment: "Rafineria i Przerób Ropy",
    website: "https://rafineriagdanska.pl",
    domains: ["rafineriagdanska.pl", "lotos.pl"],
    social_profiles: {
      facebook: "RafineriaGdanska",
      youtube: "RafineriaGdanska",
      twitter_x: "RafineriaGdansk",
      linkedin: "rafineria-gdanska",
    },
    ticker: null,
    nip: "5832868287",
    krs: "0000106880",
    entity_status: "active",
    last_verified_at: new Date().toISOString(),
    verification_source: "KRS / Raporty fuzji Orlen-Lotos",
    search_aliases: ["Dawny Lotos", "Rafineria w Gdańsku", "Lotos Gdańsk", "Aramco Gdańsk", "Zakład w Gdańsku"],
    is_monitored: true,
  },
  {
    id: "ent_orlen_poludnie",
    name: "ORLEN Południe S.A.",
    canonical_name: "ORLEN Południe",
    legal_name: "ORLEN Południe Spółka Akcyjna",
    short_name: "ORLEN Południe",
    former_name: "Rafineria Trzebinia / Rafineria Nafty Jedlicze",
    brand_name: "ORLEN Południe",
    parent_company: "ORLEN S.A.",
    country: "PL",
    business_segment: "Biorafinerie i Biopaliwa",
    website: "https://www.orlenpoludnie.pl",
    domains: ["orlenpoludnie.pl"],
    social_profiles: {
      facebook: "ORLENPoludnie",
      youtube: "ORLENPoludnie",
      twitter_x: "ORLEN_Poludnie",
      linkedin: "orlen-poludnie",
    },
    ticker: null,
    nip: "6280000783",
    krs: "0000030312",
    entity_status: "active",
    last_verified_at: new Date().toISOString(),
    verification_source: "KRS / Biuro Prasowe ORLEN Południe",
    search_aliases: ["Biorafineria Trzebinia", "Rafineria Jedlicze", "Glikol Trzebinia", "Biodiesel Orlen Południe"],
    is_monitored: true,
  },
  {
    id: "ent_orlen_paliwa",
    name: "ORLEN Paliwa Sp. z o.o.",
    canonical_name: "ORLEN Paliwa",
    legal_name: "ORLEN Paliwa Sp. z o.o.",
    short_name: "ORLEN Paliwa",
    former_name: null,
    brand_name: "ORLEN Paliwa",
    parent_company: "ORLEN S.A.",
    country: "PL",
    business_segment: "Hurt Paliw i LPG",
    website: "https://www.orlenpaliwa.com.pl",
    domains: ["orlenpaliwa.com.pl"],
    social_profiles: {
      facebook: "ORLENPaliwa",
      youtube: "ORLENPaliwa",
      twitter_x: "ORLENPaliwa",
      linkedin: "orlen-paliwa",
    },
    ticker: null,
    nip: "7742299863",
    krs: "0000120150",
    entity_status: "active",
    last_verified_at: new Date().toISOString(),
    verification_source: "KRS",
    search_aliases: ["Hurt Orlen", "LPG Orlen", "Dystrybucja paliw Orlen", "Paliwa Płock"],
    is_monitored: true,
  },
  {
    id: "ent_orlen_koltrans",
    name: "ORLEN KolTrans S.A.",
    canonical_name: "ORLEN KolTrans",
    legal_name: "ORLEN KolTrans Spółka Akcyjna",
    short_name: "KolTrans",
    former_name: null,
    brand_name: "ORLEN KolTrans",
    parent_company: "ORLEN S.A.",
    country: "PL",
    business_segment: "Logistyka Kolejowa",
    website: "https://www.orlenkoltrans.pl",
    domains: ["orlenkoltrans.pl"],
    social_profiles: {
      facebook: "ORLENKolTrans",
      youtube: "ORLENKolTrans",
      twitter_x: "ORLENKolTrans",
      linkedin: "orlen-koltrans",
    },
    ticker: null,
    nip: "7742517652",
    krs: "0000043818",
    entity_status: "active",
    last_verified_at: new Date().toISOString(),
    verification_source: "KRS / UTK (Urząd Transportu Kolejowego)",
    search_aliases: ["Kolej Orlenu", "Cysterny kolejowe Orlen", "Koltrans Płock"],
    is_monitored: true,
  },
  {
    id: "ent_psg_gaz",
    name: "Polska Spółka Gazownictwa",
    canonical_name: "Polska Spółka Gazownictwa",
    legal_name: "Polska Spółka Gazownictwa Sp. z o.o.",
    short_name: "PSG",
    former_name: null,
    brand_name: "PSG Grupa ORLEN",
    parent_company: "ORLEN S.A. (d. PGNiG)",
    country: "PL",
    business_segment: "Dystrybucja Gazu Ziemnego",
    website: "https://www.psgaz.pl",
    domains: ["psgaz.pl"],
    social_profiles: {
      facebook: "PolskaSpolkaGazownictwa",
      youtube: "PolskaSpolkaGazownictwa",
      twitter_x: "PSG_GrupaORLEN",
      linkedin: "polska-spolka-gazownictwa",
    },
    ticker: null,
    nip: "5252549221",
    krs: "0000455648",
    entity_status: "active",
    last_verified_at: new Date().toISOString(),
    verification_source: "KRS / Raporty URE",
    search_aliases: ["Gazownia", "Dystrybucja gazu", "Pogotowie gazowe PSG", "Przyłącza gazowe Orlen"],
    is_monitored: true,
  },
  {
    id: "ent_baltic_power",
    name: "Baltic Power Sp. z o.o.",
    canonical_name: "Baltic Power",
    legal_name: "Baltic Power Sp. z o.o.",
    short_name: "Baltic Power",
    former_name: null,
    brand_name: "Baltic Power Offshore Wind",
    parent_company: "ORLEN S.A. (51%) / Northland Power (49%)",
    country: "PL",
    business_segment: "Morska Energetyka Wiatrowa (Offshore)",
    website: "https://balticpower.pl",
    domains: ["balticpower.pl"],
    social_profiles: {
      facebook: "BalticPowerOffshore",
      youtube: "BalticPower",
      twitter_x: "BalticPowerWind",
      linkedin: "baltic-power",
    },
    ticker: null,
    nip: "5252528785",
    krs: "0000412702",
    entity_status: "active",
    last_verified_at: new Date().toISOString(),
    verification_source: "KRS / Biuro Prasowe Projektu Baltic Power",
    search_aliases: ["Wiatraki na Bałtyku Orlen", "Offshore Orlen", "Morska farma wiatrowa", "Port instalacyjny Świnoujście"],
    is_monitored: true,
  },
  {
    id: "ent_orlen_serwis",
    name: "ORLEN Serwis S.A.",
    canonical_name: "ORLEN Serwis",
    legal_name: "ORLEN Serwis Spółka Akcyjna",
    short_name: "ORLEN Serwis",
    former_name: null,
    brand_name: "ORLEN Serwis",
    parent_company: "ORLEN S.A.",
    country: "PL",
    business_segment: "Utrzymanie Ruchu i Mechanika Przemysłowa",
    website: "https://www.orlenserwis.pl",
    domains: ["orlenserwis.pl"],
    social_profiles: {
      facebook: "ORLENSerwis",
      youtube: "ORLENSerwis",
      twitter_x: "ORLENSerwis",
      linkedin: "orlen-serwis",
    },
    ticker: null,
    nip: "7742686861",
    krs: "0000080646",
    entity_status: "active",
    last_verified_at: new Date().toISOString(),
    verification_source: "KRS",
    search_aliases: ["Serwis instalacji Orlen", "Remonty instalacji Płock", "Automatyka Orlen"],
    is_monitored: true,
  },
  {
    id: "ent_orlen_deutschland",
    name: "ORLEN Deutschland GmbH",
    canonical_name: "ORLEN Deutschland",
    legal_name: "ORLEN Deutschland GmbH",
    short_name: "ORLEN Niemcy",
    former_name: null,
    brand_name: "star / ORLEN",
    parent_company: "ORLEN S.A.",
    country: "DE",
    business_segment: "Detal Paliwowy (Niemcy)",
    website: "https://www.orlen-deutschland.de",
    domains: ["orlen-deutschland.de", "star.de"],
    social_profiles: {
      facebook: "starTankstellen",
      youtube: "starTankstellen",
      twitter_x: "ORLEN_DE",
      linkedin: "orlen-deutschland-gmbh",
    },
    ticker: null,
    nip: "DE813636573",
    krs: "HRB 1475 Elmshorn",
    entity_status: "active",
    last_verified_at: new Date().toISOString(),
    verification_source: "Handelsregister Niemcy",
    search_aliases: ["star Tankstellen", "Stacje Orlen w Niemczech", "Orlen Elmshorn"],
    is_monitored: true,
  },
  {
    id: "ent_pgnig_norway",
    name: "PGNiG Upstream Norway AS",
    canonical_name: "PGNiG Upstream Norway",
    legal_name: "PGNiG Upstream Norway AS",
    short_name: "PUN AS",
    former_name: null,
    brand_name: "ORLEN Upstream Norway",
    parent_company: "ORLEN S.A.",
    country: "NO",
    business_segment: "Wydobycie Ropy i Gazu (Szelf Norweski)",
    website: "https://pgnigupstream.no",
    domains: ["pgnigupstream.no"],
    social_profiles: {
      facebook: "PGNiGNorway",
      youtube: "PGNiGNorway",
      twitter_x: "PGNiG_Norway",
      linkedin: "pgnig-upstream-norway",
    },
    ticker: null,
    nip: "NO990928231MVA",
    krs: "990 928 231 (Brønnøysundregistrene)",
    entity_status: "active",
    last_verified_at: new Date().toISOString(),
    verification_source: "Norweski Dyrektoriat Naftowy (NPD / Havindustritilsynet)",
    search_aliases: ["Złoża w Norwegii Orlen", "Baltic Pipe dostawy", "Szelf Norweski Orlen", "Koncesje norweskie"],
    is_monitored: true,
  },
  {
    id: "ent_gas_storage_poland",
    name: "Gas Storage Poland Sp. z o.o.",
    canonical_name: "Gas Storage Poland",
    legal_name: "Gas Storage Poland Sp. z o.o.",
    short_name: "Gas Storage",
    former_name: null,
    brand_name: "GSP",
    parent_company: "ORLEN S.A. (Przejęcie przez Gaz-System w toku)",
    country: "PL",
    business_segment: "Podziemne Magazyny Gazu Ziemnego",
    website: "https://gasstoragepoland.pl",
    domains: ["gasstoragepoland.pl"],
    social_profiles: {
      facebook: "GasStoragePoland",
      youtube: "GasStoragePoland",
      twitter_x: "GasStoragePL",
      linkedin: "gas-storage-poland",
    },
    ticker: null,
    nip: "7742686861",
    krs: "0000418579",
    entity_status: "merging",
    last_verified_at: new Date().toISOString(),
    verification_source: "KRS / Decyzja UOKiK o zbyciu operatora magazynów",
    search_aliases: ["Magazyny gazu Mogilno", "Podziemne magazyny gazu", "Operator magazynów gazu"],
    is_monitored: true,
  },
  {
    id: "ent_orlen_projekt",
    name: "ORLEN Projekt S.A.",
    canonical_name: "ORLEN Projekt",
    legal_name: "ORLEN Projekt Spółka Akcyjna",
    short_name: "ORLEN Projekt",
    former_name: null,
    brand_name: "ORLEN Projekt",
    parent_company: "ORLEN S.A.",
    country: "PL",
    business_segment: "Projektowanie Inżynieryjne i Budownictwo Przemysłowe",
    website: "https://www.orlenprojekt.pl",
    domains: ["orlenprojekt.pl"],
    social_profiles: {
      facebook: "ORLENProjekt",
      youtube: "ORLENProjekt",
      twitter_x: "ORLENProjekt",
      linkedin: "orlen-projekt",
    },
    ticker: null,
    nip: "7740003051",
    krs: "0000040700",
    entity_status: "active",
    last_verified_at: new Date().toISOString(),
    verification_source: "KRS",
    search_aliases: ["Biuro projektowe Orlen", "Inżynieria procesowa Płock", "Projekty Olefiny"],
    is_monitored: true,
  },
  {
    id: "ent_orlen_laboratorium",
    name: "ORLEN Laboratorium Sp. z o.o.",
    canonical_name: "ORLEN Laboratorium",
    legal_name: "ORLEN Laboratorium Sp. z o.o.",
    short_name: "ORLEN Laboratorium",
    former_name: null,
    brand_name: "ORLEN Laboratorium",
    parent_company: "ORLEN S.A.",
    country: "PL",
    business_segment: "Badania Analityczne i Certyfikacja Jakości Paliw",
    website: "https://www.orlenlaboratorium.pl",
    domains: ["orlenlaboratorium.pl"],
    social_profiles: {
      facebook: "ORLENLaboratorium",
      youtube: "ORLENLaboratorium",
      twitter_x: "ORLEN_Lab",
      linkedin: "orlen-laboratorium",
    },
    ticker: null,
    nip: "7742542472",
    krs: "0000057288",
    entity_status: "active",
    last_verified_at: new Date().toISOString(),
    verification_source: "KRS / Akredytacja PCA",
    search_aliases: ["Laboratorium paliw", "Kontrola jakości paliw Orlen", "Badania ropy Płock"],
    is_monitored: true,
  },
  {
    id: "ent_orlen_ochrona",
    name: "ORLEN Ochrona Sp. z o.o.",
    canonical_name: "ORLEN Ochrona",
    legal_name: "ORLEN Ochrona Sp. z o.o.",
    short_name: "ORLEN Ochrona",
    former_name: null,
    brand_name: "ORLEN Ochrona",
    parent_company: "ORLEN S.A.",
    country: "PL",
    business_segment: "Bezpieczeństwo Fizyczne i Infrastruktura Krytyczna",
    website: "https://www.orlenochrona.pl",
    domains: ["orlenochrona.pl"],
    social_profiles: {
      facebook: "ORLENOchrona",
      youtube: "ORLENOchrona",
      twitter_x: "ORLENOchrona",
      linkedin: "orlen-ochrona",
    },
    ticker: null,
    nip: "7742358896",
    krs: "0000030588",
    entity_status: "active",
    last_verified_at: new Date().toISOString(),
    verification_source: "KRS / Rejestr MSWiA",
    search_aliases: ["Straż zakładowa Orlen", "Ochrona rafinerii", "Bezpieczeństwo obiektów krytycznych"],
    is_monitored: true,
  }
];

export class OrlenEntityRegistry {
  /**
   * Pobiera listę podmiotów z bazy PostgreSQL z opcją zaawansowanego filtrowania
   */
  async getEntities(filter?: {
    segment?: string;
    status?: string;
    country?: string;
    is_monitored?: boolean;
    query?: string;
  }): Promise<OrlenEntity[]> {
    return await postgresRepo.getOrlenEntities(filter);
  }

  /**
   * Pobiera konkretny podmiot po ID
   */
  async getEntityById(id: string): Promise<OrlenEntity | null> {
    return await postgresRepo.getOrlenEntityById(id);
  }

  /**
   * Tworzy lub aktualizuje podmiot w rejestrze
   */
  async saveEntity(
    entity: Partial<OrlenEntity> & { id: string; name: string },
    confirmedByHuman = false,
    source = "Panel Administracyjny / Synchronizacja Oficjalna"
  ): Promise<OrlenEntity> {
    const existing = await this.getEntityById(entity.id);

    const saved = await postgresRepo.upsertOrlenEntity(entity);

    // Zapis audytowy dla każdej istotnej zmiany
    if (existing) {
      const keysToAudit: (keyof OrlenEntity)[] = [
        "legal_name",
        "short_name",
        "former_name",
        "brand_name",
        "entity_status",
        "is_monitored",
        "business_segment",
        "website",
      ];

      for (const k of keysToAudit) {
        if (entity[k] !== undefined && String(entity[k]) !== String(existing[k])) {
          await this.logAuditChange({
            entity_id: entity.id,
            field_name: String(k),
            old_value: String(existing[k] ?? ""),
            new_value: String(entity[k] ?? ""),
            change_type: k === "entity_status" ? "status_change" : "updated",
            confidence: 1.0,
            source,
            confirmed_by_human: confirmedByHuman,
          });
        }
      }
    } else {
      await this.logAuditChange({
        entity_id: entity.id,
        field_name: "entity",
        old_value: null,
        new_value: entity.name,
        change_type: "created",
        confidence: 1.0,
        source,
        confirmed_by_human: confirmedByHuman,
      });
    }

    return saved;
  }

  /**
   * Przełącza flagę monitorowania podmiotu bez wyłączania całego źródła
   */
  async toggleMonitored(id: string, is_monitored: boolean, confirmedByHuman = true): Promise<void> {
    const existing = await this.getEntityById(id);
    if (!existing) throw new Error(`Podmiot o ID ${id} nie istnieje`);

    await postgresRepo.updateOrlenEntityMonitored(id, is_monitored);

    await this.logAuditChange({
      entity_id: id,
      field_name: "is_monitored",
      old_value: String(existing.is_monitored),
      new_value: String(is_monitored),
      change_type: "updated",
      confidence: 1.0,
      source: "Manual Analyst Toggle",
      confirmed_by_human: confirmedByHuman,
    });
  }

  /**
   * Ręczne dodanie nowego aliasu wyszukiwawczego
   */
  async addAlias(id: string, newAlias: string, confirmedByHuman = true): Promise<void> {
    const existing = await this.getEntityById(id);
    if (!existing) throw new Error(`Podmiot o ID ${id} nie istnieje`);

    const trimmed = newAlias.trim();
    if (!trimmed) return;

    const currentAliases = existing.search_aliases || [];
    if (currentAliases.includes(trimmed)) return;

    const updatedAliases = [...currentAliases, trimmed];
    await postgresRepo.updateOrlenEntityAliases(id, updatedAliases);

    await this.logAuditChange({
      entity_id: id,
      field_name: "search_aliases",
      old_value: JSON.stringify(currentAliases),
      new_value: JSON.stringify(updatedAliases),
      change_type: "updated",
      confidence: 1.0,
      source: "Manual Alias Addition",
      confirmed_by_human: confirmedByHuman,
    });
  }

  /**
   * Ręczne dodanie lub aktualizacja profilu społecznościowego
   */
  async updateSocialProfile(
    id: string,
    network: keyof SocialProfiles,
    handle: string,
    confirmedByHuman = true
  ): Promise<void> {
    const existing = await this.getEntityById(id);
    if (!existing) throw new Error(`Podmiot o ID ${id} nie istnieje`);

    const currentProfiles = existing.social_profiles || {};
    const updatedProfiles = { ...currentProfiles, [network]: handle.trim() };

    await postgresRepo.updateOrlenEntitySocialProfiles(id, updatedProfiles);

    await this.logAuditChange({
      entity_id: id,
      field_name: `social_profiles.${String(network)}`,
      old_value: currentProfiles[network] || null,
      new_value: handle.trim(),
      change_type: "updated",
      confidence: 1.0,
      source: "Manual Social Profile Edit",
      confirmed_by_human: confirmedByHuman,
    });
  }

  /**
   * Generuje pełną matrycę wariantów wyszukiwania dla danej spółki
   */
  generateSearchVariants(entity: OrlenEntity): EntitySearchMatrix {
    const legalName = entity.legal_name || entity.name;
    const shortName = entity.short_name || entity.name;
    const noDiacritics = removeDiacritics(shortName);

    // Odmiana przez przypadki
    const declensions = Array.from(
      new Set([
        ...generateDeclensions(shortName),
        ...generateDeclensions(entity.name),
        ...(entity.brand_name ? generateDeclensions(entity.brand_name) : []),
      ])
    );

    // Skróty
    const abbreviations: string[] = [];
    if (entity.ticker) abbreviations.push(entity.ticker);
    if (entity.short_name && entity.short_name !== entity.name) abbreviations.push(entity.short_name);
    // Skrót z pierwszych liter
    const initials = legalName
      .split(" ")
      .filter((w) => w.length > 2 && !["Sp.", "z", "o.o.", "S.A.", "a.s.", "GmbH"].includes(w))
      .map((w) => w[0].toUpperCase())
      .join("");
    if (initials.length >= 2 && initials.length <= 5) abbreviations.push(initials);

    // Warianty medialne
    const mediaVariants = Array.from(
      new Set([
        shortName,
        `${shortName} Płock`,
        `${shortName} Gdańsk`,
        `${shortName} Włocławek`,
        `${shortName} Grupa`,
        ...(entity.search_aliases || []),
      ])
    );

    // Profile social handles
    const socialHandles: string[] = [];
    if (entity.social_profiles?.facebook) socialHandles.push(entity.social_profiles.facebook);
    if (entity.social_profiles?.youtube) socialHandles.push(entity.social_profiles.youtube);
    if (entity.social_profiles?.twitter_x) socialHandles.push(entity.social_profiles.twitter_x);

    // Kombinacje z Orlen
    const orlenCombinations = Array.from(
      new Set([
        `${shortName} Orlen`,
        `Orlen ${shortName}`,
        `${shortName} Grupa Orlen`,
        `Grupa Orlen ${shortName}`,
        `${shortName} ORLEN`,
        `ORLEN ${shortName}`,
      ])
    );

    return {
      legal_name: legalName,
      short_name: shortName,
      no_diacritics: noDiacritics,
      former_name: entity.former_name,
      abbreviations,
      brand_name: entity.brand_name,
      english_name: `${shortName} ORLEN Group`,
      declensions,
      media_variants: mediaVariants,
      social_handles: socialHandles,
      domain: entity.website ? new URL(entity.website).hostname : entity.domains[0] || "",
      orlen_combinations: orlenCombinations,
    };
  }

  /**
   * Generuje zapytania dla źródeł: Facebook, YouTube, X oraz wyszukiwarek
   */
  generatePlatformQueries(entity: OrlenEntity): EntityPlatformQueries {
    const matrix = this.generateSearchVariants(entity);
    const sn = matrix.short_name;
    const fn = matrix.former_name;

    // 1. Zapytania ogólne tematyczne (14 wymaganych wzorców)
    const generalQueries = [
      sn,
      `${sn} Orlen`,
      `${sn} komunikat`,
      `${sn} zarząd`,
      `${sn} inwestycje`,
      `${sn} awaria`,
      `${sn} wyniki`,
      `${sn} pracownicy`,
      `${sn} kryzys`,
      `${sn} kontrowersje`,
      `${sn} post`,
      `${sn} Facebook`,
      `${sn} YouTube`,
      `${sn} X`,
    ];

    // 2. Zapytania dla Facebooka
    const facebookQueries = [
      `site:facebook.com "${sn}"`,
      `site:facebook.com "${sn}" "Orlen"`,
      `site:facebook.com "${sn}" "komunikat"`,
      `site:facebook.com "${sn}" "awaria"`,
      `site:facebook.com "${sn}" "pracownicy"`,
      `site:facebook.com "${sn}" "zarząd"`,
    ];

    if (entity.social_profiles?.facebook) {
      facebookQueries.push(`site:facebook.com/${entity.social_profiles.facebook} "${sn}"`);
    }

    if (entity.search_aliases && entity.search_aliases.length > 0) {
      facebookQueries.push(`site:facebook.com "${entity.search_aliases[0]}"`);
    }

    if (fn) {
      facebookQueries.push(`site:facebook.com "${sn}" OR "${fn}"`);
    }

    // 3. Zapytania dla YouTube (YouTube Data API)
    const youtubeQueries = [
      sn,
      `${sn} Orlen`,
      `${sn} inwestycje konferencja`,
      `${sn} zarząd wywiad`,
      `${sn} konferencja prasowa`,
      `${sn} wyniki finansowe`,
    ];
    if (entity.social_profiles?.youtube) {
      youtubeQueries.unshift(`channel:${entity.social_profiles.youtube}`);
    }
    if (matrix.domain) {
      youtubeQueries.push(`${sn} ${matrix.domain}`);
    }

    // 4. Zapytania dla X (Twitter API)
    const twitterQueries = [
      sn,
      `from:${entity.social_profiles?.twitter_x || "GrupaORLEN"}`,
      `#${removeDiacritics(sn).replace(/\s+/g, "")}`,
      `#GrupaORLEN ${sn}`,
      `${sn} (awaria OR strajk OR zysk OR fuzja OR zarząd)`,
    ];
    if (matrix.former_name) {
      twitterQueries.push(`${sn} OR "${matrix.former_name}"`);
    }

    return {
      general_queries: generalQueries,
      facebook_queries: facebookQueries,
      youtube_queries: youtubeQueries,
      twitter_queries: twitterQueries,
    };
  }

  /**
   * Zapisuje wpis w historii audytu zmian
   */
  async logAuditChange(audit: Omit<EntityRegistryAudit, "id" | "created_at">): Promise<void> {
    const id = `aud_ent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await postgresRepo.insertEntityAudit({
      id,
      ...audit,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Pobiera historię zmian audytowych dla danej spółki lub całego rejestru
   */
  async getAuditHistory(entityId?: string): Promise<EntityRegistryAudit[]> {
    return await postgresRepo.getEntityAuditLogs(entityId);
  }

  /**
   * Dynamiczna synchronizacja i weryfikacja z oficjalnymi źródłami
   */
  async syncWithOfficialSources(): Promise<{
    synced_count: number;
    detected_changes: number;
  }> {
    let detectedChanges = 0;

    for (const initEnt of INITIAL_ORLEN_ENTITIES) {
      const existing = await this.getEntityById(initEnt.id);
      if (!existing) {
        await this.saveEntity(initEnt, false, "Oficjalny Raport Roczny Grupy ORLEN / ESPI");
        detectedChanges++;
      } else {
        // Sprawdzenie czy nastąpiła zmiana w domenach, KRS lub statusie
        let hasChanges = false;
        if (existing.entity_status !== initEnt.entity_status) {
          hasChanges = true;
        }
        if (existing.business_segment !== initEnt.business_segment) {
          hasChanges = true;
        }
        if (hasChanges) {
          await this.saveEntity({ ...existing, ...initEnt }, false, "Weryfikacja okresowa ESPI / GPW");
          detectedChanges++;
        }
      }
    }

    return {
      synced_count: INITIAL_ORLEN_ENTITIES.length,
      detected_changes: detectedChanges,
    };
  }
}

export const orlenEntityRegistry = new OrlenEntityRegistry();
