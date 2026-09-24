"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { CalendarDays, ChevronRight, Plus } from "lucide-react";
import { startEmpty, startScheduled, type StartState } from "@/lib/log/actions";
import type { PlannedItem, StartedItem } from "@/lib/log/load";

export function Picker({ planned, started }: { planned: PlannedItem[]; started: StartedItem[] }) {
  const t = useTranslations("pages.log");
  const nothing = planned.length === 0 && started.length === 0;

  return (
    <div className="mx-auto w-full max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>

      {nothing ? (
        <div className="mt-10 flex flex-col items-center px-4 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-surface-muted text-muted">
            <CalendarDays className="size-6" strokeWidth={1.75} aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-semibold">{t("picker.nothingTitle")}</h2>
          <p className="mt-1 max-w-sm text-sm text-muted">{t("picker.nothingBody")}</p>
          <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
            <EmptyWorkoutButton primary />
            <Link
              href="/planner"
              className="flex h-12 items-center justify-center rounded-lg text-[15px] font-medium text-accent hover:bg-accent-surface"
            >
              {t("picker.toPlanner")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          {planned.length ? (
            <section aria-labelledby="planned-heading">
              <h2 id="planned-heading" className="mb-3 text-base font-semibold">
                {t("picker.planned")}
              </h2>
              <ul className="flex flex-col gap-2">
                {planned.map((item) => (
                  <li key={item.id}>
                    <PlannedRow item={item} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {started.length ? (
            <section aria-labelledby="started-heading">
              <h2 id="started-heading" className="mb-3 text-base font-semibold">
                {t("picker.started")}
              </h2>
              <ul className="flex flex-col gap-2">
                {started.map((item) => (
                  <li key={item.id}>
                    <StartedRow item={item} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <EmptyWorkoutButton />
        </div>
      )}
    </div>
  );
}

function Groups({ groups }: { groups: PlannedItem["muscleGroups"] }) {
  const tEnum = useTranslations("enums.muscleGroup");
  if (!groups.length) return null;
  return <>{groups.map((g) => tEnum(g)).join(" · ")}</>;
}

function PlannedRow({ item }: { item: PlannedItem }) {
  const t = useTranslations("pages.log.picker");
  const [state, action, pending] = useActionState<StartState, FormData>(startScheduled, {});

  return (
    <form action={action} className="rounded-xl border border-border bg-surface p-4">
      <input type="hidden" name="scheduledId" value={item.id} />
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold">{item.templateName ?? t("noTemplate")}</p>
          <p className="mt-0.5 truncate text-[13px] text-muted">
            {t("exercises", { count: item.exerciseCount })} · {t("sets", { count: item.setCount })}
          </p>
          <p className="truncate text-[13px] text-muted">
            <Groups groups={item.muscleGroups} />
          </p>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-12 shrink-0 rounded-lg bg-accent px-5 text-[15px] font-semibold text-accent-foreground hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? t("starting") : t("start")}
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {t("error")}
        </p>
      ) : null}
    </form>
  );
}

function StartedRow({ item }: { item: StartedItem }) {
  const t = useTranslations("pages.log.picker");
  const format = useFormatter();
  const time = format.dateTime(new Date(item.createdAt), { hour: "2-digit", minute: "2-digit" });

  return (
    <Link
      href={`/log?workout=${item.id}`}
      className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 hover:bg-surface-muted"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px] font-semibold">{t("startedAt", { time })}</p>
        <p className="mt-0.5 truncate text-[13px] text-muted tabular-nums">
          {t("exercises", { count: item.exerciseCount })} · {item.doneCount}/{t("sets", { count: item.setCount })}
        </p>
        <p className="truncate text-[13px] text-muted">
          <Groups groups={item.muscleGroups} />
        </p>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-[15px] font-semibold text-accent">
        {t("continue")}
        <ChevronRight className="size-4" strokeWidth={2.25} aria-hidden />
      </span>
    </Link>
  );
}

function EmptyWorkoutButton({ primary = false }: { primary?: boolean }) {
  const t = useTranslations("pages.log.picker");
  const [state, action, pending] = useActionState<StartState>(startEmpty, {});

  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        className={`flex h-12 w-full items-center justify-center gap-2 rounded-lg text-[15px] font-semibold disabled:cursor-wait disabled:opacity-60 ${
          primary
            ? "bg-accent text-accent-foreground hover:opacity-90"
            : "bg-surface-muted text-foreground hover:bg-surface-strong"
        }`}
      >
        <Plus className="size-5" strokeWidth={2.25} aria-hidden />
        {pending ? t("creating") : t("empty")}
      </button>
      {!primary ? <p className="mt-2 text-center text-xs text-muted">{t("emptyHint")}</p> : null}
      {state.error ? (
        <p role="alert" className="mt-2 text-center text-sm text-danger">
          {t("error")}
        </p>
      ) : null}
    </form>
  );
}
