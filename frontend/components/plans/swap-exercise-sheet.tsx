"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { clientApi } from "@/lib/api/client";
import type { MuscleGroup, SimilarExercise } from "@/lib/api/extra-types";
import { Sheet } from "@/components/ui/sheet";

type Picked = { id: number; name: string; muscleGroup: MuscleGroup };
type State = { kind: "loading" } | { kind: "ready"; items: SimilarExercise[] } | { kind: "unavailable" } | { kind: "error" };

/**
 * Zamiana ćwiczenia na podobne (embedding z Gemini, ta sama grupa mięśniowa).
 * Gdy podobnych brak, prowadzi do pełnego katalogu.
 */
export function SwapExerciseSheet({
  exercise,
  taken,
  onClose,
  onPick,
  onBrowse,
}: {
  exercise: { exerciseId: number; name: string } | null;
  /** Ćwiczenia już obecne w tym dniu: zamiana na nie dałaby duplikat. */
  taken: Set<number>;
  onClose: () => void;
  onPick: (picked: Picked) => void;
  onBrowse: () => void;
}) {
  const t = useTranslations("templateEditor.swap");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const [attempt, setAttempt] = useState(0);
  // Wynik przypisany do (ćwiczenie, próba): inny klucz = wciąż się wczytuje.
  const [result, setResult] = useState<{ key: string; state: State } | null>(null);
  const exerciseId = exercise?.exerciseId;
  const key = `${exerciseId}:${attempt}`;
  const state: State = result?.key === key ? result.state : { kind: "loading" };

  useEffect(() => {
    if (exerciseId === undefined) return;
    let cancelled = false;
    const done = (next: State) => !cancelled && setResult({ key, state: next });
    clientApi
      .GET("/exercise/{id}/similar", { params: { path: { id: exerciseId } } })
      .then(({ data, response }) => {
        if (data) done({ kind: "ready", items: data });
        else done({ kind: response.status === 404 ? "unavailable" : "error" });
      })
      .catch(() => done({ kind: "error" }));
    return () => {
      cancelled = true;
    };
  }, [exerciseId, key]);

  const browse = (
    <button
      type="button"
      onClick={onBrowse}
      className="-ml-3 mt-1 flex h-11 items-center rounded-lg px-3 text-sm font-medium text-accent hover:bg-accent-surface"
    >
      {t("browse")}
    </button>
  );

  return (
    <Sheet
      open={exercise !== null}
      onClose={onClose}
      title={t("title", { name: exercise?.name ?? "" })}
      closeLabel={tNav("close")}
    >
      <p className="text-sm text-muted">{t("hint")}</p>
      <div className="mt-4">
        {state.kind === "loading" ? (
          <p role="status" className="py-4 text-sm text-muted">
            {t("loading")}
          </p>
        ) : state.kind === "error" ? (
          <div className="py-2">
            <p role="alert" className="text-sm text-danger">
              {t("error")}
            </p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="-ml-3 mt-1 flex h-11 items-center rounded-lg px-3 text-sm font-medium text-accent hover:bg-accent-surface"
            >
              {tCommon("retry")}
            </button>
          </div>
        ) : state.kind === "unavailable" || state.items.length === 0 ? (
          <div className="py-2">
            <p className="text-sm text-muted">{state.kind === "unavailable" ? t("unavailable") : t("none")}</p>
            {browse}
          </div>
        ) : (
          <>
            <ul className="-mx-2">
              {state.items.map(({ exercise: candidate, similarity }) => (
                <li key={candidate.id}>
                  <button
                    type="button"
                    disabled={taken.has(candidate.id)}
                    onClick={() =>
                      onPick({ id: candidate.id, name: candidate.name, muscleGroup: candidate.muscleGroup as MuscleGroup })
                    }
                    className="flex min-h-12 w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-surface-muted disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <span className={`min-w-0 flex-1 text-[15px] leading-snug ${taken.has(candidate.id) ? "text-muted" : ""}`}>
                      {candidate.name}
                    </span>
                    <span className="shrink-0 text-[13px] text-muted tabular-nums">
                      {taken.has(candidate.id) ? t("taken") : t("match", { value: Math.round(similarity * 100) })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 border-t border-border pt-2">{browse}</div>
          </>
        )}
      </div>
    </Sheet>
  );
}
