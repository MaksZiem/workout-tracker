"use client";

import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";

/** Wyszukiwarka katalogu (Graphite Muted 44px) z czyszczeniem; wspólna dla katalogu i panelu admina. */
export function SearchField({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const t = useTranslations("pages.exercises");
  return (
    <label className="flex h-11 items-center gap-2 rounded-lg bg-surface-muted px-3 focus-within:ring-2 focus-within:ring-accent sm:max-w-sm">
      <span className="sr-only">{label}</span>
      <Search className="size-4 shrink-0 text-muted" strokeWidth={2} aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        className="h-full w-full bg-transparent text-[15px] outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("clear")}
          className="-mr-1.5 grid size-8 shrink-0 place-items-center rounded-md text-muted hover:bg-surface hover:text-foreground"
        >
          <X className="size-4" strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}
    </label>
  );
}
