"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { clientApi } from "@/lib/api/client";
import { ApiError, unwrap } from "@/lib/api/errors";
import type { Exercise, MuscleGroup, Workout } from "@/lib/api/extra-types";
import {
  baselineFrom,
  personalRecords,
  previousFrom,
  roundWeight,
  type LogExercise,
  type LogSet,
  type LogWorkout,
  type PrKind,
  type SyncStatus,
} from "./model";

// ---------------------------------------------------------------------------
// Stan
// ---------------------------------------------------------------------------

type Action =
  | { type: "patchSet"; exKey: string; setKey: string; patch: Partial<LogSet> }
  | { type: "cascadeWeight"; exKey: string; fromSetKey: string; weight: number }
  | { type: "addSet"; exKey: string; set: LogSet }
  | { type: "removeSet"; exKey: string; setKey: string }
  | { type: "restoreSet"; exKey: string; set: LogSet; index: number }
  | { type: "addExercise"; exercise: LogExercise }
  | { type: "patchExercise"; exKey: string; patch: Partial<LogExercise> }
  | { type: "removeExercise"; exKey: string }
  | { type: "restoreExercise"; exercise: LogExercise; index: number };

function mapExercise(state: LogExercise[], exKey: string, fn: (ex: LogExercise) => LogExercise) {
  return state.map((ex) => (ex.key === exKey ? fn(ex) : ex));
}

function reducer(state: LogExercise[], action: Action): LogExercise[] {
  switch (action.type) {
    case "patchSet":
      return mapExercise(state, action.exKey, (ex) => ({
        ...ex,
        sets: ex.sets.map((s) => (s.key === action.setKey ? { ...s, ...action.patch } : s)),
      }));
    case "cascadeWeight":
      return mapExercise(state, action.exKey, (ex) => {
        const from = ex.sets.findIndex((s) => s.key === action.fromSetKey);
        return {
          ...ex,
          sets: ex.sets.map((s, i) =>
            i > from && !s.completed && !s.touched ? { ...s, weight: action.weight } : s,
          ),
        };
      });
    case "addSet":
      return mapExercise(state, action.exKey, (ex) => ({ ...ex, sets: [...ex.sets, action.set] }));
    case "removeSet":
      return mapExercise(state, action.exKey, (ex) => ({
        ...ex,
        sets: ex.sets.filter((s) => s.key !== action.setKey),
      }));
    case "restoreSet":
      return mapExercise(state, action.exKey, (ex) => {
        const sets = [...ex.sets];
        sets.splice(action.index, 0, action.set);
        return { ...ex, sets };
      });
    case "addExercise":
      return [...state, action.exercise];
    case "patchExercise":
      return mapExercise(state, action.exKey, (ex) => ({ ...ex, ...action.patch }));
    case "removeExercise":
      return state.filter((ex) => ex.key !== action.exKey);
    case "restoreExercise": {
      const next = [...state];
      next.splice(action.index, 0, action.exercise);
      return next;
    }
  }
}

// ---------------------------------------------------------------------------
// Synchronizacja: optymistycznie, kolejka per ćwiczenie, ponawianie przy braku sieci
// ---------------------------------------------------------------------------

function isTransient(error: unknown) {
  if (error instanceof ApiError) return error.status >= 500 || error.status === 408 || error.status === 429;
  return true; // TypeError z fetch = brak sieci
}

function waitForRetry(attempt: number) {
  const delay = Math.min(1000 * 2 ** attempt, 15000);
  return new Promise<void>((resolve) => {
    const timer = setTimeout(done, delay);
    function done() {
      clearTimeout(timer);
      window.removeEventListener("online", done);
      resolve();
    }
    window.addEventListener("online", done);
  });
}

let keySeq = 0;
const newKey = (prefix: string) => `${prefix}-new-${Date.now()}-${keySeq++}`;

import type { Toast } from "@/components/ui/toast";
export type { Toast };

