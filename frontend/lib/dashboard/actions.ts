"use server";

import { redirect } from "next/navigation";
import { serverApi } from "@/lib/api/server";
import { localDate } from "@/lib/log/model";

export type ParseState = { error?: "empty" | "ai" | "nothing" | "failed"; text?: string };

/**
 * Skrót AI z pulpitu: tworzy dzisiejszy trening, Gemini dopisuje rozpoznane ćwiczenia,
 * a użytkownik trafia do /log, żeby wynik przejrzeć i poprawić. Gdy AI zawiedzie
 * albo nic nie rozpozna, pusty trening jest usuwany, a tekst wraca do pola.
 */
export async function parseToWorkout(_prev: ParseState, formData: FormData): Promise<ParseState> {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "empty" };

  const api = await serverApi();
  const { data: workout } = await api.POST("/workout", { body: { date: localDate() } });
  if (!workout?.id) return { error: "failed", text };

  const { data: parsed, error } = await api.POST("/ai/parse-workout", { body: { workoutId: workout.id, text } });
  const recognized = parsed?.exercises?.length ?? 0;
  if (error !== undefined || !parsed || recognized === 0) {
    await api.DELETE("/workout/{id}", { params: { path: { id: workout.id } } });
    return { error: error !== undefined || !parsed ? "ai" : "nothing", text };
  }

  redirect(`/log?workout=${workout.id}`);
}
