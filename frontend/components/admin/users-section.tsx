"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Ellipsis, ShieldCheck } from "lucide-react";
import { clientApi } from "@/lib/api/client";
import { unwrap } from "@/lib/api/errors";
import type { AdminUserDto, AdminUsersPage, UserRole } from "@/lib/api/extra-types";
import { defaultOrder, PAGE_SIZES, usersHref, type UserListQuery, type UserSort } from "@/lib/admin/users-query";
import { SearchField } from "@/components/exercises/search-field";
import { ActionMenu } from "@/components/ui/action-menu";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import type { Toast } from "@/components/ui/toast";

type ShowToast = (toast: Omit<Toast, "id">) => void;

const SORT_OPTIONS = [
  "name-asc",
  "name-desc",
  "email-asc",
  "email-desc",
  "role-desc",
  "role-asc",
  "workoutCount-desc",
  "workoutCount-asc",
] as const;

/**
 * Konta użytkowników: wyszukiwanie, sortowanie i strony liczy backend, stan listy jest w URL.
 * Wyszukiwarka leży poza tabelą, bo tabela montuje się od nowa przy każdej nowej stronie danych.
 */
export function UsersSection({
  page,
  query,
  meId,
  onToast,
}: {
  page: AdminUsersPage;
  query: UserListQuery;
  meId: number;
  onToast: ShowToast;
}) {
  const t = useTranslations("pages.admin.users");
  const router = useRouter();
  const [search, setSearch] = useState(query.q);
  const [pending, startTransition] = useTransition();

  const go = (next: UserListQuery) => startTransition(() => router.replace(usersHref(next), { scroll: false }));

  useEffect(() => {
    if (search.trim() === query.q.trim()) return;
    // Zapytanie dopiero po przerwie w pisaniu, zawsze od pierwszej strony.
    const timer = setTimeout(
      () => startTransition(() => router.replace(usersHref({ ...query, q: search, page: 1 }), { scroll: false })),
      300,
    );
    return () => clearTimeout(timer);
  }, [search, query, router]);

  // Nowe dane albo nowy stan listy: tabela startuje od świeżych wierszy z serwera.
  const tableKey = `${usersHref(query)}|${page.items.map((u) => `${u.id}:${u.role}`).join(",")}`;

  return (
    <>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:w-96">
          <SearchField value={search} onChange={setSearch} label={t("search")} />
        </div>
        {/* Telefon: bez nagłówków kolumn, więc sortowanie jest listą wyboru. */}
        <label className="flex h-11 items-center gap-2 rounded-lg bg-surface-muted px-3 text-[15px] focus-within:ring-2 focus-within:ring-accent sm:hidden">
          <span className="shrink-0 text-muted">{t("sortLabel")}</span>
          <select
            value={`${query.sort}-${query.order}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split("-") as [UserSort, "asc" | "desc"];
              go({ ...query, sort, order, page: 1 });
            }}
            className="h-full min-w-0 flex-1 bg-transparent font-medium outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`sort.${option}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <UsersTable
        key={tableKey}
        page={page}
        query={query}
        meId={meId}
        pending={pending}
        onPageSize={(limit) => go({ ...query, limit, page: 1 })}
        onClearSearch={() => setSearch("")}
        onToast={onToast}
      />
    </>
  );
}

function UsersTable({
  page,
  query,
  meId,
  pending,
  onPageSize,
  onClearSearch,
  onToast,
}: {
  page: AdminUsersPage;
  query: UserListQuery;
  meId: number;
  pending: boolean;
  onPageSize: (limit: number) => void;
  onClearSearch: () => void;
  onToast: ShowToast;
}) {
  const t = useTranslations("pages.admin.users");
  const tAdmin = useTranslations("pages.admin");
  const tRole = useTranslations("common.role");
  const router = useRouter();
  const [users, setUsers] = useState(page.items);
  const [deleting, setDeleting] = useState<AdminUserDto | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const fullName = (u: AdminUserDto) => `${u.name} ${u.surname}`;

  const setRole = async (user: AdminUserDto, role: UserRole, undoable = true) => {
    const previous = user.role;
    const apply = (next: UserRole) => setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, role: next } : u)));
    apply(role);
    try {
      await unwrap(clientApi.PATCH("/auth/{id}", { params: { path: { id: user.id } }, body: { role } }));
      onToast({
        message: t(role === "ADMIN" ? "granted" : "revoked", { name: fullName(user) }),
        tone: "default",
        undo: undoable ? () => setRole({ ...user, role }, previous, false) : undefined,
      });
      // Przy sortowaniu po roli wiersz mógł zmienić miejsce albo stronę.
      router.refresh();
    } catch {
      apply(previous);
      onToast({ message: t("roleError"), tone: "error" });
    }
  };

  const remove = async () => {
    if (!deleting || deletePending) return;
    const user = deleting;
    setDeletePending(true);
    try {
      await unwrap(clientApi.DELETE("/auth/{id}", { params: { path: { id: user.id } } }));
      setUsers((list) => list.filter((u) => u.id !== user.id));
      onToast({ message: t("deleted", { name: fullName(user) }), tone: "default" });
      // Strona dobiera kolejne konto, a licznik i liczba stron się zmniejszają.
      router.refresh();
    } catch {
      onToast({ message: t("deleteError"), tone: "error" });
    } finally {
      setDeletePending(false);
      setDeleting(null);
    }
  };

  const menu = (user: AdminUserDto) =>
    user.id === meId ? (
      // Własnego konta nie można tu usunąć ani odebrać sobie roli (backend też tego pilnuje).
      <span className="block size-10" aria-hidden />
    ) : (
      <ActionMenu
        label={t("menu", { name: fullName(user) })}
        align="right"
        trigger={<Ellipsis className="size-5" strokeWidth={2} aria-hidden />}
        triggerClassName="grid size-10 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground"
        actions={[
          user.role === "ADMIN"
            ? { label: t("revoke"), onSelect: () => setRole(user, "USER") }
            : { label: t("grant"), onSelect: () => setRole(user, "ADMIN") },
          { label: t("delete"), tone: "danger", onSelect: () => setDeleting(user) },
        ]}
      />
    );

  const nameCell = (user: AdminUserDto) => (
    <>
      <span className="min-w-0 truncate">{fullName(user)}</span>
      {user.id === meId ? <span className="shrink-0 text-[13px] font-normal text-muted">{t("you")}</span> : null}
    </>
  );

  const role = (user: AdminUserDto) =>
    user.role === "ADMIN" ? (
      <span className="inline-flex items-center gap-1.5 font-medium">
        <ShieldCheck className="size-4 text-muted" strokeWidth={2} aria-hidden />
        {tRole("ADMIN")}
      </span>
    ) : (
      <span className="text-muted">{tRole("USER")}</span>
    );

  const searching = query.q.trim() !== "";
  const from = (page.page - 1) * page.limit + 1;

  return (
    <>
      <div
        aria-busy={pending}
        className={`rounded-xl border border-border bg-surface transition-opacity ${pending ? "opacity-60" : ""}`}
      >
        {users.length === 0 ? (
          <div className="px-4 py-4 sm:px-5">
            <p className="text-sm text-muted">{t("noResults", { query: query.q.trim() })}</p>
            <button
              type="button"
              onClick={onClearSearch}
              className="-ml-3 mt-1 flex h-10 items-center rounded-lg px-3 text-sm font-medium text-accent hover:bg-accent-surface"
            >
              {t("clear")}
            </button>
          </div>
        ) : (
          <>
            {/* Desktop: tabela z sortowaniem po kliknięciu nagłówka */}
            <table className="hidden w-full table-fixed text-sm sm:table">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-semibold tracking-wide whitespace-nowrap text-muted uppercase">
                  <SortHeader field="name" label={t("user")} query={query} className="w-[30%] px-4 sm:pl-5" />
                  <SortHeader field="email" label={t("email")} query={query} className="px-3" />
                  <SortHeader field="role" label={t("role")} query={query} className="w-36 px-3" />
                  <SortHeader field="workoutCount" label={t("workouts")} query={query} className="w-28 px-3" align="right" />
                  <th scope="col" className="w-14 pr-2">
                    <span className="sr-only">{t("menu", { name: "" })}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id}>
                    <th scope="row" className="px-4 py-1.5 text-left font-medium sm:pl-5">
                      <span className="flex items-baseline gap-2">{nameCell(user)}</span>
                    </th>
                    <td className="truncate px-3 py-1.5 text-muted">{user.email}</td>
                    <td className="px-3 py-1.5">{role(user)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{user.workoutCount}</td>
                    <td className="py-1.5 pr-2">{menu(user)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Telefon: lista */}
            <ul className="divide-y divide-border sm:hidden">
              {users.map((user) => (
                <li key={user.id} className="flex min-h-14 items-center gap-3 py-2.5 pr-2 pl-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-baseline gap-2 text-[15px] font-medium">{nameCell(user)}</p>
                    <p className="truncate text-[13px] text-muted">{user.email}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-[13px] tabular-nums">
                      {role(user)}
                      <span className="text-muted" aria-hidden>
                        ·
                      </span>
                      <span className="text-muted">{t("workoutsCount", { count: user.workoutCount })}</span>
                    </p>
                  </div>
                  {menu(user)}
                </li>
              ))}
            </ul>
          </>
        )}

        {!searching && page.total <= 1 ? (
          <p className="border-t border-border px-4 py-3 text-sm text-muted sm:px-5">{t("alone")}</p>
        ) : null}

        {/* Stopka od 11 kont: wtedy wybór rozmiaru strony coś zmienia. */}
        {page.total > PAGE_SIZES[0] ? (
          <nav
            aria-label={t("pagination")}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border py-2 pr-2 pl-4 sm:pl-5"
          >
            <div className="flex items-center gap-4">
              <p className="text-[13px] text-muted tabular-nums">
                {t("range", { from, to: from + page.items.length - 1, total: page.total })}
              </p>
              <label className="flex h-9 items-center gap-1.5 rounded-lg bg-surface-muted pr-1 pl-2.5 text-[13px] focus-within:ring-2 focus-within:ring-accent">
                <span className="text-muted">{t("perPage")}</span>
                <select
                  value={query.limit}
                  onChange={(e) => onPageSize(Number(e.target.value))}
                  className="h-full bg-transparent font-medium tabular-nums outline-none"
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {page.pageCount > 1 ? (
              <div className="flex items-center gap-1">
                <span className="mr-2 hidden text-[13px] text-muted tabular-nums sm:inline">
                  {t("pageOf", { page: page.page, pages: page.pageCount })}
                </span>
                <PageLink query={query} page={page.page - 1} disabled={page.page <= 1} label={t("prev")}>
                  <ChevronLeft className="size-5" strokeWidth={2} aria-hidden />
                </PageLink>
                <PageLink query={query} page={page.page + 1} disabled={page.page >= page.pageCount} label={t("next")}>
                  <ChevronRight className="size-5" strokeWidth={2} aria-hidden />
                </PageLink>
              </div>
            ) : null}
          </nav>
        ) : null}
      </div>

      <ConfirmSheet
        open={deleting !== null}
        title={deleting ? t("deleteTitle", { name: fullName(deleting) }) : ""}
        body={deleting ? t("deleteBody", { count: deleting.workoutCount, email: deleting.email }) : ""}
        confirmLabel={deletePending ? t("deleting") : t("deleteConfirm")}
        cancelLabel={tAdmin("cancel")}
        pending={deletePending}
        onConfirm={remove}
        onClose={() => !deletePending && setDeleting(null)}
      />
    </>
  );
}

