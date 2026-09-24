import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { displayDate } from "@/lib/planner/dates";
import { requireUser } from "@/lib/auth/session";
import { MUSCLE_GROUPS } from "@/lib/api/extra-types";
import { loadDashboard } from "@/lib/dashboard/load";
import { localDate } from "@/lib/log/model";
import { SectionError } from "@/components/stats/section";
import { TodayCard } from "@/components/dashboard/today-card";
import { WeekStrip } from "@/components/dashboard/week-strip";
import { AiQuick } from "@/components/dashboard/ai-quick";
import { RecentWorkouts } from "@/components/dashboard/recent-workouts";
import { FreshRecords } from "@/components/dashboard/fresh-records";
import { Onboarding } from "@/components/dashboard/onboarding";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.dashboard");
  return { title: t("title") };
}

export default async function DashboardPage() {
  const t = await getTranslations("pages.dashboard");
  const tGroup = await getTranslations("enums.muscleGroup");
  const format = await getFormatter();
  const user = await requireUser();
  const today = localDate();
  const data = await loadDashboard(today);

  const groupNames = Object.fromEntries(MUSCLE_GROUPS.map((g) => [g, tGroup(g)]));
  const steps = data.onboarding;
  const onboarding = !(steps.workout && steps.plan && steps.schedule);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("greeting", { name: user.name })}</h1>
        <p className="mt-1 text-sm text-muted first-letter:uppercase">
          {format.dateTime(displayDate(today), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:gap-4">
        {data.today.ok ? <TodayCard items={data.today.data} today={today} groupNames={groupNames} /> : <SectionError retryHref="/" />}
        {onboarding ? <Onboarding steps={steps} /> : null}
        {data.week.ok ? (
          <WeekStrip entries={data.week.data} trained={data.weekTrained} today={today} streak={data.streak} />
        ) : (
          <SectionError retryHref="/" />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <div className="flex flex-col gap-6 sm:gap-8">
          {data.recent.ok ? <RecentWorkouts workouts={data.recent.data} /> : <SectionError retryHref="/" />}
        </div>
        <div className="flex flex-col gap-6 sm:gap-8">
          <AiQuick />
          {data.records.ok ? <FreshRecords records={data.records.data} hasHistory={steps.workout} /> : <SectionError retryHref="/" />}
        </div>
      </div>
    </div>
  );
}
