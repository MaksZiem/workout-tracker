"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { parseToWorkout, type ParseState } from "@/lib/dashboard/actions";

/** Skrót AI: opis tekstem → dzisiejszy trening do przejrzenia w /log. */
export function AiQuick() {
  const t = useTranslations("pages.dashboard.ai");
  const [state, action, pending] = useActionState<ParseState, FormData>(parseToWorkout, {});

  return (
    <section aria-labelledby="ai" className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <h2 id="ai" className="flex items-center gap-2 text-[17px] font-semibold">
        <Sparkles className="size-4 text-muted" strokeWidth={2} aria-hidden />
        {t("title")}
      </h2>
      <p id="ai-hint" className="mt-1 text-[13px] text-muted">
        {t("hint")}
      </p>
      <form action={action} className="mt-3">
        <textarea
          // Po błędzie tekst wraca do pola, żeby nie trzeba było pisać od nowa.
          key={state.text ?? ""}
          name="text"
          defaultValue={state.text ?? ""}
          aria-label={t("title")}
          aria-describedby="ai-hint"
          aria-invalid={state.error ? true : undefined}
          placeholder={t("placeholder")}
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-[15px] outline-none placeholder:text-muted focus-visible:border-accent"
        />
        {state.error ? (
          <p role="alert" className="mt-2 rounded-lg bg-danger-surface px-3 py-2.5 text-sm text-danger">
            {t(`errors.${state.error}`)}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-surface-muted disabled:opacity-60 sm:w-auto"
        >
          <Sparkles className="size-4" strokeWidth={2} aria-hidden />
          {pending ? t("pending") : t("submit")}
        </button>
      </form>
    </section>
  );
}
