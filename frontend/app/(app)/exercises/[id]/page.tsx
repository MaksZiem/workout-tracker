import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { loadExerciseCard, type SimilarItem } from "@/lib/exercises/load";
import { displayDate } from "@/lib/planner/dates";
import { roundKg } from "@/lib/stats/model";
import { RecordStrip } from "@/components/stats/record-strip";
import { SectionError, StatsSection } from "@/components/stats/section";

type Props = PageProps<"/exercises/[id]">;

async function exerciseId(props: Props) {
  const { id } = await props.params;
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const id = await exerciseId(props);
  const card = id ? await loadExerciseCard(id) : null;
  const t = await getTranslations("pages.exercises");
  return { title: card?.exercise.name ?? t("title") };
}

export default async function ExercisePage(props: Props) {
  const id = await exerciseId(props);
  if (id === null) notFound();
  const card = await loadExerciseCard(id);
  if (!card) notFound();

  const t = await getTranslations("pages.exerciseDetail");
  const tStats = await getTranslations("pages.statsExercise");
  const tGroup = await getTranslations("enums.muscleGroup");
  const format = await getFormatter();
  const kg = (v: number) => format.number(roundKg(v), { maximumFractionDigits: 1 });
  const date = (iso: string) => format.dateTime(displayDate(iso), { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const { exercise, records, similar } = card;
  const self = `/exercises/${exercise.id}`;
  const statsLink = (
    <Link
      href={`/stats/exercise/${exercise.id}`}
      className="-mr-2 flex h-9 items-center gap-0.5 rounded-lg pr-1 pl-2 text-sm font-medium text-accent hover:bg-accent-surface"
    >
      {t("fullStats")}
      <ChevronRight className="size-4" strokeWidth={2.25} aria-hidden />
    </Link>
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link
        href="/exercises"
        className="-ml-2 inline-flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted hover:bg-surface-muted hover:text-foreground"
      >
        <ChevronLeft className="size-4" strokeWidth={2.25} aria-hidden />
        {t("back")}
      </Link>

      <header className="mt-2">
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{exercise.name}</h1>
        <p className="mt-1 text-sm text-muted">
          <Link href={`/exercises?group=${exercise.muscleGroup}`} className="underline-offset-2 hover:text-foreground hover:underline">
            {tGroup(exercise.muscleGroup)}
          </Link>
        </p>
      </header>

      <StatsSection id="records" title={t("records")} aside={records.ok && records.data ? statsLink : undefined} className="mt-8">
        {!records.ok ? (
          <SectionError retryHref={self} />
        ) : records.data ? (
          <RecordStrip
            records={records.data}
            kg={kg}
            date={date}
            labels={{ e1rm: tStats("records.e1rm"), maxWeight: tStats("records.maxWeight"), bestSet: tStats("records.bestSet") }}
          />
        ) : (
          <p className="rounded-xl border border-border bg-surface px-4 py-4 text-sm text-muted sm:px-5">{t("noRecords")}</p>
        )}
      </StatsSection>

      <StatsSection id="similar" title={t("similar")} hint={t("similarHint")} className="mt-10">
        {similar.ok ? (
          similar.data.length ? (
            <SimilarList
              items={similar.data}
              kg={kg}
              labels={{
                match: (n) => t("match", { value: n }),
                notDone: t("notDone"),
                bodyweight: t("bodyweight"),
                e1rm: (iso) => t("e1rmOn", { date: format.dateTime(displayDate(iso), { day: "numeric", month: "short", timeZone: "UTC" }) }),
              }}
            />
          ) : (
            <p className="rounded-xl border border-border bg-surface px-4 py-4 text-sm text-muted sm:px-5">{t("similarNone")}</p>
          )
        ) : similar.reason === "unavailable" ? (
          <p className="rounded-xl border border-border bg-surface px-4 py-4 text-sm text-muted sm:px-5">{t("similarUnavailable")}</p>
        ) : (
          <SectionError retryHref={self} />
        )}
      </StatsSection>
    </div>
  );
}

function SimilarList({
  items,
  kg,
  labels,
}: {
  items: SimilarItem[];
  kg: (v: number) => string;
  labels: { match: (n: number) => string; notDone: string; bodyweight: string; e1rm: (iso: string) => string };
}) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {items.map((item) => (
        <li key={item.id}>
          <Link href={`/exercises/${item.id}`} className="flex min-h-14 items-center gap-4 px-4 py-2.5 hover:bg-surface-muted sm:px-5">
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] leading-snug font-medium">{item.name}</span>
              <span className="block text-[13px] text-muted tabular-nums">{labels.match(Math.round(item.similarity * 100))}</span>
            </span>
            {item.mark && item.mark.e1rm > 0 ? (
              <span className="shrink-0 text-right">
                <span className="block text-[15px] font-semibold tabular-nums">
                  {kg(item.mark.e1rm)}
                  <span className="ml-1 text-[13px] font-normal text-muted">kg</span>
                </span>
                <span className="block text-xs text-muted tabular-nums">{labels.e1rm(item.mark.date)}</span>
              </span>
            ) : item.mark ? (
              <span className="shrink-0 text-[13px] text-muted">{labels.bodyweight}</span>
            ) : (
              <span className="shrink-0 text-[13px] text-muted">
                <span className="sm:hidden" aria-hidden>
                  —
                </span>
                <span className="sr-only sm:not-sr-only">{labels.notDone}</span>
              </span>
            )}
            <ChevronRight className="size-5 shrink-0 text-muted" strokeWidth={2} aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
