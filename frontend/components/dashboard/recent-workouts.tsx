import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import type { RecentWorkout } from "@/lib/dashboard/load";
import { displayDate } from "@/lib/planner/dates";

/** Na telefonie 3 ostatnie treningi, od `sm` wszystkie 5. */
const PHONE_LIMIT = 3;
const NAMES_SHOWN = 2;

export async function RecentWorkouts({ workouts }: { workouts: RecentWorkout[] }) {
  const t = await getTranslations("pages.dashboard.recent");
  const format = await getFormatter();

  return (
    <section aria-labelledby="recent">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 id="recent" className="text-[17px] font-semibold">
          {t("title")}
        </h2>
        <Link href="/workouts" className="-mr-2 flex h-9 items-center gap-0.5 rounded-lg px-2 text-sm font-medium text-accent hover:bg-accent-surface">
          {t("all")}
          <ChevronRight className="size-4" strokeWidth={2.25} aria-hidden />
        </Link>
      </div>
      {workouts.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {workouts.map((w, i) => {
            const names = w.exercises.slice(0, NAMES_SHOWN).join(", ");
            const rest = w.exercises.length - NAMES_SHOWN;
            return (
              <li key={w.id} className={i >= PHONE_LIMIT ? "hidden sm:block" : undefined}>
                <Link href={`/workouts/${w.id}`} className="flex min-h-16 items-center gap-4 px-4 py-3 hover:bg-surface-muted">
                  <span className="w-14 shrink-0 text-center">
                    <span className="block text-[11px] font-medium text-muted first-letter:uppercase">
                      {format.dateTime(displayDate(w.date), { weekday: "short", timeZone: "UTC" })}
                    </span>
                    <span className="block text-[15px] font-semibold tabular-nums">
                      {format.dateTime(displayDate(w.date), { day: "numeric", month: "short", timeZone: "UTC" })}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    {/* „+N” poza obcinanym tekstem, żeby zawsze było widać, że ćwiczeń jest więcej. */}
                    <span className="flex min-w-0 items-baseline gap-1.5 text-sm font-medium">
                      <span className="truncate">{w.exercises.length ? names : t("noExercises")}</span>
                      {rest > 0 ? <span className="shrink-0 text-muted tabular-nums">{t("more", { count: rest })}</span> : null}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-muted tabular-nums">
                      {w.inProgress ? <span className="font-medium text-foreground">{t("inProgress")} · </span> : null}
                      {t("sets", { count: w.doneSets })} · {format.number(Math.round(w.volume))} kg
                      {w.minutes ? ` · ${t("minutes", { count: w.minutes })}` : null}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted" strokeWidth={2} aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
