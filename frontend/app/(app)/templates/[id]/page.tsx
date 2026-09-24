import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { localDate } from "@/lib/log/model";
import { loadTemplate } from "@/lib/templates/load";
import { TemplatePage } from "@/components/templates/template-page";

type Props = PageProps<"/templates/[id]">;

async function templateId(props: Props) {
  const { id } = await props.params;
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const id = await templateId(props);
  const detail = id ? await loadTemplate(id) : null;
  const t = await getTranslations("pages.templates");
  return { title: detail?.template.name ?? t("title") };
}

export default async function TemplateDetailPage(props: Props) {
  const id = await templateId(props);
  if (id === null) notFound();
  const detail = await loadTemplate(id);
  if (!detail) notFound();

  // key: po odświeżeniu danych z serwera stan edytora zaczyna od nowa.
  return <TemplatePage key={detail.template.id} detail={detail} today={localDate()} />;
}
