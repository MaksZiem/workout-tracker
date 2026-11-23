import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Picker } from "@/components/log/picker";
import { WorkoutLogger } from "@/components/log/workout-logger";
import { loadToday, loadWorkout } from "@/lib/log/load";
import { parseId } from "@/lib/ids";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.log");
  return { title: t("title") };
}

export default async function LogPage(props: PageProps<"/log">) {
  const { workout: workoutParam } = await props.searchParams;
  const workoutId = parseId(workoutParam);

  if (workoutId) {
    const workout = await loadWorkout(workoutId);
    if (!workout) notFound();
    return <WorkoutLogger key={workout.id} workout={workout} />;
  }

  const { planned, started } = await loadToday();

  if (planned.length === 0 && started.length === 1) {
    redirect(`/log?workout=${started[0].id}`);
  }

  return <Picker planned={planned} started={started} />;
}
