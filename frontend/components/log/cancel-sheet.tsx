"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";

/**
 * Potwierdzenie przerwania treningu w trakcie. Po sukcesie wraca na pulpit,
 * gdzie zaplanowany trening znów czeka na „Rozpocznij”.
 */
export function CancelWorkoutSheet({
  open,
  sets,
  onClose,
  onCancel,
  onError,
}: {
  open: boolean;
  /** Liczba serii, które znikną razem z treningiem. */
  sets: number;
  onClose: () => void;
  onCancel: () => Promise<unknown>;
  onError: (message: string) => void;
}) {
  const t = useTranslations("pages.log.cancel");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const confirm = async () => {
    setPending(true);
    try {
      await onCancel();
      router.push("/");
      router.refresh();
    } catch {
      setPending(false);
      onClose();
      onError(t("error"));
    }
  };

  return (
    <ConfirmSheet
      open={open}
      title={t("title")}
      body={t("body", { sets })}
      confirmLabel={t("confirm")}
      cancelLabel={t("keep")}
      pending={pending}
      onConfirm={confirm}
      onClose={onClose}
    />
  );
}
