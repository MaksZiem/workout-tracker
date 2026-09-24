import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { loadTemplates } from "@/lib/templates/load";
import { TemplatesView } from "@/components/templates/templates-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.templates");
  return { title: t("title") };
}

export default async function TemplatesPage() {
  const groups = await loadTemplates();
  return <TemplatesView groups={groups} />;
}
