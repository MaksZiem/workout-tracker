import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/session";
import { loadAdminOverview } from "@/lib/admin/load";
import { parseUserQuery } from "@/lib/admin/users-query";
import { AdminView } from "@/components/admin/admin-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.admin");
  return { title: t("title") };
}

export default async function Page(props: PageProps<"/admin">) {
  const query = parseUserQuery(await props.searchParams);
  const [me, overview] = await Promise.all([requireAdmin(), loadAdminOverview(query)]);
  return <AdminView catalog={overview.catalog} users={overview.users} query={query} meId={me.id} />;
}
