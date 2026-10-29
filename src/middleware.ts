import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ścieżki publiczne, zasoby statyczne oraz endpointy API
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-touch-icon")
  ) {
    return NextResponse.next();
  }

  // Sprawdzenie ciasteczka autoryzacji
  const sessionToken = request.cookies.get("ttscope_session")?.value;
  if (sessionToken && (sessionToken.startsWith("auth_") || sessionToken === "authenticated_ttscope_2026")) {
    return NextResponse.next();
  }

  // Przekierowanie do ekranu logowania
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
