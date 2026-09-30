"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { InfoTip } from "@/components/ui/info-tip";

export type TipKey =
  | "e1rm"
  | "maxWeight"
  | "bestSet"
  | "volume"
  | "avgSets"
  | "topGroup"
  | "adherence"
  | "weekly"
  | "weeklyChange"
  | "streak"
  | "muscles"
  | "repRanges"
  | "stagnation"
  | "records"
  | "repRecords"
  | "repRecordActual";

/** Wyjaśnienie pojęcia ze statystyk (treść w `tips.*`, z <p> i <b>). */
export function StatsTip({
  tip,
  values,
  trigger,
}: {
  tip: TipKey;
  values?: Record<string, string | number>;
  trigger?: ReactNode;
}) {
  const t = useTranslations("tips");
  return (
    <InfoTip label={t(`${tip}.label`, values)} trigger={trigger}>
      {t.rich(`${tip}.body`, {
        ...values,
        p: (chunks) => <p>{chunks}</p>,
        b: (chunks) => <strong>{chunks}</strong>,
      })}
    </InfoTip>
  );
}
