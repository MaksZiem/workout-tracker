"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Ellipsis, Plus, Sparkles } from "lucide-react";
import { personalRecords, type LogExercise } from "@/lib/log/model";
import type { WorkoutLogApi } from "@/lib/log/use-workout-log";
import { ActionMenu } from "@/components/ui/action-menu";
import { SET_GRID, SetRow } from "./set-row";

type Props = {
  exercise: LogExercise;
  log: WorkoutLogApi;
  activeSetKey: string | null;
  onFocusSet: (setKey: string) => void;
};

export function ExerciseBlock({ exercise, log, activeSetKey, onFocusSet }: Props) {
  const t = useTranslations("pages.log");
  const tEnum = useTranslations("enums.muscleGroup");
  const format = useFormatter();
  const records = personalRecords(exercise);
  const kg = (value: number) => format.number(value, { maximumFractionDigits: 2 });

  const previousLine = exercise.previous
    ? t("exercise.lastTime", {
        date: format.dateTime(new Date(`${exercise.previous.date}T12:00:00`), { day: "numeric", month: "short" }),
        sets: exercise.previous.sets.map((s) => `${kg(s.weight)}×${s.reps}`).join(", "),
      })
    : t("exercise.firstTime");

  return (
    <section aria-labelledby={`${exercise.key}-title`} className="scroll-mt-32">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`${exercise.key}-title`} className="text-[17px] leading-snug font-semibold text-accent">
            {exercise.exercise.name}
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {tEnum(exercise.exercise.muscleGroup)}
            {exercise.baseline ? ` · ${t("exercise.best", { weight: kg(exercise.baseline.maxWeight) })}` : ""}
            {exercise.fromAi ? (
              <span className="ml-2 inline-flex items-center gap-1 text-accent">
                <Sparkles className="size-3" strokeWidth={2} aria-hidden />
                {t("exercise.fromAi")}
              </span>
            ) : null}
          </p>
        </div>
        <ActionMenu
          label={t("exercise.menu")}
          align="right"
          trigger={<Ellipsis className="size-5" strokeWidth={2} aria-hidden />}
          triggerClassName="-mr-2 grid size-10 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground"
          actions={[{ label: t("exercise.remove"), tone: "danger", onSelect: () => log.removeExercise(exercise.key) }]}
        />
      </div>

      <p className="mt-1.5 text-[13px] text-muted tabular-nums">{previousLine}</p>

      {exercise.sets.length ? (
        <div className="mt-3">
          <div aria-hidden className={`${SET_GRID} px-1.5 pb-1 text-[11px] font-semibold tracking-wide text-muted uppercase`}>
            <span className="text-center">{t("table.set")}</span>
            <span className="px-1">{t("table.previous")}</span>
            <span className="text-center">{t("table.kg")}</span>
            <span className="text-center">{t("table.reps")}</span>
            <span />
          </div>
          <ol className="flex flex-col gap-1">
            {exercise.sets.map((set, index) => (
              <li key={set.key}>
                <SetRow
                  set={set}
                  previous={exercise.previous?.sets[index]}
                  pr={records.get(set.key)}
                  active={set.key === activeSetKey}
                  onFocusRow={() => onFocusSet(set.key)}
                  onWeight={(value) => log.updateWeight(exercise.key, set.key, value)}
                  onReps={(value) => log.updateReps(exercise.key, set.key, value)}
                  onToggle={() => log.toggleDone(exercise.key, set.key)}
                  onRemove={() => log.removeSet(exercise.key, set.key)}
                  onRetry={() => log.retry(set.key)}
                />
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => log.addSet(exercise.key)}
        disabled={exercise.status === "failed"}
        className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-surface-muted text-sm font-medium text-foreground hover:bg-surface-strong disabled:opacity-50"
      >
        <Plus className="size-4" strokeWidth={2.25} aria-hidden />
        {t("exercise.addSet")}
      </button>
    </section>
  );
}
