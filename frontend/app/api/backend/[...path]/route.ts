import { NextResponse, type NextRequest } from "next/server";
import { backendUrl } from "@/lib/api/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

// Proxy BFF: przeglądarka woła /api/backend/<ścieżka>, a my przekazujemy
// zapytanie do NestJS z tokenem z httpOnly cookie. Dzięki temu backend nie
// potrzebuje CORS dla frontendu, a JWT nie trafia do JavaScriptu.

const FORWARDED_REQUEST_HEADERS = ["content-type", "accept", "accept-language"];
const FORWARDED_RESPONSE_HEADERS = ["content-type", "content-length"];

async function forward(request: NextRequest, ctx: RouteContext<"/api/backend/[...path]">) {
  const { path } = await ctx.params;

  // Logowanie i rejestracja idą przez Server Actions (lib/auth/actions.ts),
  // żeby token nigdy nie wrócił do przeglądarki w treści odpowiedzi.
  if (path[0] === "auth" && (path[1] === "signin" || path[1] === "signup")) {
    return NextResponse.json(
      { statusCode: 404, error: "Not Found", message: "Use the sign-in form" },
      { status: 404 },
    );
  }

  const target = new URL(`${backendUrl()}/${path.map(encodeURIComponent).join("/")}`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) headers.set("authorization", `Bearer ${token}`);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { statusCode: 502, error: "Bad Gateway", message: "Backend is unreachable" },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });

  // Token wygasł albo użytkownik został usunięty: czyścimy sesję,
  // a następna nawigacja trafi przez proxy.ts na /login.
  if (upstream.status === 401 && token) {
    response.cookies.delete(SESSION_COOKIE);
  }

  return response;
}

export {
  forward as GET,
  forward as POST,
  forward as PATCH,
  forward as PUT,
  forward as DELETE,
};