export type LogMessages = {
  setRemoved: string;
  exerciseRemoved: string;
  offline: string;
  pr: (kind: PrKind, value: number) => string;
};

const UNDO_WINDOW = 5000;
const SAVE_DEBOUNCE = 500;

export function useWorkoutLog(initial: LogWorkout, messages: LogMessages) {
  const workoutId = initial.id;
  const [exercises, dispatch] = useReducer(reducer, initial.exercises);
  const [toast, setToast] = useState<Toast | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const stateRef = useRef(exercises);
  useEffect(() => {
    stateRef.current = exercises;
  }, [exercises]);

  /** klucz klienta → id w backendzie; aktualizowane synchronicznie po utworzeniu. */
  const ids = useRef(new Map<string, number>());
  useEffect(() => {
    for (const ex of initial.exercises) {
      if (ex.id) ids.current.set(ex.key, ex.id);
      for (const s of ex.sets) if (s.id) ids.current.set(s.key, s.id);
    }
  }, [initial.exercises]);

  const chains = useRef(new Map<string, Promise<void>>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const retries = useRef(new Map<string, () => void>());
  const toastSeq = useRef(0);

  const dismissToast = useCallback(() => setToast(null), []);

  const showToast = useCallback((t: Omit<Toast, "id">) => {
    toastSeq.current += 1;
    setToast({ ...t, id: toastSeq.current });
  }, []);

  const findSet = (exKey: string, setKey: string) =>
    stateRef.current.find((e) => e.key === exKey)?.sets.find((s) => s.key === setKey);

  type Enqueue = (exKey: string, entityKey: string, op: () => Promise<void>, onStatus: (s: SyncStatus) => void) => Promise<void>;
  const enqueueRef = useRef<Enqueue | null>(null);

  /** Dodaje operację na koniec kolejki ćwiczenia, z ponawianiem przy braku sieci. */
  const enqueue = useCallback<Enqueue>(
    (exKey: string, entityKey: string, op: () => Promise<void>, onStatus: (s: SyncStatus) => void) => {
      const run = async () => {
        setPendingCount((n) => n + 1);
        for (let attempt = 0; ; attempt++) {
          try {
            await op();
            onStatus("saved");
            retries.current.delete(entityKey);
            break;
          } catch (error) {
            if (!isTransient(error)) {
              onStatus("failed");
              retries.current.set(entityKey, () => enqueueRef.current?.(exKey, entityKey, op, onStatus));
              break;
            }
            onStatus("pending");
            if (attempt === 0 && !navigator.onLine) {
              showToast({ message: messages.offline, tone: "default" });
            }
            await waitForRetry(attempt);
          }
        }
        setPendingCount((n) => n - 1);
      };
      const next = (chains.current.get(exKey) ?? Promise.resolve()).then(run);
      chains.current.set(exKey, next);
      return next;
    },
    [messages.offline, showToast],
  );
  useEffect(() => {
    enqueueRef.current = enqueue;
  }, [enqueue]);

  const setStatus = (exKey: string, setKey: string) => (status: SyncStatus) =>
    dispatch({ type: "patchSet", exKey, setKey, patch: { status } });

  /** Zapisuje pełny bieżący stan serii (idempotentnie). */
  const saveSet = useCallback(
    (exKey: string, setKey: string) => {
      const timer = timers.current.get(setKey);
      if (timer) clearTimeout(timer);
      timers.current.delete(setKey);
      enqueue(
        exKey,
        setKey,
        async () => {
          const set = findSet(exKey, setKey);
          const weId = ids.current.get(exKey);
          const setId = ids.current.get(setKey);
          if (!set || !weId || !setId) return; // usunięta w międzyczasie
          await unwrap(
            clientApi.PATCH("/workout/{workoutId}/exercise/{weId}/set/{setId}", {
              params: { path: { workoutId, weId, setId } },
              body: { weight: set.weight, reps: set.reps, completed: set.completed },
            }),
          );
        },
        setStatus(exKey, setKey),
      );
    },
    [enqueue, workoutId],
  );

  const scheduleSave = useCallback(
    (exKey: string, setKey: string) => {
      const existing = timers.current.get(setKey);
      if (existing) clearTimeout(existing);
      timers.current.set(
        setKey,
        setTimeout(() => saveSet(exKey, setKey), SAVE_DEBOUNCE),
      );
    },
    [saveSet],
  );

  // --- operacje na seriach -------------------------------------------------

  const updateWeight = useCallback(
    (exKey: string, setKey: string, weight: number) => {
      const value = roundWeight(weight);
      dispatch({ type: "patchSet", exKey, setKey, patch: { weight: value, touched: true } });
      dispatch({ type: "cascadeWeight", exKey, fromSetKey: setKey, weight: value });
      scheduleSave(exKey, setKey);
      const ex = stateRef.current.find((e) => e.key === exKey);
      const from = ex?.sets.findIndex((s) => s.key === setKey) ?? -1;
      ex?.sets.forEach((s, i) => {
        if (i > from && !s.completed && !s.touched && s.weight !== value) scheduleSave(exKey, s.key);
      });
    },
    [scheduleSave],
  );

  const updateReps = useCallback(
    (exKey: string, setKey: string, reps: number) => {
      dispatch({ type: "patchSet", exKey, setKey, patch: { reps: Math.max(0, Math.round(reps)) } });
      scheduleSave(exKey, setKey);
    },
    [scheduleSave],
  );

  const toggleDone = useCallback(
    (exKey: string, setKey: string) => {
      const ex = stateRef.current.find((e) => e.key === exKey);
      const set = ex?.sets.find((s) => s.key === setKey);
      if (!ex || !set) return;
      const completed = !set.completed;
      dispatch({ type: "patchSet", exKey, setKey, patch: { completed } });
      stateRef.current = reducer(stateRef.current, {
        type: "patchSet",
        exKey,
        setKey,
        patch: { completed },
      });
      saveSet(exKey, setKey);

      if (completed) {
        const updated = stateRef.current.find((e) => e.key === exKey)!;
        const kind = personalRecords(updated).get(setKey);
        if (kind) {
          const value = kind === "weight" ? set.weight : Math.round(set.weight * (1 + set.reps / 30) * 10) / 10;
          showToast({ message: messages.pr(kind, value), tone: "pr" });
          navigator.vibrate?.([30, 40, 30]);
        }
      }
    },
    [messages, saveSet, showToast],
  );

  const retry = useCallback((entityKey: string) => {
    retries.current.get(entityKey)?.();
  }, []);

  const addSet = useCallback(
    (exKey: string) => {
      const ex = stateRef.current.find((e) => e.key === exKey);
      if (!ex) return;
      const last = ex.sets.at(-1);
      const prev = ex.previous?.sets[ex.sets.length];
      const set: LogSet = {
        key: newKey("set"),
        setNumber: (last?.setNumber ?? 0) + 1,
        weight: last?.weight ?? prev?.weight ?? 0,
        reps: last?.reps ?? prev?.reps ?? 0,
        restSeconds: last?.restSeconds ?? null,
        completed: false,
        touched: false,
        status: "saved",
      };
      dispatch({ type: "addSet", exKey, set });
      enqueue(
        exKey,
        set.key,
        async () => {
          const weId = ids.current.get(exKey);
          if (!weId) throw new ApiError(409, "Conflict", ["exercise not saved"]);
          const current = findSet(exKey, set.key) ?? set;
          const created = await unwrap(
            clientApi.POST("/workout/{workoutId}/exercise/{weId}/set", {
              params: { path: { workoutId, weId } },
              body: {
                setNumber: current.setNumber,
                weight: current.weight,
                reps: current.reps,
                completed: current.completed,
                ...(current.restSeconds ? { restSeconds: current.restSeconds } : {}),
              },
            }),
          );
          ids.current.set(set.key, created.id);
          dispatch({ type: "patchSet", exKey, setKey: set.key, patch: { id: created.id } });
        },
        setStatus(exKey, set.key),
      );
    },
    [enqueue, workoutId],
  );

  const removeSet = useCallback(
    (exKey: string, setKey: string) => {
      const ex = stateRef.current.find((e) => e.key === exKey);
      const index = ex?.sets.findIndex((s) => s.key === setKey) ?? -1;
      const set = ex?.sets[index];
      if (!ex || !set) return;
      const timer = timers.current.get(setKey);
      if (timer) clearTimeout(timer);
      dispatch({ type: "removeSet", exKey, setKey });

      let undone = false;
      const commit = setTimeout(() => {
        if (undone) return;
        enqueue(
          exKey,
          setKey,
          async () => {
            const weId = ids.current.get(exKey);
            const setId = ids.current.get(setKey);
            if (!weId || !setId) return;
            await unwrap(
              clientApi.DELETE("/workout/{workoutId}/exercise/{weId}/set/{setId}", {
                params: { path: { workoutId, weId, setId } },
              }),
            );
          },
          () => {},
        );
      }, UNDO_WINDOW);

      showToast({
        message: messages.setRemoved,
        tone: "default",
        undo: () => {
          undone = true;
          clearTimeout(commit);
          dispatch({ type: "restoreSet", exKey, set, index });
        },
      });
    },
    [enqueue, messages.setRemoved, showToast, workoutId],
  );

  // --- operacje na ćwiczeniach --------------------------------------------

  const loadHistory = useCallback(
    async (exKey: string, exerciseId: number) => {
      try {
        const points = await unwrap(
          clientApi.GET("/stats/exercise/{exerciseId}/progress", {
            params: { path: { exerciseId } },
          }),
        );
        dispatch({
          type: "patchExercise",
          exKey,
          patch: { previous: previousFrom(points, initial.date), baseline: baselineFrom(points, initial.date) },
        });
      } catch {
        // Brak historii nie blokuje logowania.
      }
    },
    [initial.date],
  );

  const addExercise = useCallback(
    (exercise: Pick<Exercise, "id" | "name" | "muscleGroup">) => {
      const order = Math.max(-1, ...stateRef.current.map((e) => e.order)) + 1;
      const ex: LogExercise = {
        key: newKey("we"),
        order,
        exercise: { id: exercise.id, name: exercise.name, muscleGroup: exercise.muscleGroup as MuscleGroup },
        sets: [],
        previous: null,
        baseline: null,
        status: "saved",
      };
      dispatch({ type: "addExercise", exercise: ex });
      loadHistory(ex.key, exercise.id);
      enqueue(
        ex.key,
        ex.key,
        async () => {
          const created = await unwrap(
            clientApi.POST("/workout/{workoutId}/exercise", {
              params: { path: { workoutId } },
              body: { exerciseId: exercise.id, order },
            }),
          );
          ids.current.set(ex.key, created.id);
          dispatch({ type: "patchExercise", exKey: ex.key, patch: { id: created.id } });
        },
        (status) => dispatch({ type: "patchExercise", exKey: ex.key, patch: { status } }),
      );
      return ex.key;
    },
    [enqueue, loadHistory, workoutId],
  );

  const removeExercise = useCallback(
    (exKey: string) => {
      const index = stateRef.current.findIndex((e) => e.key === exKey);
      const ex = stateRef.current[index];
      if (!ex) return;
      dispatch({ type: "removeExercise", exKey });
      let undone = false;
      const commit = setTimeout(() => {
        if (undone) return;
        enqueue(
          exKey,
          exKey,
          async () => {
            const weId = ids.current.get(exKey);
            if (!weId) return;
            await unwrap(
              clientApi.DELETE("/workout/{workoutId}/exercise/{weId}", {
                params: { path: { workoutId, weId } },
              }),
            );
          },
          () => {},
        );
      }, UNDO_WINDOW);
      showToast({
        message: messages.exerciseRemoved,
        tone: "default",
        undo: () => {
          undone = true;
          clearTimeout(commit);
          dispatch({ type: "restoreExercise", exercise: ex, index });
        },
      });
    },
    [enqueue, messages.exerciseRemoved, showToast, workoutId],
  );

  /** Wynik /ai/parse-workout: dopisuje ćwiczenia i serie, których jeszcze nie znamy. */
  const mergeParsed = useCallback(
    (workout: Workout) => {
      const knownIds = new Set(ids.current.values());
      let added = 0;
      for (const we of [...(workout.exercises ?? [])].sort((a, b) => a.order - b.order)) {
        const newSets = (we.sets ?? []).filter((s) => !knownIds.has(s.id));
        if (!newSets.length && knownIds.has(we.id)) continue;
        const sets: LogSet[] = newSets
          .sort((a, b) => a.setNumber - b.setNumber)
          .map((s) => {
            const key = `set-${s.id}`;
            ids.current.set(key, s.id);
            return {
              key,
              id: s.id,
              setNumber: s.setNumber,
              weight: Number(s.weight),
              reps: s.reps,
              restSeconds: s.restSeconds ?? null,
              completed: s.completed,
              touched: true,
              status: "saved",
            };
          });
        const existing = stateRef.current.find((e) => e.id === we.id);
        if (existing) {
          for (const set of sets) dispatch({ type: "addSet", exKey: existing.key, set });
          continue;
        }
        const key = `we-${we.id}`;
        ids.current.set(key, we.id);
        dispatch({
          type: "addExercise",
          exercise: {
            key,
            id: we.id,
            order: we.order,
            exercise: { id: we.exercise.id, name: we.exercise.name, muscleGroup: we.exercise.muscleGroup as MuscleGroup },
            sets,
            previous: null,
            baseline: null,
            fromAi: true,
            status: "saved",
          },
        });
        loadHistory(key, we.exercise.id);
        added += 1;
      }
      return added;
    },
    [loadHistory],
  );

  /** Kończy trening: opcjonalnie usuwa nieodhaczone serie i czeka na kolejkę. */
  const flush = useCallback(
    async (removeUnchecked: boolean) => {
      for (const [setKey, timer] of timers.current) {
        clearTimeout(timer);
        const ex = stateRef.current.find((e) => e.sets.some((s) => s.key === setKey));
        if (ex) saveSet(ex.key, setKey);
      }
      if (removeUnchecked) {
        for (const ex of stateRef.current) {
          for (const set of ex.sets.filter((s) => !s.completed)) {
            enqueue(
              ex.key,
              set.key,
              async () => {
                const weId = ids.current.get(ex.key);
                const setId = ids.current.get(set.key);
                if (!weId || !setId) return;
                await unwrap(
                  clientApi.DELETE("/workout/{workoutId}/exercise/{weId}/set/{setId}", {
                    params: { path: { workoutId, weId, setId } },
                  }),
                );
              },
              () => {},
            );
          }
        }
      }
      await Promise.all(chains.current.values());
      await unwrap(clientApi.POST("/workout/{id}/finish", { params: { path: { id: workoutId } } }));
    },
    [enqueue, saveSet, workoutId],
  );

  /** Oznacza trening jako zakończony bez czekania na kolejkę zapisów. */
  const finishNow = useCallback(async () => {
    await unwrap(clientApi.POST("/workout/{id}/finish", { params: { path: { id: workoutId } } }));
  }, [workoutId]);

  return {
    finishNow,
    exercises,
    toast,
    dismissToast,
    showToast,
    pendingCount,
    updateWeight,
    updateReps,
    toggleDone,
    addSet,
    removeSet,
    retry,
    addExercise,
    removeExercise,
    mergeParsed,
    flush,
  };
}

export type WorkoutLogApi = ReturnType<typeof useWorkoutLog>;