/** Nagłówek kolumny jako link sortowania; aktywna kolumna ma jasny tekst i strzałkę kierunku. */
function SortHeader({
  field,
  label,
  query,
  className,
  align = "left",
}: {
  field: UserSort;
  label: string;
  query: UserListQuery;
  className: string;
  align?: "left" | "right";
}) {
  const t = useTranslations("pages.admin.users");
  const active = query.sort === field;
  const order = active ? (query.order === "asc" ? "desc" : "asc") : defaultOrder(field);
  const Icon = !active ? ChevronsUpDown : query.order === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (query.order === "asc" ? "ascending" : "descending") : "none"}
      className={`py-1 font-semibold ${align === "right" ? "text-right" : ""} ${className}`}
    >
      <Link
        href={usersHref({ ...query, sort: field, order, page: 1 })}
        scroll={false}
        replace
        aria-label={t("sortBy", { column: label })}
        className={`group -mx-1.5 inline-flex h-8 items-center gap-1 rounded-md px-1.5 uppercase hover:bg-surface-muted hover:text-foreground ${
          align === "right" ? "flex-row-reverse" : ""
        } ${active ? "text-foreground" : ""}`}
      >
        {label}
        <Icon
          className={`size-3.5 shrink-0 ${active ? "" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}
          strokeWidth={2.25}
          aria-hidden
        />
      </Link>
    </th>
  );
}

function PageLink({
  query,
  page,
  disabled,
  label,
  children,
}: {
  query: UserListQuery;
  page: number;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const className = "grid size-10 place-items-center rounded-full";
  if (disabled) {
    return (
      <span aria-disabled className={`${className} text-muted opacity-40`} title={label}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={usersHref({ ...query, page })}
      scroll={false}
      replace
      aria-label={label}
      className={`${className} text-muted hover:bg-surface-muted hover:text-foreground`}
    >
      {children}
    </Link>
  );
}
