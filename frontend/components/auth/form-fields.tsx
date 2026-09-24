import type { InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  hint?: string;
};

export function Field({ label, name, hint, className = "", ...input }: FieldProps) {
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-describedby={hintId}
        className="h-11 rounded-md border border-border bg-surface px-3 text-[15px] placeholder:text-muted focus-visible:border-accent"
        {...input}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function FormError({ message, details }: { message?: string; details?: string[] }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-md bg-danger-surface px-3 py-2.5 text-sm text-danger">
      <p>{message}</p>
      {details?.length ? (
        <ul className="mt-1 list-disc pl-4">
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function SubmitButton({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="h-11 rounded-md bg-foreground px-4 text-[15px] font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
