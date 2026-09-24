"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { signUp, type AuthFormState } from "@/lib/auth/actions";
import { Field, FormError, SubmitButton } from "./form-fields";

export function SignUpForm() {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signUp, {});

  return (
    <form action={action} className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold tracking-tight">{t("signUp.title")}</h1>

      <FormError message={state.error ? t(`errors.${state.error}`) : undefined} details={state.details} />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label={t("fields.name")}
          name="name"
          autoComplete="given-name"
          required
          defaultValue={state.values?.name}
        />
        <Field
          label={t("fields.surname")}
          name="surname"
          autoComplete="family-name"
          required
          defaultValue={state.values?.surname}
        />
      </div>
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
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={24}
        hint={t("fields.passwordHint")}
      />
      <SubmitButton pending={pending} label={t("signUp.submit")} pendingLabel={t("signUp.pending")} />

      <p className="text-sm text-muted">
        {t("signUp.hasAccount")}{" "}
        <Link href="/login" className="font-medium text-accent underline">
          {t("signUp.toSignIn")}
        </Link>
      </p>
    </form>
  );
}
