"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { clientApi } from "@/lib/api/client";
import { unwrap } from "@/lib/api/errors";
import type { Workout } from "@/lib/api/extra-types";
import { Sheet } from "@/components/ui/sheet";

export function ParseSheet({
  open,
  onClose,
  workoutId,
  onParsed,
}: {
  open: boolean;
  onClose: () => void;
  workoutId: number;
  onParsed: (workout: Workout) => void;
}) {
  const t = useTranslations("pages.log.ai");
  const tNav = useTranslations("nav");
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const submit = async () => {
    if (!text.trim() || pending) return;
    setPending(true);
    setError(false);
    try {
      const workout = await unwrap(
        clientApi.POST("/ai/parse-workout", { body: { workoutId, text: text.trim() } }),
      );
      setText("");
      onParsed(workout);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("title")}
      closeLabel={tNav("close")}
      footer={
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim() || pending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent text-[15px] font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Sparkles className="size-4" strokeWidth={2} aria-hidden />
          {pending ? t("pending") : t("submit")}
        </button>
      }
    >
      <p id="parse-hint" className="text-sm text-muted">
        {t("hint")}
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label={t("title")}
        aria-describedby="parse-hint"
        placeholder={t("placeholder")}
        rows={5}
        className="mt-3 w-full resize-none rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-[15px] outline-none placeholder:text-muted focus-visible:border-accent"
      />
      {error ? (
        <p role="alert" className="mt-2 rounded-lg bg-danger-surface px-3 py-2.5 text-sm text-danger">
          {t("error")}
        </p>
      ) : null}
    </Sheet>
  );
}
