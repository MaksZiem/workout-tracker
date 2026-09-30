"use client";

import { Fragment, type ReactNode } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { InfoTip } from "@/components/ui/info-tip";
import { estimatedOneRepMax as epley } from "@/lib/log/model";
import { roundKg } from "@/lib/stats/model";

/**
 * Wyjaśnienie szacowanego 1RM. Z serią (`set`) pokazuje rachunek właśnie tej liczby:
 * „80 kg × 8: 80 × (1 + 8 ÷ 30) = 101,3 kg” i ewentualne zaokrąglenie do 0,5 kg,
 * pod spodem ogólne objaśnienie wzoru Epleya. Bez serii: samo objaśnienie.
 * `trigger` zamienia ikonkę „?” na podkreśloną wartość.
 */
export function E1rmTip({
  set,
  trigger,
  rounded = true,
}: {
  set?: { weight: number; reps: number } | null;
  trigger?: ReactNode;
  /** Czy obok jest wartość zaokrąglona do 0,5 kg (wtedy dopisujemy, skąd różnica). */
  rounded?: boolean;
}) {
  const t = useTranslations("tips.e1rm");
  const format = useFormatter();
  const rich = {
    p: (chunks: ReactNode) => <p>{chunks}</p>,
    b: (chunks: ReactNode) => <strong>{chunks}</strong>,
  };
  const known = set && set.weight > 0 && set.reps > 0;
  const exact = known ? Math.round(epley(set.weight, set.reps) * 10) / 10 : 0;
  const shown = known ? roundKg(epley(set.weight, set.reps)) : 0;
  const kg = (v: number) => format.number(v, { maximumFractionDigits: 2 });

  return (
    <InfoTip label={known ? t("calcLabel") : t("label")} trigger={trigger}>
      {/* Każdy t.rich numeruje swoje <p> od p0: osobne fragmenty, żeby klucze się nie zderzały. */}
      {known ? <Fragment key="yours">{t.rich("yours", { ...rich, weight: kg(set.weight), reps: set.reps, value: kg(exact) })}</Fragment> : null}
      {known && rounded && shown !== exact ? <Fragment key="rounded">{t.rich("rounded", { ...rich, shown: kg(shown) })}</Fragment> : null}
      <Fragment key="body">{t.rich("body", rich)}</Fragment>
    </InfoTip>
  );
}
