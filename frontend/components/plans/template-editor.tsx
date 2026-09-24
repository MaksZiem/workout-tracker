"use client";

import { useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Ellipsis, Plus } from "lucide-react";
import { clientApi } from "@/lib/api/client";
import { unwrap } from "@/lib/api/errors";
import type { MuscleGroup } from "@/lib/api/extra-types";
import { moveExercise, parseTarget, type EditorExercise, type EditorTemplate, type TargetField } from "@/lib/plans/model";
import { ActionMenu } from "@/components/ui/action-menu";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import type { Toast } from "@/components/ui/toast";
import { AddExerciseSheet } from "@/components/log/add-exercise-sheet";
import { InlineText } from "./inline-text";

const DEFAULT_SETS = 3;
const DEFAULT_REPS = 10;
const SAVED_VISIBLE_MS = 2000;

const FIELDS: TargetField[] = ["targetSets", "targetReps", "targetWeight", "restSeconds"];
const COL: Record<TargetField, "sets" | "reps" | "weight" | "rest"> = {
  targetSets: "sets",
  targetReps: "reps",
  targetWeight: "weight",
  restSeconds: "rest",
};

// Wspólna siatka nagłówka i wierszy (desktop): ćwiczenie | serie | powt. | kg | przerwa | ↑↓ | ⋯
const GRID = "sm:grid sm:grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_5.5rem_5.5rem_5rem_2.75rem] sm:items-center sm:gap-2";

/**
 * Edytor jednego szablonu (dnia treningowego): nazwa, tabela celów, kolejność.
 * Każde pole zapisuje się samo; błąd przywraca poprzednią wartość i pokazuje komunikat.
 * Używany w planie, później też na /templates/[id].
 */
