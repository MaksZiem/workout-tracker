import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight, ClipboardList, Trophy } from "lucide-react";
import { localDate } from "@/lib/log/model";
import { addMonths, displayDate, monthStart } from "@/lib/planner/dates";
import { loadMonth, parseMonth } from "@/lib/workouts/load";
import type { HistoryRow, MonthSummary } from "@/lib/workouts/model";
import { SectionError } from "@/components/stats/section";
import { HistoryCalendar } from "@/components/workouts/history-calendar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.workouts");
  return { title: t("title") };
}

/** Na liście widać dwa pierwsze ćwiczenia, reszta jako „+N”. */
const NAMES_SHOWN = 2;

type View = "list" | "calendar";

/** Adres miesiąca w danym widoku; bieżący miesiąc w liście to po prostu /workouts. */
const monthHref = (month: string, current: string, view: View = "list") => {
  const params = new URLSearchParams();
  if (view === "calendar") params.set("view", "calendar");
  if (month !== current) params.set("month", month.slice(0, 7));
  const query = params.toString();
  return query ? `/workouts?${query}` : "/workouts";
};

export default async function WorkoutsPage(props: PageProps<"/workouts">) {
  const { month: monthParam, view: viewParam } = await props.searchParams;
  const view: View = viewParam === "calendar" ? "calendar" : "list";
  const today = localDate();
  const current = monthStart(today);
  const month = parseMonth(monthParam, today);
  const data = await loadMonth(month);

  const t = await getTranslations("pages.workouts");
  const format = await getFormatter();
  const monthLabel = (iso: string) => format.dateTime(displayDate(iso), { month: "long", year: "numeric", timeZone: "UTC" });
  const shortDay = (iso: string, withMonth: boolean) =>
    format.dateTime(displayDate(iso), withMonth ? { day: "numeric", month: "short", timeZone: "UTC" } : { day: "numeric", timeZone: "UTC" });
  const isFuture = month >= current;
  // Pusty miesiąc bez wcześniejszych treningów: dalej wstecz nic nie ma.
  const isOldest = data.ok && data.summary.workouts === 0 && data.earlier === null;

  const navClass =
    "grid size-10 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-30";

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <nav aria-label={t("view.label")} className="flex rounded-lg bg-surface-muted p-1">
          {(["list", "calendar"] as const).map((v) => (
            <Link
              key={v}
              href={monthHref(month, current, v)}
              aria-current={v === view ? "page" : undefined}
              className={`flex h-9 items-center rounded-md px-3.5 text-sm font-medium ${
                v === view ? "bg-surface text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {t(`view.${v}`)}
            </Link>
          ))}
        </nav>
      </div>

      <nav aria-label={t("monthNav")} className="mt-4 flex items-center gap-1">
        <Link
          href={monthHref(addMonths(month, -1), current, view)}
          aria-label={t("prev")}
          aria-disabled={isOldest}
          tabIndex={isOldest ? -1 : undefined}
          className={`-ml-2.5 ${navClass}`}
        >
          <ChevronLeft className="size-5" strokeWidth={2} aria-hidden />
        </Link>
        <Link
          href={monthHref(addMonths(month, 1), current, view)}
          aria-label={t("next")}
          aria-disabled={isFuture}
          tabIndex={isFuture ? -1 : undefined}
          className={navClass}
        >
          <ChevronRight className="size-5" strokeWidth={2} aria-hidden />
        </Link>
        <p aria-live="polite" className="ml-2 text-base font-semibold tabular-nums first-letter:uppercase">
          {monthLabel(month)}
        </p>
        {month !== current ? (
          <Link href={monthHref(current, current, view)} className="ml-auto flex h-10 items-center rounded-lg px-2 text-sm font-medium text-accent hover:bg-accent-surface">
            {t("thisMonth")}
          </Link>
        ) : null}
      </nav>

      {!data.ok ? (
        <div className="mt-6">
          <SectionError retryHref={monthHref(month, current, view)} />
        </div>
      ) : data.summary.workouts === 0 ? (
        <div className="mt-6 max-w-xl rounded-xl border border-border bg-surface p-5">
          <p className="text-[17px] font-semibold">{t("empty.title")}</p>
          <p className="mt-1 text-sm text-muted">
            {month === current ? t("empty.current") : data.earlier ? t("empty.past") : t("empty.oldest")}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4">
            {data.earlier ? (
              <Link
                href={monthHref(data.earlier, current, view)}
                className="-ml-2 flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-accent hover:bg-accent-surface"
              >
                <ChevronLeft className="size-4" strokeWidth={2.25} aria-hidden />
                {t("empty.earlier", { month: monthLabel(data.earlier) })}
              </Link>
            ) : null}
            {/* Nowy trening zapisuje się zawsze na dziś, więc logger proponujemy tylko w bieżącym miesiącu. */}
            {month === current ? (
              <Link href="/log" className="-ml-2 flex h-10 items-center rounded-lg px-2 text-sm font-medium text-accent hover:bg-accent-surface">
                {t("empty.log")}
              </Link>
            ) : (
              <Link href={monthHref(current, current, view)} className="-ml-2 flex h-10 items-center rounded-lg px-2 text-sm font-medium text-accent hover:bg-accent-surface">
                {t("thisMonth")}
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <Summary summary={data.summary} />
          {view === "calendar" ? (
            <div className="mt-6">
              <HistoryCalendar month={month} today={today} rows={data.rows} />
            </div>
          ) : (
          <div className="mt-8 flex flex-col gap-8">
            {data.weeks.map((week) => {
              const sameMonth = week.start.slice(0, 7) === week.end.slice(0, 7);
              return (
                <section key={week.start} aria-labelledby={`week-${week.start}`}>
                  <div className="mb-3 flex items-baseline gap-2">
                    <h2 id={`week-${week.start}`} className="text-[17px] leading-snug font-semibold tabular-nums">
                      {week.start <= today && today <= week.end
                        ? t("thisWeek")
                        : `${shortDay(week.start, !sameMonth)}–${shortDay(week.end, true)}`}
                    </h2>
                    <span className="text-[13px] text-muted tabular-nums">{t("count", { count: week.rows.length })}</span>
                  </div>
                  <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
                    {week.rows.map((row) => (
                      <li key={row.id}>
                        <Row row={row} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
          )}
        </>
      )}
    </div>
  );
}

async function Summary({ summary }: { summary: MonthSummary }) {
  const t = await getTranslations("pages.workouts.summary");
  const format = await getFormatter();
  const volume =
    summary.volume >= 100_000
      ? t("tons", { value: format.number(summary.volume / 1000, { maximumFractionDigits: 1 }) })
      : `${format.number(Math.round(summary.volume))} kg`;
  const items = [
    { label: t("workouts"), value: format.number(summary.workouts) },
    { label: t("sets"), value: format.number(summary.sets) },
    { label: t("volume"), value: volume },
    { label: t("days"), value: format.number(summary.days) },
  ];
  return (
    <dl aria-label={t("label")} className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border py-3 sm:flex sm:gap-0">
      {items.map((item, i) => (
        <div key={item.label} className={`min-w-0 sm:px-5 ${i === 0 ? "sm:pl-0" : "sm:border-l sm:border-border"}`}>
          <dt className="text-xs text-muted">{item.label}</dt>
          <dd className="truncate text-[17px] font-semibold tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

async function Row({ row }: { row: HistoryRow }) {
  const t = await getTranslations("pages.workouts");
  const format = await getFormatter();
  const names = row.exercises.slice(0, NAMES_SHOWN).join(", ");
  const rest = row.exercises.length - NAMES_SHOWN;
  return (
    <Link href={`/workouts/${row.id}`} className="flex min-h-16 items-center gap-4 px-4 py-3 hover:bg-surface-muted sm:px-5">
      <span className="w-14 shrink-0 text-center">
        <span className="block text-[11px] font-medium text-muted first-letter:uppercase">
          {format.dateTime(displayDate(row.date), { weekday: "short", timeZone: "UTC" })}
        </span>
        <span className="block text-[15px] font-semibold tabular-nums">
          {format.dateTime(displayDate(row.date), { day: "numeric", month: "short", timeZone: "UTC" })}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-baseline gap-1.5 text-sm font-medium">
          <span className="truncate">{row.exercises.length ? names : t("noExercises")}</span>
          {rest > 0 ? <span className="shrink-0 text-muted tabular-nums">{t("moreExercises", { count: rest })}</span> : null}
          {row.record ? (
            <span className="shrink-0 self-center" title={t("record")}>
              <Trophy className="size-3.5 text-pr" strokeWidth={2.25} aria-hidden />
              <span className="sr-only">{t("record")}</span>
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-[13px] text-muted tabular-nums">
          {row.inProgress ? <span className="font-medium text-foreground">{t("inProgress")} · </span> : null}
          {t("sets", { count: row.doneSets })} · {format.number(Math.round(row.volume))} kg
          {row.minutes ? ` · ${t("minutes", { count: row.minutes })}` : null}
        </span>
        {row.plan ? (
          <span className="mt-0.5 flex min-w-0 items-center gap-1 text-[13px] text-muted">
            <ClipboardList className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
            <span className="sr-only">{t("plan")}: </span>
            <span className="truncate">
              {row.templateName ? `${row.templateName} · ` : null}
              {row.plan.name}
            </span>
          </span>
        ) : null}
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted" strokeWidth={2} aria-hidden />
    </Link>
  );
}
