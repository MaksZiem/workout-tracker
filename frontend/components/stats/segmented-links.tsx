import Link from "next/link";

/** Przełącznik segmentowy na linkach (stan w URL), w tym samym stylu co w planerze. */
export function SegmentedLinks({
  label,
  items,
}: {
  label: string;
  items: { key: string; label: string; href: string; active: boolean }[];
}) {
  return (
    <nav aria-label={label} className="flex max-w-full overflow-x-auto rounded-lg bg-surface-muted p-1">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          scroll={false}
          aria-current={item.active ? "page" : undefined}
          className={`flex h-9 shrink-0 items-center rounded-md px-3 text-sm font-medium whitespace-nowrap ${
            item.active ? "bg-surface text-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
