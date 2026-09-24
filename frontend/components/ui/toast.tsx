"use client";

import { useEffect } from "react";
import { Trophy } from "lucide-react";
export type Toast = { id: number; message: string; tone: "default" | "pr" | "error"; undo?: () => void };

const DURATION = 5000;

/** Jeden komunikat naraz, nad dolną nawigacją na telefonie. */
export function ToastView({ toast, onDismiss, undoLabel }: { toast: Toast | null; onDismiss: () => void; undoLabel: string }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, DURATION);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 md:bottom-6 md:pl-64"
    >
      {toast ? (
        <div
          key={toast.id}
          role="status"
          className={`animate-sheet-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-[0_12px_32px_-12px_oklch(0_0_0/0.5)] ${
            toast.tone === "pr"
              ? "bg-pr text-pr-foreground"
              : toast.tone === "error"
                ? "bg-danger text-white"
                : "bg-foreground text-background"
          }`}
        >
          {toast.tone === "pr" ? <Trophy className="animate-pr-in size-5 shrink-0" strokeWidth={2.25} aria-hidden /> : null}
          <span className="flex-1">{toast.message}</span>
          {toast.undo ? (
            <button
              type="button"
              onClick={() => {
                toast.undo?.();
                onDismiss();
              }}
              className="-my-1 rounded-md px-2 py-1 font-semibold underline underline-offset-2"
            >
              {undoLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
