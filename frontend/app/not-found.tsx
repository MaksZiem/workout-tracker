import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">{t("errors.notFoundTitle")}</h1>
      <p className="mt-2 text-muted">{t("errors.notFoundDescription")}</p>
      <Link href="/" className="mt-6 text-sm font-medium text-accent underline">
        {t("common.backToDashboard")}
      </Link>
    </main>
  );
}
