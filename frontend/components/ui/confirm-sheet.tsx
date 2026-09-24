"use client";

import { useTranslations } from "next-intl";
import { Sheet } from "./sheet";

/** Potwierdzenie nieodwracalnej akcji: tytuł, uczciwy opis skutków, czerwony przycisk. */
export function ConfirmSheet({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  pending = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const tNav = useTranslations("nav");
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      closeLabel={tNav("close")}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 items-center justify-center rounded-lg border border-border px-5 text-[15px] font-semibold hover:bg-surface-muted"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="flex h-12 items-center justify-center rounded-lg bg-danger px-5 text-[15px] font-semibold text-danger-foreground hover:opacity-90 disabled:opacity-60"
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-sm text-muted">{body}</p>
    </Sheet>
  );
}
