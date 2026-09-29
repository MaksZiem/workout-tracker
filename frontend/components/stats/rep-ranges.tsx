import { getFormatter, getTranslations } from "next-intl/server";
import type { RepRange, RepRangeStats } from "@/lib/api/extra-types";

const SHADE: Record<RepRange, string> = {
  STRENGTH: "bg-foreground/85",
  HYPERTROPHY: "bg-foreground/50",
  ENDURANCE: "bg-foreground/20",
};

/** Udział serii w zakresach 1–5, 6–12 i 13+ powtórzeń: jeden dzielony pasek z legendą. */
export async function RepRanges({ ranges }: { ranges: RepRangeStats[] }) {
  const t = await getTranslations("pages.stats.repRanges");
  const format = await getFormatter();
  const total = ranges.reduce((sum, r) => sum + r.sets, 0);

  if (!total) return <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">{t("empty")}</p>;

  const share = (r: RepRangeStats) => format.number(r.sets / total, { style: "percent", maximumFractionDigits: 0 });

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full" aria-hidden>
        {ranges
          .filter((r) => r.sets > 0)
          .map((r) => (
            <span key={r.range} className={SHADE[r.range]} style={{ width: `${(r.sets / total) * 100}%` }} />
          ))}
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ranges.map((r) => (
          <div key={r.range} className="min-w-0">
            <dt className="flex items-center gap-2 text-[13px] text-muted">
              <span className={`inline-block size-2.5 shrink-0 rounded-sm ${SHADE[r.range]}`} aria-hidden />
              <span className="truncate">{t(`${r.range}.label`)}</span>
            </dt>
            <dd className="mt-0.5 text-[17px] font-semibold tabular-nums">{share(r)}</dd>
            <dd className="text-[13px] text-muted tabular-nums">
              {t("reps", { range: t(`${r.range}.reps`) })} · {t("sets", { count: r.sets })}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
