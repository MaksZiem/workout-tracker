import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";

export async function generateMetadata(props: PageProps<"/workouts/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const t = await getTranslations("pages.workoutDetail");
  return { title: t("title", { id }) };
}

export default async function Page(props: PageProps<"/workouts/[id]">) {
  const { id } = await props.params;
  const t = await getTranslations("pages.workoutDetail");

  return (
    <>
      <PageHeader title={t("title", { id })} description={t("description")} />
      <Placeholder
        endpoints={[
          "GET /workout/:id",
          "PATCH /workout/:id",
          "PATCH /workout/:workoutId/exercise/:weId",
          "DELETE /workout/:workoutId/exercise/:weId",
        ]}
      />
    </>
  );
}
