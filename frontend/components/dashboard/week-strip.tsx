import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import type { WeekSummary } from "@/lib/dashboard/load";
import { addDays, daysBetween, displayDate, weekStart } from "@/lib/planner/dates";
import { displayStatus, STATUS_DOT, type PlannerEntry } from "@/lib/planner/model";

/**
 * Tydzień pon–niedz. z planera. Zielone tło: tego dnia zakończono trening.
 * Od sm w dniu widać nazwy treningów (kropka w kolorze statusu planera, „Poza planem”
 * dla treningu zapisanego bez planera), na telefonie same kropki. Pod spodem
 * podsumowanie tygodnia i najbliższy zaplanowany trening.
 */
export async function WeekStrip({
  entries,
  trained,
  summary,
  today,
}: {
  entries: PlannerEntry[];
  trained: Set<string>;
  summary: WeekSummary;
  today: string;
}) {
  const t = await getTranslations("pages.dashboard.week");
  const tStatus = await getTranslations("enums.scheduledWorkoutStatus");
  const tPlanner = await getTranslations("pages.planner.entry");
  const format = await getFormatter();
  const monday = weekStart(today);
  const days = daysBetween(monday, addDays(monday, 6));

  const countable = entries.filter((e) => e.status !== "SKIPPED");
  const done = countable.filter((e) => e.status === "COMPLETED").length;
  const volume =
    summary.volume >= 100_000
      ? t("tons", { value: format.number(summary.volume / 1000, { maximumFractionDigits: 1 }) })
      : `${format.number(Math.round(summary.volume))} kg`;
  const nextLabel = summary.next
    ? `${summary.next.title ?? t("untitled")}, ${format.dateTime(displayDate(summary.next.date), {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      })}`
    : t("noNext");
  const stats = [
    { label: t("stats.workouts"), value: format.number(summary.workouts) },
    { label: t("stats.sets"), value: format.number(summary.sets) },
    { label: t("stats.volume"), value: volume },
  ];

  return (
    <section aria-labelledby="week" className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      {/* Tytuł i link w jednym wierszu także na telefonie; podsumowanie zawija się pod spód. */}
      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h2 id="week" className="text-[17px] font-semibold">
            {t("title")}
          </h2>
          <p className="text-[13px] text-muted tabular-nums">
            {countable.length ? t("progress", { done, total: countable.length }) : t("nothing")}
          </p>
        </div>
        <Link
          href={`/planner?view=week&date=${today}`}
          className="-mr-2 flex h-9 items-center gap-0.5 rounded-lg px-2 text-sm font-medium text-accent hover:bg-accent-surface"
        >
          {t("open")}
          <ChevronRight className="size-4" strokeWidth={2.25} aria-hidden />
        </Link>
      </div>

      <ol className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((date) => {
          const dayEntries = entries.filter((e) => e.date === date);
          const isToday = date === today;
          const didTrain = trained.has(date);
          const offPlan = summary.offPlan.has(date);
          const labels = [
            ...dayEntries.map((e) => {
              const status = displayStatus(e, today);
              return {
                key: `e${e.id}`,
                dot: STATUS_DOT[status],
                name: e.templateName ?? t("untitled"),
                status: status === "OVERDUE" ? tPlanner("overdue") : tStatus(status),
                skipped: status === "SKIPPED",
              };
            }),
            ...(offPlan ? [{ key: "off", dot: "bg-success", name: t("offPlan"), status: tStatus("COMPLETED"), skipped: false }] : []),
          ];
          const description = labels.map((l) => `${l.name} (${l.status})`).join(", ") || t("free");
          return (
            <li key={date} className="min-w-0">
              <Link
                href={`/planner?view=week&date=${date}`}
                aria-label={t("day", {
                  date: format.dateTime(displayDate(date), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
                  summary: description,
                })}
                aria-current={isToday ? "date" : undefined}
                className={`flex h-[4.5rem] flex-col items-center gap-1.5 rounded-lg py-2 transition-colors sm:h-full sm:min-h-32 sm:px-2 ${
                  didTrain ? "bg-success-surface hover:bg-success-surface/70" : "hover:bg-surface-muted"
                }`}
              >
                <span className={`text-[11px] font-medium first-letter:uppercase ${isToday ? "text-accent" : "text-muted"}`}>
                  {format.dateTime(displayDate(date), { weekday: "short", timeZone: "UTC" })}
                </span>
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold tabular-nums ${
                    isToday ? "bg-accent text-accent-foreground" : ""
                  }`}
                >
                  {Number(date.slice(8))}
                </span>

                {/* Telefon: kropki. */}
                <span className="mt-auto flex h-1.5 gap-1 sm:hidden" aria-hidden>
                  {labels.slice(0, 3).map((l) => (
                    <span key={l.key} className={`size-1.5 rounded-full ${l.dot}`} />
                  ))}
                </span>

                {/* Od sm: nazwy treningów ze statusem. */}
                <span className="hidden w-full min-w-0 flex-col gap-1 pt-0.5 sm:flex" aria-hidden>
                  {labels.slice(0, 2).map((l) => (
                    <span key={l.key} className="flex min-w-0 flex-col items-center text-center">
                      <span className={`line-clamp-2 text-xs leading-4 font-medium break-words ${l.skipped ? "text-muted line-through" : ""}`}>
                        {l.name}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] leading-4 text-muted">
                        <span className={`size-1.5 shrink-0 rounded-full ${l.dot}`} />
                        {l.status}
                      </span>
                    </span>
                  ))}
                  {labels.length > 2 ? <span className="text-center text-[11px] text-muted">+{labels.length - 2}</span> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {/* Podsumowanie tygodnia: to, co zrobione, i co dalej. */}
      <dl className="mt-4 grid grid-cols-3 gap-x-4 gap-y-3 border-t border-border pt-3 sm:flex sm:gap-0">
        {stats.map((item, i) => (
          <div key={item.label} className={`min-w-0 sm:px-5 ${i === 0 ? "sm:pl-0" : "sm:border-l sm:border-border"}`}>
            <dt className="text-xs text-muted">{item.label}</dt>
            <dd className="truncate text-[15px] font-semibold tabular-nums">{item.value}</dd>
          </div>
        ))}
        <div className="col-span-3 min-w-0 sm:ml-auto sm:border-l sm:border-border sm:pl-5">
          <dt className="text-xs text-muted">{t("stats.next")}</dt>
          <dd className={`truncate text-[15px] font-semibold ${summary.next ? "" : "font-normal text-muted"}`}>{nextLabel}</dd>
        </div>
      </dl>
    </section>
  );
}
