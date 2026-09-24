"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { daysBetween, displayDate } from "@/lib/planner/dates";
import { displayStatus, type DisplayStatus, type PlannerEntry } from "@/lib/planner/model";
import { EntryCard } from "./entry-card";
import { groupByDate } from "./week-board";
import type { PlannerApi } from "./use-planner";

type Props = {
  from: string;
  to: string;
  month: string; // YYYY-MM
  today: string;
  entries: PlannerEntry[];
  planner: PlannerApi;
  onAdd: (date: string) => void;
  onMove: (entry: PlannerEntry) => void;
};

const DOT: Record<DisplayStatus, string> = {
  PLANNED: "bg-muted",
  IN_PROGRESS: "bg-foreground",
  COMPLETED: "bg-success",
  SKIPPED: "border border-muted",
  OVERDUE: "bg-danger",
};

/**
 * Miesiąc: siatka pełnych tygodni. Na desktopie komórki pokazują nazwy
 * szablonów, na telefonie kropki statusów. Wybrany dzień rozwija się pod siatką
 * z pełnymi kartami i akcjami.
 */
export function MonthBoard({ from, to, month, today, entries, planner, onAdd, onMove }: Props) {
  const format = useFormatter();
  const t = useTranslations("pages.planner");
  const tStatus = useTranslations("enums.scheduledWorkoutStatus");
  const days = daysBetween(from, to);
  const byDate = groupByDate(entries);
  const initial = today.startsWith(month) ? today : `${month}-01`;
  const [selected, setSelected] = useState(initial);
  const selectedEntries = byDate.get(selected) ?? [];
  const weekdays = days.slice(0, 7).map((d) => format.dateTime(displayDate(d), { weekday: "short", timeZone: "UTC" }));

  return (
    <div className="2xl:grid 2xl:grid-cols-[minmax(0,1fr)_17rem] 2xl:gap-6">
      <div role="group" aria-label={format.dateTime(displayDate(`${month}-01`), { month: "long", year: "numeric", timeZone: "UTC" })}>
        <div aria-hidden className="grid grid-cols-7 gap-1 pb-1">
          {weekdays.map((w) => (
            <span key={w} className="text-center text-xs font-medium text-muted first-letter:uppercase">
              {w}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((date) => {
            const inMonth = date.startsWith(month);
            const isToday = date === today;
            const isSelected = date === selected;
            const dayEntries = byDate.get(date) ?? [];
            return (
              <button
                key={date}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelected(date)}
                aria-label={`${format.dateTime(displayDate(date), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}${
                  dayEntries.length
                    ? `: ${dayEntries
                        .map((e) => {
                          const s = displayStatus(e, today);
                          return `${e.templateName ?? t("entry.noTemplate")} (${s === "OVERDUE" ? t("entry.overdue") : tStatus(s)})`;
                        })
                        .join(", ")}`
                    : ""
                }`}
                className={`flex h-14 flex-col items-center gap-1 rounded-lg p-1 text-left transition-colors md:h-24 md:items-stretch md:p-2 ${
                  isSelected ? "bg-accent-surface ring-1 ring-accent" : "hover:bg-surface-muted"
                } ${inMonth ? "" : "opacity-40"}`}
              >
                <span
                  className={`grid size-7 place-items-center rounded-full text-sm tabular-nums md:self-start ${
                    isToday ? "bg-accent font-semibold text-accent-foreground" : "font-medium"
                  }`}
                >
                  {Number(date.slice(8))}
                </span>

                {/* Telefon: kropki statusów */}
                <span className="flex flex-wrap justify-center gap-1 md:hidden" aria-hidden>
                  {dayEntries.slice(0, 3).map((e) => (
                    <span key={e.id} className={`size-1.5 rounded-full ${DOT[displayStatus(e, today)]}`} />
                  ))}
                </span>

                {/* Desktop: nazwy szablonów */}
                <span className="hidden min-w-0 flex-col gap-0.5 md:flex" aria-hidden>
                  {dayEntries.slice(0, 2).map((e) => {
                    const status = displayStatus(e, today);
                    return (
                      <span
                        key={e.id}
                        title={`${e.templateName ?? ""} · ${status === "OVERDUE" ? t("entry.overdue") : tStatus(status)}`}
                        className={`flex min-w-0 items-start gap-1 rounded px-1 text-xs leading-4 ${
                          status === "SKIPPED" ? "text-muted line-through" : ""
                        }`}
                      >
                        <span className={`mt-[5px] size-1.5 shrink-0 rounded-full ${DOT[status]}`} />
                        {/* Jeden wpis w dniu: do dwóch linii, żeby nazwa szablonu była czytelna. */}
                        <span className={`min-w-0 flex-1 break-words ${dayEntries.length === 1 ? "line-clamp-2" : "line-clamp-1"}`}>
                          {e.templateName ?? t("entry.noTemplate")}
                        </span>
                      </span>
                    );
                  })}
                  {dayEntries.length > 2 ? (
                    <span className="px-1 text-xs text-muted tabular-nums">+{dayEntries.length - 2}</span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section aria-live="polite" className="mt-6 2xl:mt-7">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h2 className="text-base font-semibold first-letter:uppercase">
            {format.dateTime(displayDate(selected), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}
          </h2>
          <button
            type="button"
            onClick={() => onAdd(selected)}
            className="flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-accent hover:bg-accent-surface"
          >
            <Plus className="size-4" strokeWidth={2.25} aria-hidden />
            {t("day.add")}
          </button>
        </div>
        {selectedEntries.length ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
            {selectedEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} today={today} planner={planner} onMove={onMove} />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">{t("day.empty")}</p>
        )}
      </section>
    </div>
  );
}
