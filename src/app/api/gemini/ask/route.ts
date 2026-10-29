import { NextRequest, NextResponse } from "next/server";
import { getGeminiConfig } from "@/lib/gemini/client";
import {
  GEMINI_FUNCTION_DECLARATIONS,
  executeGeminiFunction,
} from "@/lib/gemini/functions";
import { dbRepo } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { ok: false, error: "Brak treści pytania." },
        { status: 400 }
      );
    }

    const config = getGeminiConfig();

    // 1. Obsługa braku klucza API
    if (!config.apiKey) {
      // Wykonujemy zapytanie heurystyczne do bazy jako fallback
      const searchRes = dbRepo.getDocuments({ query: question.trim(), limit: 5 });
      return NextResponse.json({
        ok: true,
        aiEnabled: false,
        warning: "Klucz GEMINI_API_KEY nie jest skonfigurowany. Wyświetlam bezpośrednie wyniki wyszukiwania w bazie danych.",
        answer: `System działa w trybie bez modelu językowego. Znaleziono ${searchRes.total} pasujących publikacji w bazie lokalnej.`,
        sourcesUsed: searchRes.documents.map((d) => ({
          title: d.title,
          url: d.url,
          source: d.source_name,
          published_at: d.published_at,
        })),
      });
    }

    // 2. Wywołanie Gemini API z Function Calling
    const systemInstruction = `Jesteś analitykiem wywiadowczym systemu TTscope (monitoring Grupy ORLEN).
Odpowiadaj WYŁĄCZNIE w oparciu o dane uzyskane z bazy za pomocą udostępnionych funkcji narzędziowych (search_documents, search_events, get_location_signals itp.).
ZASADY ODPOWIEDZI:
1. Nigdy nie zmyślaj faktów, cytatów ani liczb.
2. Zawsze podawaj źródło, datę publikacji i bezpośredni link URL do dokumentu.
3. Wyraźnie rozdzielaj: [FAKT POTWIERDZONY], [INFORMACJA PRASOWA], [STANOWISKO ORLENU], [OPINIA].
4. Jeśli w bazie nie ma wystarczających danych do odpowiedzi na pytanie, napisz wprost: "Brak wystarczających danych w bazie TTscope na ten temat." Nie zgaduj.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: question }],
        },
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      tools: [
        {
          functionDeclarations: GEMINI_FUNCTION_DECLARATIONS,
        },
      ],
      generationConfig: {
        temperature: 0.1,
      },
    };

    const firstResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!firstResponse.ok) {
      const errText = await firstResponse.text();
      return NextResponse.json(
        { ok: false, error: `Błąd komunikacji z modelem (${firstResponse.status}): ${errText.slice(0, 200)}` },
        { status: firstResponse.status }
      );
    }

    const firstData = await firstResponse.json();
    const candidate = firstData?.candidates?.[0]?.content;
    const functionCallPart = candidate?.parts?.find((p: any) => p.functionCall);

    // Jeśli model nie wywołał funkcji, zwraca bezpośrednią odpowiedź
    if (!functionCallPart) {
      const directText = candidate?.parts?.[0]?.text || "Brak wystarczających danych.";
      return NextResponse.json({
        ok: true,
        aiEnabled: true,
        answer: directText,
        sourcesUsed: [],
      });
    }

    // Wykonanie funkcji narzędziowej w lokalnej bazie danych TTscope
    const fnName = functionCallPart.functionCall.name;
    const fnArgs = functionCallPart.functionCall.args || {};
    const functionExecutionResult = await executeGeminiFunction(fnName, fnArgs);

    // Krok 2: Przekazanie wyniku narzędzia z powrotem do Gemini
    const secondRequestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: question }],
        },
        candidate,
        {
          role: "function",
          parts: [
            {
              functionResponse: {
                name: fnName,
                response: functionExecutionResult,
              },
            },
          ],
        },
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      generationConfig: {
        temperature: 0.1,
      },
    };

    const secondResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(secondRequestBody),
    });

    if (!secondResponse.ok) {
      const errText = await secondResponse.text();
      return NextResponse.json(
        { ok: false, error: `Błąd syntezy odpowiedzi modelu (${secondResponse.status}): ${errText.slice(0, 200)}` },
        { status: secondResponse.status }
      );
    }

    const secondData = await secondResponse.json();
    const finalAnswer = secondData?.candidates?.[0]?.content?.parts?.[0]?.text || "Brak danych.";

    return NextResponse.json({
      ok: true,
      aiEnabled: true,
      functionExecuted: fnName,
      functionArgs: fnArgs,
      answer: finalAnswer,
      rawFunctionResult: functionExecutionResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd asystenta TTscope";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
