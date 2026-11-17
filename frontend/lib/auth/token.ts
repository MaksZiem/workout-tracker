import { decodeJwt } from "jose";
import { USER_ROLES, type UserRole } from "@/lib/api/extra-types";

export type SessionClaims = {
  id: number;
  email: string;
  role: UserRole;
  name: string;
  surname: string;
  exp?: number;
};

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
