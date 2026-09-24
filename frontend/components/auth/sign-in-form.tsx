"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { signIn, type AuthFormState } from "@/lib/auth/actions";
import { Field, FormError, SubmitButton } from "./form-fields";

export function SignInForm({ next, expired }: { next?: string; expired?: boolean }) {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signIn, {});

  return (
    <form action={action} className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold tracking-tight">{t("signIn.title")}</h1>

      {expired && !state.error ? (
        <p role="status" className="rounded-md bg-surface-muted px-3 py-2.5 text-sm">
          {t("signIn.expired")}
        </p>
      ) : null}
      <FormError message={state.error ? t(`errors.${state.error}`) : undefined} details={state.details} />

      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Field
        label={t("fields.email")}
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
      />
      <Field
        label={t("fields.password")}
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <SubmitButton pending={pending} label={t("signIn.submit")} pendingLabel={t("signIn.pending")} />

      <p className="text-sm text-muted">
        {t("signIn.noAccount")}{" "}
        <Link href="/register" className="font-medium text-accent underline">
          {t("signIn.toSignUp")}
        </Link>
      </p>
    </form>
  );
}
