"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { ToastView } from "@/components/ui/toast";
import { displayDate, shiftAnchor, type PlannerView as View } from "@/lib/planner/dates";
import type { PlanOption, PlannerEntry, TemplateOption } from "@/lib/planner/model";
import { usePlanner } from "./use-planner";
import { WeekBoard } from "./week-board";
import { MonthBoard } from "./month-board";
import { GenerateSheet } from "./generate-sheet";
import { AddSheet, MoveSheet } from "./day-sheets";

type Props = {
  view: View;
  anchor: string;
  from: string;
  to: string;
  today: string;
  entries: PlannerEntry[];
  templates: TemplateOption[];
  plans: PlanOption[];
};

const href = (view: View, date: string) => `/planner?view=${view}&date=${date}`;

export function PlannerView({ view, anchor, from, to, today, entries: serverEntries, templates, plans }: Props) {
  const t = useTranslations("pages.planner");
  const tUndo = useTranslations("pages.log.toast");
  const format = useFormatter();
  const planner = usePlanner(serverEntries, { error: t("toast.error"), removed: t("toast.removed") });

  const [generateOpen, setGenerateOpen] = useState(false);
  const [addDate, setAddDate] = useState<string | null>(null);
  const [moving, setMoving] = useState<PlannerEntry | null>(null);

  const month = anchor.slice(0, 7);
  const visible = view === "month" ? planner.entries.filter((e) => e.date.startsWith(month)) : planner.entries;
  const done = visible.filter((e) => e.status === "COMPLETED").length;
  const countable = visible.filter((e) => e.status !== "SKIPPED").length;

  const rangeLabel =
    view === "week"
      ? format.dateTimeRange(displayDate(from), displayDate(to), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
      : format.dateTime(displayDate(`${month}-01`), { month: "long", year: "numeric", timeZone: "UTC" });

  const prev = shiftAnchor(view, anchor, -1);
  const next = shiftAnchor(view, anchor, 1);
  const inCurrentRange = today >= from && today <= to && (view === "week" || today.startsWith(month));

  return (
    <div>
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
            {/* Stała wysokość, żeby pasek narzędzi nie skakał między stanami. */}
            <p className="mt-1 h-5 text-sm text-muted tabular-nums">
              {countable ? t("summary", { done, total: countable }) : null}
            </p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <nav aria-label={t("view.label")} className="flex rounded-lg bg-surface-muted p-1">
              {(["week", "month"] as const).map((v) => (
                <Link
                  key={v}
                  href={href(v, anchor)}
                  aria-current={v === view ? "page" : undefined}
                  className={`flex h-9 items-center rounded-md px-3.5 text-sm font-medium ${
                    v === view ? "bg-surface text-foreground" : "text-muted hover:text-foreground"
                  }`}
                >
                  {t(`view.${v}`)}
                </Link>
              ))}
            </nav>
            <button
              type="button"
              onClick={() => setGenerateOpen(true)}
              className="ml-auto flex h-11 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90 sm:ml-0"
            >
              <CalendarPlus className="size-4" strokeWidth={2.25} aria-hidden />
              {t("generate.open")}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <Link
              href={href(view, prev)}
              aria-label={view === "week" ? t("nav.prevWeek") : t("nav.prevMonth")}
              className="grid size-10 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground"
            >
              <ChevronLeft className="size-5" strokeWidth={2} aria-hidden />
            </Link>
            <Link
              href={href(view, today)}
              aria-current={inCurrentRange ? "date" : undefined}
              className={`flex h-10 items-center rounded-lg px-3 text-sm font-medium ${
                inCurrentRange ? "text-muted hover:bg-surface-muted" : "text-accent hover:bg-accent-surface"
              }`}
            >
              {t("nav.today")}
            </Link>
            <Link
              href={href(view, next)}
              aria-label={view === "week" ? t("nav.nextWeek") : t("nav.nextMonth")}
              className="grid size-10 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground"
            >
              <ChevronRight className="size-5" strokeWidth={2} aria-hidden />
            </Link>
          </div>
          <h2 className="text-base font-semibold first-letter:uppercase tabular-nums" aria-live="polite">
            {rangeLabel}
          </h2>
        </div>
      </header>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-surface p-5">
          <div>
            <p className="font-semibold">{view === "week" ? t("empty.title") : t("empty.monthTitle")}</p>
            <p className="mt-0.5 text-sm text-muted">{t("empty.body")}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        {view === "week" ? (
          <WeekBoard
            hasEntries={visible.length > 0}
            from={from}
            to={to}
            today={today}
            entries={planner.entries}
            planner={planner}
            onAdd={setAddDate}
            onMove={setMoving}
          />
        ) : (
          <MonthBoard
            from={from}
            to={to}
            month={month}
            today={today}
            entries={planner.entries}
            planner={planner}
            onAdd={setAddDate}
            onMove={setMoving}
          />
        )}
      </div>

      <GenerateSheet
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        plans={plans}
        today={today}
        onGenerated={(count) => {
          setGenerateOpen(false);
          planner.showToast({ message: t("generate.done", { count }), tone: "default" });
          planner.refresh();
        }}
      />
      <AddSheet
        date={addDate}
        onClose={() => setAddDate(null)}
        templates={templates}
        onAdded={(name) => {
          setAddDate(null);
          planner.showToast({ message: t("toast.added", { name }), tone: "default" });
          planner.refresh();
        }}
      />
      <MoveSheet
        entry={moving}
        onClose={() => setMoving(null)}
        onMove={(entry, date) => {
          setMoving(null);
          planner.patch(
            { id: entry.id, date },
            t("toast.moved", {
              date: format.dateTime(displayDate(date), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
            }),
          );
        }}
      />

      <ToastView toast={planner.toast} onDismiss={planner.dismissToast} undoLabel={tUndo("undo")} />
    </div>
  );
}
