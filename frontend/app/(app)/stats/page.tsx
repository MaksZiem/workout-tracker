import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.stats");
  return { title: t("title") };
}

export default async function Page() {
  const t = await getTranslations("pages.stats");

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <Placeholder
        endpoints={[
          "GET /stats/summary",
          "GET /stats/exercise/:exerciseId/progress",
          "GET /stats/records",
          "GET /stats/muscle-groups",
          "GET /stats/frequency",
          "GET /stats/streak",
        ]}
      />
    </>
  );
}
