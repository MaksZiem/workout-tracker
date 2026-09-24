"use server";

import { redirect } from "next/navigation";
import { serverApi } from "@/lib/api/server";
import { localDate } from "./model";

export type StartState = { error?: boolean };

/** Uruchamia zaplanowany trening: backend tworzy trening z serią wypełnioną z szablonu. */
export async function startScheduled(_prev: StartState, formData: FormData): Promise<StartState> {
  const id = Number(formData.get("scheduledId"));
  let workoutId: number | undefined;
  try {
    const api = await serverApi();
    const { data } = await api.POST("/planner/scheduled/{id}/start", { params: { path: { id } } });
    workoutId = data?.workout?.id;
  } catch {
    return { error: true };
  }
  if (!workoutId) return { error: true };
  redirect(`/log?workout=${workoutId}`);
}

export async function startEmpty(): Promise<StartState> {
  let workoutId: number | undefined;
  try {
    const api = await serverApi();
    const { data } = await api.POST("/workout", { body: { date: localDate() } });
    workoutId = data?.id;
  } catch {
    return { error: true };
  }
  if (!workoutId) return { error: true };
  redirect(`/log?workout=${workoutId}`);
}
