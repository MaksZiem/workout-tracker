"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Ellipsis, X } from "lucide-react";
import type { UserDto } from "@/lib/api/extra-types";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { NAV_ITEMS, isActive, visibleNavItems } from "./nav-items";
import { UserMenu } from "./user-menu";

/**
 * Nawigacja na telefonie: dolny pasek z najczęstszymi sekcjami, gdzie
 * „Zapisz trening” jest wyróżniony (logowanie jest mobile-first), oraz arkusz
 * „Więcej” z pozostałymi sekcjami, językiem i kontem.
 */
export function MobileNav({ user }: { user: UserDto }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const tabs = NAV_ITEMS.filter((item) => item.mobileTab);
  const rest = visibleNavItems(user.role === "ADMIN").filter((item) => !item.mobileTab);
  const moreActive = rest.some((item) => isActive(pathname, item.href)) || isActive(pathname, "/account");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <nav
        aria-label={t("label")}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-5">
          {tabs.map(({ key, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            const primary = key === "log";
            return (
              <li key={key} className="flex">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] leading-none ${
                    active ? "font-medium text-foreground" : "text-muted"
                  }`}
                >
                  <span
                    className={
                      primary
                        ? "grid size-9 place-items-center rounded-full bg-accent text-accent-foreground"
                        : "grid size-6 place-items-center"
                    }
                  >
                    <Icon className="size-5" strokeWidth={primary ? 2.25 : 1.75} aria-hidden />
                  </span>
                  {t(key)}
                </Link>
              </li>
            );
          })}
          <li className="flex">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] leading-none ${
                moreActive ? "font-medium text-foreground" : "text-muted"
              }`}
            >
              <span className="grid size-6 place-items-center">
                <Ellipsis className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              {t("more")}
            </button>
          </li>
        </ul>
      </nav>

      <dialog
        ref={dialogRef}
        onClose={close}
        onClick={(event) => event.target === dialogRef.current && close()}
        aria-label={t("more")}
        className="mt-auto mb-0 w-full max-w-none rounded-t-2xl bg-surface p-0 text-foreground backdrop:bg-black/40 md:hidden"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <p className="text-sm font-semibold">{t("more")}</p>
          <button
            type="button"
            onClick={close}
            aria-label={t("close")}
            className="grid size-10 place-items-center rounded-full text-muted hover:bg-surface-muted"
          >
            <X className="size-5" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        <ul className="flex flex-col px-2">
          {rest.map(({ key, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={key}>
                <Link
                  href={href}
                  onClick={close}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-12 items-center gap-3 rounded-md px-3 text-[15px] ${
                    active ? "bg-surface-muted font-medium" : "hover:bg-surface-muted"
                  }`}
                >
                  <Icon className="size-5 text-muted" strokeWidth={1.75} aria-hidden />
                  {t(key)}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex flex-col gap-3 border-t border-border px-2 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <LocaleSwitcher className="ml-3 self-start" />
          <UserMenu user={user} onNavigate={close} />
        </div>
      </dialog>
    </>
  );
}
