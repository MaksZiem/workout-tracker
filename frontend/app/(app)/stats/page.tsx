import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { localDate } from "@/lib/log/model";
import { loadOverview } from "@/lib/stats/load";
import { parseRange, STATS_RANGES, statsHref, type StatsRange } from "@/lib/stats/range";
import { SegmentedLinks } from "@/components/stats/segmented-links";
import { SectionError, StatsSection } from "@/components/stats/section";
import { MainExercises } from "@/components/stats/main-exercises";
import { SummaryLine } from "@/components/stats/summary-line";
import { ActivityMap } from "@/components/stats/activity-map";
import { MuscleBars } from "@/components/stats/muscle-bars";
import { RecordsTable } from "@/components/stats/records-table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.stats");
  return { title: t("title") };
}

export default async function StatsPage(props: PageProps<"/stats">) {
  const searchParams = await props.searchParams;
  const range = parseRange(searchParams.range);
  const t = await getTranslations("pages.stats");
  const data = await loadOverview(range, localDate());
  const self = statsHref("/stats", { range });

  const activity = (
    <StatsSection id="activity" title={t("activity.title")} aside={<StreakNote weeks={data.streak.weeks} days={data.streak.days} />}>
      {data.frequency.ok ? <ActivityMap days={data.frequency.data} allTime={range === "all"} /> : <SectionError retryHref={self} />}
    </StatsSection>
  );
  const muscles = (columns: 1 | 2) => (
    <StatsSection id="muscles" title={t("muscles.title")} hint={t("muscles.hint")}>
      {data.muscleGroups.ok ? <MuscleBars groups={data.muscleGroups.data} columns={columns} /> : <SectionError retryHref={self} />}
    </StatsSection>
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        {data.hasHistory ? <RangeSwitch range={range} /> : null}
      </header>

      {!data.hasHistory ? (
        <EmptyState />
      ) : (
        <>
          <StatsSection id="main" title={t("main.title")} hint={t("main.hint")}>
            {!data.main.ok ? (
              <SectionError retryHref={self} />
            ) : data.main.data.length ? (
              <MainExercises exercises={data.main.data} range={range} />
            ) : (
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border bg-surface p-4 text-sm text-muted">
                {t("main.emptyRange")}
                {range !== "all" ? (
                  <Link href={statsHref("/stats", { range: "all" })} className="font-medium text-accent underline">
                    {t("main.showAll")}
                  </Link>
                ) : null}
              </p>
            )}
            <div className="mt-4">
              {data.summary.ok ? <SummaryLine summary={data.summary.data} /> : <SectionError retryHref={self} />}
            </div>
          </StatsSection>

          {range === "30d" || range === "90d" ? (
            // Krótki zakres: mała mapa obok partii mięśniowych.
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
              {activity}
              {muscles(1)}
            </div>
          ) : (
            <>
              {activity}
              {muscles(2)}
            </>
          )}

          <StatsSection id="records" title={t("records.title")} hint={range === "all" ? t("records.hintAll") : t("records.hint")}>
            {data.records.ok ? (
              <RecordsTable records={data.records.data} range={range} bounds={data.bounds} />
            ) : (
              <SectionError retryHref={self} />
            )}
          </StatsSection>
        </>
      )}
    </div>
  );
}

async function RangeSwitch({ range }: { range: StatsRange }) {
  const t = await getTranslations("pages.stats.range");
  return (
    <SegmentedLinks
      label={t("label")}
      items={STATS_RANGES.map((r) => ({ key: r, label: t(r), href: statsHref("/stats", { range: r }), active: r === range }))}
    />
  );
}

/** Passa tygodniowa (cała historia) i dzienna seria z backendu jako dopisek. */
async function StreakNote({ weeks, days }: { weeks: number | null; days: number | null }) {
  if (weeks === null) return null;
  const t = await getTranslations("pages.stats.streak");
  return (
    <p className="text-[13px] tabular-nums">
      <span className="font-medium">{t("weeks", { count: weeks })}</span>
      <span className="text-muted">
        {" · "}
        {days !== null ? `${t("days", { count: days })} · ` : null}
        {t("scope")}
      </span>
    </p>
  );
}

async function EmptyState() {
  const t = await getTranslations("pages.stats.empty");
  return (
    <div className="max-w-xl rounded-xl border border-border bg-surface p-5">
      <p className="text-[17px] font-semibold">{t("title")}</p>
      <p className="mt-1 text-sm text-muted">{t("body")}</p>
      <Link
        href="/log"
        className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90"
      >
        <Plus className="size-4" strokeWidth={2.5} aria-hidden />
        {t("action")}
      </Link>
    </div>
  );
}
