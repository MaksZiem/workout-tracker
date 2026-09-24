import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

export function StatsSection({
  id,
  title,
  hint,
  aside,
  children,
  className = "",
}: {
  id: string;
  title: string;
  hint?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={className}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <h2 id={id} className="text-[17px] font-semibold leading-snug">
            {title}
          </h2>
          {hint ? <p className="mt-0.5 text-[13px] text-muted">{hint}</p> : null}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Błąd jednej sekcji: reszta strony działa dalej. */
export async function SectionError({ retryHref }: { retryHref: string }) {
  const t = await getTranslations("pages.stats");
  return (
    <p role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-danger-surface px-4 py-3 text-sm text-danger">
      {t("sectionError")}
      <Link href={retryHref} className="font-medium underline">
        {t("retry")}
      </Link>
    </p>
  );
}
