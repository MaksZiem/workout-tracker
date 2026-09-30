"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import type { WeeklyStats } from "@/lib/api/extra-types";
import { addDays, displayDate, plainSpaces, weekStart } from "@/lib/planner/dates";
import { niceScale, yPosition } from "@/lib/stats/chart";
import { WEEKLY_BASELINE, weeklyChange } from "@/lib/stats/model";
import { StatsTip } from "./stats-tip";

/** Najwięcej tygodni na wykresie: przy „całym czasie” pokazujemy ostatni rok. */
const MAX_WEEKS = 52;
/** Tyle etykiet osi X mieści się bez nachodzenia (także na telefonie). */
const MAX_X_LABELS = 6;

/**
 * Objętość tydzień po tygodniu. Odczyt nad wykresem pokazuje ostatni pełny tydzień,
 * a po najechaniu/dotknięciu (lub strzałkach) tydzień pod kursorem.
 */
export function WeeklyVolume({ weeks, today }: { weeks: WeeklyStats[]; today: string }) {
  const t = useTranslations("pages.stats.weekly");
  const format = useFormatter();
  const [active, setActive] = useState<number | null>(null);

  const shown = weeks.slice(-MAX_WEEKS);
  if (!shown.some((w) => w.volume > 0)) {
    return <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">{t("empty")}</p>;
  }

  const current = weekStart(today);
  const last = shown.length - 1;
  const complete = shown.filter((w) => w.weekStart < current);
  const average = complete.length ? complete.reduce((sum, w) => sum + w.volume, 0) / complete.length : null;
  const change = weeklyChange(weeks, today);
  // Bez aktywnego tygodnia: ostatni pełny (bieżący zwykle jest niepełny i mylący).
  const fallback = change ? shown.findIndex((w) => w.weekStart === change.week.weekStart) : -1;
  const shownIndex = active ?? (fallback >= 0 ? fallback : shown.findLastIndex((w) => w.weekStart < current));
  const week = shown[Math.max(shownIndex, 0)];

  const { hi, ticks } = niceScale([0, ...shown.map((w) => w.volume)]);
  const inTons = hi >= 10_000;
  const volume = (v: number) =>
    inTons ? t("tons", { value: format.number(v / 1000, { maximumFractionDigits: 1 }) }) : `${format.number(Math.round(v))} kg`;
  const axis = (v: number) => (inTons ? format.number(v / 1000, { maximumFractionDigits: 1 }) : format.number(v));
  const weekRange = (w: WeeklyStats, year = false) =>
    plainSpaces(
      format.dateTimeRange(displayDate(w.weekStart), displayDate(addDays(w.weekStart, 6)), {
        day: "numeric",
        month: "short",
        year: year ? "numeric" : undefined,
        timeZone: "UTC",
      }),
    );
  const details = (w: WeeklyStats) => `${t("workouts", { count: w.workouts })} · ${t("sets", { count: w.sets })}`;
  const percent = (v: number) => format.number(v, { style: "percent", maximumFractionDigits: 0, signDisplay: "exceptZero" });

  const onPointer = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActive(Math.min(last, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * shown.length))));
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 };
    let next: number | null = null;
    if (e.key in moves) next = Math.min(last, Math.max(0, shownIndex + moves[e.key]));
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
  };

  const xLabels = axisLabels(shown, (iso, withYear) =>
    format.dateTime(displayDate(iso), withYear ? { month: "short", year: "numeric", timeZone: "UTC" } : { month: "short", timeZone: "UTC" }),
    (iso) => format.dateTime(displayDate(iso), { day: "numeric", month: "short", timeZone: "UTC" }),
  );

  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      {/* Odczyt: stała wysokość, żeby wykres nie skakał przy zmianie tygodnia. */}
      <div className="min-h-[6.75rem]">
        <p className="text-[13px] text-muted tabular-nums">
          {active === null ? `${t("lastWeek")} · ${weekRange(week)}` : weekRange(week, true)}
          {week.weekStart === current ? ` · ${t("partial")}` : null}
        </p>
        <p className="mt-0.5 text-3xl font-semibold tracking-tight tabular-nums">{volume(week.volume)}</p>
        <p className="mt-0.5 text-[13px] text-muted tabular-nums">{details(week)}</p>
        {active === null && change ? (
          <p className="mt-0.5 text-[13px] text-muted tabular-nums">
            <span className={change.change >= 0 ? "font-medium text-foreground" : ""}>
              {t("vsAverage", { value: percent(change.change), weeks: WEEKLY_BASELINE })}
            </span>{" "}
            <StatsTip tip="weeklyChange" values={{ weeks: WEEKLY_BASELINE }} />
          </p>
        ) : null}
      </div>

      <div className="relative mt-4 h-48 sm:h-60">
        {/* Obszar rysowania: miejsce na oś Y z lewej i oś X na dole. */}
        <div className="absolute top-2 right-1 bottom-7 left-11">
          {ticks.map((tick) => (
            <div
              key={tick}
              aria-hidden
              className="absolute inset-x-0 border-t border-border"
              style={{ bottom: `${yPosition(tick, 0, hi) * 100}%` }}
            >
              <span className="absolute -left-11 w-9 -translate-y-1/2 text-right text-[11px] text-muted tabular-nums">{axis(tick)}</span>
            </div>
          ))}
          <span aria-hidden className="absolute -top-5 -left-11 w-9 text-right text-[11px] text-muted">
            {inTons ? "t" : "kg"}
          </span>

          <div aria-hidden className="absolute inset-0 flex items-end gap-[2px] sm:gap-[3px]">
            {shown.map((w, i) => {
              const partial = w.weekStart === current;
              const isActive = i === shownIndex;
              const tone = partial ? "bg-foreground/25" : isActive || active === null ? "bg-foreground/80" : "bg-foreground/35";
              return (
                <span key={w.weekStart} className="flex h-full min-w-0 flex-1 items-end">
                  <span
                    className={`block w-full rounded-t-[3px] transition-colors duration-100 ${tone} ${
                      isActive && active !== null ? "outline-2 outline-offset-1 outline-foreground/60" : ""
                    }`}
                    // Tydzień bez treningu: cienka kreska zamiast pustego miejsca.
                    style={{ height: w.volume > 0 ? `${Math.max(yPosition(w.volume, 0, hi) * 100, 1.5)}%` : "1px" }}
                  />
                </span>
              );
            })}
          </div>

          {average !== null && average > 0 ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 border-t-[1.5px] border-dashed border-accent"
              style={{ bottom: `${yPosition(average, 0, hi) * 100}%` }}
            >
              <span className="absolute right-0 bottom-0.5 rounded bg-surface/90 px-1 text-[11px] font-medium text-accent tabular-nums">
                {t("average", { value: volume(average) })}
              </span>
            </div>
          ) : null}

          {/* Warstwa interakcji: wskaźnik i klawiatura. */}
          <div
            role="slider"
            tabIndex={0}
            aria-label={t("chart")}
            aria-valuemin={0}
            aria-valuemax={last}
            aria-valuenow={shownIndex}
            aria-valuetext={`${weekRange(week, true)}: ${volume(week.volume)}, ${details(week)}`}
            onPointerMove={onPointer}
            onPointerDown={onPointer}
            onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
            onKeyDown={onKey}
            onBlur={() => setActive(null)}
            className="absolute -inset-x-1 inset-y-0 cursor-crosshair touch-pan-y rounded-md"
          />

          <div aria-hidden className="absolute inset-x-0 -bottom-6 h-4 text-[11px] text-muted tabular-nums">
            {xLabels.map(({ index, text }) => (
              <span
                key={index}
                className={`absolute whitespace-nowrap ${index === 0 ? "" : index === last ? "-translate-x-full" : "-translate-x-1/2"}`}
                style={{ left: index === 0 ? 0 : index === last ? "100%" : `${((index + 0.5) / shown.length) * 100}%` }}
              >
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      <ul aria-hidden className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <li className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm bg-foreground/80" />
          {t("legendWeek")}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm bg-foreground/25" />
          {t("legendCurrent")}
        </li>
        {average !== null && average > 0 ? (
          <li className="flex items-center gap-1.5">
            <span className="inline-block w-4 border-t-[1.5px] border-dashed border-accent" />
            {t("legendAverage")}
          </li>
        ) : null}
      </ul>
    </div>
  );
}

/**
 * Etykiety osi X. Krótki zakres: daty tygodni co kilka słupków (zawsze z ostatnim).
 * Długi zakres: początki miesięcy, z rokiem przy pierwszej etykiecie i przy styczniu.
 */
function axisLabels(
  weeks: WeeklyStats[],
  month: (iso: string, withYear: boolean) => string,
  day: (iso: string) => string,
): { index: number; text: string }[] {
  const n = weeks.length;
  if (n <= 16) {
    const step = Math.ceil(n / MAX_X_LABELS);
    const indices: number[] = [];
    for (let i = n - 1; i >= 0; i -= step) indices.unshift(i);
    return indices.map((index) => ({ index, text: day(weeks[index].weekStart) }));
  }

  // Tydzień, w którym zaczyna się miesiąc (jego niedziela wypada już w nowym miesiącu).
  const starts: number[] = [];
  weeks.forEach((w, i) => {
    const sunday = addDays(w.weekStart, 6);
    if (i === 0 || sunday.slice(0, 7) !== addDays(weeks[i - 1].weekStart, 6).slice(0, 7)) starts.push(i);
  });
  const step = Math.ceil(starts.length / MAX_X_LABELS);
  // Pierwsza etykieta tylko, gdy nie nachodzi na następną.
  const picked = starts.filter((_, k) => k % step === 0).filter((index, k, all) => k > 0 || all.length < 2 || all[1] - index >= 3);
  return picked.map((index, k) => {
    const iso = addDays(weeks[index].weekStart, 6);
    return { index, text: month(iso, k === 0 || iso.slice(5, 7) === "01") };
  });
}
