"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { clientApi } from "@/lib/api/client";
import { unwrap } from "@/lib/api/errors";
import type { AdminUsersPage } from "@/lib/api/extra-types";
import type { CatalogHealth } from "@/lib/admin/load";
import type { UserListQuery } from "@/lib/admin/users-query";
import type { Section } from "@/lib/stats/model";
import { ToastView, useToast, type Toast } from "@/components/ui/toast";
import { UsersSection } from "./users-section";

type ShowToast = (toast: Omit<Toast, "id">) => void;

/** Panel admina: stan katalogu (embeddingi) i konta użytkowników. Bez niebieskiego przycisku. */
export function AdminView({
  catalog,
  users,
  query,
  meId,
}: {
  catalog: Section<CatalogHealth>;
  users: Section<AdminUsersPage>;
  query: UserListQuery;
  meId: number;
}) {
  const t = useTranslations("pages.admin");
  const { toast, show, dismiss } = useToast();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("description")}</p>
      </header>

      <AdminSection
        id="admin-catalog"
        title={t("catalog.title")}
        className="mt-8"
        aside={
          <Link
            href="/admin/exercises"
            className="-mr-2 flex h-9 items-center gap-0.5 rounded-lg pr-1 pl-2 text-sm font-medium text-accent hover:bg-accent-surface"
          >
            {t("catalog.manage")}
            <ChevronRight className="size-4" strokeWidth={2.25} aria-hidden />
          </Link>
        }
      >
        {catalog.ok ? <CatalogPanel health={catalog.data} onToast={show} /> : <LoadError />}
      </AdminSection>

      <AdminSection
        id="admin-users"
        title={t("users.title")}
        count={users.ok ? t("users.count", { count: users.data.total }) : undefined}
        className="mt-10"
      >
        {users.ok ? <UsersSection page={users.data} query={query} meId={meId} onToast={show} /> : <LoadError />}
      </AdminSection>

      <ToastView toast={toast} onDismiss={dismiss} undoLabel={t("undo")} />
    </div>
  );
}

function AdminSection({
  id,
  title,
  count,
  aside,
  className,
  children,
}: {
  id: string;
  title: string;
  count?: string;
  aside?: ReactNode;
  className: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={className}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <h2 id={id} className="text-[17px] leading-snug font-semibold">
            {title}
          </h2>
          {count ? <span className="text-[13px] text-muted tabular-nums">{count}</span> : null}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Błąd jednej sekcji: reszta panelu działa dalej. */
function LoadError() {
  const t = useTranslations("pages.stats");
  const router = useRouter();
  return (
    <p role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-danger-surface px-4 py-3 text-sm text-danger">
      {t("sectionError")}
      <button type="button" onClick={() => router.refresh()} className="font-medium underline">
        {t("retry")}
      </button>
    </p>
  );
}

function CatalogPanel({ health, onToast }: { health: CatalogHealth; onToast: ShowToast }) {
  const t = useTranslations("pages.admin.catalog");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const backfill = async () => {
    if (pending) return;
    setPending(true);
    setFailed(false);
    try {
      const result = await unwrap(clientApi.POST("/exercise/backfill-embeddings"));
      onToast({ message: t("backfilled", { count: result.updated }), tone: "default" });
    } catch {
      // Backfill zapisuje po jednym ćwiczeniu, więc część mogła się udać: liczniki odświeżamy zawsze.
      setFailed(true);
    } finally {
      setPending(false);
      router.refresh();
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <p className="text-[15px] tabular-nums">
            <span className="font-semibold">{t("count", { count: health.total })}</span>
            {health.missing ? (
              <>
                <span className="text-muted"> · </span>
                {t("missing", { count: health.missing })}
              </>
            ) : null}
          </p>
          <p className="mt-1 max-w-[65ch] text-[13px] text-muted">{health.missing ? t("missingHint") : t("complete")}</p>
        </div>
        {health.missing ? (
          <button
            type="button"
            onClick={backfill}
            disabled={pending}
            aria-busy={pending}
            className="flex h-11 shrink-0 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60 sm:w-auto"
          >
            {pending ? t("backfilling") : t("backfill")}
          </button>
        ) : null}
      </div>
      {failed ? (
        <p role="alert" className="mt-3 rounded-lg bg-danger-surface px-3 py-2.5 text-sm text-danger">
          {t("backfillError")}
        </p>
      ) : null}
    </div>
  );
}
