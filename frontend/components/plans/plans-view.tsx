"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, Minus, Plus, Sparkles } from "lucide-react";
import { clientApi } from "@/lib/api/client";
import { unwrap } from "@/lib/api/errors";
import { TRAINING_GOALS, type TrainingGoal } from "@/lib/api/extra-types";
import type { PlanSummary } from "@/lib/plans/model";
import { Sheet } from "@/components/ui/sheet";

const MIN_DAYS = 1;
const MAX_DAYS = 7;

/** Lista planów: nowy plan (niebieski) albo wygenerowany przez AI (drugorzędny). */
export function PlansView({ plans }: { plans: PlanSummary[] }) {
  const t = useTranslations("pages.plans");
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);

  const actions = (
    <div className="flex w-full gap-2 sm:w-auto">
      <button
        type="button"
        onClick={() => setGenerating(true)}
        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-surface-muted sm:flex-none"
      >
        <Sparkles className="size-4" strokeWidth={2} aria-hidden />
        {t("ai")}
      </button>
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90 sm:flex-none"
      >
        <Plus className="size-4" strokeWidth={2.5} aria-hidden />
        {t("new")}
      </button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        {plans.length ? actions : null}
      </header>

      {plans.length === 0 ? (
        <div className="mt-6 max-w-xl rounded-xl border border-border bg-surface p-5">
          <p className="text-[17px] font-semibold">{t("empty.title")}</p>
          <p className="mt-1 text-sm text-muted">{t("empty.body")}</p>
          <div className="mt-4">{actions}</div>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-xl border border-border bg-surface">
          {plans.map((plan) => (
            <li key={plan.id}>
              <Link href={`/plans/${plan.id}`} className="flex items-center gap-4 px-4 py-4 hover:bg-surface-muted sm:px-5">
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] leading-snug font-semibold">{plan.name}</span>
                  <span className="mt-0.5 block text-[13px] text-muted tabular-nums">
                    {plan.templates.length
                      ? `${t("days", { count: plan.templates.length })} · ${t("exercises", { count: plan.exerciseCount })}`
                      : t("noTemplates")}
                  </span>
                  {plan.templates.length ? (
                    <span className="mt-1.5 block truncate text-sm">{plan.templates.map((tpl) => tpl.name).join(" · ")}</span>
                  ) : null}
                  {plan.notes ? <span className="mt-1 block truncate text-[13px] text-muted">{plan.notes}</span> : null}
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted" strokeWidth={2} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <NewPlanSheet open={creating} onClose={() => setCreating(false)} />
      <AiPlanSheet open={generating} onClose={() => setGenerating(false)} />
    </div>
  );
}

function NewPlanSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("pages.plans.newSheet");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || pending) return;
    setPending(true);
    setError(false);
    try {
      const plan = await unwrap(clientApi.POST("/plan", { body: { name: name.trim() } }));
      router.push(`/plans/${plan.id}`);
    } catch {
      setError(true);
      setPending(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("title")}
      closeLabel={tNav("close")}
      footer={
        <button
          type="submit"
          form="new-plan"
          disabled={!name.trim() || pending}
          className="h-12 w-full rounded-lg bg-accent text-[15px] font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pending ? t("pending") : t("submit")}
        </button>
      }
    >
      <form id="new-plan" onSubmit={submit} className="flex flex-col gap-1.5">
        <label htmlFor="plan-name" className="text-sm font-medium">
          {t("name")}
        </label>
        <input
          id="plan-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("placeholder")}
          autoFocus
          className="h-11 rounded-lg border border-border bg-surface-muted px-3 text-[15px] outline-none placeholder:text-muted focus-visible:border-accent"
        />
        {error ? (
          <p role="alert" className="mt-2 rounded-lg bg-danger-surface px-3 py-2.5 text-sm text-danger">
            {t("error")}
          </p>
        ) : null}
      </form>
    </Sheet>
  );
}

function AiPlanSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("pages.plans.aiSheet");
  const tGoal = useTranslations("enums.trainingGoal");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const [goal, setGoal] = useState<TrainingGoal>("HYPERTROPHY");
  const [days, setDays] = useState(3);
  const [constraints, setConstraints] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const submit = async () => {
    if (pending) return;
    setPending(true);
    setError(false);
    try {
      const result = await unwrap(
        clientApi.POST("/ai/generate-plan", {
          body: { goal, daysPerWeek: days, ...(constraints.trim() ? { constraints: constraints.trim() } : {}) },
        }),
      );
      router.push(`/plans/${result.plan.id}?ai=1`);
    } catch {
      // Formularz zostaje wypełniony, żeby można było spróbować ponownie.
      setError(true);
      setPending(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      locked={pending}
      title={t("title")}
      closeLabel={tNav("close")}
      footer={
        <div>
          {pending ? (
            <p role="status" className="mb-3 text-sm text-muted">
              {t("pending")}
            </p>
          ) : null}
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent text-[15px] font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-60"
          >
            <Sparkles className={`size-4 ${pending ? "animate-pulse" : ""}`} strokeWidth={2} aria-hidden />
            {pending ? t("pendingShort") : t("submit")}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <p className="text-sm text-muted">{t("hint")}</p>

        <fieldset>
          <legend className="text-sm font-medium">{t("goal")}</legend>
          {/* Segmented control jak w planerze i statystykach, zawinięty do 2×2. */}
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-surface-muted p-1">
            {TRAINING_GOALS.map((g) => (
              <label
                key={g}
                className={`flex h-10 cursor-pointer items-center justify-center rounded-md px-3 text-sm font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-accent ${
                  goal === g ? "bg-surface text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                <input type="radio" name="goal" value={g} checked={goal === g} onChange={() => setGoal(g)} className="sr-only" />
                {tGoal(g)}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <span id="ai-days" className="text-sm font-medium">
            {t("days")}
          </span>
          <div role="group" aria-labelledby="ai-days" className="mt-2 flex w-fit overflow-hidden rounded-lg border border-border">
            <button
              type="button"
              aria-label={t("decrease")}
              disabled={days <= MIN_DAYS}
              onClick={() => setDays((d) => Math.max(MIN_DAYS, d - 1))}
              className="grid size-11 place-items-center hover:bg-surface-muted disabled:opacity-40"
            >
              <Minus className="size-4" strokeWidth={2.5} aria-hidden />
            </button>
            <span aria-live="polite" className="grid min-w-24 place-items-center border-x border-border px-3 text-[15px] font-semibold tabular-nums">
              {t("daysValue", { count: days })}
            </span>
            <button
              type="button"
              aria-label={t("increase")}
              disabled={days >= MAX_DAYS}
              onClick={() => setDays((d) => Math.min(MAX_DAYS, d + 1))}
              className="grid size-11 place-items-center hover:bg-surface-muted disabled:opacity-40"
            >
              <Plus className="size-4" strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t("constraints")}</span>
          <textarea
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            placeholder={t("constraintsPlaceholder")}
            rows={3}
            className="resize-none rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-[15px] outline-none placeholder:text-muted focus-visible:border-accent"
          />
        </label>

        {error ? (
          <p role="alert" className="rounded-lg bg-danger-surface px-3 py-2.5 text-sm text-danger">
            {t("error")}
          </p>
        ) : null}
      </div>
    </Sheet>
  );
}
