"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { UserDto } from "@/lib/api/extra-types";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { NAV_GROUPS, isActive, visibleNavItems } from "./nav-items";
import { UserMenu } from "./user-menu";

/** Nawigacja desktopowa (od md w górę). Na telefonie zastępuje ją MobileNav. */
export function Sidebar({ user }: { user: UserDto }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const items = visibleNavItems(user.role === "ADMIN");

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <Link href="/" className="px-6 pt-6 pb-4 text-base font-semibold tracking-tight">
        Workout Tracker
      </Link>

      <nav aria-label={t("label")} className="flex-1 overflow-y-auto px-3">
        {NAV_GROUPS.map((group) => {
          const groupItems = items.filter((item) => item.group === group);
          if (!groupItems.length) return null;
          return (
            <div key={group} className="mt-5 first:mt-1">
              <p className="px-3 pb-1.5 text-xs font-medium text-muted">{t(`groups.${group}`)}</p>
              <ul className="flex flex-col gap-0.5">
                {groupItems.map(({ key, href, icon: Icon }) => {
                  const active = isActive(pathname, href);
                  return (
                    <li key={key}>
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                          active
                            ? "bg-surface-muted font-medium text-foreground"
                            : "text-muted hover:bg-surface-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                        {t(key)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="flex flex-col gap-3 border-t border-border p-3">
        <LocaleSwitcher className="self-start ml-3" />
        <UserMenu user={user} />
      </div>
    </aside>
  );
}
