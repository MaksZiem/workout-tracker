"use server";

import { redirect } from "next/navigation";
import { serverApi } from "@/lib/api/server";
import { localDate } from "./model";
import { parseId } from "@/lib/ids";

export type StartState = { error?: boolean };

export async function startScheduled(_prev: StartState, formData: FormData): Promise<StartState> {
  const id = parseId(formData.get("scheduledId"));
  if (!id) return { error: true };
  let workoutId: string | undefined;
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
  let workoutId: string | undefined;
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
