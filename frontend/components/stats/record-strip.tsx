import { Trophy } from "lucide-react";
import type { PersonalRecords } from "@/lib/api/extra-types";

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
  const items = [
    { label: labels.e1rm, value: records.bestEstimatedOneRepMax, date: records.bestEstimatedOneRepMaxDate },
    { label: labels.maxWeight, value: records.maxWeight, date: records.maxWeightDate },
    { label: labels.bestSet, value: records.bestVolumeInSingleSet, date: records.bestVolumeDate },
  ];
  return (
    <dl className="grid divide-y divide-border rounded-xl border border-border bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {items.map((item) => (
        <div key={item.label} className="px-4 py-3.5">
          <dt className="flex items-center gap-1.5 text-[13px] text-muted">
            <Trophy className="size-3.5 text-pr" strokeWidth={2.25} aria-hidden />
            {item.label}
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
