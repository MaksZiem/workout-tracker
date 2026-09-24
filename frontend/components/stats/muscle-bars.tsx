import { getFormatter, getTranslations } from "next-intl/server";
import type { MuscleGroupStats } from "@/lib/api/extra-types";

/** Rozkład ukończonych serii na partie: poziome słupki, najczęstsza na górze. */
export async function MuscleBars({ groups, columns = 1 }: { groups: MuscleGroupStats[]; columns?: 1 | 2 }) {
  const t = await getTranslations("pages.stats.muscles");
  const tGroup = await getTranslations("enums.muscleGroup");
  const format = await getFormatter();

  if (!groups.length) return <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">{t("empty")}</p>;

  const sorted = [...groups].sort((a, b) => b.sets - a.sets);
  const max = sorted[0].sets;
  const total = sorted.reduce((sum, g) => sum + g.sets, 0);

  return (
    <ul
      // Dwie kolumny czytane w dół: ranking 1–4 po lewej, 5–8 po prawej.
      className={`grid gap-x-10 gap-y-3 rounded-xl border border-border bg-surface p-4 ${columns === 2 ? "md:grid-flow-col md:grid-cols-2" : ""}`}
      style={columns === 2 ? { gridTemplateRows: `repeat(${Math.ceil(sorted.length / 2)}, auto)` } : undefined}
    >
      {sorted.map((g) => (
        <li key={g.muscleGroup} className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_auto] items-center gap-3 text-sm">
          <span className="truncate">{tGroup(g.muscleGroup)}</span>
          <span className="h-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
            <span className="block h-full rounded-full bg-foreground/75" style={{ width: `${(g.sets / max) * 100}%` }} />
          </span>
          <span className="text-right text-[13px] whitespace-nowrap text-muted tabular-nums">
            {t("sets", { count: g.sets })}
            <span className="ml-1.5 inline-block w-9 text-foreground">
              {format.number(g.sets / total, { style: "percent", maximumFractionDigits: 0 })}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
