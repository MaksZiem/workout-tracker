import { NextResponse, type NextRequest } from "next/server";
import { PUBLIC_ROUTES, SESSION_COOKIE } from "@/lib/auth/constants";
import { readToken } from "@/lib/auth/token";

// Ochrona tras przed renderem. Rolę bierzemy z JWT (bez weryfikacji podpisu);
// to tylko nawigacja. Uprawnienia egzekwuje backend, a layouty sprawdzają
// je jeszcze raz przez GET /auth/context.

function isPublic(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = readToken(token);

  if (isPublic(pathname)) {
    // ?expired=1 ustawia requireUser(), gdy backend odrzucił token, który
    // wyglądał na ważny (np. konto usunięte). Czyścimy go, żeby nie było pętli.
    if (searchParams.has("expired")) {
      const response = NextResponse.next();
      if (token) response.cookies.delete(SESSION_COOKIE);
      return response;
    }
    if (session) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!session) {
    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("next", `${pathname}${search}`);
    const response = NextResponse.redirect(login);
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  if ((pathname === "/admin" || pathname.startsWith("/admin/")) && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Wszystko poza API (proxy BFF samo obsługuje 401), plikami Next i statykami.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt)$).*)",
  ],
};
