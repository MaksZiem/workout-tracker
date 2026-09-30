"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, Ellipsis, Plus } from "lucide-react";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/api/extra-types";
import type { AdminExercise } from "@/lib/admin/load";
import { SegmentedLinks } from "@/components/stats/segmented-links";
import { SearchField } from "@/components/exercises/search-field";
import { ActionMenu } from "@/components/ui/action-menu";
import { ToastView, useToast } from "@/components/ui/toast";
import { DeleteExerciseSheet, ExerciseSheet } from "./exercise-sheets";

type SheetState = { kind: "add" } | { kind: "edit"; exercise: AdminExercise } | { kind: "delete"; exercise: AdminExercise } | null;

/** Edytor katalogu: ten sam układ co /exercises, ale wiersze otwierają edycję. Jedyny niebieski to „Dodaj ćwiczenie”. */
export function AdminExercisesView({ items, group }: { items: AdminExercise[]; group: MuscleGroup | null }) {
  const t = useTranslations("pages.adminExercises");
  const tGroup = useTranslations("enums.muscleGroup");
  const tAdmin = useTranslations("pages.admin");
  const [query, setQuery] = useState("");
  const [sheet, setSheet] = useState<SheetState>(null);
  // Nowy klucz przy każdym otwarciu: arkusz startuje z czystym formularzem.
  const [sheetKey, setSheetKey] = useState(0);
  const { toast, show, dismiss } = useToast();

  const open = (next: NonNullable<SheetState>) => {
    setSheetKey((k) => k + 1);
    setSheet(next);
  };

  const present = MUSCLE_GROUPS.filter((g) => items.some((e) => e.muscleGroup === g));
  const missing = items.filter((e) => !e.hasEmbedding).length;

  const groups = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    const visible = items.filter(
      (e) => (!group || e.muscleGroup === group) && (!q || e.name.toLocaleLowerCase().includes(q)),
    );
    return MUSCLE_GROUPS.map((g) => ({ group: g, items: visible.filter((e) => e.muscleGroup === g) })).filter(
      (g) => g.items.length,
    );
  }, [items, group, query]);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link
        href="/admin"
        className="-ml-2 inline-flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted hover:bg-surface-muted hover:text-foreground"
      >
        <ChevronLeft className="size-4" strokeWidth={2.25} aria-hidden />
        {t("back")}
      </Link>

      <header className="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted tabular-nums">
            {t("count", { count: items.length })}
            {missing ? ` · ${t("missing", { count: missing })}` : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => open({ kind: "add" })}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90 sm:w-auto"
        >
          <Plus className="size-4" strokeWidth={2.5} aria-hidden />
          {t("add")}
        </button>
      </header>

      {items.length === 0 ? (
        <p className="mt-6 max-w-xl rounded-xl border border-border bg-surface p-5 text-sm text-muted">{t("empty")}</p>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3">
            <SearchField value={query} onChange={setQuery} label={t("search")} />
            <SegmentedLinks
              label={t("filter")}
              items={[
                { key: "all", label: t("all"), href: "/admin/exercises", active: group === null },
                ...present.map((g) => ({
                  key: g,
                  label: tGroup(g),
                  href: `/admin/exercises?group=${g}`,
                  active: group === g,
                })),
              ]}
            />
          </div>

          {groups.length === 0 ? (
            <div className="mt-6 rounded-xl border border-border bg-surface px-4 py-4 sm:px-5">
              <p className="text-sm text-muted">{t("noResults", { query: query.trim() })}</p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="-ml-3 mt-1 flex h-10 items-center rounded-lg px-3 text-sm font-medium text-accent hover:bg-accent-surface"
              >
                {t("clear")}
              </button>
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-8">
              {groups.map(({ group: g, items: rows }) => (
                <section key={g} aria-labelledby={`admin-group-${g}`}>
                  <div className="mb-3 flex items-baseline gap-2">
                    <h2 id={`admin-group-${g}`} className="text-[17px] leading-snug font-semibold">
                      {tGroup(g)}
                    </h2>
                    <span className="text-[13px] text-muted tabular-nums">{t("count", { count: rows.length })}</span>
                  </div>
                  {/* Bez overflow-hidden: menu ⋯ ostatniego wiersza wychodzi poza panel. */}
                  <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
                    {rows.map((exercise) => (
                      <li key={exercise.id} className="group/row flex items-center">
                        <button
                          type="button"
                          onClick={() => open({ kind: "edit", exercise })}
                          className="flex min-h-14 min-w-0 flex-1 items-center gap-4 py-2.5 pr-2 pl-4 text-left group-first/row:rounded-tl-xl group-last/row:rounded-bl-xl hover:bg-surface-muted sm:pl-5"
                        >
                          <span className="min-w-0 flex-1 text-[15px] leading-snug font-medium">{exercise.name}</span>
                          {exercise.hasEmbedding ? null : (
                            <span className="shrink-0 text-[13px] text-muted">{t("noEmbedding")}</span>
                          )}
                        </button>
                        <div className="pr-2">
                          <ActionMenu
                            label={t("menu", { name: exercise.name })}
                            align="right"
                            trigger={<Ellipsis className="size-5" strokeWidth={2} aria-hidden />}
                            triggerClassName="grid size-10 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground"
                            actions={[
                              { label: t("edit"), onSelect: () => open({ kind: "edit", exercise }) },
                              { label: t("delete"), tone: "danger", onSelect: () => open({ kind: "delete", exercise }) },
                            ]}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {sheet?.kind === "add" || sheet?.kind === "edit" ? (
        <ExerciseSheet
          key={sheetKey}
          exercise={sheet.kind === "edit" ? sheet.exercise : null}
          defaultGroup={group}
          onClose={() => setSheet(null)}
          onToast={show}
        />
      ) : null}
      {sheet?.kind === "delete" ? (
        <DeleteExerciseSheet
          key={sheetKey}
          exercise={sheet.exercise}
          onClose={() => setSheet(null)}
          onRename={() => open({ kind: "edit", exercise: sheet.exercise })}
          onToast={show}
        />
      ) : null}

      <ToastView toast={toast} onDismiss={dismiss} undoLabel={tAdmin("undo")} />
    </div>
  );
}
