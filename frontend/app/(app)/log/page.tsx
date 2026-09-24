import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Picker } from "@/components/log/picker";
import { WorkoutLogger } from "@/components/log/workout-logger";
import { loadToday, loadWorkout } from "@/lib/log/load";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.log");
  return { title: t("title") };
}

export default async function LogPage(props: PageProps<"/log">) {
  const { workout: workoutParam } = await props.searchParams;
  const workoutId = Number(typeof workoutParam === "string" ? workoutParam : NaN);

  if (Number.isInteger(workoutId) && workoutId > 0) {
    const workout = await loadWorkout(workoutId);
    if (!workout) notFound();
    // key: po przejściu do innego treningu stan klienta zaczyna się od nowa.
    return <WorkoutLogger key={workout.id} workout={workout} />;
  }

  const { planned, started } = await loadToday();

  // Jeden trening dziś i nic więcej w planie: od razu wracamy do niego.
  if (planned.length === 0 && started.length === 1) {
    redirect(`/log?workout=${started[0].id}`);
  }

  return <Picker planned={planned} started={started} />;
}
