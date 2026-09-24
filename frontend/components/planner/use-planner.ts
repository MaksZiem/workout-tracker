"use client";

import { useCallback, useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clientApi } from "@/lib/api/client";
import { unwrap } from "@/lib/api/errors";
import type { ScheduledWorkoutStatus } from "@/lib/api/extra-types";
import type { Toast } from "@/components/ui/toast";
import type { PlannerEntry } from "@/lib/planner/model";

type Patch = { id: number; status?: ScheduledWorkoutStatus; date?: string };

const UNDO_WINDOW = 5000;

export type PlannerMessages = {
  error: string;
  removed: string;
};

/**
 * Stan planera: dane z serwera + optymistyczne zmiany (status, data) i ukryte
 * wpisy czekające na usunięcie (cofnięcie przez 5 s). Po każdej zapisanej
 * zmianie odświeżamy dane serwera (router.refresh).
 */
export function usePlanner(serverEntries: PlannerEntry[], messages: PlannerMessages) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [entries, applyPatch] = useOptimistic(serverEntries, (state, patch: Patch) =>
    state.map((e) => (e.id === patch.id ? { ...e, ...patch } : e)),
  );
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<Toast | null>(null);
  const toastSeq = useRef(0);

  const showToast = useCallback((t: Omit<Toast, "id">) => {
    toastSeq.current += 1;
    setToast({ ...t, id: toastSeq.current });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  const patch = useCallback(
    (p: Patch, successMessage?: string) => {
      startTransition(async () => {
        applyPatch(p);
        try {
          await unwrap(
            clientApi.PATCH("/planner/scheduled/{id}", {
              params: { path: { id: p.id } },
              body: { ...(p.status ? { status: p.status } : {}), ...(p.date ? { date: p.date } : {}) },
            }),
          );
          if (successMessage) showToast({ message: successMessage, tone: "default" });
          router.refresh();
        } catch {
          showToast({ message: messages.error, tone: "error" });
        }
      });
    },
    [applyPatch, messages.error, router, showToast],
  );

  const remove = useCallback(
    (id: number) => {
      setHidden((prev) => new Set(prev).add(id));
      let undone = false;
      const commit = setTimeout(async () => {
        if (undone) return;
        try {
          await unwrap(clientApi.DELETE("/planner/scheduled/{id}", { params: { path: { id } } }));
          router.refresh();
        } catch {
          setHidden((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          showToast({ message: messages.error, tone: "error" });
        }
      }, UNDO_WINDOW);
      showToast({
        message: messages.removed,
        tone: "default",
        undo: () => {
          undone = true;
          clearTimeout(commit);
          setHidden((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        },
      });
    },
    [messages.error, messages.removed, router, showToast],
  );

  const refresh = useCallback(() => router.refresh(), [router]);

  return {
    entries: entries.filter((e) => !hidden.has(e.id)),
    patch,
    remove,
    refresh,
    toast,
    showToast,
    dismissToast,
  };
}

export type PlannerApi = ReturnType<typeof usePlanner>;
