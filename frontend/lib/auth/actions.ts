"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverApi } from "@/lib/api/server";
import { SESSION_COOKIE } from "./constants";
import { readToken } from "./token";

export type AuthErrorCode =
  | "invalidCredentials"
  | "userExists"
  | "validation"
  | "unreachable"
  | "unknown";

export type AuthFormState = {
  error?: AuthErrorCode;
  /** Surowe komunikaty walidacji z backendu (po angielsku, z class-validator). */
  details?: string[];
  /** Wartości do ponownego wypełnienia formularza (nigdy hasło). */
  values?: { email?: string; name?: string; surname?: string };
};

async function startSession(token: string) {
  const claims = readToken(token);
  const maxAge = claims?.exp ? Math.max(0, claims.exp - Math.floor(Date.now() / 1000)) : undefined;
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

/** Dopuszcza tylko ścieżki wewnętrzne, żeby ?next= nie przekierował na obcą domenę. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function toMessages(error: unknown): string[] {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (Array.isArray(message)) return message.map(String);
    if (typeof message === "string") return [message];
  }
  return [];
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const values = { email };

  let token: string;
  try {
    const api = await serverApi();
    const { data, error, response } = await api.POST("/auth/signin", {
      body: { email, password },
    });
    if (!data) {
      if (response.status === 401) return { error: "invalidCredentials", values };
      if (response.status === 400) return { error: "validation", details: toMessages(error), values };
      return { error: "unknown", values };
    }
    token = data.access_token;
  } catch {
    return { error: "unreachable", values };
  }

  await startSession(token);
  redirect(safeNext(formData.get("next")));
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const surname = String(formData.get("surname") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const values = { email, name, surname };

  let token: string;
  try {
    const api = await serverApi();
    const { data, error, response } = await api.POST("/auth/signup", {
      body: { email, name, surname, password },
    });
    if (!data) {
      const details = toMessages(error);
      if (details.some((m) => /already exists/i.test(m))) return { error: "userExists", values };
      if (response.status === 400) return { error: "validation", details, values };
      return { error: "unknown", values };
    }
    token = data.access_token;
  } catch {
    return { error: "unreachable", values };
  }

  await startSession(token);
  redirect("/");
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
