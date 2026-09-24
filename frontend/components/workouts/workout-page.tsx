"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Check, ChevronLeft, CircleDot, Ellipsis, Pencil, Play, RotateCcw, Trophy } from "lucide-react";
import { clientApi } from "@/lib/api/client";
import { unwrap } from "@/lib/api/errors";
import { displayDate } from "@/lib/planner/dates";
import type { DetailExercise, RecordKind, WorkoutDetail } from "@/lib/workouts/model";
import { ActionMenu } from "@/components/ui/action-menu";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { Sheet } from "@/components/ui/sheet";
import { ToastView, useToast } from "@/components/ui/toast";
import { InlineText } from "@/components/plans/inline-text";

// Wspólna siatka nagłówka i serii: # | kg | powt. | status. Telefon: status przy prawej krawędzi;
// od `sm` status stoi tuż za powtórzeniami, żeby czytał się razem z serią.
const SET_GRID =
  "grid grid-cols-[2.25rem_4.5rem_4.5rem_minmax(0,1fr)] items-center gap-x-3 sm:grid-cols-[2.25rem_5.5rem_5.5rem_7rem_minmax(0,1fr)]";

/** Arkusz sesji: dane treningu do czytania; zmiany serii w loggerze, jedna akcja: powtórz. */
export function WorkoutPage({ workout }: { workout: WorkoutDetail }) {
  const t = useTranslations("pages.workoutDetail");
  const tUndo = useTranslations("pages.log.toast");
  const format = useFormatter();
  const router = useRouter();
  const { toast, show, dismiss } = useToast();
  const [notes, setNotes] = useState(workout.notes);
  const [repeating, setRepeating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [redating, setRedating] = useState(false);

  const inProgress = !workout.finishedAt;
  const monthHref = `/workouts?month=${workout.date.slice(0, 7)}`;
  const day = displayDate(workout.date);
  const time = (iso: string) => format.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" });

  const patchNotes = async (value: string) => {
    const previous = notes;
    setNotes(value);
    try {
      await unwrap(clientApi.PATCH("/workout/{id}", { params: { path: { id: workout.id } }, body: { notes: value } }));
    } catch {
      setNotes(previous);
      show({ message: t("error"), tone: "error" });
    }
  };

  const repeat = async () => {
    setRepeating(true);
    try {
      const copy = await unwrap(clientApi.POST("/workout/{id}/duplicate", { params: { path: { id: workout.id } } }));
      router.push(`/log?workout=${copy.id}`);
    } catch {
      setRepeating(false);
      show({ message: t("repeatError"), tone: "error" });
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await unwrap(clientApi.DELETE("/workout/{id}", { params: { path: { id: workout.id } } }));
      router.push(monthHref);
      router.refresh();
    } catch {
      setDeleting(false);
      show({ message: t("deleteError"), tone: "error" });
    }
  };

  const volume = `${format.number(Math.round(workout.volume))} kg`;
  const summary = [
    { label: t("summary.sets"), value: t("summary.setsValue", { done: workout.doneSets, total: workout.totalSets }) },
    { label: t("summary.volume"), value: volume },
    { label: t("summary.exercises"), value: format.number(workout.exercises.length) },
    { label: t("summary.duration"), value: workout.minutes ? t("minutes", { count: workout.minutes }) : "—" },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link
        href={monthHref}
        className="-ml-2 inline-flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted hover:bg-surface-muted hover:text-foreground"
      >
        <ChevronLeft className="size-4" strokeWidth={2.25} aria-hidden />
        <span className="first-letter:uppercase">{format.dateTime(day, { month: "long", year: "numeric", timeZone: "UTC" })}</span>
      </Link>

      <header className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight first-letter:uppercase sm:text-3xl">
            {format.dateTime(day, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted tabular-nums">
            {inProgress ? (
              <>
                <CircleDot className="size-3.5 text-foreground" strokeWidth={2.25} aria-hidden />
                <span className="font-medium text-foreground">{t("inProgress")}</span>
                <span>· {t("startedAt", { time: time(workout.createdAt) })}</span>
              </>
            ) : (
              <span>
                {workout.minutes
                  ? t("finishedSpan", { from: time(workout.createdAt), to: time(workout.finishedAt!), minutes: workout.minutes })
                  : t("finished")}
              </span>
            )}
          </p>
          <InlineText
            key={notes}
            value={notes}
            label={t("notes")}
            placeholder={t("notesPlaceholder")}
            multiline
            onCommit={patchNotes}
            className="mt-1 min-h-9 resize-none py-1.5 text-sm text-muted focus-visible:text-foreground"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {inProgress ? (
            <Link
              href={`/log?workout=${workout.id}`}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90 sm:flex-none"
            >
              <Play className="size-4 fill-current" strokeWidth={2} aria-hidden />
              {t("continue")}
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={repeat}
                disabled={repeating}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-60 sm:flex-none"
              >
                <RotateCcw className="size-4" strokeWidth={2.25} aria-hidden />
                {repeating ? t("repeating") : t("repeat")}
              </button>
              <Link
                href={`/log?workout=${workout.id}`}
                className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-surface-muted"
              >
                <Pencil className="size-4" strokeWidth={2} aria-hidden />
                {t("edit")}
              </Link>
            </>
          )}
          <ActionMenu
            label={t("menu")}
            align="right"
            trigger={<Ellipsis className="size-5" strokeWidth={2} aria-hidden />}
            triggerClassName="grid size-11 place-items-center rounded-lg border border-border text-muted hover:bg-surface-muted hover:text-foreground"
            actions={[
              { label: t("changeDate"), onSelect: () => setRedating(true) },
              { label: t("delete"), tone: "danger", onSelect: () => setConfirming(true) },
            ]}
          />
        </div>
      </header>

      <dl aria-label={t("summary.label")} className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border py-3 sm:flex sm:gap-0">
        {summary.map((item, i) => (
          <div key={item.label} className={`min-w-0 sm:px-5 ${i === 0 ? "sm:pl-0" : "sm:border-l sm:border-border"}`}>
            <dt className="text-xs text-muted">{item.label}</dt>
            <dd className="truncate text-[17px] font-semibold tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>

      {workout.exercises.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">{t("empty")}</p>
          <Link
            href={`/log?workout=${workout.id}`}
            className="-ml-2 mt-2 inline-flex h-10 items-center rounded-lg px-2 text-sm font-medium text-accent hover:bg-accent-surface"
          >
            {t("emptyAction")}
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {workout.exercises.map((exercise) => (
            <ExerciseSection key={exercise.id} exercise={exercise} />
          ))}
        </div>
      )}

      <DateSheet
        open={redating}
        workoutId={workout.id}
        date={workout.date}
        onClose={() => setRedating(false)}
        onSaved={(date) => {
          setRedating(false);
          router.refresh();
          show({ message: t("dateSheet.saved", { date: format.dateTime(displayDate(date), { day: "numeric", month: "long", timeZone: "UTC" }) }), tone: "default" });
        }}
      />
      <ConfirmSheet
        open={confirming}
        title={t("deleteTitle", { date: format.dateTime(day, { day: "numeric", month: "long", timeZone: "UTC" }) })}
        body={t("deleteBody", { sets: workout.totalSets })}
        confirmLabel={t("deleteConfirm")}
        cancelLabel={t("cancel")}
        pending={deleting}
        onConfirm={remove}
        onClose={() => setConfirming(false)}
      />
      <ToastView toast={toast} onDismiss={dismiss} undoLabel={tUndo("undo")} />
    </div>
  );
}

function ExerciseSection({ exercise }: { exercise: DetailExercise }) {
  const t = useTranslations("pages.workoutDetail");
  const tGroup = useTranslations("enums.muscleGroup");
  const format = useFormatter();
  const recordLabel = (kinds: RecordKind[]) => kinds.map((k) => t(`record.${k}`)).join(", ");

  return (
    <section aria-labelledby={`ex-${exercise.id}`} className="rounded-xl border border-border bg-surface">
      <header className="flex items-baseline justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
        <div className="min-w-0">
          <h2 id={`ex-${exercise.id}`} className="text-[17px] leading-snug font-semibold">
            <Link href={`/exercises/${exercise.exerciseId}`} className="underline-offset-2 hover:underline">
              {exercise.name}
            </Link>
          </h2>
          <p className="text-xs text-muted">{tGroup(exercise.muscleGroup)}</p>
        </div>
        <p className="shrink-0 text-[13px] text-muted tabular-nums">
          {t("sets", { count: exercise.doneSets })} · {format.number(Math.round(exercise.volume))} kg
        </p>
      </header>

      {exercise.sets.length === 0 ? (
        <p className="border-t border-border px-4 py-4 text-sm text-muted sm:px-5">{t("noSets")}</p>
      ) : (
        <>
          <div className={`${SET_GRID} border-y border-border px-4 py-2 text-[11px] font-semibold tracking-wide text-muted uppercase sm:px-5`}>
            <span className="text-center">{t("col.set")}</span>
            <span className="text-right">{t("col.weight")}</span>
            <span className="text-right">{t("col.reps")}</span>
            <span className="sr-only">{t("col.done")}</span>
          </div>
          <ol className="divide-y divide-border">
            {exercise.sets.map((set) => (
              <li key={set.id} className={`${SET_GRID} min-h-12 px-4 py-1.5 sm:px-5 ${set.completed ? "" : "text-muted"}`}>
                <span className="grid place-items-center">
                  {set.records.length ? (
                    <span
                      title={recordLabel(set.records)}
                      className="grid size-8 place-items-center rounded-full bg-pr text-pr-foreground"
                    >
                      <Trophy className="size-4" strokeWidth={2.25} aria-hidden />
                      <span className="sr-only">
                        {t("setNumber", { n: set.number })}, {t("recordSr", { kinds: recordLabel(set.records) })}
                      </span>
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-muted tabular-nums">{set.number}</span>
                  )}
                </span>
                <span className="text-right text-base font-semibold tabular-nums">
                  {set.weight > 0 ? format.number(set.weight, { maximumFractionDigits: 2 }) : "—"}
                </span>
                <span className="text-right text-base font-semibold tabular-nums">{set.reps}</span>
                <span className="flex justify-end sm:justify-center">
                  {set.completed ? (
                    <span className="grid size-7 place-items-center rounded-md bg-success text-success-foreground">
                      <Check className="size-4" strokeWidth={3} aria-hidden />
                      <span className="sr-only">{t("done")}</span>
                    </span>
                  ) : (
                    <span className="text-xs">{t("skipped")}</span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

function DateSheet({
  open,
  workoutId,
  date,
  onClose,
  onSaved,
}: {
  open: boolean;
  workoutId: number;
  date: string;
  onClose: () => void;
  onSaved: (date: string) => void;
}) {
  const t = useTranslations("pages.workoutDetail.dateSheet");
  const tNav = useTranslations("nav");
  const [value, setValue] = useState(date);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || pending) return;
    if (value === date) return onClose();
    setPending(true);
    setError(false);
    try {
      await unwrap(clientApi.PATCH("/workout/{id}", { params: { path: { id: workoutId } }, body: { date: value } }));
      setPending(false);
      onSaved(value);
    } catch {
      setPending(false);
      setError(true);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      locked={pending}
      title={t("title")}
      closeLabel={tNav("close")}
      footer={
        <button
          type="submit"
          form="workout-date"
          disabled={pending || !value}
          className="h-12 w-full rounded-lg bg-accent text-[15px] font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-60"
        >
          {pending ? t("pending") : t("submit")}
        </button>
      }
    >
      <form id="workout-date" onSubmit={submit} className="flex flex-col gap-1.5">
        <p className="mb-3 text-sm text-muted">{t("hint")}</p>
        <label htmlFor="workout-date-input" className="text-sm font-medium">
          {t("date")}
        </label>
        <input
          id="workout-date-input"
          type="date"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-11 rounded-lg border border-border bg-surface-muted px-3 text-[15px] outline-none focus-visible:border-accent"
        />
        {error ? (
          <p role="alert" className="mt-2 rounded-lg bg-danger-surface px-3 py-2.5 text-sm text-danger">
            {t("error")}
          </p>
        ) : null}
      </form>
    </Sheet>
  );
}
