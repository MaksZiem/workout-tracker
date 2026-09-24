import { getFormatter, getTranslations } from "next-intl/server";
import type { WorkoutFrequencyDay } from "@/lib/api/extra-types";
import { displayDate, mondayIndex } from "@/lib/planner/dates";

/** Na telefonie mieści się tyle tygodni; starsze kolumny chowamy. */
const PHONE_WEEKS = 20;

const LEVEL = ["bg-surface-muted", "bg-success/55", "bg-success"];

/**
 * Mapa dni treningowych: kolumna = tydzień (pon–niedz.), zieleń = trening zrobiony.
 * Sama siatka jest ukryta przed czytnikiem ekranu; liczba dni jest podana tekstem.
 */
export async function ActivityMap({ days, allTime }: { days: WorkoutFrequencyDay[]; allTime: boolean }) {
  const t = await getTranslations("pages.stats.activity");
  const format = await getFormatter();

  const lead = days.length ? mondayIndex(days[0].date) : 0;
  const cells: (WorkoutFrequencyDay | null)[] = [...Array(lead).fill(null), ...days];
  const weeks: (WorkoutFrequencyDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const trainingDays = days.filter((d) => d.count > 0).length;
  const firstDate = (week: (WorkoutFrequencyDay | null)[]) => week.find(Boolean)?.date ?? "";
  const monthLabel = (week: (WorkoutFrequencyDay | null)[], i: number) => {
    const starts = week.find((d) => d?.date.endsWith("-01"));
    if (!starts && i !== 0) return null;
    const date = starts?.date ?? firstDate(week);
    return format.dateTime(displayDate(date), { month: "short", timeZone: "UTC" });
  };
  // Etykieta pierwszej kolumny znika, gdy tuż obok zaczyna się kolejny miesiąc (inaczej nachodzą na siebie).
  const labels = weeks.map(monthLabel);
  if (labels[0] && labels.slice(1, 3).some(Boolean)) labels[0] = null;
  // Krótki zakres (do 20 tygodni) dostaje większe komórki, żeby mapa nie ginęła w karcie.
  const large = weeks.length <= PHONE_WEEKS;
  const cell = large ? "size-[11px] sm:size-5" : "size-[11px] sm:size-3.5";
  const row = large ? "h-[11px] sm:h-5" : "h-[11px] sm:h-3.5";
  const col = large ? "w-[11px] sm:w-5" : "w-[11px] sm:w-3.5";
  const hideOnPhone = (i: number) => (i < weeks.length - PHONE_WEEKS ? "hidden sm:flex" : "flex");

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[13px]">
        <p className="font-medium tabular-nums">{t("days", { count: trainingDays, total: format.number(days.length) })}</p>
        <p className="text-muted">
          {allTime ? t("lastYear") : null}
          {weeks.length > PHONE_WEEKS ? <span className="sm:hidden">{allTime ? " · " : ""}{t("phoneWindow")}</span> : null}
        </p>
      </div>

      <div aria-hidden className="flex gap-2">
        <div className="flex shrink-0 flex-col gap-[3px] pt-[19px] text-[11px] leading-none text-muted">
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <span key={d} className={`flex ${row} w-7 items-center first-letter:uppercase`}>
              {d % 2 === 0 ? format.dateTime(displayDate(`2024-01-0${d + 1}`), { weekday: "short", timeZone: "UTC" }) : ""}
            </span>
          ))}
        </div>
        {/* Przy długim zakresie wyrównanie do prawej: gdy brakuje miejsca, odpadają najstarsze tygodnie. */}
        <div className={`flex min-w-0 flex-1 gap-[3px] overflow-hidden ${weeks.length > PHONE_WEEKS ? "justify-end" : ""}`}>
          {weeks.map((week, i) => (
            <div key={i} className={`${hideOnPhone(i)} ${col} shrink-0 flex-col gap-[3px]`}>
              <span className="h-4 overflow-visible text-[11px] leading-4 whitespace-nowrap text-muted first-letter:uppercase">
                {labels[i]}
              </span>
              {Array.from({ length: 7 }, (_, d) => week[d] ?? null).map((day, d) =>
                day ? (
                  <span
                    key={d}
                    title={t("day", {
                      date: format.dateTime(displayDate(day.date), { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" }),
                      count: day.count,
                    })}
                    className={`${cell} rounded-[3px] ${LEVEL[Math.min(day.count, 2)]}`}
                  />
                ) : (
                  <span key={d} className={cell} />
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      <div aria-hidden className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-muted">
        {t("less")}
        {LEVEL.map((c) => (
          <span key={c} className={`size-2.5 rounded-[3px] ${c}`} />
        ))}
        {t("more")}
      </div>
    </div>
  );
}
