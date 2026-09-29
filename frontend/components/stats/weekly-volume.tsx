import { getFormatter, getTranslations } from "next-intl/server";
import type { WeeklyStats } from "@/lib/api/extra-types";
import { addDays, displayDate, weekStart } from "@/lib/planner/dates";

/** Najwięcej tygodni na wykresie: przy „całym czasie” pokazujemy ostatni rok. */
const MAX_WEEKS = 52;
/** Z iloma poprzednimi tygodniami porównujemy ostatni pełny tydzień. */
const BASELINE_WEEKS = 4;

/** Ostatni pełny tydzień względem średniej z poprzednich; null bez punktu odniesienia. */
export function weeklyChange(weeks: WeeklyStats[], today: string) {
  const complete = weeks.filter((w) => w.weekStart < weekStart(today));
  const last = complete.at(-1);
  const baseline = complete.slice(-1 - BASELINE_WEEKS, -1);
  if (!last || !baseline.length) return null;
  const average = baseline.reduce((sum, w) => sum + w.volume, 0) / baseline.length;
  return average > 0 ? last.volume / average - 1 : null;
}

/** Objętość tydzień po tygodniu jako słupki; bieżący, niepełny tydzień wyszarzony. */
export async function WeeklyVolume({ weeks, today }: { weeks: WeeklyStats[]; today: string }) {
  const t = await getTranslations("pages.stats.weekly");
  const format = await getFormatter();

  const shown = weeks.slice(-MAX_WEEKS);
  if (!shown.some((w) => w.volume > 0)) {
    return <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">{t("empty")}</p>;
  }

  const current = weekStart(today);
  const max = Math.max(...shown.map((w) => w.volume));
  const volume = (v: number) =>
    v >= 10_000 ? t("tons", { value: format.number(v / 1000, { maximumFractionDigits: 1 }) }) : `${format.number(Math.round(v))} kg`;
  const range = (w: WeeklyStats) =>
    format.dateTimeRange(displayDate(w.weekStart), displayDate(addDays(w.weekStart, 6)), {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="mb-2 text-xs text-muted tabular-nums" aria-hidden>
        {volume(max)}
      </p>
      <ol className="flex h-32 items-end gap-[3px] border-b border-border" aria-label={t("label")}>
        {shown.map((w) => {
          const partial = w.weekStart === current;
          const label = `${range(w)}: ${volume(w.volume)}, ${t("workouts", { count: w.workouts })}${partial ? ` (${t("partial")})` : ""}`;
          return (
            <li key={w.weekStart} className="flex h-full min-w-0 flex-1 items-end" title={label}>
              <span className="sr-only">{label}</span>
              <span
                aria-hidden
                className={`block w-full rounded-t-[3px] ${partial ? "bg-foreground/25" : "bg-foreground/75"}`}
                // Tydzień bez treningu: cienka kreska zamiast pustego miejsca.
                style={{ height: w.volume > 0 ? `${Math.max((w.volume / max) * 100, 2)}%` : "1px" }}
              />
            </li>
          );
        })}
      </ol>
      <div className="mt-1.5 flex justify-between text-xs text-muted tabular-nums" aria-hidden>
        <span>{format.dateTime(displayDate(shown[0].weekStart), { day: "numeric", month: "short", timeZone: "UTC" })}</span>
        <span>{t("thisWeek")}</span>
      </div>
    </div>
  );
}

/** Dopisek w nagłówku sekcji: zmiana ostatniego pełnego tygodnia. */
export async function WeeklyChangeNote({ change }: { change: number | null }) {
  if (change === null) return null;
  const t = await getTranslations("pages.stats.weekly");
  const format = await getFormatter();
  return (
    <p className="text-[13px] tabular-nums">
      <span className="font-medium">{format.number(change, { style: "percent", maximumFractionDigits: 0, signDisplay: "exceptZero" })}</span>
      <span className="text-muted"> {t("changeScope", { weeks: BASELINE_WEEKS })}</span>
    </p>
  );
}
