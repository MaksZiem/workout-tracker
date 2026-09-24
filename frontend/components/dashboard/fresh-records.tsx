import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { ChevronRight, Trophy } from "lucide-react";
import type { FreshRecord } from "@/lib/dashboard/load";
import { displayDate } from "@/lib/planner/dates";
import { roundKg } from "@/lib/stats/model";

const SHOWN = 4;

/**
 * Rekordy z ostatnich 30 dni: jedyne złoto na pulpicie. Wiersz nosi ten sam 32px medal,
 * który w zapisie treningu zastępuje numer serii przy rekordzie: to ta sama chwila, widziana później.
 */
export async function FreshRecords({ records, hasHistory }: { records: FreshRecord[]; hasHistory: boolean }) {
  const t = await getTranslations("pages.dashboard.records");
  const format = await getFormatter();

  return (
    <section aria-labelledby="records">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <h2 id="records" className="text-[17px] font-semibold">
            {t("title")}
          </h2>
          <span className="text-[13px] text-muted">{t("hint")}</span>
        </div>
        <Link href="/stats" className="-mr-2 flex h-9 items-center gap-0.5 rounded-lg px-2 text-sm font-medium text-accent hover:bg-accent-surface">
          {t("all")}
          <ChevronRight className="size-4" strokeWidth={2.25} aria-hidden />
        </Link>
      </div>
      {records.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">{hasHistory ? t("empty") : t("emptyNew")}</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {records.slice(0, SHOWN).map((r) => (
            <li key={`${r.exerciseId}-${r.kind}`}>
              <Link href={`/stats/exercise/${r.exerciseId}`} className="flex min-h-14 items-center gap-3 px-4 py-2.5 hover:bg-surface-muted">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-pr text-pr-foreground">
                  <Trophy className="size-4" strokeWidth={2.25} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.exerciseName}</span>
                  <span className="block text-[13px] text-muted tabular-nums">
                    {t(r.kind)} · {format.dateTime(displayDate(r.date), { day: "numeric", month: "short", timeZone: "UTC" })}
                  </span>
                </span>
                <span className="shrink-0 text-[15px] font-semibold tabular-nums">
                  {format.number(roundKg(r.value), { maximumFractionDigits: 1 })} kg
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
