import { getTranslations } from "next-intl/server";
import { CalendarCheck, Flame } from "lucide-react";

/**
 * Passy na pulpicie (jak w Duolingo): tygodnie z rzędu z treningiem i zaplanowane treningi
 * wykonane bez opuszczenia. Pokazujemy tylko te, które trwają. Ogień gaśnie (szary),
 * gdy w tym tygodniu jeszcze nie było treningu, czyli passa jest do uratowania.
 */
export async function Streaks({ weeks, plan, weekAtRisk }: { weeks: number | null; plan: number | null; weekAtRisk: boolean }) {
  const t = await getTranslations("pages.dashboard.streak");
  const items = [
    weeks
      ? {
          key: "weeks",
          value: weeks,
          label: t("weeks", { count: weeks }),
          hint: weekAtRisk ? t("weeksAtRisk") : t("weeksHint"),
          icon: <Flame className={`size-6 ${weekAtRisk ? "text-muted" : "fill-pr text-pr"}`} strokeWidth={2} aria-hidden />,
        }
      : null,
    plan
      ? {
          key: "plan",
          value: plan,
          label: t("plan", { count: plan }),
          hint: t("planHint"),
          icon: <CalendarCheck className="size-6 text-success" strokeWidth={2} aria-hidden />,
        }
      : null,
  ].filter((item) => item !== null);

  if (!items.length) return null;

  return (
    <ul aria-label={t("label")} className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item.key}
          title={item.hint}
          className="flex items-center gap-2.5 rounded-xl border border-border bg-surface py-2 pr-4 pl-3"
        >
          {item.icon}
          <span className="flex flex-col">
            <span className="text-xl leading-6 font-semibold tabular-nums">{item.value}</span>
            <span className="text-[11px] leading-4 text-muted">{item.label}</span>
          </span>
          <span className="sr-only">. {item.hint}</span>
        </li>
      ))}
    </ul>
  );
}
