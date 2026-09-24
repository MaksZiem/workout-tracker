"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type MenuAction = { label: string; onSelect: () => void; tone?: "danger" };

/** Mały rozwijany popover z akcjami. Zamyka się po kliknięciu obok i po Escape. */
export function ActionMenu({
  label,
  trigger,
  triggerClassName,
  align = "left",
  actions,
}: {
  label: string;
  trigger: ReactNode;
  triggerClassName: string;
  align?: "left" | "right";
  actions: MenuAction[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open ? (
        <div
          role="menu"
          className={`absolute top-full z-20 mt-1 min-w-44 rounded-lg border border-border bg-surface p-1 shadow-[0_8px_24px_-8px_oklch(0_0_0/0.35)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                action.onSelect();
              }}
              className={`flex w-full items-center rounded-md px-3 py-2.5 text-left text-sm ${
                action.tone === "danger" ? "text-danger hover:bg-danger-surface" : "hover:bg-surface-muted"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
