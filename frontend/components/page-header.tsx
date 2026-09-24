import type { ReactNode } from "react";

export function PageHeader({ title, description }: { title: ReactNode; description?: ReactNode }) {
  return (
    <header className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {description ? <p className="mt-2 max-w-[65ch] text-muted">{description}</p> : null}
    </header>
  );
}
