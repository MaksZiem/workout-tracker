import type { RepRecord } from "@/lib/api/extra-types";
import { StatsTip } from "./stats-tip";

export function RepRecords({
  records,
  kg,
  date,
  labels,
  columns = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
}: {
  records: RepRecord[];
  kg: (v: number) => string;
  date: (iso: string) => string;
  labels: { rm: (reps: number) => string; actual: (reps: number) => string; none: string };
  columns?: string;
}) {
  return (
    <dl className={`grid overflow-hidden rounded-xl border border-border bg-surface ${columns}`}>
      {records.map((r) => (
        <div
          key={r.reps}
          className="-mt-px -ml-px border-t border-l border-border px-4 py-3.5"
        >
          <dt className="text-[13px] text-muted">{labels.rm(r.reps)}</dt>
          {r.weight !== null && r.actualReps !== null && r.date !== null ? (
            <>
              <dd className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold tracking-tight tabular-nums">{kg(r.weight)}</span>
                <span className="text-sm text-muted">kg</span>
                {r.actualReps > r.reps ? (
                  <span className="text-[13px] text-muted tabular-nums">
                    <StatsTip
                      tip="repRecordActual"
                      values={{ reps: r.reps, actual: r.actualReps, below: r.actualReps - 1, weight: kg(r.weight) }}
                      trigger={labels.actual(r.actualReps)}
                    />
                  </span>
                ) : null}
              </dd>
              <dd className="text-[13px] text-muted tabular-nums">{date(r.date)}</dd>
            </>
          ) : (
            <dd className="mt-1 text-2xl font-semibold tracking-tight text-muted" aria-label={labels.none}>
              —
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}
