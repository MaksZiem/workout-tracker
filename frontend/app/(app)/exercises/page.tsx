import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/api/extra-types";
import { loadCatalog } from "@/lib/exercises/load";
import { ExercisesView } from "@/components/exercises/exercises-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.exercises");
  return { title: t("title") };
}

function parseGroup(value: unknown): MuscleGroup | null {
  return MUSCLE_GROUPS.includes(value as MuscleGroup) ? (value as MuscleGroup) : null;
}

export default async function ExercisesPage(props: PageProps<"/exercises">) {
  const { group } = await props.searchParams;
  const { items, recordsOk } = await loadCatalog();
  const selected = parseGroup(group);
  // Filtr po zmianie grupy zaczyna z pustą wyszukiwarką.
  return <ExercisesView key={selected ?? "all"} items={items} group={selected} recordsOk={recordsOk} />;
}
