import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PlannerView } from "@/components/planner/planner-view";
import { localDate } from "@/lib/log/model";
import { isIsoDate, visibleRange, type PlannerView as View } from "@/lib/planner/dates";
import { loadPlanner } from "@/lib/planner/load";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.planner");
  return { title: t("title") };
}

export default async function PlannerPage(props: PageProps<"/planner">) {
  const searchParams = await props.searchParams;
  const view: View = searchParams.view === "month" ? "month" : "week";
  const today = localDate();
  const anchor = isIsoDate(searchParams.date) ? searchParams.date : today;
  const { from, to } = visibleRange(view, anchor);

  const { entries, templates, plans } = await loadPlanner(from, to);

  return (
    <PlannerView
      // Nowy zakres = świeży stan klienta (np. wybrany dzień w miesiącu).
      key={`${view}-${from}`}
      view={view}
      anchor={anchor}
      from={from}
      to={to}
      today={today}
      entries={entries}
      templates={templates}
      plans={plans}
    />
  );
}
