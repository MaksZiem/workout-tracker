import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverApi } from "@/lib/api/server";
import type { UserDto } from "@/lib/api/extra-types";
import { SESSION_COOKIE } from "./constants";
import { readToken, type SessionClaims } from "./token";

export async function getSession(): Promise<SessionClaims | null> {
  return readToken((await cookies()).get(SESSION_COOKIE)?.value);
}

export const getCurrentUser = cache(async (): Promise<UserDto | null> => {
  if (!(await getSession())) return null;
  const api = await serverApi();
  const { data, response } = await api.GET("/auth/context");
  if (!response.ok || !data) return null;
  return data;
});

export async function requireUser(): Promise<UserDto> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?expired=1");
  return user;
}

export async function requireAdmin(): Promise<UserDto> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
