import { decodeJwt } from "jose";
import { USER_ROLES, type UserRole } from "@/lib/api/extra-types";

/** Pola, które backend podpisuje w JWT (backend/src/users/auth.service.ts). */
export type SessionClaims = {
  id: number;
  email: string;
  role: UserRole;
  name: string;
  surname: string;
  /** Wygaśnięcie w sekundach od epoki (backend: expiresIn 7d). */
  exp?: number;
};

/**
 * Dekoduje JWT BEZ weryfikacji podpisu. Wystarcza do nawigacji i ukrywania
 * elementów UI. Prawdziwą autoryzację robi backend przy każdym zapytaniu
 * (AuthGuard/AdminGuard). Zwraca null dla tokenu uszkodzonego lub wygasłego.
 * Działa też w proxy.ts.
 */
export function readToken(token: string | undefined): SessionClaims | null {
  if (!token) return null;
  try {
    const claims = decodeJwt(token);
    if (typeof claims.exp === "number" && claims.exp * 1000 <= Date.now()) {
      return null;
    }
    if (
      typeof claims.id !== "number" ||
      typeof claims.email !== "string" ||
      !USER_ROLES.includes(claims.role as UserRole)
    ) {
      return null;
    }
    return {
      id: claims.id,
      email: claims.email,
      role: claims.role as UserRole,
      name: String(claims.name ?? ""),
      surname: String(claims.surname ?? ""),
      exp: claims.exp,
    };
  } catch {
    return null;
  }
}
