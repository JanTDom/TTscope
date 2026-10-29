import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    const validPassword = process.env.AUTH_PASSWORD_HASH || "TTomasz2026";

    if (password === validPassword) {
      const response = NextResponse.json({ ok: true });
      response.cookies.set("ttscope_session", "authenticated_ttscope_2026", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    }

    return NextResponse.json(
      { ok: false, error: "Nieprawidłowe hasło dostępu do systemu TTscope" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Błąd autoryzacji" },
      { status: 500 }
    );
  }
}
