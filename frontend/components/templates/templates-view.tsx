"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, Plus } from "lucide-react";
import { clientApi } from "@/lib/api/client";
import { unwrap } from "@/lib/api/errors";
import type { TemplateGroup, TemplateSummary } from "@/lib/templates/model";
import { Sheet } from "@/components/ui/sheet";

/** Wszystkie szablony: pojedyncze treningi, potem dni każdego planu. */
export function TemplatesView({ groups }: { groups: TemplateGroup[] }) {
  const t = useTranslations("pages.templates");
  const [creating, setCreating] = useState(false);
  const total = groups.reduce((sum, g) => sum + g.templates.length, 0);
  const standalone = groups.find((g) => g.plan === null)?.templates ?? [];
  const planGroups = groups.filter((g) => g.plan !== null);

  const newButton = (
    <button
      type="button"
      onClick={() => setCreating(true)}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90 sm:w-auto"
    >
      <Plus className="size-4" strokeWidth={2.5} aria-hidden />
      {t("new")}
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
          {total ? <p className="mt-1 text-sm text-muted tabular-nums">{t("count", { count: total })}</p> : null}
        </div>
        {total ? newButton : null}
      </header>

      {total === 0 ? (
        <div className="mt-6 max-w-xl rounded-xl border border-border bg-surface p-5">
          <p className="text-[17px] font-semibold">{t("empty.title")}</p>
          <p className="mt-1 text-sm text-muted">{t("empty.body")}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            {newButton}
            <Link href="/plans" className="flex h-11 items-center justify-center text-sm font-medium text-accent underline-offset-2 hover:underline">
              {t("empty.toPlans")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          <Group title={t("standalone")} meta={t("count", { count: standalone.length })}>
            {standalone.length ? (
              <Rows templates={standalone} />
            ) : (
              <div className="rounded-xl border border-border bg-surface px-4 py-4 sm:px-5">
                <p className="text-sm text-muted">{t("standaloneEmpty")}</p>
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="-ml-3 mt-1 flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-accent hover:bg-accent-surface"
                >
                  <Plus className="size-4" strokeWidth={2.5} aria-hidden />
                  {t("new")}
                </button>
              </div>
            )}
          </Group>

          {planGroups.map((group) =>
            group.plan ? (
              <Group
                key={group.plan.id}
                title={group.plan.name}
                meta={t("days", { count: group.templates.length })}
                link={{ href: `/plans/${group.plan.id}`, label: t("openPlan"), a11y: t("openPlanNamed", { name: group.plan.name }) }}
              >
                <Rows templates={group.templates} />
              </Group>
            ) : null,
          )}
        </div>
      )}

      <NewTemplateSheet open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

function Group({
  title,
  meta,
  link,
  children,
}: {
  title: string;
  meta: string;
  link?: { href: string; label: string; a11y: string };
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title}>
      <div className="mb-2 flex min-h-10 items-center justify-between gap-4">
        {/* Telefon: licznik pod nazwą, żeby długa nazwa planu się nie ucinała. */}
        <div className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-2">
          <h2 className="text-[17px] leading-snug font-semibold sm:truncate">{title}</h2>
          <span className="shrink-0 text-[13px] text-muted tabular-nums">{meta}</span>
        </div>
        {link ? (
          <Link
            href={link.href}
            aria-label={link.a11y}
            className="-mr-2 flex h-10 shrink-0 items-center rounded-lg px-2 text-sm font-medium text-accent hover:bg-accent-surface"
          >
            {link.label}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Rows({ templates }: { templates: TemplateSummary[] }) {
  const t = useTranslations("pages.templates");
  const tGroup = useTranslations("enums.muscleGroup");
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {templates.map((tpl) => (
        <li key={tpl.id}>
          <Link
            href={`/templates/${tpl.id}`}
            className="flex items-center gap-4 px-4 py-4 hover:bg-surface-muted sm:px-5"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] leading-snug font-semibold">{tpl.name}</span>
              <span className="mt-0.5 block truncate text-[13px] text-muted tabular-nums">
                {tpl.inProgress ? <span className="font-medium text-foreground">{t("inProgress")} · </span> : null}
                {tpl.exerciseCount
                  ? [t("exercises", { count: tpl.exerciseCount }), ...tpl.muscleGroups.map((g) => tGroup(g))].join(" · ")
                  : t("noExercises")}
              </span>
              {tpl.notes ? <span className="mt-1 block truncate text-[13px] text-muted">{tpl.notes}</span> : null}
            </span>
            <ChevronRight className="size-5 shrink-0 text-muted" strokeWidth={2} aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function NewTemplateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("pages.templates.newSheet");
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
      const template = await unwrap(clientApi.POST("/template", { body: { name: name.trim() } }));
      router.push(`/templates/${template.id}`);
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
          form="new-template"
          disabled={!name.trim() || pending}
          className="h-12 w-full rounded-lg bg-accent text-[15px] font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pending ? t("pending") : t("submit")}
        </button>
      }
    >
      <form id="new-template" onSubmit={submit} className="flex flex-col gap-1.5">
        <p className="mb-3 text-sm text-muted">{t("hint")}</p>
        <label htmlFor="template-name" className="text-sm font-medium">
          {t("name")}
        </label>
        <input
          id="template-name"
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
