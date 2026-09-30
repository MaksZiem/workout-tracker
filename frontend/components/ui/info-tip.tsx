"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CircleHelp } from "lucide-react";

const WIDTH = 288;
const GAP = 6;
const EDGE = 8;

/**
 * Wyjaśnienie pojęcia w dymku. Otwiera się po najechaniu myszą, kliknięciu/dotknięciu
 * albo fokusie z klawiatury; zamyka po Escape, kliknięciu obok i przewinięciu.
 * Dymek trafia do portalu w <body> albo otwartym <dialog> (można go użyć np. wewnątrz <p>) z pozycją `fixed`
 * przyciętą do ekranu, więc nie ucieka za krawędź na telefonie.
 * Domyślny wyzwalacz to ikonka „?”; `trigger` zamienia go na podkreślony tekst.
 */
export function InfoTip({ label, children, trigger }: { label: string; children: ReactNode; trigger?: ReactNode }) {
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  // „pinned” = otwarty kliknięciem: nie zamyka się po zjechaniu myszą.
  const [open, setOpen] = useState<false | "hover" | "pinned">(false);
  const [container, setContainer] = useState<Element | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const button = buttonRef.current!.getBoundingClientRect();
    const height = tipRef.current?.offsetHeight ?? 0;
    const width = Math.min(WIDTH, window.innerWidth - 2 * EDGE);
    const left = Math.min(Math.max(button.left + button.width / 2 - width / 2, EDGE), window.innerWidth - width - EDGE);
    const below = button.bottom + GAP;
    // Brak miejsca pod spodem: nad wyzwalaczem.
    const top = below + height > window.innerHeight - EDGE && button.top - GAP - height > EDGE ? button.top - GAP - height : below;
    setPosition({ left, top });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!buttonRef.current?.contains(target) && !tipRef.current?.contains(target)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      close();
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, { capture: true, passive: true });
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const show = (button: HTMLElement, mode: "hover" | "pinned") => {
    // W otwartym modalu reszta strony jest nieaktywna: dymek musi być w samym <dialog>.
    setContainer(button.closest("dialog[open]") ?? document.body);
    // Klik na otwartym (przypiętym) dymku go zamyka; najechanie nie zmienia przypiętego.
    setOpen((v) => (mode === "pinned" ? (v === "pinned" ? false : "pinned") : v || "hover"));
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={trigger ? undefined : label}
        aria-expanded={!!open}
        aria-describedby={open ? id : undefined}
        onClick={(e) => {
          // Klik w środku linku (np. karta ćwiczenia) nie ma nawigować.
          e.preventDefault();
          e.stopPropagation();
          show(e.currentTarget, "pinned");
        }}
        onPointerEnter={(e) => e.pointerType === "mouse" && show(e.currentTarget, "hover")}
        onPointerLeave={(e) => e.pointerType === "mouse" && setOpen((v) => (v === "hover" ? false : v))}
        onFocus={(e) => e.target.matches(":focus-visible") && show(e.currentTarget, "hover")}
        onBlur={() => setOpen((v) => (v === "hover" ? false : v))}
        className={
          trigger
            ? "cursor-pointer rounded-sm underline decoration-muted/70 decoration-dotted underline-offset-[3px] hover:decoration-foreground"
            : "-m-1 inline-grid size-6 shrink-0 cursor-pointer place-items-center rounded-full align-middle text-muted hover:bg-surface-muted hover:text-foreground aria-expanded:text-foreground"
        }
      >
        {trigger ?? <CircleHelp className="size-3.5" strokeWidth={2} aria-hidden />}
      </button>
      {open && container
        ? createPortal(
            <div
              ref={tipRef}
              id={id}
              role="tooltip"
              style={{
                position: "fixed",
                left: position?.left ?? 0,
                top: position?.top ?? 0,
                width: `min(${WIDTH}px, calc(100vw - ${2 * EDGE}px))`,
                visibility: position ? "visible" : "hidden",
              }}
              className="z-50 rounded-lg border border-border bg-surface px-3.5 py-3 text-left text-[13px] leading-relaxed font-normal tracking-normal text-foreground normal-case shadow-[0_8px_24px_-8px_oklch(0_0_0/0.35)]"
            >
              <p className="mb-1 font-semibold">{label}</p>
              <div className="flex flex-col gap-1.5 text-muted [&_strong]:font-medium [&_strong]:text-foreground">{children}</div>
            </div>,
            container,
          )
        : null}
    </>
  );
}
