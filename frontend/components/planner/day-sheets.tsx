"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { clientApi } from "@/lib/api/client";
import { unwrap } from "@/lib/api/errors";
import { Sheet } from "@/components/ui/sheet";
import { displayDate, isIsoDate } from "@/lib/planner/dates";
import type { PlannerEntry, TemplateOption } from "@/lib/planner/model";

/** Dodanie pojedynczego szablonu na wybrany dzień. */
export function AddSheet({
  date,
  onClose,
  templates,
  onAdded,
}: {
  date: string | null;
  onClose: () => void;
  templates: TemplateOption[];
  onAdded: (name: string) => void;
}) {
  const t = useTranslations("pages.planner");
  const tNav = useTranslations("nav");
  const tEnum = useTranslations("enums.muscleGroup");
  const format = useFormatter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState(false);

  const add = async (template: TemplateOption) => {
    if (!date) return;
    setPendingId(template.id);
    setError(false);
    try {
      await unwrap(clientApi.POST("/planner/scheduled", { body: { templateId: template.id, date } }));
      onAdded(template.name);
    } catch {
      setError(true);
    } finally {
      setPendingId(null);
    }
  };

  const subtitle = date
    ? format.dateTime(displayDate(date), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })
    : "";

  return (
    <Sheet open={date !== null} onClose={onClose} title={t("add.title")} closeLabel={tNav("close")}>
      <p className="text-sm text-muted first-letter:uppercase">{subtitle}</p>
      {templates.length === 0 ? (
        <div className="mt-3">
          <p className="text-sm text-muted">{t("add.noTemplates")}</p>
          <Link href="/templates" className="mt-3 inline-flex h-11 items-center font-medium text-accent underline">
            {t("add.toTemplates")}
          </Link>
        </div>
      ) : (
        <ul className="mt-3 flex flex-col">
          {templates.map((template) => (
            <li key={template.id}>
              <button
                type="button"
                onClick={() => add(template)}
                disabled={pendingId !== null}
                className="-mx-2 flex min-h-14 w-[calc(100%+1rem)] flex-col items-start justify-center rounded-lg px-2 py-2 text-left hover:bg-surface-muted disabled:opacity-60"
              >
                <span className="text-[15px] font-medium">{template.name}</span>
                <span className="text-xs text-muted">
                  {t("entry.exercises", { count: template.exerciseCount })}
                  {template.muscleGroups.length ? ` · ${template.muscleGroups.map((g) => tEnum(g)).join(" · ")}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-danger-surface px-3 py-2.5 text-sm text-danger">
          {t("toast.error")}
        </p>
      ) : null}
    </Sheet>
  );
}

/** Przeniesienie wpisu na inną datę. */
export function MoveSheet({
  entry,
  onClose,
  onMove,
}: {
  entry: PlannerEntry | null;
  onClose: () => void;
  onMove: (entry: PlannerEntry, date: string) => void;
}) {
  const t = useTranslations("pages.planner.move");
  const tNav = useTranslations("nav");

  return (
    <Sheet open={entry !== null} onClose={onClose} title={t("title")} closeLabel={tNav("close")}>
      {entry ? (
        <form
          key={entry.id}
          onSubmit={(e) => {
            e.preventDefault();
            const value = new FormData(e.currentTarget).get("date");
            if (isIsoDate(value) && value !== entry.date) onMove(entry, value);
            else onClose();
          }}
          className="flex flex-col gap-4"
        >
          <p className="text-[15px] font-medium">{entry.templateName}</p>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t("date")}</span>
            <input
              type="date"
              name="date"
              required
              defaultValue={entry.date}
              className="h-11 rounded-lg border border-border bg-surface-muted px-3 text-[15px]"
            />
          </label>
          <button
            type="submit"
            className="h-12 w-full rounded-lg bg-accent text-[15px] font-semibold text-accent-foreground hover:opacity-90"
          >
            {t("submit")}
          </button>
        </form>
      ) : null}
    </Sheet>
  );
}
