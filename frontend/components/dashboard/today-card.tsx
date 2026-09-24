"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Check, CircleDot, Play, Plus } from "lucide-react";
import { startEmpty, startScheduled, type StartState } from "@/lib/log/actions";
import type { TodayItem } from "@/lib/dashboard/load";
import { displayDate } from "@/lib/planner/dates";

/**
 * Karta „Dziś”: jedna odpowiedź na pytanie, co dziś robię, i jedno niebieskie działanie.
 * Kolejność: trening w toku → zaplanowane → zrobione. Tylko pierwszy wiersz z akcją jest niebieski.
 */
export function TodayCard({ items, today, groupNames }: { items: TodayItem[]; today: string; groupNames: Record<string, string> }) {
  const t = useTranslations("pages.dashboard.today");
  const primary = items.findIndex((i) => i.kind !== "done");

  return (
    // Tytuł karty to nazwa treningu; „Dziś” jest tylko w nazwie dostępnej sekcji.
    <section aria-label={t("label")} className="overflow-hidden rounded-xl border border-border bg-surface">
      {items.length === 0 ? (
        <RestDay />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item, i) => (
            <li
              key={`${item.kind}-${"workoutId" in item ? item.workoutId : item.scheduledId}`}
              className={`px-4 py-4 sm:px-5 sm:py-5 ${item.kind === "done" ? "bg-success-surface" : ""}`}
            >
              {item.kind === "planned" ? (
                <PlannedRow item={item} primary={i === primary} groupNames={groupNames} />
              ) : item.kind === "inProgress" ? (
                <InProgressRow item={item} primary={i === primary} today={today} />
              ) : (
                <DoneRow item={item} />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  const t = useTranslations("pages.dashboard.today");
  return (
    <h2 className="text-xl leading-tight font-semibold tracking-tight sm:text-2xl">
      <span className="sr-only">{t("label")}: </span>
      {children}
    </h2>
  );
}

function actionClass(primary: boolean) {
  return primary
    ? "flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 text-[15px] font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-60 sm:w-auto"
    : "flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-surface-muted disabled:opacity-60 sm:w-auto";
}

function Row({ body, action }: { body: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">{body}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function PlannedRow({
  item,
  primary,
  groupNames,
}: {
  item: Extract<TodayItem, { kind: "planned" }>;
  primary: boolean;
  groupNames: Record<string, string>;
}) {
  const t = useTranslations("pages.dashboard.today");
  const [state, action, pending] = useActionState<StartState, FormData>(startScheduled, {});
  return (
    <Row
      body={
        <>
          <Title>{item.title ?? t("untitled")}</Title>
          <p className="mt-1 text-[13px] text-muted tabular-nums">
            {t("exercises", { count: item.exerciseCount })} · {t("sets", { count: item.setCount })}
            {item.muscleGroups.length ? ` · ${item.muscleGroups.map((g) => groupNames[g] ?? g).join(", ")}` : null}
          </p>
          {state.error ? (
            <p role="alert" className="mt-2 text-sm text-danger">
              {t("startError")}
            </p>
          ) : null}
        </>
      }
      action={
        <form action={action}>
          <input type="hidden" name="scheduledId" value={item.scheduledId} />
          <button type="submit" disabled={pending} className={actionClass(primary)}>
            <Play className="size-4 fill-current" strokeWidth={2} aria-hidden />
            {pending ? t("starting") : t("start")}
          </button>
        </form>
      }
    />
  );
}

function InProgressRow({
  item,
  primary,
  today,
}: {
  item: Extract<TodayItem, { kind: "inProgress" }>;
  primary: boolean;
  today: string;
}) {
  const t = useTranslations("pages.dashboard.today");
  const format = useFormatter();
  const status =
    item.date === today
      ? t("startedAt", { time: format.dateTime(new Date(item.createdAt), { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }) })
      : t("unfinishedFrom", { date: format.dateTime(displayDate(item.date), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) });
  const share = item.setCount ? item.doneCount / item.setCount : 0;

  return (
    <Row
      body={
        <>
          <Title>{item.title ?? t("untitled")}</Title>
          {/* Ten sam znacznik „W trakcie” co w planerze. */}
          <p className="mt-1.5 flex items-center gap-1.5 text-[13px] tabular-nums">
            <CircleDot className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
            <span className="font-medium">{status}</span>
            <span className="text-muted">· {t("exercises", { count: item.exerciseCount })}</span>
          </p>
          {item.setCount ? (
            <div className="mt-3 flex items-center gap-3">
              <span
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={item.setCount}
                aria-valuenow={item.doneCount}
                aria-label={t("setsDone", { done: item.doneCount, total: item.setCount })}
                className="h-1.5 w-40 overflow-hidden rounded-full bg-surface-muted"
              >
                <span className="block h-full rounded-full bg-foreground" style={{ width: `${share * 100}%` }} />
              </span>
              <span className="text-[13px] font-medium tabular-nums">{t("setsDone", { done: item.doneCount, total: item.setCount })}</span>
            </div>
          ) : null}
        </>
      }
      action={
        <Link href={`/log?workout=${item.workoutId}`} className={actionClass(primary)}>
          <Play className="size-4 fill-current" strokeWidth={2} aria-hidden />
          {t("continue")}
        </Link>
      }
    />
  );
}

function DoneRow({ item }: { item: Extract<TodayItem, { kind: "done" }> }) {
  const t = useTranslations("pages.dashboard.today");
  const format = useFormatter();
  return (
    <Row
      body={
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-success text-success-foreground">
            <Check className="size-4" strokeWidth={3} aria-hidden />
          </span>
          <div className="min-w-0">
            <Title>{item.title ?? t("untitled")}</Title>
            <p className="mt-1 text-[13px] tabular-nums">
              <span className="font-medium text-success">{t("done")}</span>
              <span className="text-muted">
                {" "}
                · {t("exercises", { count: item.exerciseCount })} · {t("sets", { count: item.doneCount })} ·{" "}
                {format.number(Math.round(item.volume))} kg
              </span>
            </p>
          </div>
        </div>
      }
      action={
        <Link href={`/workouts/${item.workoutId}`} className="flex h-11 items-center text-sm font-medium text-accent hover:underline">
          {t("details")}
        </Link>
      }
    />
  );
}

function RestDay() {
  const t = useTranslations("pages.dashboard.today");
  const [state, action, pending] = useActionState<StartState>(startEmpty, {});
  return (
    <div className="px-4 py-4 sm:px-5 sm:py-5">
      <Row
        body={
          <>
            <Title>{t("restTitle")}</Title>
            <p className="mt-1 max-w-prose text-sm text-muted">{t("restBody")}</p>
            {state.error ? (
              <p role="alert" className="mt-2 text-sm text-danger">
                {t("startError")}
              </p>
            ) : null}
          </>
        }
        action={
          // Telefon: przycisk najpierw, pod nim cichy link wyrównany do tekstu.
          <div className="flex flex-col-reverse items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
            <Link href="/planner" className="-ml-3 flex h-11 items-center rounded-lg px-3 text-sm font-medium text-accent hover:bg-accent-surface sm:ml-0">
              {t("toPlanner")}
            </Link>
            <form action={action} className="w-full sm:w-auto">
              <button type="submit" disabled={pending} className={actionClass(false)}>
                <Plus className="size-4" strokeWidth={2.5} aria-hidden />
                {pending ? t("starting") : t("startEmpty")}
              </button>
            </form>
          </div>
        }
      />
    </div>
  );
}
