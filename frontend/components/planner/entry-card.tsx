"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { Check, CircleDot, Ellipsis, SkipForward, TriangleAlert } from "lucide-react";
import { clientApi } from "@/lib/api/client";
import { unwrap } from "@/lib/api/errors";
import { ActionMenu, type MenuAction } from "@/components/ui/action-menu";
import { displayDate } from "@/lib/planner/dates";
import { displayStatus, type PlannerEntry } from "@/lib/planner/model";
import type { PlannerApi } from "./use-planner";

/**
 * Jeden zaplanowany trening. Status słowem i kolorem:
 * zaplanowany (neutralny), w trakcie (neutralny + ikona; niebieski tylko przycisk „Kontynuuj”),
 * wykonany (zielony), pominięty (przerywana ramka, bez przygaszania), zaległy (czerwony, liczony po stronie klienta).
 */
export function EntryCard({
  entry,
  today,
  planner,
  onMove,
  compact = false,
}: {
  entry: PlannerEntry;
  today: string;
  planner: PlannerApi;
  onMove: (entry: PlannerEntry) => void;
  compact?: boolean;
}) {
  const t = useTranslations("pages.planner");
  const tStatus = useTranslations("enums.scheduledWorkoutStatus");
  const format = useFormatter();
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const status = displayStatus(entry, today);
  const name = entry.templateName ?? t("entry.noTemplate");
  const canStart = entry.status === "PLANNED" && entry.date === today && entry.templateId !== null;
  const canContinue = entry.status === "IN_PROGRESS" && entry.workoutId !== null;

  const start = async () => {
    setStarting(true);
    try {
      const started = await unwrap(
        clientApi.POST("/planner/scheduled/{id}/start", { params: { path: { id: entry.id } } }),
      );
      router.push(`/log?workout=${started.workout?.id ?? ""}`);
    } catch {
      setStarting(false);
      planner.showToast({ message: t("toast.error"), tone: "error" });
    }
  };

  const actions: MenuAction[] = [];
  if (entry.workoutId) {
    actions.push({ label: t("entry.viewWorkout"), onSelect: () => router.push(`/workouts/${entry.workoutId}`) });
  }
  if (entry.status === "PLANNED") {
    actions.push({ label: t("entry.move"), onSelect: () => onMove(entry) });
    actions.push({
      label: t("entry.skip"),
      onSelect: () => planner.patch({ id: entry.id, status: "SKIPPED" }, t("toast.skipped")),
    });
  }
  if (entry.status === "SKIPPED") {
    actions.push({
      label: t("entry.restore"),
      onSelect: () => planner.patch({ id: entry.id, status: "PLANNED" }, t("toast.restored")),
    });
    actions.push({ label: t("entry.move"), onSelect: () => onMove(entry) });
  }
  if (!entry.workoutId) {
    actions.push({ label: t("entry.delete"), tone: "danger", onSelect: () => planner.remove(entry.id) });
  }

  const tone =
    status === "COMPLETED"
      ? "border-transparent bg-success-surface"
      : status === "SKIPPED"
        ? "border-dashed border-border bg-transparent"
        : "border-border bg-surface";

  const dateLabel = format.dateTime(displayDate(entry.date), { weekday: "long", day: "numeric", month: "long" });

  return (
    <article
      aria-label={`${name}, ${dateLabel}`}
      className={`rounded-xl border ${compact ? "p-2.5" : "p-3"} ${tone}`}
    >
      <div>
        <div className="min-w-0">
          <h3 className={`font-semibold leading-snug break-words ${compact ? "text-sm" : "text-[15px]"}`}>
            {entry.templateId && entry.status !== "SKIPPED" ? (
              <Link href={`/templates/${entry.templateId}`} className="hover:underline">
                {name}
              </Link>
            ) : (
              name
            )}
          </h3>
          {entry.exerciseCount ? (
            <p className="mt-0.5 text-xs text-muted tabular-nums">{t("entry.exercises", { count: entry.exerciseCount })}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-1.5 -mb-1 flex items-center justify-between gap-2">
        <StatusLine status={status} label={status === "OVERDUE" ? t("entry.overdue") : tStatus(status)} />
        {actions.length ? (
          <ActionMenu
            label={t("entry.menu", { name })}
            align="right"
            trigger={<Ellipsis className="size-4" strokeWidth={2} aria-hidden />}
            triggerClassName="-mr-1.5 grid size-9 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground"
            actions={actions}
          />
        ) : null}
      </div>

      {canContinue ? (
        <button
          type="button"
          onClick={() => router.push(`/log?workout=${entry.workoutId}`)}
          className="mt-2.5 h-10 w-full rounded-lg bg-accent text-sm font-semibold text-accent-foreground hover:opacity-90"
        >
          {t("entry.continue")}
        </button>
      ) : null}

      {canStart ? (
        <button
          type="button"
          onClick={start}
          disabled={starting}
          className="mt-2.5 h-10 w-full rounded-lg bg-accent text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {t("entry.start")}
        </button>
      ) : null}
    </article>
  );
}

function StatusLine({ status, label }: { status: ReturnType<typeof displayStatus>; label: string }) {
  const config = {
    PLANNED: { icon: null, className: "text-muted" },
    IN_PROGRESS: { icon: CircleDot, className: "text-foreground font-medium" },
    COMPLETED: { icon: Check, className: "text-success font-medium" },
    SKIPPED: { icon: SkipForward, className: "text-muted" },
    OVERDUE: { icon: TriangleAlert, className: "text-danger font-medium" },
  }[status];
  const Icon = config.icon;
  return (
    <p className={`flex min-w-0 items-center gap-1.5 text-xs ${config.className}`}>
      {Icon ? <Icon className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden /> : null}
      {label}
    </p>
  );
}
