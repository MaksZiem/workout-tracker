import { Trophy } from "lucide-react";
import type { PersonalRecords } from "@/lib/api/extra-types";
import { E1rmTip } from "@/components/ui/e1rm-tip";
import { StatsTip, type TipKey } from "./stats-tip";

/** Trzy rekordy ćwiczenia (e1RM, maks. ciężar, najlepsza seria) w jednym panelu. Statystyki i katalog ćwiczeń. */
export function RecordStrip({
  records,
  kg,
  date,
  labels,
}: {
  records: PersonalRecords;
  kg: (v: number) => string;
  date: (iso: string) => string;
  labels: { e1rm: string; maxWeight: string; bestSet: string };
}) {
  const items: { label: string; value: number; date: string; tip: TipKey }[] = [
    { label: labels.e1rm, value: records.bestEstimatedOneRepMax, date: records.bestEstimatedOneRepMaxDate, tip: "e1rm" },
    { label: labels.maxWeight, value: records.maxWeight, date: records.maxWeightDate, tip: "maxWeight" },
    { label: labels.bestSet, value: records.bestVolumeInSingleSet, date: records.bestVolumeDate, tip: "bestSet" },
  ];
  return (
    <dl className="grid divide-y divide-border rounded-xl border border-border bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {items.map((item) => (
        <div key={item.label} className="px-4 py-3.5">
          <dt className="flex items-center gap-1.5 text-[13px] text-muted">
            <Trophy className="size-3.5 text-pr" strokeWidth={2.25} aria-hidden />
            <span>
              {item.label}{" "}
              {item.tip === "e1rm" ? (
                <E1rmTip set={{ weight: records.bestEstimatedOneRepMaxWeight, reps: records.bestEstimatedOneRepMaxReps }} />
              ) : (
                <StatsTip tip={item.tip} />
              )}
            </span>
          </dt>
          <dd className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">{item.value > 0 ? kg(item.value) : "—"}</span>
            {item.value > 0 ? <span className="text-sm text-muted">kg</span> : null}
          </dd>
          <dd className="text-[13px] text-muted tabular-nums">{date(item.date)}</dd>
        </div>
      ))}
    </dl>
  );
}
