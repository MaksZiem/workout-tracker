"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { Trophy } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { personalRecords, workoutTotals, type LogExercise, type LogWorkout } from "@/lib/log/model";

const FINISH_TIMEOUT = 12000;

export function FinishSheet({
  open,
  onClose,
  workout,
  exercises,
  pendingCount,
  onFinish,
  onFinishNow,
}: {
  open: boolean;
  onClose: () => void;
  workout: LogWorkout;
  exercises: LogExercise[];
  pendingCount: number;
  onFinish: (removeUnchecked: boolean) => Promise<void>;
  onFinishNow: () => Promise<void>;
}) {
  const t = useTranslations("pages.log.finish");
  const tNav = useTranslations("nav");
  const tPr = useTranslations("pages.log.pr");
  const format = useFormatter();
  const router = useRouter();
  const now = useNow({ updateInterval: 30000 });
  const [removeUnchecked, setRemoveUnchecked] = useState(true);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const totals = workoutTotals(exercises);
  const unchecked = totals.total - totals.done;
  const minutes = Math.max(1, Math.round((now.getTime() - new Date(workout.createdAt).getTime()) / 60000));

  // Kolejka zapisów może ponawiać bez końca przy braku sieci, więc czekamy
  // ograniczony czas, a potem dajemy wybór zamiast wiecznego „Zapisywanie…”.
  const finish = async () => {
    setSaving(true);
    setFailed(false);
    try {
      await Promise.race([
        onFinish(unchecked > 0 && removeUnchecked),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), FINISH_TIMEOUT)),
      ]);
      router.push(`/workouts/${workout.id}`);
    } catch {
      setFailed(true);
      setSaving(false);
    }
  };

  const finishAnyway = async () => {
    setSaving(true);
    try {
      await onFinishNow();
      router.push(`/workouts/${workout.id}`);
    } catch {
      setSaving(false);
    }
  };

  const stats = [
    { label: t("sets"), value: `${totals.done}` },
    { label: t("volume"), value: t("volumeValue", { value: format.number(totals.volume, { maximumFractionDigits: 0 }) }) },
    { label: t("duration"), value: format.number(minutes, { style: "unit", unit: "minute", unitDisplay: "short" }) },
    { label: t("records"), value: `${totals.records}`, highlight: totals.records > 0 },
  ];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("title")}
      closeLabel={tNav("close")}
      footer={
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={finish}
            disabled={saving}
            className="h-12 w-full rounded-lg bg-accent text-[15px] font-semibold text-accent-foreground hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? t("saving") : t("confirm")}
          </button>
          {failed ? (
            <button
              type="button"
              onClick={finishAnyway}
              disabled={saving}
              className="h-11 w-full rounded-lg bg-surface-muted text-sm font-medium hover:bg-surface-strong disabled:opacity-60"
            >
              {t("finishAnyway")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-11 w-full rounded-lg text-sm font-medium text-muted hover:bg-surface-muted hover:text-foreground"
          >
            {t("cancel")}
          </button>
        </div>
      }
    >
      <h3 className="sr-only">{t("summary")}</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-y border-border py-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="text-xs text-muted">{stat.label}</dt>
            <dd className={`mt-0.5 text-2xl font-semibold tabular-nums ${stat.highlight ? "text-pr" : ""}`}>
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      {exercises.length ? (
        <ul className="mt-4 flex flex-col divide-y divide-border">
          {exercises.map((exercise) => {
            const done = exercise.sets.filter((s) => s.completed);
            const best = done.reduce<(typeof done)[number] | null>(
              (top, s) => (!top || s.weight > top.weight || (s.weight === top.weight && s.reps > top.reps) ? s : top),
              null,
            );
            const hasPr = personalRecords(exercise).size > 0;
            return (
              <li key={exercise.key} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{exercise.exercise.name}</p>
                  <p className="text-xs text-muted tabular-nums">
                    {best
                      ? t("exerciseLine", {
                          done: done.length,
                          total: exercise.sets.length,
                          best: `${format.number(best.weight, { maximumFractionDigits: 2 })} × ${best.reps}`,
                        })
                      : t("exerciseNone", { done: 0, total: exercise.sets.length })}
                  </p>
                </div>
                {hasPr ? (
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-pr text-pr-foreground">
                    <Trophy className="size-3.5" strokeWidth={2.5} aria-hidden />
                    <span className="sr-only">{tPr("label")}</span>
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {unchecked > 0 ? (
        <fieldset className="mt-4">
          <legend className="text-sm">{t("unchecked", { count: unchecked })}</legend>
          <div className="mt-2 flex flex-col gap-1">
            {[
              { value: true, label: t("removeUnchecked") },
              { value: false, label: t("keepUnchecked") },
            ].map((option) => (
              <label
                key={String(option.value)}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-surface-muted"
              >
                <input
                  type="radio"
                  name="unchecked"
                  checked={removeUnchecked === option.value}
                  onChange={() => setRemoveUnchecked(option.value)}
                  className="size-4 accent-[var(--accent)]"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {failed ? (
        <p role="alert" className="mt-4 rounded-lg bg-danger-surface px-3 py-2.5 text-sm text-danger">
          {t("failed")}
        </p>
      ) : pendingCount > 0 ? (
        <p className="mt-4 text-sm text-muted">{t("pendingWarning")}</p>
      ) : null}
    </Sheet>
  );
}
