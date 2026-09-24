import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";

export async function generateMetadata(props: PageProps<"/templates/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const t = await getTranslations("pages.templateDetail");
  return { title: t("title", { id }) };
}

export default async function Page(props: PageProps<"/templates/[id]">) {
  const { id } = await props.params;
  const t = await getTranslations("pages.templateDetail");

  return (
    <>
      <PageHeader title={t("title", { id })} description={t("description")} />
      <Placeholder
        endpoints={[
          "GET /template/:id",
          "PATCH /template/:id",
          "POST /template/:templateId/exercise",
          "PATCH /template/:templateId/exercise/:teId",
          "DELETE /template/:templateId/exercise/:teId",
        ]}
      />
    </>
  );
}