export function TemplateEditor({
  template: initial,
  headingLevel = "h2",
  autoFocusName = false,
  onDeleted,
  showToast,
}: {
  template: EditorTemplate;
  headingLevel?: "h2" | "h3";
  autoFocusName?: boolean;
  onDeleted: (id: number) => void;
  showToast: (toast: Omit<Toast, "id">) => void;
}) {
  const t = useTranslations("templateEditor");
  const tCommon = useTranslations("pages.planDetail");
  const tGroup = useTranslations("enums.muscleGroup");
  const [template, setTemplate] = useState(initial);
  const [pending, setPending] = useState(0);
  const [saved, setSaved] = useState(false);
  const [picking, setPicking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Heading = headingLevel;

  /** Wspólna obsługa zapisu: licznik „Zapisywanie…”, potem krótkie „Zapisano”. */
  const save = async (request: () => Promise<unknown>, rollback: () => void) => {
    setPending((n) => n + 1);
    setSaved(false);
    try {
      await request();
      if (savedTimer.current) clearTimeout(savedTimer.current);
      setSaved(true);
      savedTimer.current = setTimeout(() => setSaved(false), SAVED_VISIBLE_MS);
      return true;
    } catch {
      rollback();
      showToast({ message: tCommon("error"), tone: "error" });
      return false;
    } finally {
      setPending((n) => n - 1);
    }
  };

  const rename = (name: string) => {
    const previous = template.name;
    setTemplate((tpl) => ({ ...tpl, name }));
    void save(
      () => unwrap(clientApi.PATCH("/template/{id}", { params: { path: { id: template.id } }, body: { name } })),
      () => setTemplate((tpl) => ({ ...tpl, name: previous })),
    );
  };

  const setField = (exercise: EditorExercise, field: TargetField, value: number | null) => {
    const previous = exercise[field];
    const apply = (v: number | null) =>
      setTemplate((tpl) => ({ ...tpl, exercises: tpl.exercises.map((e) => (e.id === exercise.id ? { ...e, [field]: v } : e)) }));
    apply(value);
    void save(
      () =>
        unwrap(
          clientApi.PATCH("/template/{templateId}/exercise/{teId}", {
            params: { path: { templateId: template.id, teId: exercise.id } },
            // null czyści pole (ciężar, przerwa); backend przypisuje każdą zdefiniowaną wartość.
            body: { [field]: value } as Record<TargetField, number>,
          }),
        ),
      () => apply(previous),
    );
  };

  const move = (index: number, direction: -1 | 1) => {
    const before = template.exercises;
    const next = moveExercise(before, index, direction);
    if (!next) return;
    setTemplate((tpl) => ({ ...tpl, exercises: next }));
    const changed = next.filter((e) => before.find((b) => b.id === e.id)?.order !== e.order);
    void save(
      () =>
        Promise.all(
          changed.map((e) =>
            unwrap(
              clientApi.PATCH("/template/{templateId}/exercise/{teId}", {
                params: { path: { templateId: template.id, teId: e.id } },
                body: { order: e.order },
              }),
            ),
          ),
        ),
      () => setTemplate((tpl) => ({ ...tpl, exercises: before })),
    );
  };

  const add = async (picked: { id: number; name: string; muscleGroup: string }, values?: Partial<EditorExercise>) => {
    setPicking(false);
    const order = values?.order ?? (template.exercises.at(-1)?.order ?? -1) + 1;
    const body = {
      exerciseId: picked.id,
      order,
      targetSets: values?.targetSets ?? DEFAULT_SETS,
      targetReps: values?.targetReps ?? DEFAULT_REPS,
      ...(values?.targetWeight != null ? { targetWeight: values.targetWeight } : {}),
      ...(values?.restSeconds != null ? { restSeconds: values.restSeconds } : {}),
    };
    await save(async () => {
      const created = await unwrap(
        clientApi.POST("/template/{templateId}/exercise", { params: { path: { templateId: template.id } }, body }),
      );
      const exercise: EditorExercise = {
        id: created.id,
        exerciseId: picked.id,
        name: picked.name,
        muscleGroup: picked.muscleGroup as MuscleGroup,
        order,
        targetSets: body.targetSets,
        targetReps: body.targetReps,
        targetWeight: values?.targetWeight ?? null,
        restSeconds: values?.restSeconds ?? null,
      };
      setTemplate((tpl) => ({
        ...tpl,
        exercises: [...tpl.exercises, exercise].sort((a, b) => a.order - b.order || a.id - b.id),
      }));
    }, () => {});
  };

  const remove = (exercise: EditorExercise) => {
    const before = template.exercises;
    setTemplate((tpl) => ({ ...tpl, exercises: tpl.exercises.filter((e) => e.id !== exercise.id) }));
    void save(
      () =>
        unwrap(
          clientApi.DELETE("/template/{templateId}/exercise/{teId}", {
            params: { path: { templateId: template.id, teId: exercise.id } },
          }),
        ),
      () => setTemplate((tpl) => ({ ...tpl, exercises: before })),
    ).then((ok) => {
      if (!ok) return;
      showToast({
        message: t("removed", { name: exercise.name }),
        tone: "default",
        // Cofnięcie dodaje ćwiczenie ponownie z tymi samymi celami i miejscem.
        undo: () => void add({ id: exercise.exerciseId, name: exercise.name, muscleGroup: exercise.muscleGroup }, exercise),
      });
    });
  };

  const deleteTemplate = async () => {
    setDeleting(true);
    try {
      await unwrap(clientApi.DELETE("/template/{id}", { params: { path: { id: template.id } } }));
      setConfirming(false);
      onDeleted(template.id);
    } catch {
      showToast({ message: tCommon("error"), tone: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const status = pending > 0 ? t("saving") : saved ? t("saved") : "";

  return (
    <section aria-label={template.name} className="rounded-xl border border-border bg-surface">
      <header className="flex items-start gap-3 px-4 pt-4 pb-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <Heading className="text-[17px] leading-snug font-semibold">
            <InlineText
              key={template.name}
              value={template.name}
              label={t("name")}
              required
              onCommit={rename}
              className="h-9 text-[17px] font-semibold"
              autoFocus={autoFocusName}
            />
          </Heading>
          <p className="text-[13px] text-muted tabular-nums">
            {t("exercises", { count: template.exercises.length })}
            <span aria-live="polite" className="ml-2">
              {status ? `· ${status}` : null}
            </span>
          </p>
        </div>
        <ActionMenu
          label={t("menu", { name: template.name })}
          align="right"
          trigger={<Ellipsis className="size-5" strokeWidth={2} aria-hidden />}
          triggerClassName="grid size-10 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground"
          actions={[{ label: t("delete"), tone: "danger", onSelect: () => setConfirming(true) }]}
        />
      </header>

      {template.exercises.length ? (
        <>
          <div className={`hidden border-y border-border px-5 py-2 text-[11px] font-semibold tracking-wide text-muted uppercase ${GRID}`}>
            <span>{t("col.exercise")}</span>
            {FIELDS.map((f) => (
              <span key={f} className="text-center">
                {t(`col.${COL[f]}`)}
              </span>
            ))}
            <span />
            <span />
          </div>
          <ol className="divide-y divide-border border-t border-border sm:border-t-0">
            {template.exercises.map((exercise, index) => (
              <li key={exercise.id} className={`px-4 py-3 sm:px-5 sm:py-2 ${GRID}`}>
                <div className="flex min-w-0 items-start gap-2 sm:block">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] leading-snug font-medium sm:truncate">{exercise.name}</p>
                    <p className="text-xs text-muted">{tGroup(exercise.muscleGroup)}</p>
                  </div>
                  {/* Telefon: kolejność i menu obok nazwy. */}
                  <div className="flex shrink-0 items-center sm:hidden">
                    <MoveButtons index={index} count={template.exercises.length} name={exercise.name} onMove={move} />
                    <ExerciseMenu name={exercise.name} onRemove={() => remove(exercise)} />
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2 sm:contents">
                  {FIELDS.map((field) => (
                    <TargetInput
                      key={`${field}-${exercise[field]}`}
                      field={field}
                      value={exercise[field]}
                      exerciseName={exercise.name}
                      onCommit={(v) => setField(exercise, field, v)}
                      onInvalid={() => showToast({ message: t("invalid", { field: t(`col.${COL[field]}`) }), tone: "error" })}
                    />
                  ))}
                </div>
                <div className="hidden sm:flex sm:justify-center">
                  <MoveButtons index={index} count={template.exercises.length} name={exercise.name} onMove={move} />
                </div>
                <div className="hidden sm:flex sm:justify-end">
                  <ExerciseMenu name={exercise.name} onRemove={() => remove(exercise)} />
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="border-t border-border px-4 py-4 text-sm text-muted sm:px-5">{t("empty")}</p>
      )}

      <div className="border-t border-border px-2 py-2 sm:px-3">
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-accent hover:bg-accent-surface"
        >
          <Plus className="size-4" strokeWidth={2.5} aria-hidden />
          {t("add")}
        </button>
      </div>

      <AddExerciseSheet open={picking} onClose={() => setPicking(false)} onPick={(ex) => void add(ex)} />
      <ConfirmSheet
        open={confirming}
        title={t("deleteTitle", { name: template.name })}
        body={t("deleteBody")}
        confirmLabel={t("deleteConfirm")}
        cancelLabel={tCommon("cancel")}
        pending={deleting}
        onConfirm={deleteTemplate}
        onClose={() => setConfirming(false)}
      />
    </section>
  );
}

function MoveButtons({
  index,
  count,
  name,
  onMove,
}: {
  index: number;
  count: number;
  name: string;
  onMove: (index: number, direction: -1 | 1) => void;
}) {
  const t = useTranslations("templateEditor");
  const cls =
    "grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <span className="flex">
      <button type="button" aria-label={t("moveUp", { name })} disabled={index === 0} onClick={() => onMove(index, -1)} className={cls}>
        <ArrowUp className="size-4" strokeWidth={2.25} aria-hidden />
      </button>
      <button
        type="button"
        aria-label={t("moveDown", { name })}
        disabled={index === count - 1}
        onClick={() => onMove(index, 1)}
        className={cls}
      >
        <ArrowDown className="size-4" strokeWidth={2.25} aria-hidden />
      </button>
    </span>
  );
}

function ExerciseMenu({ name, onRemove }: { name: string; onRemove: () => void }) {
  const t = useTranslations("templateEditor");
  return (
    <ActionMenu
      label={t("exerciseMenu", { name })}
      align="right"
      trigger={<Ellipsis className="size-5" strokeWidth={2} aria-hidden />}
      triggerClassName="grid size-10 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground"
      actions={[{ label: t("remove"), tone: "danger", onSelect: onRemove }]}
    />
  );
}

/** Pole celu: zapis po Enter lub wyjściu z pola; błędna wartość wraca do poprzedniej. */
function TargetInput({
  field,
  value,
  exerciseName,
  onCommit,
  onInvalid,
}: {
  field: TargetField;
  value: number | null;
  exerciseName: string;
  onCommit: (value: number | null) => void;
  onInvalid: () => void;
}) {
  const t = useTranslations("templateEditor");
  const format = useFormatter();
  const shown = value === null ? "" : format.number(value, { maximumFractionDigits: 2, useGrouping: false });
  const [draft, setDraft] = useState(shown);
  const label = t(`col.${COL[field]}`);

  const commit = () => {
    const parsed = parseTarget(field, draft);
    if (parsed === undefined) {
      setDraft(shown);
      onInvalid();
      return;
    }
    if (parsed !== value) onCommit(parsed);
  };

  return (
    <label className="flex flex-col gap-1 sm:block">
      <span className="text-[11px] text-muted sm:sr-only">{label}</span>
      <span className="relative block">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") setDraft(shown);
          }}
          onFocus={(e) => e.currentTarget.select()}
          inputMode={field === "targetWeight" ? "decimal" : "numeric"}
          aria-label={t("field", { field: label, name: exerciseName })}
          placeholder="—"
          className={`h-11 w-full rounded-lg bg-surface-muted text-center text-base font-semibold sm:text-[15px] tabular-nums outline-none placeholder:font-normal placeholder:text-muted focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-accent sm:h-10 ${
            field === "restSeconds" && draft ? "pr-4" : ""
          }`}
        />
        {field === "restSeconds" && draft ? (
          <span aria-hidden className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted">
            {t("restUnit")}
          </span>
        ) : null}
      </span>
    </label>
  );
}
