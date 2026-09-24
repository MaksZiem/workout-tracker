import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Minus, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { roundKg, type MainExercise } from "@/lib/stats/model";
import { statsHref, type StatsRange } from "@/lib/stats/range";
import { MiniTrend } from "./mini-trend";

/** Najważniejsza sekcja: czy główne ćwiczenia idą w górę. */
export async function MainExercises({ exercises, range }: { exercises: MainExercise[]; range: StatsRange }) {
  const t = await getTranslations("pages.stats.main");
  const tGroup = await getTranslations("enums.muscleGroup");
  const format = await getFormatter();
  const kg = (v: number, signed = false) =>
    format.number(roundKg(v), { maximumFractionDigits: 1, signDisplay: signed ? "exceptZero" : "auto" });

  return (
    <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {exercises.map((ex) => {
        const change = ex.change === null ? null : roundKg(ex.change);
        const changeText = change === null ? t("noChange") : change === 0 ? t("flat") : t("change", { value: kg(change, true) });
        const Icon = change === null || change === 0 ? Minus : change > 0 ? TrendingUp : TrendingDown;
        return (
          <li key={ex.id}>
            <Link
              href={statsHref(`/stats/exercise/${ex.id}`, { range })}
              aria-label={t("open", { name: ex.name, value: kg(ex.current), change: changeText })}
              className="group flex h-full flex-col rounded-xl border border-border bg-surface p-3 transition-colors hover:bg-surface-muted sm:p-4"
            >
              <span className="line-clamp-2 min-h-[2.75em] text-[15px] leading-snug font-semibold">{ex.name}</span>
              <span className="mt-0.5 truncate text-xs text-muted">
                {ex.muscleGroup ? tGroup(ex.muscleGroup) : null}
              </span>

              <span className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold tabular-nums tracking-tight">{kg(ex.current)}</span>
                <span className="text-sm text-muted">kg</span>
              </span>
              <span className="text-xs text-muted">{t("e1rm")}</span>

              <span
                className={`mt-1.5 flex items-center gap-1 text-[13px] tabular-nums ${
                  change !== null && change > 0 ? "font-medium text-foreground" : "text-muted"
                }`}
              >
                <Icon className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
                <span className="truncate">{changeText}</span>
              </span>

              <span className="mt-auto pt-3">
                <MiniTrend points={ex.points} recordDate={ex.recordDate} />
              </span>

              <span className="mt-2 flex items-center justify-between gap-2 text-xs text-muted tabular-nums">
                <span>{t("sessions", { count: ex.sessions })}</span>
                {/* Przy „całym czasie” rekord zawsze wypada w zakresie: chip nic by nie mówił. */}
                {ex.recordDate && range !== "all" ? (
                  <span className="flex items-center gap-1 font-medium text-pr">
                    <Trophy className="size-3.5" strokeWidth={2.25} aria-hidden />
                    {t("record")}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
