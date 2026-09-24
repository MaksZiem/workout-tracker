"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ChevronLeft, ClipboardList, Ellipsis, Play } from "lucide-react";
import { clientApi } from "@/lib/api/client";
import { unwrap } from "@/lib/api/errors";
import type { StartState } from "@/lib/log/actions";
import { startTemplate, scheduleTemplate, type ScheduleState } from "@/lib/templates/actions";
import type { TemplateDetail } from "@/lib/templates/model";
import { ActionMenu } from "@/components/ui/action-menu";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { Sheet } from "@/components/ui/sheet";
import { ToastView, useToast } from "@/components/ui/toast";
import { InlineText } from "@/components/plans/inline-text";
import { TemplateEditor } from "@/components/plans/template-editor";

/** Szablon na własnej stronie: nazwa i notatka na miejscu, tabela celów, start od razu. */
export function TemplatePage({ detail, today }: { detail: TemplateDetail; today: string }) {
  const t = useTranslations("pages.templateDetail");
  const tUndo = useTranslations("pages.log.toast");
  const router = useRouter();
  const { toast, show, dismiss } = useToast();
  const [meta, setMeta] = useState({ name: detail.template.name, notes: detail.notes });
  const [count, setCount] = useState(detail.template.exercises.length);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [startState, start, starting] = useActionState<StartState, FormData>(startTemplate, {});
  const onCountChange = useCallback((n: number) => setCount(n), []);

  const id = detail.template.id;
  const plan = detail.plan;
  const backHref = plan ? `/plans/${plan.id}` : "/templates";
  const continuing = detail.today.kind === "inProgress";

  useEffect(() => {
    if (startState.error) show({ message: t("startError"), tone: "error" });
  }, [startState, show, t]);

  const patch = async (body: { name?: string; notes?: string }) => {
    const previous = meta;
    setMeta((m) => ({ ...m, ...body }));
    try {
      await unwrap(clientApi.PATCH("/template/{id}", { params: { path: { id } }, body }));
    } catch {
      setMeta(previous);
      show({ message: t("error"), tone: "error" });
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await unwrap(clientApi.DELETE("/template/{id}", { params: { path: { id } } }));
      router.push(backHref);
      router.refresh();
    } catch {
      setDeleting(false);
      show({ message: t("deleteError"), tone: "error" });
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link
        href={backHref}
        className="-ml-2 inline-flex h-10 max-w-full items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted hover:bg-surface-muted hover:text-foreground"
      >
        <ChevronLeft className="size-4 shrink-0" strokeWidth={2.25} aria-hidden />
        <span className="truncate">{plan ? plan.name : t("back")}</span>
      </Link>

      <header className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            <InlineText
              key={meta.name}
              value={meta.name}
              label={t("name")}
              required
              onCommit={(name) => patch({ name })}
              className="h-11 sm:h-12"
            />
          </h1>
          {plan ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
              <ClipboardList className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
              {t.rich("planDay", {
                plan: plan.name,
                link: (chunks) => (
                  <Link href={`/plans/${plan.id}`} className="font-medium text-foreground underline-offset-2 hover:underline">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          ) : null}
          <InlineText
            key={meta.notes}
            value={meta.notes}
            label={t("notes")}
            placeholder={t("notesPlaceholder")}
            multiline
            onCommit={(notes) => patch({ notes })}
            className="mt-1 min-h-9 resize-none py-1.5 text-sm text-muted focus-visible:text-foreground"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <form action={start} className="flex flex-1 sm:flex-none">
            <input type="hidden" name="templateId" value={id} />
            <button
              type="submit"
              disabled={starting || count === 0}
              title={count === 0 ? t("startEmpty") : undefined}
              className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold sm:flex-none ${
                count === 0
                  ? "border border-border text-muted disabled:cursor-not-allowed"
                  : "bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-60"
              }`}
            >
              <Play className="size-4 fill-current" strokeWidth={2} aria-hidden />
              {starting ? t("starting") : continuing ? t("continue") : t("start")}
            </button>
          </form>
          <ActionMenu
            label={t("menu")}
            align="right"
            trigger={<Ellipsis className="size-5" strokeWidth={2} aria-hidden />}
            triggerClassName="grid size-11 place-items-center rounded-lg border border-border text-muted hover:bg-surface-muted hover:text-foreground"
            actions={[
              { label: t("schedule"), onSelect: () => setScheduling(true) },
              { label: t("delete"), tone: "danger", onSelect: () => setConfirming(true) },
            ]}
          />
        </div>
      </header>

      <div className="mt-6">
        <TemplateEditor
          template={detail.template}
          variant="page"
          onCountChange={onCountChange}
          showToast={show}
        />
      </div>

      <ScheduleSheet
        open={scheduling}
        templateId={id}
        today={today}
        onClose={() => setScheduling(false)}
        onScheduled={(date) => {
          setScheduling(false);
          show({ message: t("scheduled", { date }), tone: "default" });
        }}
      />
      <ConfirmSheet
        open={confirming}
        title={plan ? t("deleteDayTitle", { name: meta.name, plan: plan.name }) : t("deleteTitle", { name: meta.name })}
        body={plan ? t("deleteDayBody", { plan: plan.name }) : t("deleteBody")}
        confirmLabel={t(plan ? "deleteDayConfirm" : "deleteConfirm")}
        cancelLabel={t("cancel")}
        pending={deleting}
        onConfirm={remove}
        onClose={() => setConfirming(false)}
      />
      <ToastView toast={toast} onDismiss={dismiss} undoLabel={tUndo("undo")} />
    </div>
  );
}

function ScheduleSheet({
  open,
  templateId,
  today,
  onClose,
  onScheduled,
}: {
  open: boolean;
  templateId: number;
  today: string;
  onClose: () => void;
  onScheduled: (date: string) => void;
}) {
  const t = useTranslations("pages.templateDetail.scheduleSheet");
  const tNav = useTranslations("nav");
  const format = useFormatter();
  const [state, action, pending] = useActionState<ScheduleState, FormData>(scheduleTemplate, {});

  useEffect(() => {
    if (state.scheduled) {
      onScheduled(
        format.dateTime(new Date(`${state.scheduled}T00:00:00Z`), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
      );
    }
    // onScheduled zmienia się przy każdym renderze rodzica; reagujemy tylko na nowy wynik akcji.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      locked={pending}
      title={t("title")}
      closeLabel={tNav("close")}
      footer={
        <div className="flex flex-col gap-3">
          <button
            type="submit"
            form="schedule-template"
            disabled={pending}
            className="h-12 w-full rounded-lg bg-accent text-[15px] font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-60"
          >
            {pending ? t("pending") : t("submit")}
          </button>
          <Link href="/planner" className="self-center text-sm font-medium text-accent underline-offset-2 hover:underline">
            {t("toPlanner")}
          </Link>
        </div>
      }
    >
      <form id="schedule-template" action={action} className="flex flex-col gap-1.5">
        <input type="hidden" name="templateId" value={templateId} />
        <label htmlFor="schedule-date" className="text-sm font-medium">
          {t("date")}
        </label>
        <input
          id="schedule-date"
          type="date"
          name="date"
          required
          defaultValue={today}
          className="h-11 rounded-lg border border-border bg-surface-muted px-3 text-[15px] outline-none focus-visible:border-accent"
        />
        {state.error ? (
          <p role="alert" className="mt-2 rounded-lg bg-danger-surface px-3 py-2.5 text-sm text-danger">
            {t("error")}
          </p>
        ) : null}
      </form>
    </Sheet>
  );
}
