"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { clientApi } from "@/lib/api/client";
import { unwrap } from "@/lib/api/errors";
import { MUSCLE_GROUPS, type Exercise } from "@/lib/api/extra-types";
import { Sheet } from "@/components/ui/sheet";

type CatalogItem = Pick<Exercise, "id" | "name" | "muscleGroup">;

export function AddExerciseSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (exercise: CatalogItem) => void;
}) {
  const t = useTranslations("pages.log");
  const tNav = useTranslations("nav");
  const tEnum = useTranslations("enums.muscleGroup");
  const tCommon = useTranslations("common");
  const [catalog, setCatalog] = useState<CatalogItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open || catalog) return;
    unwrap(clientApi.GET("/exercise"))
      .then((items) => setCatalog(items.map(({ id, name, muscleGroup }) => ({ id, name, muscleGroup }))))
      .catch(() => setFailed(true));
  }, [open, catalog]);

  const groups = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    const filtered = (catalog ?? []).filter(
      (e) => !q || e.name.toLocaleLowerCase().includes(q) || tEnum(e.muscleGroup).toLocaleLowerCase().includes(q),
    );
    return MUSCLE_GROUPS.map((group) => ({
      group,
      items: filtered.filter((e) => e.muscleGroup === group).sort((a, b) => a.name.localeCompare(b.name)),
    })).filter((g) => g.items.length);
  }, [catalog, query, tEnum]);

  return (
    <Sheet open={open} onClose={onClose} title={t("add.exercise")} closeLabel={tNav("close")}>
      <label className="sticky top-0 z-10 -mx-5 flex items-center gap-2 bg-surface px-5 pb-3">
        <span className="sr-only">{t("add.search")}</span>
        <div className="flex h-11 flex-1 items-center gap-2 rounded-lg bg-surface-muted px-3">
          <Search className="size-4 shrink-0 text-muted" strokeWidth={2} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("add.search")}
            className="h-full w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
          />
        </div>
      </label>

      {failed ? (
        <div className="py-6 text-center text-sm">
          <p className="text-danger">{t("add.loadError")}</p>
          <button
            type="button"
            onClick={() => {
              setFailed(false);
              setCatalog(null);
            }}
            className="mt-3 font-medium text-accent underline"
          >
            {tCommon("retry")}
          </button>
        </div>
      ) : !catalog ? (
        <p className="py-6 text-center text-sm text-muted" role="status">
          {t("add.loading")}
        </p>
      ) : groups.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{t("add.noResults", { query })}</p>
      ) : (
        groups.map(({ group, items }) => (
          <section key={group} className="mb-4">
            <h3 className="py-1.5 text-xs font-semibold tracking-wide text-muted uppercase">{tEnum(group)}</h3>
            <ul>
              {items.map((exercise) => (
                <li key={exercise.id}>
                  <button
                    type="button"
                    onClick={() => onPick(exercise)}
                    className="-mx-2 flex min-h-12 w-[calc(100%+1rem)] items-center rounded-lg px-2 text-left text-[15px] hover:bg-surface-muted"
                  >
                    {exercise.name}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </Sheet>
  );
}
