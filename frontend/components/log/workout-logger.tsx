"use client";

import { useMemo, useState } from "react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { Dumbbell, Plus, Sparkles } from "lucide-react";
import { workoutTotals, type LogWorkout } from "@/lib/log/model";
import { useWorkoutLog } from "@/lib/log/use-workout-log";
import { ExerciseBlock } from "./exercise-block";
import { AddExerciseSheet } from "./add-exercise-sheet";
import { ParseSheet } from "./parse-sheet";
import { FinishSheet } from "./finish-sheet";
import { ToastView } from "@/components/ui/toast";

type SheetName = "exercise" | "parse" | "finish" | null;

export function WorkoutLogger({ workout }: { workout: LogWorkout }) {
  const t = useTranslations("pages.log");
  const tEnum = useTranslations("enums.muscleGroup");
  const format = useFormatter();

  const log = useWorkoutLog(workout, {
    setRemoved: t("toast.setRemoved"),
    exerciseRemoved: t("toast.exerciseRemoved"),
    offline: t("toast.offline"),
    pr: (kind, value) =>
      kind === "weight"
        ? t("pr.weight", { value: format.number(value, { maximumFractionDigits: 2 }) })
        : t("pr.e1rm", { value: format.number(value, { maximumFractionDigits: 1 }) }),
  });

  const [sheet, setSheet] = useState<SheetName>(null);
  const [focusedSetKey, setFocusedSetKey] = useState<string | null>(null);
  const totals = workoutTotals(log.exercises);

  // Aktywna seria: ta, którą użytkownik ostatnio dotknął (jeśli nie jest zrobiona),
  // w przeciwnym razie pierwsza nieodhaczona seria w kolejności ćwiczeń.
  const activeSetKey = useMemo(() => {
    const all = log.exercises.flatMap((ex) => ex.sets);
    const focused = all.find((s) => s.key === focusedSetKey);
    if (focused && !focused.completed) return focused.key;
    return all.find((s) => !s.completed)?.key ?? null;
  }, [log.exercises, focusedSetKey]);

  const muscleGroups = [...new Set(log.exercises.map((ex) => ex.exercise.muscleGroup))];
  const date = new Date(`${workout.date}T12:00:00`);
  const title = format.dateTime(date, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto w-full max-w-xl">
      <header className="sticky top-0 z-10 -mx-4 -mt-6 border-b border-border bg-background/95 px-4 pt-4 pb-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:-mx-6 sm:px-6 md:mx-0 md:-mt-10 md:px-0 md:pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight first-letter:uppercase">{title}</h1>
            <p className="truncate text-[13px] text-muted">
              {muscleGroups.length ? muscleGroups.map((g) => tEnum(g)).join(" · ") : t("header.fullBody")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSheet("finish")}
            className="h-10 shrink-0 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            {t("header.finish")}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3 text-[13px] font-medium tabular-nums">
          <Elapsed createdAt={workout.createdAt} label={t("header.elapsed")} />
          <span className="text-muted">{t("header.setsDone", { done: totals.done, total: totals.total })}</span>
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-strong"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={totals.total}
            aria-valuenow={totals.done}
            aria-label={t("header.setsDone", { done: totals.done, total: totals.total })}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${totals.total ? (totals.done / totals.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </header>

      {log.exercises.length ? (
        <div className="mt-6 flex flex-col gap-8">
          {log.exercises.map((exercise) => (
            <ExerciseBlock
              key={exercise.key}
              exercise={exercise}
              log={log}
              activeSetKey={activeSetKey}
              onFocusSet={setFocusedSetKey}
            />
          ))}
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center px-4 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-surface-muted text-muted">
            <Dumbbell className="size-6" strokeWidth={1.75} aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-semibold">{t("emptyWorkout.title")}</h2>
          <p className="mt-1 max-w-sm text-sm text-muted">{t("emptyWorkout.body")}</p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => setSheet("exercise")}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-accent-surface text-[15px] font-semibold text-accent hover:bg-accent/20"
        >
          <Plus className="size-5" strokeWidth={2.25} aria-hidden />
          {t("add.exercise")}
        </button>
        <button
          type="button"
          onClick={() => setSheet("parse")}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-surface-muted text-[15px] font-medium hover:bg-surface-strong"
        >
          <Sparkles className="size-4" strokeWidth={2} aria-hidden />
          {t("add.fromText")}
        </button>
      </div>

      <AddExerciseSheet
        open={sheet === "exercise"}
        onClose={() => setSheet(null)}
        onPick={(exercise) => {
          log.addExercise(exercise);
          setSheet(null);
        }}
      />
      <ParseSheet
        open={sheet === "parse"}
        onClose={() => setSheet(null)}
        workoutId={workout.id}
        onParsed={(parsed) => {
          const added = log.mergeParsed(parsed);
          log.showToast({
            message: added ? t("ai.added", { count: added }) : t("ai.nothing"),
            tone: added ? "default" : "error",
          });
          setSheet(null);
        }}
      />
      <FinishSheet
        open={sheet === "finish"}
        onClose={() => setSheet(null)}
        workout={workout}
        exercises={log.exercises}
        pendingCount={log.pendingCount}
        onFinish={log.flush}
        onFinishNow={log.finishNow}
      />

      <ToastView toast={log.toast} onDismiss={log.dismissToast} undoLabel={t("toast.undo")} />
    </div>
  );
}

const ELAPSED_LIMIT = 12 * 3600;

function Elapsed({ createdAt, label }: { createdAt: string; label: string }) {
  const now = useNow({ updateInterval: 1000 });
  const seconds = Math.max(0, Math.floor((now.getTime() - new Date(createdAt).getTime()) / 1000));

  // Licznik ma sens tylko dla treningu, który trwa (utworzony niedawno).
  if (seconds > ELAPSED_LIMIT) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const text = h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;

  return (
    <time aria-label={label} className="text-accent" suppressHydrationWarning>
      {text}
    </time>
  );
}
