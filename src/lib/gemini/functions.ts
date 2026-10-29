import { dbRepo } from "../db";
import type { Document, Event, Source } from "../db/types";

// Deklaracje narzędzi (tools) dla Gemini API Function Calling
export const GEMINI_FUNCTION_DECLARATIONS = [
  {
    name: "search_documents",
    description: "Wyszukuje zweryfikowane dokumenty i artykuły w bazie TTscope po zapytaniu tekstowym, lokalizacji zakładu lub filtrach.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Fraza kluczowa, np. 'ceny paliw', 'flara', 'Olefiny', 'spór zbiorowy'" },
        facilityLocation: { type: "STRING", description: "Nazwa zakładu lub miasta, np. 'Płock', 'Gdańsk', 'Włocławek', 'Trzebinia'" },
        isOrlenOfficial: { type: "BOOLEAN", description: "Tylko oficjalne komunikaty Grupy ORLEN" },
        isLaborSignal: { type: "BOOLEAN", description: "Tylko sygnały pracownicze i związkowe" },
        limit: { type: "INTEGER", description: "Maksymalna liczba wyników (domyślnie 10)" },
      },
    },
  },
  {
    name: "get_document",
    description: "Zwraca pełną treść i metadane konkretnego dokumentu z bazy TTscope po jego ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        id: { type: "STRING", description: "Unikalny identyfikator dokumentu (doc_...)" },
      },
      required: ["id"],
    },
  },
  {
    name: "search_events",
    description: "Wyszukuje zagregowane wydarzenia i potencjalne ogniska iskrzeń w bazie TTscope.",
    parameters: {
      type: "OBJECT",
      properties: {
        stage: { type: "STRING", description: "Etap kryzysu, np. 'local_cluster', 'growing_topic', 'media_crisis'" },
      },
    },
  },
  {
    name: "get_event_timeline",
    description: "Zwraca chronologiczną oś czasu publikacji dla danego wydarzenia w bazie.",
    parameters: {
      type: "OBJECT",
      properties: {
        eventId: { type: "STRING", description: "ID wydarzenia (evt_...)" },
      },
      required: ["eventId"],
    },
  },
  {
    name: "get_source_health",
    description: "Zwraca aktualny stan zdrowia konektorów i źródeł danych (sukcesy, błędy, status kluczy API).",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "get_location_signals",
    description: "Zwraca wszystkie sygnały i artykuły przypisane do danego zakładu produkcyjnego Grupy ORLEN.",
    parameters: {
      type: "OBJECT",
      properties: {
        location: { type: "STRING", description: "Nazwa lokalizacji: 'Płock', 'Gdańsk', 'Włocławek', 'Trzebinia', 'Jedlicze'" },
      },
      required: ["location"],
    },
  },
];

// Wykonawca wywołań narzędzi (Tool Executor)
export async function executeGeminiFunction(
  name: string,
  args: Record<string, any>
): Promise<any> {
  // Rejestracja w audit logu
  dbRepo.logAudit({
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    action_type: "gemini_function_call",
    entity_type: "function",
    entity_id: name,
    details: args,
    created_at: new Date().toISOString(),
  });

  switch (name) {
    case "search_documents": {
      const result = dbRepo.getDocuments({
        query: args.query,
        facilityLocation: args.facilityLocation,
        isOrlenOfficial: args.isOrlenOfficial,
        isLaborSignal: args.isLaborSignal,
        limit: Math.min(args.limit || 10, 25),
      });

      return {
        total_found: result.total,
        documents: result.documents.map((d) => ({
          id: d.id,
          title: d.title,
          source_name: d.source_name,
          url: d.url,
          published_at: d.published_at,
          facility_location: d.facility_location,
          is_orlen_official: d.is_orlen_official,
          is_labor_signal: d.is_labor_signal,
          excerpt: d.excerpt || d.content.slice(0, 200),
        })),
      };
    }

    case "get_document": {
      const doc = dbRepo.getDocumentById(args.id);
      if (!doc) return { error: `Dokument o ID ${args.id} nie został odnaleziony w bazie.` };
      return doc;
    }

    case "search_events": {
      const events = dbRepo.getAllEvents();
      return {
        total_events: events.length,
        events: events.map((e) => ({
          id: e.id,
          title: e.title,
          stage: e.event_stage,
          sparks_score: e.sparks_score,
          last_signal_at: e.last_signal_at,
          has_orlen_responded: e.has_orlen_responded,
        })),
      };
    }

    case "get_event_timeline": {
      const eventDetails = dbRepo.getEventById(args.eventId);
      if (!eventDetails) return { error: `Wydarzenie o ID ${args.eventId} nie istnieje.` };
      return {
        event_title: eventDetails.title,
        timeline: eventDetails.documents.map((d) => ({
          title: d.title,
          source: d.source_name,
          published_at: d.published_at,
          step: d.diffusion_step,
          time_delta_seconds: d.time_delta_seconds,
          url: d.url,
        })),
      };
    }

    case "get_source_health": {
      const stats = dbRepo.getDashboardStats();
      const sources = dbRepo.getAllSources();
      return {
        total_sources: stats.totalSources,
        active_sources: stats.activeSources,
        last_fetch: stats.lastFetch,
        sources_summary: sources.map((s) => ({
          name: s.name,
          category: s.category,
          requires_api_key: s.requires_api_key,
          is_active: s.is_active,
        })),
      };
    }

    case "get_location_signals": {
      const { documents } = dbRepo.getDocuments({
        facilityLocation: args.location,
        limit: 15,
      });
      return {
        location: args.location,
        count: documents.length,
        signals: documents.map((d) => ({
          id: d.id,
          title: d.title,
          source_name: d.source_name,
          published_at: d.published_at,
          is_labor_signal: d.is_labor_signal,
          is_local_signal: d.is_local_signal,
          url: d.url,
        })),
      };
    }

    default:
      return { error: `Nieznana funkcja: ${name}` };
  }
}
