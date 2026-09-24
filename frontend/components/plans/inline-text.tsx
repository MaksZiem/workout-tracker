"use client";

import { useState } from "react";

/**
 * Tekst edytowalny na miejscu: wygląda jak nagłówek, na fokus pokazuje pole.
 * Zapis po Enter lub opuszczeniu pola; Escape przywraca poprzednią wartość.
 * Rodzic podaje `key` zależny od wartości, żeby zewnętrzna zmiana odświeżyła szkic.
 */
export function InlineText({
  value,
  label,
  placeholder,
  required = false,
  multiline = false,
  className,
  onCommit,
  autoFocus = false,
}: {
  value: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  className: string;
  onCommit: (value: string) => void;
  autoFocus?: boolean;
}) {
  const [draft, setDraft] = useState(value);

  const commit = () => {
    const next = draft.trim();
    if (required && !next) {
      setDraft(value);
      return;
    }
    if (next !== value) onCommit(next);
  };

  const shared = {
    value: draft,
    "aria-label": label,
    placeholder,
    onChange: (e: { target: { value: string } }) => setDraft(e.target.value),
    onBlur: commit,
    className: `w-full rounded-lg border border-transparent bg-transparent px-2 -mx-2 outline-none transition-colors placeholder:text-muted hover:border-border focus-visible:border-accent focus-visible:bg-surface ${className}`,
  };

  return multiline ? (
    <textarea
      {...shared}
      autoFocus={autoFocus}
      rows={1}
      onKeyDown={(e) => {
        if (e.key === "Escape") setDraft(value);
      }}
      // Pole rośnie z tekstem (field-sizing), bez przewijania w środku.
      style={{ fieldSizing: "content" } as React.CSSProperties}
    />
  ) : (
    <input
      {...shared}
      autoFocus={autoFocus}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraft(value);
          requestAnimationFrame(() => e.currentTarget?.blur());
        }
      }}
    />
  );
}
