import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";
import { serverApi } from "@/lib/api/server";
import { requireUser } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.dashboard");
  return { title: t("title") };
}

export default async function DashboardPage() {
  const t = await getTranslations("pages.dashboard");
  const user = await requireUser();

  // Przykład typowanego zapytania: `summary` ma typ StatsSummary
  // (nadpisanie z lib/api/extra-types.ts, bo w OpenAPI jest `unknown`).
  const api = await serverApi();
  const { data: summary } = await api.GET("/stats/summary");

  return (
    <>
      <PageHeader title={t("greeting", { name: user.name })} description={t("description")} />
      <p className="mb-6 text-sm tabular-nums">
        {summary
          ? t("summary", { streak: summary.currentStreak, total: summary.totalWorkouts })
          : t("summaryUnavailable")}
      </p>
      <Placeholder
        endpoints={["GET /planner/today", "GET /stats/summary", "GET /stats/streak"]}
      />
    </>
  );
}
