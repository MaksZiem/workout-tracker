"use client";

import { useTranslations } from "next-intl";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations();

  return (
    <div role="alert" className="max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">{t("errors.title")}</h1>
      <p className="mt-2 text-muted">{t("errors.description")}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
      >
        {t("common.retry")}
      </button>
    </div>
  );
}
