import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/api/extra-types";
import { loadAdminCatalog } from "@/lib/admin/load";
import { AdminExercisesView } from "@/components/admin/admin-exercises-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.adminExercises");
  return { title: t("title") };
}

function parseGroup(value: unknown): MuscleGroup | null {
  return MUSCLE_GROUPS.includes(value as MuscleGroup) ? (value as MuscleGroup) : null;
}

export default async function Page(props: PageProps<"/admin/exercises">) {
  const { group } = await props.searchParams;
  const items = await loadAdminCatalog();
  const selected = parseGroup(group);
  // Filtr po zmianie grupy zaczyna z pustą wyszukiwarką.
  return <AdminExercisesView key={selected ?? "all"} items={items} group={selected} />;
}
