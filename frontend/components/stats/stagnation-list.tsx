import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { ChevronRight, TrendingUp } from "lucide-react";
import type { StagnantExercise } from "@/lib/api/extra-types";
import { displayDate } from "@/lib/planner/dates";
import { roundKg } from "@/lib/stats/model";
import { statsHref, type StatsRange } from "@/lib/stats/range";

/** Ćwiczenia bez nowego szacowanego 1RM od ponad 6 tygodni, mimo regularnych sesji. */
export async function StagnationList({ exercises, range }: { exercises: StagnantExercise[]; range: StatsRange }) {
  const t = await getTranslations("pages.stats.stagnation");
  const format = await getFormatter();

  if (!exercises.length) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-border bg-surface p-4 text-sm text-muted">
        <TrendingUp className="size-4 shrink-0" strokeWidth={2.25} aria-hidden />
        {t("empty")}
      </p>
    );
  }

  const date = (iso: string) => format.dateTime(displayDate(iso), { day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {exercises.map((ex) => (
        <li key={ex.exerciseId}>
          <Link
            href={statsHref(`/stats/exercise/${ex.exerciseId}`, { range })}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{ex.exerciseName}</span>
              <span className="block text-[13px] text-muted tabular-nums">
                {t("since", { weeks: ex.weeksSinceBest })} · {t("sessions", { count: ex.sessionsSince })}
              </span>
            </span>
            <span className="shrink-0 text-right tabular-nums">
              <span className="block text-sm font-semibold">
                {format.number(roundKg(ex.bestEstimatedOneRepMax), { maximumFractionDigits: 1 })} kg
              </span>
              <span className="block text-xs text-muted">{t("best", { date: date(ex.bestDate) })}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted" strokeWidth={2} aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
