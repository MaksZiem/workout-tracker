import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { CircleDot, Trophy } from "lucide-react";
import { daysBetween, displayDate, visibleRange } from "@/lib/planner/dates";
import type { HistoryRow } from "@/lib/workouts/model";

/**
 * Historia jako miesiąc: tylko to, co zostało zrobione. Bez przyszłości, statusów
 * i akcji planera; każdy trening prowadzi do swoich szczegółów. Na desktopie
 * komórka pokazuje treningi (szablon albo ćwiczenia, serie, objętość, rekord),
 * na telefonie kropki, a cała komórka otwiera trening tego dnia.
 */
export async function HistoryCalendar({ month, today, rows }: { month: string; today: string; rows: HistoryRow[] }) {
  const t = await getTranslations("pages.workouts");
  const format = await getFormatter();
  const { from, to } = visibleRange("month", month);
  const days = daysBetween(from, to);
  const byDate = new Map<string, HistoryRow[]>();
  for (const row of [...rows].sort((a, b) => a.id - b.id)) byDate.set(row.date, [...(byDate.get(row.date) ?? []), row]);
  const weekdays = days.slice(0, 7).map((d) => format.dateTime(displayDate(d), { weekday: "short", timeZone: "UTC" }));
  const inMonthPrefix = month.slice(0, 7);

  const titleOf = (row: HistoryRow) => row.templateName ?? (row.exercises.length ? row.exercises.slice(0, 2).join(", ") : t("noExercises"));
  const volumeOf = (row: HistoryRow) =>
    row.volume >= 10_000
      ? t("summary.tons", { value: format.number(row.volume / 1000, { maximumFractionDigits: 1 }) })
      : `${format.number(Math.round(row.volume))} kg`;
  const describe = (row: HistoryRow) =>
    [
      titleOf(row),
      row.inProgress ? t("inProgress") : null,
      t("sets", { count: row.doneSets }),
      volumeOf(row),
      row.record ? t("record") : null,
      row.plan ? `${t("plan")}: ${row.plan.name}` : null,
    ]
      .filter(Boolean)
      .join(", ");

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div aria-hidden className="grid grid-cols-7 divide-x divide-border border-b border-border bg-surface">
        {weekdays.map((w) => (
          <span key={w} className="flex h-9 items-center justify-center text-xs font-medium text-muted md:justify-start md:px-3">
            <span className="first-letter:uppercase">{w}</span>
          </span>
        ))}
      </div>
      <ol className="grid grid-cols-7 gap-px bg-border">
        {days.map((date) => {
          const inMonth = date.startsWith(inMonthPrefix);
          const dayRows = inMonth ? (byDate.get(date) ?? []) : [];
          const isToday = date === today;
          const dateLabel = format.dateTime(displayDate(date), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
          return (
            <li
              key={date}
              className={`relative flex h-14 flex-col items-center gap-1 p-1 md:h-auto md:min-h-28 md:items-stretch md:p-2 ${
                inMonth ? "bg-surface" : "bg-background"
              }`}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full text-sm tabular-nums md:self-start ${
                  isToday
                    ? "bg-accent font-semibold text-accent-foreground"
                    : !inMonth || date > today
                      ? "text-muted"
                      : dayRows.length
                        ? "font-semibold"
                        : "font-medium text-muted"
                }`}
              >
                {Number(date.slice(8))}
              </span>

              {/* Telefon: kropka na trening (złota przy rekordzie), komórka prowadzi do treningu. */}
              {dayRows.length ? (
                <>
                  <span className="flex gap-1 md:hidden" aria-hidden>
                    {dayRows.slice(0, 3).map((row) => (
                      <span key={row.id} className={`size-1.5 rounded-full ${row.record ? "bg-pr" : "bg-foreground"}`} />
                    ))}
                  </span>
                  <Link
                    href={`/workouts/${dayRows.at(-1)!.id}`}
                    aria-label={`${dateLabel}: ${dayRows.map(describe).join("; ")}`}
                    className="absolute inset-0 hover:bg-surface-muted/60 focus-visible:-outline-offset-2 md:hidden"
                  />
                </>
              ) : null}

              {/* Desktop: każdy trening osobnym linkiem. */}
              <span className="hidden min-w-0 flex-col gap-1 md:flex">
                {dayRows.slice(0, 2).map((row) => (
                  <Link
                    key={row.id}
                    href={`/workouts/${row.id}`}
                    aria-label={`${dateLabel}: ${describe(row)}`}
                    title={describe(row)}
                    className="flex min-w-0 flex-col rounded-md bg-surface-muted px-1.5 py-1 hover:bg-surface-strong focus-visible:-outline-offset-2"
                  >
                    <span className="flex min-w-0 items-start gap-1 text-xs font-medium leading-4">
                      {row.inProgress ? <CircleDot className="mt-0.5 size-3 shrink-0" strokeWidth={2.25} aria-hidden /> : null}
                      <span className="line-clamp-2 min-w-0 flex-1 break-words">{titleOf(row)}</span>
                      {row.record ? <Trophy className="mt-0.5 size-3 shrink-0 text-pr" strokeWidth={2.25} aria-hidden /> : null}
                    </span>
                    <span className="truncate text-[11px] leading-4 text-muted tabular-nums">
                      {t("sets", { count: row.doneSets })} · {volumeOf(row)}
                    </span>
                  </Link>
                ))}
                {dayRows.length > 2 ? (
                  <span className="px-1.5 text-xs text-muted tabular-nums">{t("more", { count: dayRows.length - 2 })}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
