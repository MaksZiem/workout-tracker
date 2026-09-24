"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ChevronRight, Search, X } from "lucide-react";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/api/extra-types";
import type { CatalogExercise } from "@/lib/exercises/load";
import { displayDate } from "@/lib/planner/dates";
import { roundKg } from "@/lib/stats/model";
import { SegmentedLinks } from "@/components/stats/segmented-links";

/** Katalog: wyszukiwarka na miejscu, filtr grupy w URL, twoje wyniki przy każdym ćwiczeniu. */
export function ExercisesView({
  items,
  group,
  recordsOk,
}: {
  items: CatalogExercise[];
  group: MuscleGroup | null;
  recordsOk: boolean;
}) {
  const t = useTranslations("pages.exercises");
  const tGroup = useTranslations("enums.muscleGroup");
  const [query, setQuery] = useState("");

  const present = MUSCLE_GROUPS.filter((g) => items.some((e) => e.muscleGroup === g));
  const doneCount = items.filter((e) => e.mark).length;

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
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted tabular-nums">
          {t("count", { count: items.length })}
          {recordsOk && doneCount ? ` · ${t("doneCount", { count: doneCount })}` : null}
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-3">
        <label className="flex h-11 items-center gap-2 rounded-lg bg-surface-muted px-3 focus-within:ring-2 focus-within:ring-accent sm:max-w-sm">
          <span className="sr-only">{t("search")}</span>
          <Search className="size-4 shrink-0 text-muted" strokeWidth={2} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            className="h-full w-full bg-transparent text-[15px] outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("clear")}
              className="-mr-1.5 grid size-8 shrink-0 place-items-center rounded-md text-muted hover:bg-surface hover:text-foreground"
            >
              <X className="size-4" strokeWidth={2.25} aria-hidden />
            </button>
          ) : null}
        </label>
        <SegmentedLinks
          label={t("filter")}
          items={[
            { key: "all", label: t("all"), href: "/exercises", active: group === null },
            ...present.map((g) => ({ key: g, label: tGroup(g), href: `/exercises?group=${g}`, active: group === g })),
          ]}
        />
      </div>

      {!recordsOk ? (
        <p role="alert" className="mt-4 rounded-xl bg-danger-surface px-4 py-3 text-sm text-danger">
          {t("recordsError")}
        </p>
      ) : null}

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
            <section key={g} aria-labelledby={`group-${g}`}>
              <div className="mb-3 flex items-baseline gap-2">
                <h2 id={`group-${g}`} className="text-[17px] leading-snug font-semibold">
                  {tGroup(g)}
                </h2>
                <span className="text-[13px] text-muted tabular-nums">{t("count", { count: rows.length })}</span>
              </div>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
                {rows.map((exercise) => (
                  <li key={exercise.id}>
                    <ExerciseRow exercise={exercise} showMark={recordsOk} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ExerciseRow({ exercise, showMark }: { exercise: CatalogExercise; showMark: boolean }) {
  const t = useTranslations("pages.exercises");
  const format = useFormatter();
  const mark = exercise.mark;
  return (
    <Link href={`/exercises/${exercise.id}`} className="flex min-h-14 items-center gap-4 px-4 py-2.5 hover:bg-surface-muted sm:px-5">
      <span className="min-w-0 flex-1 text-[15px] leading-snug font-medium">{exercise.name}</span>
      {showMark ? (
        mark && mark.e1rm > 0 ? (
          <span className="shrink-0 text-right">
            <span className="block text-[15px] font-semibold tabular-nums">
              {format.number(roundKg(mark.e1rm), { maximumFractionDigits: 1 })}
              <span className="ml-1 text-[13px] font-normal text-muted">kg</span>
            </span>
            <span className="block text-xs text-muted tabular-nums">
              {t("e1rmOn", {
                date: format.dateTime(displayDate(mark.date), { day: "numeric", month: "short", timeZone: "UTC" }),
              })}
            </span>
          </span>
        ) : mark ? (
          <span className="shrink-0 text-[13px] text-muted">{t("bodyweight")}</span>
        ) : (
          // Telefon: krótki znacznik, żeby nazwy mieściły się w jednej linii.
          <span className="shrink-0 text-[13px] text-muted">
            <span className="sm:hidden" aria-hidden>
              —
            </span>
            <span className="sr-only sm:not-sr-only">{t("notDone")}</span>
          </span>
        )
      ) : null}
      <ChevronRight className="size-5 shrink-0 text-muted" strokeWidth={2} aria-hidden />
    </Link>
  );
}
