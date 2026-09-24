"use client";

import { useEffect, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Check, CloudOff, Minus, Plus, Trophy } from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import { WEIGHT_STEP, parseReps, parseWeight, type LogSet, type PrKind } from "@/lib/log/model";

/** Wspólna siatka kolumn tabeli serii: Seria | Poprzednio | kg | Powt. | ✓ */
export const SET_GRID = "grid grid-cols-[2.25rem_minmax(0,1fr)_5.25rem_5.25rem_2.75rem] items-center gap-x-2";

type Props = {
  set: LogSet;
  previous?: { weight: number; reps: number };
  pr?: PrKind;
  active: boolean;
  onFocusRow: () => void;
  onWeight: (value: number) => void;
  onReps: (value: number) => void;
  onToggle: () => void;
  onRemove: () => void;
  onRetry: () => void;
};

export function SetRow({ set, previous, pr, active, onFocusRow, onWeight, onReps, onToggle, onRemove, onRetry }: Props) {
  const t = useTranslations("pages.log");
  const format = useFormatter();
  const n = set.setNumber;
  const kg = (value: number) => format.number(value, { maximumFractionDigits: 2 });

  return (
    <div
      className={`rounded-lg px-1.5 py-1 transition-colors ${
        set.completed ? "bg-success-surface" : active ? "bg-surface-muted" : ""
      }`}
      onFocusCapture={onFocusRow}
    >
      <div className={SET_GRID}>
        <ActionMenu
          label={pr ? `${t("table.setMenu", { n })} (${t("pr.label")})` : t("table.setMenu", { n })}
          trigger={
            pr ? (
              <span className="animate-pr-in grid size-8 place-items-center rounded-full bg-pr text-pr-foreground">
                <Trophy className="size-4" strokeWidth={2.5} aria-hidden />
              </span>
            ) : (
              <span className="tabular-nums">{n}</span>
            )
          }
          triggerClassName="grid h-11 w-9 place-items-center rounded-lg text-sm font-semibold hover:bg-surface-strong"
          actions={[{ label: t("table.removeSet"), tone: "danger", onSelect: onRemove }]}
        />

        <div className="min-w-0 text-[13px] tabular-nums">
          {previous ? (
            <button
              type="button"
              onClick={() => {
                onWeight(previous.weight);
                onReps(previous.reps);
              }}
              aria-label={t("table.copyPrevious", { value: `${kg(previous.weight)} × ${previous.reps}` })}
              className="max-w-full truncate rounded px-1 py-1 text-left text-muted hover:bg-surface-strong hover:text-foreground"
            >
              {kg(previous.weight)}&#8239;×&#8239;{previous.reps}
            </button>
          ) : (
            <span className="px-1 text-muted" aria-hidden>
              –
            </span>
          )}
        </div>

        <NumberCell
          value={set.weight}
          display={kg(set.weight)}
          inputMode="decimal"
          label={t("table.weightLabel", { n })}
          parse={parseWeight}
          onCommit={onWeight}
          completed={set.completed}
        />
        <NumberCell
          value={set.reps}
          display={String(set.reps)}
          inputMode="numeric"
          label={t("table.repsLabel", { n })}
          parse={parseReps}
          onCommit={onReps}
          completed={set.completed}
        />

        <button
          type="button"
          onClick={onToggle}
          aria-pressed={set.completed}
          aria-label={set.completed ? t("table.markUndone", { n }) : t("table.markDone", { n })}
          className={`grid size-11 place-items-center rounded-lg transition-colors ${
            set.completed
              ? "bg-success text-success-foreground"
              : "bg-surface-strong text-muted hover:text-foreground"
          }`}
        >
          <Check className="size-5" strokeWidth={set.completed ? 3 : 2.25} aria-hidden />
        </button>
      </div>

      {active && !set.completed ? (
        <div className={`${SET_GRID} mt-1 pb-0.5`}>
          <span />
          <span />
          <Stepper
            decreaseLabel={`${t("table.decrease")}: ${t("table.weightLabel", { n })}`}
            increaseLabel={`${t("table.increase")}: ${t("table.weightLabel", { n })}`}
            onDecrease={() => onWeight(set.weight - WEIGHT_STEP)}
            onIncrease={() => onWeight(set.weight + WEIGHT_STEP)}
          />
          <Stepper
            decreaseLabel={`${t("table.decrease")}: ${t("table.repsLabel", { n })}`}
            increaseLabel={`${t("table.increase")}: ${t("table.repsLabel", { n })}`}
            onDecrease={() => onReps(set.reps - 1)}
            onIncrease={() => onReps(set.reps + 1)}
          />
          <span />
        </div>
      ) : null}

      {set.status !== "saved" ? (
        <SyncNote status={set.status} onRetry={onRetry} unsaved={t("table.unsaved")} failed={t("table.failed")} />
      ) : null}
    </div>
  );
}

function NumberCell({
  value,
  display,
  inputMode,
  label,
  parse,
  onCommit,
  completed,
}: {
  value: number;
  display: string;
  inputMode: "decimal" | "numeric";
  label: string;
  parse: (input: string) => number | null;
  onCommit: (value: number) => void;
  completed: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  // Gdy wartość zmieni się z zewnątrz (stepper, kaskada), porzucamy nieaktualny szkic.
  useEffect(() => {
    if (document.activeElement !== ref.current) setDraft(null);
  }, [value]);

  const commit = () => {
    if (draft === null) return;
    const parsed = parse(draft);
    if (parsed !== null && parsed !== value) onCommit(parsed);
    setDraft(null);
  };

  return (
    <input
      ref={ref}
      type="text"
      inputMode={inputMode}
      enterKeyHint="done"
      aria-label={label}
      value={draft ?? display}
      onFocus={(e) => {
        setDraft(display);
        requestAnimationFrame(() => e.target.select());
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraft(null);
          e.currentTarget.blur();
        }
      }}
      className={`h-11 w-full rounded-lg text-center text-base font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
        completed ? "bg-transparent" : "bg-surface-strong"
      } ${draft !== null && parse(draft) === null ? "text-danger" : ""}`}
    />
  );
}

function Stepper({
  decreaseLabel,
  increaseLabel,
  onDecrease,
  onIncrease,
}: {
  decreaseLabel: string;
  increaseLabel: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  const button =
    "grid h-11 flex-1 place-items-center text-foreground hover:bg-surface-strong active:bg-surface-strong";
  return (
    <div className="flex overflow-hidden rounded-lg border border-border bg-surface">
      <button type="button" onClick={onDecrease} aria-label={decreaseLabel} className={button}>
        <Minus className="size-4" strokeWidth={2.5} aria-hidden />
      </button>
      <span className="w-px bg-border" aria-hidden />
      <button type="button" onClick={onIncrease} aria-label={increaseLabel} className={button}>
        <Plus className="size-4" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}

function SyncNote({
  status,
  onRetry,
  unsaved,
  failed,
}: {
  status: "pending" | "failed";
  onRetry: () => void;
  unsaved: string;
  failed: string;
}) {
  if (status === "pending") {
    return (
      <p className="flex items-center gap-1.5 px-1 pt-1 text-xs text-muted" role="status">
        <CloudOff className="size-3.5" strokeWidth={2} aria-hidden />
        {unsaved}
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={onRetry}
      className="flex items-center gap-1.5 px-1 pt-1 text-xs font-medium text-danger underline"
    >
      <CloudOff className="size-3.5" strokeWidth={2} aria-hidden />
      {failed}
    </button>
  );
}
