import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { CalendarCheck } from "lucide-react";
import type { Adherence } from "@/lib/api/extra-types";

/** Realizacja planu z kalendarza w jednym wierszu. Nic, gdy w okresie nic nie zaplanowano. */
export async function AdherenceLine({ adherence }: { adherence: Adherence }) {
  const t = await getTranslations("pages.stats.adherence");
  const format = await getFormatter();
  const due = adherence.completed + adherence.skipped + adherence.missed;

  if (!due && !adherence.upcoming) return null;

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm tabular-nums">
      <CalendarCheck className="size-4 shrink-0 text-muted" strokeWidth={2} aria-hidden />
      {adherence.rate === null ? (
        <span className="text-muted">{t("onlyUpcoming", { count: adherence.upcoming })}</span>
      ) : (
        <>
          <span>
            <span className="font-medium">{t("done", { completed: adherence.completed, due })}</span>{" "}
            <span className="font-semibold">({format.number(adherence.rate, { style: "percent", maximumFractionDigits: 0 })})</span>
          </span>
          {adherence.skipped ? <span className="text-muted">· {t("skipped", { count: adherence.skipped })}</span> : null}
          {adherence.missed ? <span className="text-muted">· {t("missed", { count: adherence.missed })}</span> : null}
        </>
      )}
      <Link href="/planner" className="ml-auto text-[13px] font-medium text-accent hover:underline">
        {t("planner")}
      </Link>
    </p>
  );
}
