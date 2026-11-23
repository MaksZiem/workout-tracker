"use server";

import { redirect } from "next/navigation";
import { serverApi } from "@/lib/api/server";
import { localDate } from "@/lib/log/model";
import type { StartState } from "@/lib/log/actions";
import { todayState } from "./model";
import { parseId } from "@/lib/ids";

export async function startTemplate(_prev: StartState, formData: FormData): Promise<StartState> {
  const templateId = parseId(formData.get("templateId"));
  if (!templateId) return { error: true };
  const date = localDate();
  let workoutId: string | undefined;

  try {
    const api = await serverApi();
    const { data: today } = await api.GET("/planner/today", { params: { query: { date } } });
    const state = todayState(today ?? [], templateId);

    if (state.kind === "inProgress") {
      workoutId = state.workoutId;
    } else {
      let scheduledId = state.kind === "planned" ? state.scheduledId : undefined;
      let created = false;
      if (scheduledId === undefined) {
        const { data } = await api.POST("/planner/scheduled", { body: { templateId, date } });
        scheduledId = data?.id;
        created = true;
      }
      if (scheduledId === undefined) return { error: true };

      const { data } = await api.POST("/planner/scheduled/{id}/start", { params: { path: { id: scheduledId } } });
      workoutId = data?.workout?.id;
      if (!workoutId && created) {
        await api.DELETE("/planner/scheduled/{id}", { params: { path: { id: scheduledId } } });
      }
    }
  } catch {
    return { error: true };
  }

  if (!workoutId) return { error: true };
  redirect(`/log?workout=${workoutId}`);
}

export type ScheduleState = { error?: boolean; scheduled?: string };

export async function scheduleTemplate(_prev: ScheduleState, formData: FormData): Promise<ScheduleState> {
  const templateId = parseId(formData.get("templateId"));
  const date = String(formData.get("date") ?? "");
  if (!templateId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: true };
  try {
    const api = await serverApi();
    const { response } = await api.POST("/planner/scheduled", { body: { templateId, date } });
    if (!response.ok) return { error: true };
  } catch {
    return { error: true };
  }
  return { scheduled: date };
}
