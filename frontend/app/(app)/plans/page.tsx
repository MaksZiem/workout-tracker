import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { loadPlans } from "@/lib/plans/load";
import { PlansView } from "@/components/plans/plans-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.plans");
  return { title: t("title") };
}

export default async function PlansPage() {
  const plans = await loadPlans();
  return <PlansView plans={plans} />;
}
