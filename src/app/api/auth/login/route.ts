import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    const validPassword = process.env.AUTH_PASSWORD_HASH || "TTomasz2026";

    if (password === validPassword) {
      const response = NextResponse.json({ ok: true });
      // Ciasteczko czysto sesyjne (Session Cookie):
      // Brak maxAge i Expires sprawia, że przeglądarka usuwa je przy zamknięciu sesji.
      response.cookies.set("ttscope_session", `auth_${Date.now()}`, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      return response;
    }

    return NextResponse.json(
      { ok: false, error: "Nieprawidłowe hasło dostępu do systemu TTscope" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Błąd autoryzacji" },
      { status: 500 }
    );
  }
}
