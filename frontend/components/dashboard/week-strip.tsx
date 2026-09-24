import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { addDays, daysBetween, displayDate, weekStart } from "@/lib/planner/dates";
import { displayStatus, STATUS_DOT, type PlannerEntry } from "@/lib/planner/model";

/**
 * Tydzień pon–niedz. z planera. Zielone tło: tego dnia zapisano trening.
 * Kropki: zaplanowane wpisy w kolorach statusów planera.
 */
export async function WeekStrip({
  entries,
  trained,
  today,
  streak,
}: {
  entries: PlannerEntry[];
  trained: Set<string>;
  today: string;
  streak: number | null;
}) {
  const t = await getTranslations("pages.dashboard.week");
  const tStreak = await getTranslations("pages.stats.streak");
  const format = await getFormatter();
  const monday = weekStart(today);
  const days = daysBetween(monday, addDays(monday, 6));

  const countable = entries.filter((e) => e.status !== "SKIPPED");
  const done = countable.filter((e) => e.status === "COMPLETED").length;

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
            {streak ? ` · ${tStreak("weeks", { count: streak })}` : null}
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
          const summary = [
            didTrain ? t("trained") : null,
            dayEntries.length ? t("planned", { count: dayEntries.length }) : null,
          ]
            .filter(Boolean)
            .join(", ") || t("free");
          return (
            <li key={date}>
              <Link
                href={`/planner?view=week&date=${date}`}
                aria-label={t("day", {
                  date: format.dateTime(displayDate(date), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
                  summary,
                })}
                aria-current={isToday ? "date" : undefined}
                className={`flex h-[4.5rem] flex-col items-center justify-between rounded-lg py-2 transition-colors sm:h-20 ${
                  didTrain ? "bg-success-surface hover:bg-success-surface/70" : "hover:bg-surface-muted"
                }`}
              >
                <span className={`text-[11px] font-medium first-letter:uppercase ${isToday ? "text-accent" : "text-muted"}`}>
                  {format.dateTime(displayDate(date), { weekday: "short", timeZone: "UTC" })}
                </span>
                <span
                  className={`grid size-7 place-items-center rounded-full text-sm font-semibold tabular-nums ${
                    isToday ? "bg-accent text-accent-foreground" : ""
                  }`}
                >
                  {Number(date.slice(8))}
                </span>
                <span className="flex h-1.5 gap-1" aria-hidden>
                  {dayEntries.slice(0, 3).map((e) => (
                    <span key={e.id} className={`size-1.5 rounded-full ${STATUS_DOT[displayStatus(e, today)]}`} />
                  ))}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
