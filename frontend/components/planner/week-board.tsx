"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { daysBetween, displayDate } from "@/lib/planner/dates";
import type { PlannerEntry } from "@/lib/planner/model";
import { EntryCard } from "./entry-card";
import type { PlannerApi } from "./use-planner";

type Props = {
  /** Czy w widocznym zakresie jest cokolwiek zaplanowane (inaczej nie piszemy „Odpoczynek”). */
  hasEntries: boolean;
  from: string;
  to: string;
  today: string;
  entries: PlannerEntry[];
  planner: PlannerApi;
  onAdd: (date: string) => void;
  onMove: (entry: PlannerEntry) => void;
};

/**
 * Tydzień: od xl 7 kolumn (planowanie przy biurku), poniżej pionowa lista dni.
 * Oba układy to te same dane i te same karty.
 */
export function WeekBoard({ hasEntries, from, to, today, entries, planner, onAdd, onMove }: Props) {
  const days = daysBetween(from, to);
  const byDate = groupByDate(entries);

  return (
    <>
      <ol className="hidden grid-cols-7 gap-2 xl:grid">
        {days.map((date) => (
          <li key={date} className="flex min-h-72 flex-col">
            <DayHeader date={date} today={today} />
            <div className="mt-2 flex flex-1 flex-col gap-2">
              {(byDate.get(date) ?? []).map((entry) => (
                <EntryCard key={entry.id} entry={entry} today={today} planner={planner} onMove={onMove} compact />
              ))}
              <AddButton date={date} onAdd={onAdd} rest={hasEntries && !byDate.get(date)?.length} />
            </div>
          </li>
        ))}
      </ol>

      <ol className="flex flex-col divide-y divide-border xl:hidden">
        {days.map((date) => {
          const dayEntries = byDate.get(date) ?? [];
          // Pusty dzień na telefonie: jedna linia, żeby cały tydzień mieścił się na ekranie.
          if (!dayEntries.length) {
            return (
              <li key={date} className="flex items-center gap-4 py-1.5 first:pt-0">
                <DayHeader date={date} today={today} inline />
                <AddButton date={date} onAdd={onAdd} rest={hasEntries} inline />
              </li>
            );
          }
          return (
            <li key={date} className="flex gap-4 py-4 first:pt-0">
              <DayHeader date={date} today={today} stacked />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {dayEntries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} today={today} planner={planner} onMove={onMove} />
                ))}
                <AddButton date={date} onAdd={onAdd} />
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}

export function groupByDate(entries: PlannerEntry[]) {
  const map = new Map<string, PlannerEntry[]>();
  for (const entry of entries) map.set(entry.date, [...(map.get(entry.date) ?? []), entry]);
  return map;
}

function DayHeader({
  date,
  today,
  stacked = false,
  inline = false,
}: {
  date: string;
  today: string;
  stacked?: boolean;
  inline?: boolean;
}) {
  const format = useFormatter();
  const t = useTranslations("pages.planner.day");
  const isToday = date === today;
  const weekday = format.dateTime(displayDate(date), { weekday: "short", timeZone: "UTC" });
  const day = format.dateTime(displayDate(date), { day: "numeric", timeZone: "UTC" });
  const month = format.dateTime(displayDate(date), { month: "short", timeZone: "UTC" });

  if (inline) {
    return (
      <div className="flex w-28 shrink-0 items-baseline gap-2">
        <span className={`w-9 text-xs font-medium first-letter:uppercase ${isToday ? "text-accent" : "text-muted"}`}>{weekday}</span>
        <span className={`text-[15px] font-semibold tabular-nums ${isToday ? "text-accent" : ""}`}>{day}</span>
        <span className="text-xs text-muted">{month}</span>
      </div>
    );
  }

  return (
    <div
      className={
        stacked
          ? "flex w-12 shrink-0 flex-col items-center pt-1 text-center"
          : "flex h-10 items-center justify-between border-b border-border pb-1"
      }
    >
      <span className={`text-xs font-medium first-letter:uppercase ${isToday ? "text-accent" : "text-muted"}`}>
        {weekday}
      </span>
      <span
        className={`tabular-nums ${
          isToday
            ? "grid size-8 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
            : stacked
              ? "text-xl font-semibold"
              : "text-sm font-semibold"
        } ${stacked && isToday ? "mt-0.5" : ""}`}
        aria-label={isToday ? `${t("today")}, ${day} ${month}` : undefined}
      >
        {day}
      </span>
      {stacked ? <span className="text-[11px] text-muted">{month}</span> : null}
    </div>
  );
}

function AddButton({
  date,
  onAdd,
  rest = false,
  inline = false,
}: {
  date: string;
  onAdd: (date: string) => void;
  rest?: boolean;
  /** W wierszu (telefon, pusty dzień) wypełnia szerokość obok nagłówka dnia. */
  inline?: boolean;
}) {
  const t = useTranslations("pages.planner.day");
  const format = useFormatter();
  const label = t("addTo", { date: format.dateTime(displayDate(date), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) });

  return (
    <div className={`flex items-center justify-end gap-2 ${inline ? "min-w-0 flex-1" : "w-full"}`}>
      {rest ? <span className="flex-1 text-sm text-muted">{t("rest")}</span> : null}
      <button
        type="button"
        onClick={() => onAdd(date)}
        aria-label={label}
        title={label}
        className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground"
      >
        <Plus className="size-4" strokeWidth={2.25} aria-hidden />
      </button>
    </div>
  );
}
