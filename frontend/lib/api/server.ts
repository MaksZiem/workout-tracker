import "server-only";

import createClient from "openapi-fetch";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import type { ApiPaths } from "./paths";

export function backendUrl(): string {
  return process.env.BACKEND_URL ?? "http://localhost:3000";
}

/**
 * Typowany klient backendu dla Server Components, Server Actions i Route Handlerów.
 * Dokleja token z cookie sesji, jeśli istnieje.
 *
 *   const api = await serverApi();
 *   const user = await unwrap(api.GET("/auth/context"));
 */
export async function serverApi() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return createClient<ApiPaths>({
    baseUrl: backendUrl(),
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  });
}
