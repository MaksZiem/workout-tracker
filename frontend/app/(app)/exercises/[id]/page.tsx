import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";

export async function generateMetadata(props: PageProps<"/exercises/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const t = await getTranslations("pages.exerciseDetail");
  return { title: t("title", { id }) };
}

export default async function Page(props: PageProps<"/exercises/[id]">) {
  const { id } = await props.params;
  const t = await getTranslations("pages.exerciseDetail");

  return (
    <>
      <PageHeader title={t("title", { id })} description={t("description")} />
      <Placeholder
        endpoints={[
          "GET /exercise/:id",
          "GET /exercise/:id/similar",
          "GET /stats/exercise/:exerciseId/records",
          "GET /stats/exercise/:exerciseId/progress",
        ]}
      />
    </>
  );
}
