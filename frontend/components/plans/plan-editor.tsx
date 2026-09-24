"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarPlus, ChevronLeft, Ellipsis, Plus, Sparkles, X } from "lucide-react";
import { clientApi } from "@/lib/api/client";
import { unwrap } from "@/lib/api/errors";
import type { PlanDetail } from "@/lib/plans/load";
import type { EditorTemplate } from "@/lib/plans/model";
import { ActionMenu } from "@/components/ui/action-menu";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { ToastView, useToast } from "@/components/ui/toast";
import { InlineText } from "./inline-text";
import { TemplateEditor } from "./template-editor";

/** Szczegół planu: nazwa i notatka na miejscu, dni treningowe jako edytory szablonów. */
export function PlanEditor({ plan: initial, fromAi }: { plan: PlanDetail; fromAi: boolean }) {
  const t = useTranslations("pages.planDetail");
  const tUndo = useTranslations("pages.log.toast");
  const router = useRouter();
  const { toast, show, dismiss } = useToast();
  const [plan, setPlan] = useState({
    id: initial.id,
    name: initial.name,
    notes: initial.notes,
  });
  const [templates, setTemplates] = useState<EditorTemplate[]>(initial.templates);
  const [newTemplateId, setNewTemplateId] = useState<number | null>(null);
  const [aiBanner, setAiBanner] = useState(fromAi);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [adding, setAdding] = useState(false);

  const patchPlan = async (body: { name?: string; notes?: string }) => {
    const previous = plan;
    setPlan((p) => ({ ...p, ...body }));
    try {
      await unwrap(
        clientApi.PATCH("/plan/{id}", {
          params: { path: { id: plan.id } },
          body,
        }),
      );
    } catch {
      setPlan(previous);
      show({ message: t("error"), tone: "error" });
    }
  };

  const addDay = async () => {
    setAdding(true);
    try {
      const created = await unwrap(
        clientApi.POST("/template", {
          body: {
            name: t("newDayName", { n: templates.length + 1 }),
            planId: plan.id,
          },
        }),
      );
      setTemplates((list) => [...list, { id: created.id, name: created.name, exercises: [] }]);
      setNewTemplateId(created.id);
    } catch {
      show({ message: t("error"), tone: "error" });
    } finally {
      setAdding(false);
    }
  };

  const deletePlan = async () => {
    setDeleting(true);
    try {
      await unwrap(clientApi.DELETE("/plan/{id}", { params: { path: { id: plan.id } } }));
      router.push("/plans");
      router.refresh();
    } catch {
      setDeleting(false);
      show({ message: t("deleteError"), tone: "error" });
    }
  };

  const dismissBanner = () => {
    setAiBanner(false);
    router.replace(`/plans/${plan.id}`, { scroll: false });
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link
        href="/plans"
        className="-ml-2 inline-flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted hover:bg-surface-muted hover:text-foreground"
      >
        <ChevronLeft className="size-4" strokeWidth={2.25} aria-hidden />
        {t("back")}
      </Link>

      <header className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            <InlineText
              key={plan.name}
              value={plan.name}
              label={t("name")}
              required
              onCommit={(name) => patchPlan({ name })}
              className="h-11 sm:h-12"
            />
          </h1>
          <InlineText
            key={plan.notes}
            value={plan.notes}
            label={t("notes")}
            placeholder={t("notesPlaceholder")}
            multiline
            onCommit={(notes) => patchPlan({ notes })}
            className="mt-1 min-h-9 resize-none py-1.5 text-sm text-muted focus-visible:text-foreground"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {templates.length ? (
            <Link
              href={`/planner?generate=${plan.id}`}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90 sm:flex-none"
            >
              <CalendarPlus className="size-4" strokeWidth={2.25} aria-hidden />
              {t("schedule")}
            </Link>
          ) : null}
          <ActionMenu
            label={t("menu")}
            align="right"
            trigger={<Ellipsis className="size-5" strokeWidth={2} aria-hidden />}
            triggerClassName="grid size-11 place-items-center rounded-lg border border-border text-muted hover:bg-surface-muted hover:text-foreground"
            actions={[
              {
                label: t("delete"),
                tone: "danger",
                onSelect: () => setConfirming(true),
              },
            ]}
          />
        </div>
      </header>

      {aiBanner ? (
        <div
          role="status"
          className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm"
        >
          <Sparkles className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={2} aria-hidden />
          <p className="flex-1">{t("aiBanner")}</p>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="-my-1 shrink-0 rounded-md px-2 py-1 font-medium text-danger hover:bg-danger-surface"
          >
            {t("delete")}
          </button>
          <button
            type="button"
            onClick={dismissBanner}
            aria-label={t("aiDismiss")}
            className="-my-1.5 -mr-1.5 grid size-8 shrink-0 place-items-center rounded-md text-muted hover:bg-surface hover:text-foreground"
          >
            <X className="size-4" strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-4">
        {templates.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-[17px] font-semibold">{t("emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted">{t("emptyBody")}</p>
            {/* Pusty plan: dodanie dnia to jedyna sensowna akcja, więc to ona jest niebieska. */}
            <button
              type="button"
              onClick={addDay}
              disabled={adding}
              className="mt-4 flex h-11 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-60"
            >
              <Plus className="size-4" strokeWidth={2.5} aria-hidden />
              {t("addDay")}
            </button>
          </div>
        ) : (
          templates.map((template) => (
            <TemplateEditor
              key={template.id}
              template={template}
              autoFocusName={template.id === newTemplateId}
              onDeleted={(id) => setTemplates((list) => list.filter((tpl) => tpl.id !== id))}
              showToast={show}
            />
          ))
        )}
        {templates.length ? (
          <button
            type="button"
            onClick={addDay}
            disabled={adding}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm font-semibold text-muted hover:border-foreground/40 hover:text-foreground disabled:opacity-60"
          >
            <Plus className="size-4" strokeWidth={2.5} aria-hidden />
            {t("addDay")}
          </button>
        ) : null}
      </div>

      <ConfirmSheet
        open={confirming}
        title={t("deleteTitle", { name: plan.name })}
        body={t("deleteBody", { count: templates.length })}
        confirmLabel={t("deleteConfirm")}
        cancelLabel={t("cancel")}
        pending={deleting}
        onConfirm={deletePlan}
        onClose={() => setConfirming(false)}
      />
      <ToastView toast={toast} onDismiss={dismiss} undoLabel={tUndo("undo")} />
    </div>
  );
}
