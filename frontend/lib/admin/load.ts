import "server-only";

import { serverApi } from "@/lib/api/server";
import { unwrap } from "@/lib/api/errors";
import { MUSCLE_GROUPS, type AdminUsersPage, type MuscleGroup } from "@/lib/api/extra-types";
import type { UserListQuery } from "./users-query";
import { settle, type Section } from "@/lib/stats/model";

/** `substitutesPicked`: AI już dobierało zamienniki (nawet jeśli żadnego nie znalazło). */
export type AdminExercise = { id: number; name: string; muscleGroup: MuscleGroup; substitutesPicked: boolean };

export type CatalogHealth = { total: number; missing: number };

/** Cały katalog w kolejności grup z enuma, alfabetycznie w grupie (jak w /exercises). */
export async function loadAdminCatalog(): Promise<AdminExercise[]> {
  const api = await serverApi();
  const exercises = await unwrap(api.GET("/exercise"));
  const order = (g: MuscleGroup) => MUSCLE_GROUPS.indexOf(g);
  return exercises
    .map((e) => ({
      id: e.id,
      name: e.name,
      muscleGroup: e.muscleGroup as MuscleGroup,
      substitutesPicked: Boolean(e.substitutesGeneratedAt),
    }))
    .sort((a, b) => order(a.muscleGroup) - order(b.muscleGroup) || a.name.localeCompare(b.name, "pl"));
}

/** Przegląd panelu: stan katalogu i strona listy kont. Każda sekcja może zawieść osobno. */
export async function loadAdminOverview(
  query: UserListQuery,
): Promise<{ catalog: Section<CatalogHealth>; users: Section<AdminUsersPage> }> {
  const api = await serverApi();
  const [catalog, users] = await Promise.all([
    settle(loadAdminCatalog()),
    settle(
      unwrap(
        api.GET("/auth/users", {
          params: {
            query: {
              ...(query.q.trim() ? { search: query.q.trim() } : {}),
              sort: query.sort,
              order: query.order,
              page: query.page,
              limit: query.limit,
            },
          },
        }),
      ),
    ),
  ]);
  return {
    catalog: catalog.ok
      ? { ok: true, data: { total: catalog.data.length, missing: catalog.data.filter((e) => !e.substitutesPicked).length } }
      : { ok: false },
    users,
  };
}
