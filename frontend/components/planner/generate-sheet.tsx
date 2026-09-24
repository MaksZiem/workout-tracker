"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { clientApi } from "@/lib/api/client";
import { unwrap } from "@/lib/api/errors";
import { Sheet } from "@/components/ui/sheet";
import { addDays, daysBetween, displayDate, mondayIndex, toBackendDayOfWeek, weekStart } from "@/lib/planner/dates";
import { defaultSpread, type PlanOption } from "@/lib/planner/model";

type PlanTemplate = { id: number; name: string };

const capitalize = (value: string) => value.charAt(0).toLocaleUpperCase() + value.slice(1);

const MIN_WEEKS = 1;
const MAX_WEEKS = 12;

/**
 * Generowanie harmonogramu z planu: szablony planu → dni tygodnia → liczba tygodni.
 * Podgląd liczy to samo co backend (POST /planner/generate pomija daty,
 * które mają już jakikolwiek wpis), więc liczba przed zapisem jest prawdziwa.
 */
export function GenerateSheet({
  open,
  onClose,
  plans,
  today,
  onGenerated,
}: {
  open: boolean;
  onClose: () => void;
  plans: PlanOption[];
  today: string;
  onGenerated: (count: number) => void;
}) {
  const t = useTranslations("pages.planner.generate");
  const tNav = useTranslations("nav");
  const format = useFormatter();

  const [planId, setPlanId] = useState<number | null>(plans[0]?.id ?? null);
  const [templates, setTemplates] = useState<PlanTemplate[] | null>(null);
  const [days, setDays] = useState<number[]>([]);
  const [weeks, setWeeks] = useState(4);
  const [occupied, setOccupied] = useState<Set<string> | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const from = today;
  const to = addDays(weekStart(today), 7 * weeks - 1);

  // Szablony wybranego planu.
  useEffect(() => {
    if (!open || planId === null) return;
    let cancelled = false;
    unwrap(clientApi.GET("/plan/{id}", { params: { path: { id: planId } } }))
      .then((plan) => {
        if (cancelled) return;
        const list = (plan.templates ?? []).map((tpl) => ({ id: tpl.id, name: tpl.name }));
        setTemplates(list);
        setDays(defaultSpread(list.length));
      })
      .catch(() => !cancelled && setTemplates([]));
    return () => {
      cancelled = true;
    };
  }, [open, planId]);

  // Zajęte daty w zakresie (do podglądu).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    unwrap(clientApi.GET("/planner/scheduled", { params: { query: { from, to } } }))
      .then((items) => !cancelled && setOccupied(new Set(items.map((i) => i.date))))
      .catch(() => !cancelled && setOccupied(new Set()));
    return () => {
      cancelled = true;
    };
  }, [open, from, to]);

  const preview = useMemo(() => {
    if (!templates || !occupied) return null;
    let count = 0;
    let skipped = 0;
    for (const date of daysBetween(from, to)) {
      const matching = templates.filter((_, i) => days[i] === mondayIndex(date)).length;
      if (!matching) continue;
      if (occupied.has(date)) skipped += 1;
      else count += matching;
    }
    return { count, skipped };
  }, [templates, occupied, days, from, to]);

  const weekdayNames = useMemo(
    () =>
      daysBetween(weekStart(today), addDays(weekStart(today), 6)).map((d) =>
        capitalize(format.dateTime(displayDate(d), { weekday: "long", timeZone: "UTC" })),
      ),
    [format, today],
  );

  const submit = async () => {
    if (!templates?.length || !preview?.count) return;
    setPending(true);
    setError(false);
    try {
      const created = await unwrap(
        clientApi.POST("/planner/generate", {
          body: {
            from,
            to,
            assignments: templates.map((tpl, i) => ({ templateId: tpl.id, dayOfWeek: toBackendDayOfWeek(days[i]) })),
          },
        }),
      );
      onGenerated(created.length);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };

  const rangeLabel = t("range", {
    from: format.dateTime(displayDate(from), { day: "numeric", month: "long", timeZone: "UTC" }),
    to: format.dateTime(displayDate(to), { day: "numeric", month: "long", timeZone: "UTC" }),
  });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("title")}
      closeLabel={tNav("close")}
      footer={
        plans.length ? (
          <div>
            {preview ? (
              <p className="mb-3 text-sm" aria-live="polite">
                <span className="font-semibold">{t("preview", { count: preview.count })}</span>
                {preview.skipped ? <span className="text-muted"> · {t("skipped", { count: preview.skipped })}</span> : null}
              </p>
            ) : null}
            <button
              type="button"
              onClick={submit}
              disabled={pending || !preview?.count}
              className="h-12 w-full rounded-lg bg-accent text-[15px] font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {pending ? t("pending") : t("submit")}
            </button>
          </div>
        ) : null
      }
    >
      {!plans.length ? (
        <div className="py-2">
          <p className="text-sm text-muted">{t("noPlans")}</p>
          <Link href="/plans" className="mt-3 inline-flex h-11 items-center font-medium text-accent underline">
            {t("toPlans")}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t("plan")}</span>
            <select
              value={planId ?? ""}
              onChange={(e) => {
                setTemplates(null);
                setPlanId(Number(e.target.value));
              }}
              className="h-11 rounded-lg border border-border bg-surface-muted px-3 text-[15px]"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="text-sm font-medium">{t("days")}</legend>
            {!templates ? (
              <p className="mt-2 text-sm text-muted" role="status">
                {t("loadingPlan")}
              </p>
            ) : templates.length === 0 ? (
              <p className="mt-2 text-sm text-muted">{t("noTemplates")}</p>
            ) : (
              <ul className="mt-2 flex flex-col divide-y divide-border">
                {templates.map((tpl, i) => (
                  <li key={tpl.id} className="flex items-center gap-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-[15px]">{tpl.name}</span>
                    <select
                      aria-label={t("dayFor", { name: tpl.name })}
                      value={days[i] ?? 0}
                      onChange={(e) => setDays((prev) => prev.map((d, j) => (j === i ? Number(e.target.value) : d)))}
                      className="h-11 w-40 shrink-0 rounded-lg border border-border bg-surface-muted px-3 text-sm"
                    >
                      {weekdayNames.map((name, idx) => (
                        <option key={idx} value={idx}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <div>
            <span id="weeks-label" className="text-sm font-medium">
              {t("weeks")}
            </span>
            <div className="mt-2 flex items-center gap-3">
              <div role="group" aria-labelledby="weeks-label" className="flex overflow-hidden rounded-lg border border-border">
                <button
                  type="button"
                  aria-label={t("decrease")}
                  disabled={weeks <= MIN_WEEKS}
                  onClick={() => setWeeks((w) => Math.max(MIN_WEEKS, w - 1))}
                  className="grid size-11 place-items-center hover:bg-surface-muted disabled:opacity-40"
                >
                  <Minus className="size-4" strokeWidth={2.5} aria-hidden />
                </button>
                <span className="grid min-w-28 place-items-center border-x border-border px-3 text-[15px] font-semibold tabular-nums" aria-live="polite">
                  {t("weeksValue", { count: weeks })}
                </span>
                <button
                  type="button"
                  aria-label={t("increase")}
                  disabled={weeks >= MAX_WEEKS}
                  onClick={() => setWeeks((w) => Math.min(MAX_WEEKS, w + 1))}
                  className="grid size-11 place-items-center hover:bg-surface-muted disabled:opacity-40"
                >
                  <Plus className="size-4" strokeWidth={2.5} aria-hidden />
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted">{rangeLabel}</p>
          </div>

          {error ? (
            <p role="alert" className="rounded-lg bg-danger-surface px-3 py-2.5 text-sm text-danger">
              {t("error")}
            </p>
          ) : null}
        </div>
      )}
    </Sheet>
  );
}
