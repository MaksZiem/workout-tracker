"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Arkusz na natywnym <dialog>: na telefonie wysuwa się od dołu, na desktopie
 * jest wyśrodkowanym oknem. Fokus, Escape i tło obsługuje przeglądarka.
 */
export function Sheet({
  open,
  onClose,
  title,
  closeLabel,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      aria-label={title}
      className="animate-sheet-in mt-auto mb-0 flex max-h-[88dvh] w-full max-w-none flex-col rounded-t-2xl bg-surface p-0 text-foreground not-open:hidden sm:m-auto sm:max-w-lg sm:rounded-2xl"
    >
      <div className="flex shrink-0 items-center justify-between gap-4 px-5 pt-4 pb-2">
        <h2 className="text-base font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="-mr-2 grid size-10 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground"
        >
          <X className="size-5" strokeWidth={1.75} aria-hidden />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
      {footer ? (
        <div className="shrink-0 border-t border-border px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}
