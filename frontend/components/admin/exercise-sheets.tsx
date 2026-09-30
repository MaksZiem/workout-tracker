"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { clientApi } from "@/lib/api/client";
import { ApiError, unwrap } from "@/lib/api/errors";
import { MUSCLE_GROUPS, type ExerciseUsage, type MuscleGroup } from "@/lib/api/extra-types";
import type { AdminExercise } from "@/lib/admin/load";
import type { Toast } from "@/components/ui/toast";
import { Sheet } from "@/components/ui/sheet";

type ShowToast = (toast: Omit<Toast, "id">) => void;

/** Dodawanie i edycja ćwiczenia: nazwa i grupa mięśniowa. Embedding liczy backend. */
export function ExerciseSheet({
  exercise,
  defaultGroup,
  onClose,
  onToast,
}: {
  exercise: AdminExercise | null;
  defaultGroup: MuscleGroup | null;
  onClose: () => void;
  onToast: ShowToast;
}) {
  const t = useTranslations("pages.adminExercises.sheet");
  const tToast = useTranslations("pages.adminExercises.toast");
  const tGroup = useTranslations("enums.muscleGroup");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const [name, setName] = useState(exercise?.name ?? "");
  const [group, setGroup] = useState<MuscleGroup | null>(exercise?.muscleGroup ?? defaultGroup);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<"duplicate" | "error" | null>(null);

  const trimmed = name.trim();
  const changed = !exercise || trimmed !== exercise.name || group !== exercise.muscleGroup;
  const ready = Boolean(trimmed && group && changed);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || !group || pending) return;
    setPending(true);
    setError(null);
    try {
      const body = { name: trimmed, muscleGroup: group };
      const saved = exercise
        ? await unwrap(clientApi.PATCH("/exercise/{id}", { params: { path: { id: exercise.id } }, body }))
        : await unwrap(clientApi.POST("/exercise", { body }));
      onToast({
        message: saved.hasEmbedding ? tToast(exercise ? "saved" : "created", { name: saved.name }) : tToast("noEmbedding", { name: saved.name }),
        tone: "default",
      });
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? "duplicate" : "error");
      setPending(false);
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      locked={pending}
      title={exercise ? t("editTitle") : t("addTitle")}
      closeLabel={tNav("close")}
      footer={
        <div>
          {pending ? (
            <p role="status" className="mb-3 text-sm text-muted">
              {t("saving")}
            </p>
          ) : null}
          <button
            type="submit"
            form="exercise-form"
            disabled={!ready || pending}
            className="h-12 w-full rounded-lg bg-accent text-[15px] font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {pending ? t("saving") : exercise ? t("save") : t("create")}
          </button>
        </div>
      }
    >
      <form id="exercise-form" onSubmit={submit} className="flex flex-col gap-6">
        <p className="text-sm text-muted">{exercise ? t("editHint") : t("addHint")}</p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="exercise-name" className="text-sm font-medium">
            {t("name")}
          </label>
          <input
            id="exercise-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error === "duplicate") setError(null);
            }}
            placeholder={t("namePlaceholder")}
            autoFocus={!exercise}
            autoComplete="off"
            aria-invalid={error === "duplicate"}
            aria-describedby={error === "duplicate" ? "exercise-name-error" : undefined}
            className={`h-11 rounded-lg border bg-surface-muted px-3 text-[15px] outline-none placeholder:text-muted focus-visible:border-accent ${
              error === "duplicate" ? "border-danger" : "border-border"
            }`}
          />
          {error === "duplicate" ? (
            <p id="exercise-name-error" className="text-[13px] text-danger">
              {t("duplicate")}
            </p>
          ) : null}
        </div>

        <fieldset>
          <legend className="text-sm font-medium">{t("group")}</legend>
          {/* Segmented control zawinięty do dwóch kolumn, jak cel w arkuszu AI. */}
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-surface-muted p-1">
            {MUSCLE_GROUPS.map((g) => (
              <label
                key={g}
                className={`flex h-10 cursor-pointer items-center justify-center rounded-md px-3 text-sm font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-accent ${
                  group === g ? "bg-surface text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                <input type="radio" name="muscleGroup" value={g} checked={group === g} onChange={() => setGroup(g)} className="sr-only" />
                {tGroup(g)}
              </label>
            ))}
          </div>
        </fieldset>

        {error === "error" ? (
          <p role="alert" className="rounded-lg bg-danger-surface px-3 py-2.5 text-sm text-danger">
            {t("error")}
          </p>
        ) : null}
      </form>
    </Sheet>
  );
}

type Usage = { state: "loading" } | { state: "ready"; usage: ExerciseUsage } | { state: "error" };

/**
 * Usuwanie z wyprzedzeniem: arkusz najpierw sprawdza, gdzie ćwiczenie jest używane.
 * Używanego nie da się usunąć (historia zostaje), więc zamiast czerwonego przycisku jest „Zmień nazwę”.
 */
export function DeleteExerciseSheet({
  exercise,
  onClose,
  onRename,
  onToast,
}: {
  exercise: AdminExercise;
  onClose: () => void;
  onRename: () => void;
  onToast: ShowToast;
}) {
  const t = useTranslations("pages.adminExercises.deleteSheet");
  const tPage = useTranslations("pages.adminExercises");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const [usage, setUsage] = useState<Usage>({ state: "loading" });
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    unwrap(clientApi.GET("/exercise/{id}/usage", { params: { path: { id: exercise.id } } }))
      .then((data) => active && setUsage({ state: "ready", usage: data }))
      .catch(() => active && setUsage({ state: "error" }));
    return () => {
      active = false;
    };
  }, [exercise.id]);

  const used = usage.state === "ready" && (usage.usage.workoutCount > 0 || usage.usage.templateCount > 0);

  const remove = async () => {
    if (pending) return;
    setPending(true);
    try {
      await unwrap(clientApi.DELETE("/exercise/{id}", { params: { path: { id: exercise.id } } }));
      onToast({ message: tPage("toast.deleted", { name: exercise.name }), tone: "default" });
      router.refresh();
      onClose();
    } catch (err) {
      setPending(false);
      if (err instanceof ApiError && err.status === 409) {
        // Ktoś zdążył użyć ćwiczenia: pokaż aktualne liczniki zamiast błędu.
        const fresh = await clientApi.GET("/exercise/{id}/usage", { params: { path: { id: exercise.id } } }).catch(() => null);
        setUsage(fresh?.data ? { state: "ready", usage: fresh.data } : { state: "error" });
        return;
      }
      onClose();
      onToast({ message: tPage("toast.deleteError"), tone: "error" });
    }
  };

  const outline =
    "flex h-12 items-center justify-center rounded-lg border border-border px-5 text-[15px] font-semibold hover:bg-surface-muted";

  let body: React.ReactNode;
  let action: React.ReactNode = null;
  if (usage.state === "loading") {
    body = (
      <p role="status" className="text-sm text-muted">
        {t("checking")}
      </p>
    );
  } else if (usage.state === "error") {
    body = (
      <p role="alert" className="rounded-lg bg-danger-surface px-3 py-2.5 text-sm text-danger">
        {t("error")}
      </p>
    );
  } else if (used) {
    body = (
      <p className="text-sm text-muted">
        {t("blockedBody", {
          workouts: t("workouts", { count: usage.usage.workoutCount }),
          templates: t("templates", { count: usage.usage.templateCount }),
        })}
      </p>
    );
    action = (
      <button
        type="button"
        onClick={onRename}
        className="flex h-12 items-center justify-center rounded-lg bg-accent px-5 text-[15px] font-semibold text-accent-foreground hover:opacity-90"
      >
        {t("rename")}
      </button>
    );
  } else {
    body = <p className="text-sm text-muted">{t("body")}</p>;
    action = (
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="flex h-12 items-center justify-center rounded-lg bg-danger px-5 text-[15px] font-semibold text-danger-foreground hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? t("deleting") : t("confirm")}
      </button>
    );
  }

  return (
    <Sheet
      open
      onClose={onClose}
      locked={pending}
      // Dopóki nie wiadomo, czy da się usunąć, tytuł tylko nazywa ćwiczenie.
      title={
        usage.state !== "ready"
          ? exercise.name
          : used
            ? t("blockedTitle", { name: exercise.name })
            : t("title", { name: exercise.name })
      }
      closeLabel={tNav("close")}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={pending} className={outline}>
            {used ? t("close") : tPage("cancel")}
          </button>
          {action}
        </div>
      }
    >
      {body}
    </Sheet>
  );
}
