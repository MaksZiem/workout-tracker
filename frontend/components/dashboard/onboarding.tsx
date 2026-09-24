import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";

type Steps = { workout: boolean; plan: boolean; schedule: boolean };

const HREF: Record<keyof Steps, string> = { workout: "/log", plan: "/plans", schedule: "/planner" };

/** Lista „Na start” dla nowego konta. Kroki odhaczają się same na podstawie danych. */
export async function Onboarding({ steps }: { steps: Steps }) {
  const t = await getTranslations("pages.dashboard.onboarding");
  const keys = Object.keys(HREF) as (keyof Steps)[];
  const done = keys.filter((k) => steps[k]).length;
  // Pierwszy nieodhaczony krok prowadzi; reszta czeka.
  const next = keys.find((k) => !steps[k]);

  return (
    <section aria-labelledby="onboarding" className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="onboarding" className="text-[17px] font-semibold">
          {t("title")}
        </h2>
        <span className="text-[13px] text-muted tabular-nums">{t("progress", { done })}</span>
      </div>
      <ol className="mt-3 flex flex-col gap-1">
        {keys.map((key, i) => {
          const isDone = steps[key];
          return (
            <li key={key} className="flex items-start gap-3 rounded-lg py-2 sm:items-center">
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold tabular-nums ${
                  isDone ? "bg-surface-strong text-foreground" : key === next ? "border-2 border-foreground" : "border border-border text-muted"
                }`}
              >
                {isDone ? <Check className="size-4" strokeWidth={3} aria-label={t("doneLabel")} /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[15px] font-medium ${isDone ? "text-muted line-through decoration-1" : ""}`}>{t(`${key}.title`)}</span>
                {!isDone ? <span className="block text-[13px] text-muted">{t(`${key}.body`)}</span> : null}
                {/* Telefon: akcja pod opisem, żeby tekst nie ściskał się obok przycisku. */}
                {key === next ? (
                  <Link
                    href={HREF[key]}
                    className="mt-2 flex h-11 w-fit items-center rounded-lg border border-border px-4 text-sm font-semibold hover:bg-surface-muted sm:hidden"
                  >
                    {t(`${key}.action`)}
                  </Link>
                ) : null}
              </span>
              {/* Akcję ma tylko następny krok; pozostałe czekają na swoją kolej. */}
              {key === next ? (
                <Link
                  href={HREF[key]}
                  className="hidden h-10 shrink-0 items-center rounded-lg border border-border px-3 text-sm font-semibold hover:bg-surface-muted sm:flex"
                >
                  {t(`${key}.action`)}
                </Link>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
