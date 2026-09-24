"use client";

import createClient from "openapi-fetch";
import type { ApiPaths } from "./paths";

/**
 * Typowany klient dla komponentów klienckich. Zapytania idą przez proxy
 * /api/backend (app/api/backend/[...path]/route.ts), które dokleja token
 * z httpOnly cookie, więc przeglądarka nigdy nie widzi JWT.
 *
 *   const records = await unwrap(clientApi.GET("/stats/records"));
 */
export const clientApi = createClient<ApiPaths>({
  baseUrl: "/api/backend",
});
