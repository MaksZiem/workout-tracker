"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { useFormatter } from "next-intl";
import { Trophy } from "lucide-react";
import { displayDate } from "@/lib/planner/dates";
import { linePath, nearestIndex, niceScale, xPositions, yPosition } from "@/lib/stats/chart";

export type ChartPoint = { date: string; value: number; detail: string };

/**
 * Wykres postępu ćwiczenia. Odczyt nad wykresem pokazuje ostatnią sesję,
 * a po najechaniu (wskaźnik) lub strzałkach (klawiatura) sesję pod celownikiem.
 */
export function LineChart({
  points,
  recordIndex,
  change,
  labels,
}: {
  points: ChartPoint[];
  recordIndex: number | null;
  /** Zmiana w okresie, gotowa do wyświetlenia (albo null przy jednej sesji). */
  change: string;
  labels: { latest: string; record: string; chart: string };
}) {
  const format = useFormatter();
  const [active, setActive] = useState<number | null>(null);

  const xs = xPositions(points.map((p) => p.date));
  const { lo, hi, ticks } = niceScale(points.map((p) => p.value));
  const ys = points.map((p) => yPosition(p.value, lo, hi));
  const last = points.length - 1;
  const shown = active ?? last;
  const point = points[shown];

  // To samo zaokrąglenie (0,5 kg) co w liście sesji i na kartach.
  const kg = (v: number) => format.number(Math.round(v * 2) / 2, { maximumFractionDigits: 1 });
  const longDate = (iso: string) =>
    format.dateTime(displayDate(iso), { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const shortDate = (iso: string) => format.dateTime(displayDate(iso), { day: "numeric", month: "short", timeZone: "UTC" });

  const onPointer = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActive(nearestIndex(xs, (e.clientX - rect.left) / rect.width));
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 };
    let next: number | null = null;
    if (e.key in moves) next = Math.min(last, Math.max(0, shown + moves[e.key]));
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
  };

  // Etykiety osi X: pierwsza, środkowa i ostatnia sesja (bez powtórzeń).
  const xLabels = [...new Set([0, Math.round(last / 2), last])].filter((i) => points.length > 1 || i === 0);

  return (
    <div>
      <div className="min-h-[5.5rem]">
        <p className="text-[13px] text-muted tabular-nums">
          {active === null ? `${labels.latest} · ${longDate(point.date)}` : longDate(point.date)}
        </p>
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
          <span className="text-3xl font-semibold tracking-tight tabular-nums">{kg(point.value)}</span>
          <span className="text-muted">kg</span>
          {shown === recordIndex ? (
            <span className="flex items-center gap-1 self-center text-[13px] font-medium text-pr">
              <Trophy className="size-3.5" strokeWidth={2.25} aria-hidden />
              {labels.record}
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 text-[13px] text-muted tabular-nums">{active === null ? change : point.detail}</p>
      </div>

      <div className="relative mt-4 h-56 sm:h-72">
        {/* Obszar rysowania: miejsce na etykiety osi Y z lewej i osi X na dole. */}
        <div className="absolute inset-y-2 right-2 bottom-7 left-12">
          {ticks.map((tick) => (
            <div
              key={tick}
              aria-hidden
              className="absolute inset-x-0 border-t border-border"
              style={{ bottom: `${yPosition(tick, lo, hi) * 100}%` }}
            >
              <span className="absolute -left-12 w-10 -translate-y-1/2 text-right text-[11px] text-muted tabular-nums">
                {kg(tick)}
              </span>
            </div>
          ))}

          {points.length > 1 ? (
            <svg aria-hidden viewBox="0 0 1000 1000" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible text-foreground">
              <path
                d={linePath(xs, ys, 1000, 1000)}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          ) : null}

          {active !== null ? (
            <div aria-hidden className="absolute inset-y-0 w-px bg-muted/60" style={{ left: `${xs[active] * 100}%` }} />
          ) : null}

          {points.map((p, i) => {
            const isRecord = i === recordIndex;
            const isShown = i === shown;
            if (!isRecord && !isShown && points.length > 60) return null;
            return (
              <span
                key={`${p.date}-${i}`}
                aria-hidden
                className={`absolute -translate-x-1/2 translate-y-1/2 rounded-full ring-2 ring-surface transition-[width,height] duration-150 ${
                  isRecord ? "bg-pr" : "bg-foreground"
                } ${isShown ? "size-3" : isRecord ? "size-2.5" : "size-1.5"}`}
                style={{ left: `${xs[i] * 100}%`, bottom: `${ys[i] * 100}%` }}
              />
            );
          })}

          {/* Warstwa interakcji: wskaźnik i klawiatura. */}
          <div
            role="slider"
            tabIndex={0}
            aria-label={labels.chart}
            aria-valuemin={0}
            aria-valuemax={last}
            aria-valuenow={shown}
            aria-valuetext={`${longDate(point.date)}: ${kg(point.value)} kg. ${point.detail}`}
            onPointerMove={onPointer}
            onPointerDown={onPointer}
            onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
            onKeyDown={onKey}
            onBlur={() => setActive(null)}
            className="absolute -inset-x-2 inset-y-0 cursor-crosshair touch-pan-y rounded-md"
          />

          <div aria-hidden className="absolute inset-x-0 -bottom-6 h-4 text-[11px] text-muted tabular-nums">
            {xLabels.map((i) => (
              <span
                key={i}
                className={`absolute whitespace-nowrap ${
                  points.length === 1 ? "-translate-x-1/2" : i === 0 ? "" : i === last ? "-translate-x-full" : "-translate-x-1/2"
                }`}
                style={{ left: `${xs[i] * 100}%` }}
              >
                {shortDate(points[i].date)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
