import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.workouts");
  return { title: t("title") };
}

export default async function Page() {
  const t = await getTranslations("pages.workouts");

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <Placeholder
        endpoints={[
          "GET /workout?from&to",
          "POST /workout/:id/duplicate",
          "DELETE /workout/:id",
        ]}
      />
    </>
  );
}
