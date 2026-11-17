"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";

export function CancelWorkoutSheet({
  open,
  sets,
  onClose,
  onCancel,
  onError,
}: {
  open: boolean;
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
