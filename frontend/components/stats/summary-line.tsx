import { getFormatter, getTranslations } from "next-intl/server";
import type { StatsSummary } from "@/lib/api/extra-types";
import { StatsTip, type TipKey } from "./stats-tip";

/** Podsumowanie okresu jako jeden wiersz liczb, bez kafelków. */
export async function SummaryLine({ summary }: { summary: StatsSummary }) {
  const t = await getTranslations("pages.stats.summary");
  const tGroup = await getTranslations("enums.muscleGroup");
  const format = await getFormatter();

  const volume =
    summary.totalVolume >= 100_000
      ? t("tons", { value: format.number(summary.totalVolume / 1000, { maximumFractionDigits: 1 }) })
      : `${format.number(Math.round(summary.totalVolume))} kg`;

  const items: { label: string; value: string; tip?: TipKey }[] = [
    { label: t("workouts"), value: format.number(summary.totalWorkouts) },
    { label: t("sets"), value: format.number(summary.totalSets) },
    { label: t("volume"), value: volume, tip: "volume" },
    { label: t("avgSets"), value: format.number(summary.avgSetsPerWorkout, { maximumFractionDigits: 1 }), tip: "avgSets" },
    { label: t("topGroup"), value: summary.mostTrainedMuscleGroup ? tGroup(summary.mostTrainedMuscleGroup) : "—", tip: "topGroup" },
  ];

  return (
    <dl
      aria-label={t("label")}
      className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border py-3 sm:grid-cols-3 lg:flex lg:flex-wrap lg:gap-0"
    >
      {items.map((item, i) => (
        <div key={item.label} className={`min-w-0 lg:px-5 ${i === 0 ? "lg:pl-0" : "lg:border-l lg:border-border"}`}>
          <dt className="flex items-center gap-1 text-xs text-muted">
            {item.label}
            {item.tip ? <StatsTip tip={item.tip} /> : null}
          </dt>
          <dd className="truncate text-[17px] font-semibold tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
