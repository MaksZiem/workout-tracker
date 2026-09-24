"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LogOut, UserRound } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import type { UserDto } from "@/lib/api/extra-types";

/** Imię, rola, link do konta i wylogowanie. Wspólne dla sidebara i menu „Więcej”. */
export function UserMenu({ user, onNavigate }: { user: UserDto; onNavigate?: () => void }) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-1">
      <Link
        href="/account"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-surface-muted"
      >
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted text-muted"
        >
          <UserRound className="size-4" strokeWidth={1.75} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">
            {user.name} {user.surname}
          </span>
          <span className="block truncate text-xs text-muted">
            {t(`common.role.${user.role}`)} · {t("nav.account")}
          </span>
        </span>
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted hover:bg-surface-muted hover:text-foreground"
        >
          <LogOut className="size-4" strokeWidth={1.75} aria-hidden />
          {t("common.signOut")}
        </button>
      </form>
    </div>
  );
}
