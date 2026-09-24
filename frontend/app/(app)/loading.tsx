import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("common");

  return (
    <div role="status" aria-live="polite" className="animate-pulse">
      <span className="sr-only">{t("loading")}</span>
      <div className="h-8 w-48 rounded-md bg-surface-muted" />
      <div className="mt-3 h-4 w-full max-w-md rounded bg-surface-muted" />
      <div className="mt-8 h-40 rounded-lg bg-surface-muted" />
    </div>
  );
}
