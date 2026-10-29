import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ścieżki publiczne (logowanie, assety, api/auth)
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon")
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
