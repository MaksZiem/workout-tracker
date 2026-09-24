import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverApi } from "@/lib/api/server";
import type { UserDto } from "@/lib/api/extra-types";
import { SESSION_COOKIE } from "./constants";
import { readToken, type SessionClaims } from "./token";

/** Szybki odczyt sesji z cookie, bez zapytania do backendu. */
export async function getSession(): Promise<SessionClaims | null> {
  return readToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/**
 * Aktualny profil z backendu (GET /auth/context). Liczy się tylko raz
 * na render (React.cache). Zwraca null, gdy token jest nieważny.
 */
export const getCurrentUser = cache(async (): Promise<UserDto | null> => {
  if (!(await getSession())) return null;
  const api = await serverApi();
  const { data, response } = await api.GET("/auth/context");
  if (!response.ok || !data) return null;
  return data;
});

/** Dla layoutów i stron za logowaniem: profil albo przekierowanie na /login. */
export async function requireUser(): Promise<UserDto> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?expired=1");
  return user;
}

/** Tylko ADMIN. Pozostałych użytkowników przekierowuje na pulpit. */
export async function requireAdmin(): Promise<UserDto> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
