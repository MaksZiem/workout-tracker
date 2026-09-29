import { getFormatter, getTranslations } from "next-intl/server";
import type { MuscleGroup, MuscleGroupStats } from "@/lib/api/extra-types";

/** Zalecany zakres serii na partię w tygodniu (hipertrofia). */
export const WEEKLY_SETS_TARGET = { min: 10, max: 20 } as const;
/** Skala słupków: zakres widać nawet przy małej objętości. */
const SCALE_MIN = 25;
/** Partie, dla których zakres 10–20 serii nie ma sensu. */
const NO_TARGET: readonly MuscleGroup[] = ["CARDIO", "FULL_BODY"];

/**
 * Średnio ukończonych serii w tygodniu na partię, na tle zalecanego zakresu 10–20.
 * `weeks` to długość okresu w tygodniach (może być ułamkowa).
 */
export async function MuscleBars({
  groups,
  weeks,
  columns = 1,
}: {
  groups: MuscleGroupStats[];
  weeks: number;
  columns?: 1 | 2;
}) {
  const t = await getTranslations("pages.stats.muscles");
  const tGroup = await getTranslations("enums.muscleGroup");
  const format = await getFormatter();

  if (!groups.length) return <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">{t("empty")}</p>;

  const rows = [...groups]
    .sort((a, b) => b.sets - a.sets)
    .map((g) => ({ ...g, perWeek: g.sets / weeks, target: !NO_TARGET.includes(g.muscleGroup) }));
  const scale = Math.max(SCALE_MIN, ...rows.map((r) => r.perWeek));
  const pct = (v: number) => `${(v / scale) * 100}%`;
  const status = (perWeek: number) =>
    perWeek < WEEKLY_SETS_TARGET.min ? "low" : perWeek > WEEKLY_SETS_TARGET.max ? "high" : "ok";

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <ul
        // Dwie kolumny czytane w dół: ranking 1–4 po lewej, 5–8 po prawej.
        className={`grid gap-x-10 gap-y-3 ${columns === 2 ? "md:grid-flow-col md:grid-cols-2" : ""}`}
        style={columns === 2 ? { gridTemplateRows: `repeat(${Math.ceil(rows.length / 2)}, auto)` } : undefined}
      >
        {rows.map((g) => {
          const s = g.target ? status(g.perWeek) : null;
          return (
            <li key={g.muscleGroup} className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_auto] items-center gap-3 text-sm">
              <span className="truncate">{tGroup(g.muscleGroup)}</span>
              <span className="relative h-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
                {g.target ? (
                  <span
                    className="absolute inset-y-0 bg-success-surface"
                    style={{ left: pct(WEEKLY_SETS_TARGET.min), width: pct(WEEKLY_SETS_TARGET.max - WEEKLY_SETS_TARGET.min) }}
                  />
                ) : null}
                <span
                  className={`relative block h-full rounded-full ${s === "ok" || s === null ? "bg-foreground/75" : "bg-foreground/35"}`}
                  style={{ width: pct(g.perWeek) }}
                />
              </span>
              <span className="text-right text-[13px] whitespace-nowrap text-muted tabular-nums" title={t("sets", { count: g.sets })}>
                <span className="font-medium text-foreground">{t("perWeek", { value: format.number(g.perWeek, { maximumFractionDigits: 1 }) })}</span>
                <span className="ml-1.5 inline-block w-[4.5rem] text-left">{s ? t(`status.${s}`) : ""}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 flex items-center gap-2 text-xs text-muted">
        <span className="inline-block h-2 w-5 rounded-full bg-success-surface" aria-hidden />
        {t("target", WEEKLY_SETS_TARGET)}
      </p>
    </div>
  );
}
