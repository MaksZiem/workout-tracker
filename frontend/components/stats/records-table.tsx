import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Trophy } from "lucide-react";
import type { ExercisePersonalRecords } from "@/lib/api/extra-types";
import { displayDate } from "@/lib/planner/dates";
import { roundKg } from "@/lib/stats/model";
import { inRange, statsHref, type StatsRange } from "@/lib/stats/range";

/**
 * Rekordy wszystkich ćwiczeń z całej historii, najświeższe na górze.
 * Złoty znacznik tylko przy rekordzie pobitym w wybranym okresie.
 */
export async function RecordsTable({
  records,
  range,
  bounds,
}: {
  records: ExercisePersonalRecords[];
  range: StatsRange;
  bounds: { from?: string; to: string };
}) {
  const t = await getTranslations("pages.stats.records");
  const format = await getFormatter();

  if (!records.length) return <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">{t("empty")}</p>;

  // Ćwiczenia bez ciężaru (np. deska) mają rekordy równe zero: pokazujemy kreskę, nie „0 kg”.
  const kg = (v: number) => (v > 0 ? `${format.number(roundKg(v), { maximumFractionDigits: 1 })} kg` : "—");
  // Rok tylko przy dacie spoza bieżącego roku: kolumna dat mieści się wtedy w węższym układzie.
  const date = (iso: string) =>
    format.dateTime(displayDate(iso), {
      day: "numeric",
      month: "short",
      year: iso.slice(0, 4) === bounds.to.slice(0, 4) ? undefined : "numeric",
      timeZone: "UTC",
    });
  const isNew = (r: ExercisePersonalRecords) =>
    range !== "all" && [r.bestEstimatedOneRepMaxDate, r.maxWeightDate, r.bestVolumeDate].some((d) => inRange(d, bounds));

  const rows = [...records].sort((a, b) => b.bestEstimatedOneRepMaxDate.localeCompare(a.bestEstimatedOneRepMaxDate));

  const marker = (r: ExercisePersonalRecords) =>
    isNew(r) ? (
      <span className="text-pr" title={t("newInRange")}>
        <Trophy className="size-3.5" strokeWidth={2.25} aria-hidden />
        <span className="sr-only">{t("newInRange")}</span>
      </span>
    ) : null;

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      {/* Desktop: tabela */}
      <table className="hidden w-full text-sm sm:table">
        <thead>
          <tr className="border-b border-border text-left text-[11px] font-semibold tracking-wide whitespace-nowrap text-muted uppercase">
            <th scope="col" className="px-4 py-2.5 font-semibold">{t("exercise")}</th>
            <th scope="col" className="px-3 py-2.5 text-right font-semibold">{t("e1rm")}</th>
            <th scope="col" className="px-3 py-2.5 text-right font-semibold">{t("maxWeight")}</th>
            <th scope="col" className="px-3 py-2.5 text-right font-semibold">{t("bestSet")}</th>
            <th scope="col" className="px-4 py-2.5 text-right font-semibold">{t("date")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.exerciseId} className="hover:bg-surface-muted">
              <th scope="row" className="px-4 py-2.5 text-left font-medium">
                <Link href={statsHref(`/stats/exercise/${r.exerciseId}`, { range })} className="flex items-center gap-2 hover:underline">
                  <span className="min-w-0 truncate">{r.exerciseName}</span>
                  {marker(r)}
                </Link>
              </th>
              <td className="px-3 py-2.5 text-right font-semibold whitespace-nowrap tabular-nums">{kg(r.bestEstimatedOneRepMax)}</td>
              <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums">{kg(r.maxWeight)}</td>
              <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums">{kg(r.bestVolumeInSingleSet)}</td>
              <td className="px-4 py-2.5 text-right text-muted tabular-nums whitespace-nowrap">{date(r.bestEstimatedOneRepMaxDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Telefon: lista */}
      <ul className="divide-y divide-border sm:hidden">
        {rows.map((r) => (
          <li key={r.exerciseId}>
            <Link
              href={statsHref(`/stats/exercise/${r.exerciseId}`, { range })}
              className="flex min-h-14 items-center justify-between gap-3 px-4 py-2.5 active:bg-surface-muted"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-medium">
                  <span className="truncate">{r.exerciseName}</span>
                  {marker(r)}
                </span>
                <span className="block text-xs text-muted tabular-nums">
                  {t("maxWeight")} {kg(r.maxWeight)}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-semibold tabular-nums">{kg(r.bestEstimatedOneRepMax)}</span>
                <span className="block text-[11px] text-muted tabular-nums">
                  {t("e1rm")} · {date(r.bestEstimatedOneRepMaxDate)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
