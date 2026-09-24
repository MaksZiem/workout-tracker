import type { Locale } from "./i18n/config";
import type messages from "./messages/pl.json";

// Typowane klucze tłumaczeń: literówka w t("nav.planer") to błąd kompilacji.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
