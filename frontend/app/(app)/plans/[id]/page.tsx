import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";

export async function generateMetadata(props: PageProps<"/plans/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const t = await getTranslations("pages.planDetail");
  return { title: t("title", { id }) };
}

export default async function Page(props: PageProps<"/plans/[id]">) {
  const { id } = await props.params;
  const t = await getTranslations("pages.planDetail");

  return (
    <>
      <PageHeader title={t("title", { id })} description={t("description")} />
      <Placeholder
        endpoints={[
          "GET /plan/:id",
          "PATCH /plan/:id",
          "DELETE /plan/:id",
        ]}
      />
    </>
  );
}
