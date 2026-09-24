import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.planner");
  return { title: t("title") };
}

export default async function Page() {
  const t = await getTranslations("pages.planner");

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <Placeholder
        endpoints={[
          "GET /planner/scheduled",
          "POST /planner/scheduled",
          "POST /planner/generate",
          "PATCH /planner/scheduled/:id",
          "POST /planner/scheduled/:id/start",
          "DELETE /planner/scheduled/:id",
        ]}
      />
    </>
  );
}
