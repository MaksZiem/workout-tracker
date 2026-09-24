import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { displayDate } from "@/lib/planner/dates";
import { loadWorkoutDetail } from "@/lib/workouts/load";
import { WorkoutPage } from "@/components/workouts/workout-page";

type Props = PageProps<"/workouts/[id]">;

async function workoutId(props: Props) {
  const { id } = await props.params;
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const id = await workoutId(props);
  const workout = id ? await loadWorkoutDetail(id) : null;
  const t = await getTranslations("pages.workouts");
  if (!workout) return { title: t("title") };
  const format = await getFormatter();
  return { title: format.dateTime(displayDate(workout.date), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) };
}

export default async function WorkoutDetailPage(props: Props) {
  const id = await workoutId(props);
  if (id === null) notFound();
  const workout = await loadWorkoutDetail(id);
  if (!workout) notFound();
  // key: po zmianie daty lub odświeżeniu stan klienta zaczyna od nowa.
  return <WorkoutPage key={`${workout.id}-${workout.date}`} workout={workout} />;
}
