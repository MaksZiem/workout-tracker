import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { loadPlan } from "@/lib/plans/load";
import { PlanEditor } from "@/components/plans/plan-editor";

type Props = PageProps<"/plans/[id]">;

async function planId(props: Props) {
  const { id } = await props.params;
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const id = await planId(props);
  const plan = id ? await loadPlan(id) : null;
  const t = await getTranslations("pages.plans");
  return { title: plan?.name ?? t("title") };
}

export default async function PlanPage(props: Props) {
  const id = await planId(props);
  if (id === null) notFound();
  const plan = await loadPlan(id);
  if (!plan) notFound();
  const { ai } = await props.searchParams;

  // key: po odświeżeniu danych z serwera stan edytora zaczyna od nowa.
  return <PlanEditor key={plan.id} plan={plan} fromAi={ai === "1"} />;
}
