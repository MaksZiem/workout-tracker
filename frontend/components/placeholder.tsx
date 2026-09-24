import { getTranslations } from "next-intl/server";

/**
 * Tymczasowa zawartość ekranu: mówi, co tu powstanie i z jakich endpointów
 * będzie korzystać. Do usunięcia, gdy ekran dostanie prawdziwą implementację.
 */
export async function Placeholder({ endpoints }: { endpoints: string[] }) {
  const t = await getTranslations("common");

  return (
    <section className="rounded-lg border border-dashed border-border px-5 py-6">
      <p className="text-sm font-medium">{t("comingSoon")}</p>
      <h2 className="mt-4 text-xs font-medium text-muted">{t("endpoints")}</h2>
      <ul className="mt-2 flex flex-col gap-1 font-mono text-[13px] text-muted [overflow-wrap:anywhere]">
        {endpoints.map((endpoint) => (
          <li key={endpoint}>{endpoint}</li>
        ))}
      </ul>
    </section>
  );
}
