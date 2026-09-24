import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { ChevronLeft, Trophy } from "lucide-react";
import { localDate } from "@/lib/log/model";
import { displayDate } from "@/lib/planner/dates";
import { loadExercise } from "@/lib/stats/load";
import { metricValue, roundKg, type Session } from "@/lib/stats/model";
import { parseMetric, parseRange, STATS_METRICS, STATS_RANGES, statsHref, type StatsMetric } from "@/lib/stats/range";
import { LineChart } from "@/components/stats/line-chart";
import { RecordStrip } from "@/components/stats/record-strip";
import { SegmentedLinks } from "@/components/stats/segmented-links";
import { SectionError, StatsSection } from "@/components/stats/section";

type Props = PageProps<"/stats/exercise/[id]">;

async function exerciseId(props: Props) {
  const { id } = await props.params;
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.stats");
  return { title: t("title") };
}

export default async function ExerciseStatsPage(props: Props) {
  const id = await exerciseId(props);
  if (id === null) notFound();
  const searchParams = await props.searchParams;
  const range = parseRange(searchParams.range);
  const metric = parseMetric(searchParams.metric);

  const data = await loadExercise(id, range, localDate());
  if (!data) notFound();

  const t = await getTranslations("pages.statsExercise");
  const tRange = await getTranslations("pages.stats.range");
  const tGroup = await getTranslations("enums.muscleGroup");
  const format = await getFormatter();
  const path = `/stats/exercise/${id}`;
  const self = statsHref(path, { range, metric });

  const kg = (v: number, signed = false) =>
    format.number(roundKg(v), { maximumFractionDigits: 1, signDisplay: signed ? "exceptZero" : "auto" });
  const date = (iso: string) => format.dateTime(displayDate(iso), { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

  // Serie sesji zwięźle: kolejne serie z tym samym ciężarem łączone („80 kg × 8, 8, 6”).
  const setsText = (s: Session) => {
    const groups: { weight: number; reps: number[] }[] = [];
    for (const set of s.sets) {
      const prev = groups.at(-1);
      if (prev && prev.weight === set.weight) prev.reps.push(set.reps);
      else groups.push({ weight: set.weight, reps: [set.reps] });
    }
    return groups.map((g) => `${format.number(g.weight)} kg × ${g.reps.join(", ")}`).join(" · ");
  };

  const records = data.records.ok ? data.records.data : null;
  const recordDate: Record<StatsMetric, string | null> = {
    e1rm: records?.bestEstimatedOneRepMaxDate ?? null,
    top: records?.maxWeightDate ?? null,
    // Rekord objętości w backendzie dotyczy jednej serii, nie sesji, więc na wykresie objętości go nie zaznaczamy.
    volume: null,
  };
  const recordDates = new Set(records ? [records.bestEstimatedOneRepMaxDate, records.maxWeightDate, records.bestVolumeDate] : []);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link
          href={statsHref("/stats", { range })}
          className="-ml-2 inline-flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted hover:bg-surface-muted hover:text-foreground"
        >
          <ChevronLeft className="size-4" strokeWidth={2.25} aria-hidden />
          {t("back")}
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{data.exercise.name}</h1>
            <p className="mt-1 text-sm text-muted">{tGroup(data.exercise.muscleGroup)}</p>
          </div>
          {data.hasHistory ? (
            <SegmentedLinks
              label={tRange("label")}
              items={STATS_RANGES.map((r) => ({ key: r, label: tRange(r), href: statsHref(path, { range: r, metric }), active: r === range }))}
            />
          ) : null}
        </div>
      </header>

      {!data.hasHistory ? (
        <div className="max-w-xl rounded-xl border border-border bg-surface p-5">
          <p className="text-[17px] font-semibold">{t("never.title")}</p>
          <p className="mt-1 text-sm text-muted">{t("never.body")}</p>
        </div>
      ) : (
        <>
          <section aria-labelledby="progress" className="rounded-xl border border-border bg-surface p-4 sm:p-5">
            <h2 id="progress" className="sr-only">
              {t(`metric.${metric}`)}
            </h2>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <SegmentedLinks
                label={t("metric.label")}
                items={STATS_METRICS.map((m) => ({ key: m, label: t(`metric.${m}`), href: statsHref(path, { range, metric: m }), active: m === metric }))}
              />
              <p className="max-w-md text-[13px] text-muted">{t(`metricHint.${metric}`)}</p>
            </div>

            {!data.sessions.ok ? (
              <SectionError retryHref={self} />
            ) : data.sessions.data.length === 0 ? (
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 py-6 text-sm text-muted">
                {t("emptyRange")}
                <Link href={statsHref(path, { range: "all", metric })} className="font-medium text-accent underline">
                  {tRange("all")}
                </Link>
              </p>
            ) : (
              (() => {
                const sessions = data.sessions.data;
                const values = sessions.map((s) => metricValue(s, metric));
                const change = values.length > 1 ? t("change", { value: kg(values.at(-1)! - values[0], true) }) : t("noChange");
                const recordIndex = recordDate[metric] ? sessions.findLastIndex((s) => s.date === recordDate[metric]) : -1;
                return (
                  <LineChart
                    // Nowa miara lub zakres = świeży stan celownika.
                    key={`${metric}-${range}`}
                    points={sessions.map((s, i) => ({ date: s.date, value: values[i], detail: setsText(s) }))}
                    recordIndex={recordIndex >= 0 ? recordIndex : null}
                    change={change}
                    labels={{ latest: t("latest"), record: t("record"), chart: t("chart", { metric: t(`metric.${metric}`) }) }}
                  />
                );
              })()
            )}
          </section>

          <StatsSection id="records" title={t("records.title")} hint={t("records.hint")}>
            {!data.records.ok ? (
              <SectionError retryHref={self} />
            ) : records ? (
              <RecordStrip records={records} kg={kg} date={date} labels={{ e1rm: t("records.e1rm"), maxWeight: t("records.maxWeight"), bestSet: t("records.bestSet") }} />
            ) : (
              <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">{t("records.none")}</p>
            )}
          </StatsSection>

          {data.sessions.ok && data.sessions.data.length ? (
            <StatsSection id="sessions" title={t("sessions.title")}>
              <SessionList
                sessions={[...data.sessions.data].reverse()}
                metric={metric}
                recordDates={recordDates}
                setsText={setsText}
                kg={kg}
                date={date}
                labels={{
                  date: t("sessions.date"),
                  sets: t("sessions.sets"),
                  top: t("sessions.top"),
                  e1rm: t("sessions.e1rm"),
                  volume: t("sessions.volume"),
                  record: t("sessions.recordSession"),
                }}
              />
            </StatsSection>
          ) : null}
        </>
      )}
    </div>
  );
}

/** Trzy rekordy w jednym pasku rozdzielonym liniami, bez osobnych kafelków. */
function SessionList({
  sessions,
  metric,
  recordDates,
  setsText,
  kg,
  date,
  labels,
}: {
  sessions: Session[];
  metric: StatsMetric;
  recordDates: Set<string>;
  setsText: (s: Session) => string;
  kg: (v: number) => string;
  date: (iso: string) => string;
  labels: { date: string; sets: string; top: string; e1rm: string; volume: string; record: string };
}) {
  const cols: { key: StatsMetric; label: string }[] = [
    { key: "top", label: labels.top },
    { key: "e1rm", label: labels.e1rm },
    { key: "volume", label: labels.volume },
  ];
  const marker = (s: Session) =>
    recordDates.has(s.date) ? (
      <span className="text-pr" title={labels.record}>
        <Trophy className="size-3.5" strokeWidth={2.25} aria-hidden />
        <span className="sr-only">{labels.record}</span>
      </span>
    ) : null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="hidden w-full text-sm sm:table">
        <thead>
          <tr className="border-b border-border text-left text-[11px] font-semibold tracking-wide text-muted uppercase">
            <th scope="col" className="px-4 py-2.5 font-semibold">{labels.date}</th>
            <th scope="col" className="px-3 py-2.5 font-semibold">{labels.sets}</th>
            {cols.map((c) => (
              <th key={c.key} scope="col" className={`px-3 py-2.5 text-right font-semibold last:pr-4 ${c.key === metric ? "text-foreground" : ""}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sessions.map((s, i) => (
            <tr key={`${s.date}-${i}`}>
              <th scope="row" className="px-4 py-2.5 text-left font-medium whitespace-nowrap tabular-nums">
                <span className="flex items-center gap-2">
                  {date(s.date)}
                  {marker(s)}
                </span>
              </th>
              <td className="px-3 py-2.5 text-muted tabular-nums">{setsText(s)}</td>
              {cols.map((c) => (
                <td
                  key={c.key}
                  className={`px-3 py-2.5 text-right tabular-nums whitespace-nowrap last:pr-4 ${c.key === metric ? "font-semibold" : "text-muted"}`}
                >
                  {metricValue(s, c.key) > 0 ? `${kg(metricValue(s, c.key))} kg` : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-border sm:hidden">
        {sessions.map((s, i) => (
          <li key={`${s.date}-${i}`} className="flex items-start justify-between gap-3 px-4 py-3">
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-sm font-medium tabular-nums">
                {date(s.date)}
                {marker(s)}
              </span>
              <span className="block text-[13px] text-muted tabular-nums">{setsText(s)}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-sm font-semibold tabular-nums">
                {metricValue(s, metric) > 0 ? `${kg(metricValue(s, metric))} kg` : "—"}
              </span>
              <span className="block text-[11px] text-muted">{cols.find((c) => c.key === metric)!.label}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
