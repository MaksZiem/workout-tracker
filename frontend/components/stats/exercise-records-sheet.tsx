"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { clientApi } from "@/lib/api/client";
import { ApiError, unwrap } from "@/lib/api/errors";
import type { PersonalRecords, RepRecord } from "@/lib/api/extra-types";
import { displayDate } from "@/lib/planner/dates";
import { roundKg } from "@/lib/stats/model";
import { Sheet } from "@/components/ui/sheet";
import { RecordStrip } from "./record-strip";
import { RepRecords } from "./rep-records";

type Loaded = { records: PersonalRecords | null; repRecords: RepRecord[] };
type State = { status: "loading" } | { status: "error" } | { status: "ready"; data: Loaded };

async function loadRecords(exerciseId: number): Promise<Loaded> {
  const path = { params: { path: { exerciseId } } };
  const [records, repRecords] = await Promise.all([
    // 404 oznacza „brak ukończonych serii”, nie błąd.
    unwrap(clientApi.GET("/stats/exercise/{exerciseId}/records", path)).catch((error) => {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }),
    unwrap(clientApi.GET("/stats/exercise/{exerciseId}/rep-records", path)),
  ]);
  return { records, repRecords };
}

/**
 * Rekordy ćwiczenia w arkuszu otwieranym z menu ćwiczenia. Montuj tylko na czas
 * otwarcia: dane pobierają się przy montowaniu.
 */
export function ExerciseRecordsSheet({ exercise, onClose }: { exercise: { id: number; name: string }; onClose: () => void }) {
  const t = useTranslations("pages.statsExercise");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const exerciseId = exercise.id;

  useEffect(() => {
    let cancelled = false;
    loadRecords(exerciseId).then(
      (data) => !cancelled && setState({ status: "ready", data }),
      () => !cancelled && setState({ status: "error" }),
    );
    return () => {
      cancelled = true;
    };
  }, [exerciseId, attempt]);

  const kg = (v: number) => format.number(roundKg(v), { maximumFractionDigits: 1 });
  const date = (iso: string) => format.dateTime(displayDate(iso), { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

  return (
    <Sheet open onClose={onClose} title={t("sheet.title", { name: exercise.name })} closeLabel={tNav("close")}>
      {state.status === "loading" ? (
        <p className="py-8 text-center text-sm text-muted" aria-live="polite">
          {tCommon("loading")}
        </p>
      ) : state.status === "error" ? (
        <p role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-danger-surface px-4 py-3 text-sm text-danger">
          {t("sheet.error")}
          <button
            type="button"
            onClick={() => {
              setState({ status: "loading" });
              setAttempt((n) => n + 1);
            }}
            className="font-medium underline"
          >
            {tCommon("retry")}
          </button>
        </p>
      ) : !state.data.records ? (
        <p className="rounded-xl border border-border bg-surface-muted p-4 text-sm text-muted">{t("records.none")}</p>
      ) : (
        <div className="flex flex-col gap-5">
          <RecordStrip
            records={state.data.records}
            kg={kg}
            date={date}
            labels={{ e1rm: t("records.e1rm"), maxWeight: t("records.maxWeight"), bestSet: t("records.bestSet") }}
          />
          {state.data.repRecords.some((r) => r.weight !== null) ? (
            <section aria-labelledby="sheet-rep-records">
              <h3 id="sheet-rep-records" className="text-[15px] font-semibold">
                {t("repRecords.title")}
              </h3>
              <p className="mt-0.5 mb-2 text-[13px] text-muted">{t("repRecords.hint")}</p>
              <RepRecords
                records={state.data.repRecords}
                kg={kg}
                date={date}
                columns="grid-cols-2 sm:grid-cols-3"
                labels={{
                  rm: (reps) => t("repRecords.rm", { reps }),
                  actual: (reps) => t("repRecords.actual", { reps }),
                  none: t("repRecords.none"),
                }}
              />
            </section>
          ) : null}
        </div>
      )}

      <Link
        href={`/stats/exercise/${exercise.id}`}
        className="mt-5 flex h-11 items-center justify-between rounded-lg border border-border px-4 text-sm font-medium hover:bg-surface-muted"
      >
        {t("sheet.open")}
        <ChevronRight className="size-4 text-muted" strokeWidth={2} aria-hidden />
      </Link>
    </Sheet>
  );
}
