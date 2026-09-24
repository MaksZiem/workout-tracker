// Operacje na datach YYYY-MM-DD (bez strefy czasowej; arytmetyka w UTC,
// tak jak backend w planner.service.ts). Tydzień zaczyna się w poniedziałek.

export type PlannerView = "week" | "month";

const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const toIso = (date: Date) => date.toISOString().slice(0, 10);

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(toDate(value).getTime());
}

export function addDays(iso: string, days: number) {
  const date = toDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

/** 0 = poniedziałek … 6 = niedziela. */
export function mondayIndex(iso: string) {
  return (toDate(iso).getUTCDay() + 6) % 7;
}

/** Zamiana indeksu od poniedziałku na dayOfWeek backendu (0 = niedziela). */
export function toBackendDayOfWeek(mondayIdx: number) {
  return (mondayIdx + 1) % 7;
}

export function weekStart(iso: string) {
  return addDays(iso, -mondayIndex(iso));
}

export function monthStart(iso: string) {
  return `${iso.slice(0, 7)}-01`;
}

export function addMonths(iso: string, months: number) {
  const date = toDate(monthStart(iso));
  date.setUTCMonth(date.getUTCMonth() + months);
  return toIso(date);
}

export function monthEnd(iso: string) {
  return addDays(addMonths(iso, 1), -1);
}

export function daysBetween(from: string, to: string) {
  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  return days;
}

/** Zakres dni widoczny w danym widoku (miesiąc = pełne tygodnie siatki). */
export function visibleRange(view: PlannerView, anchor: string) {
  if (view === "week") {
    const from = weekStart(anchor);
    return { from, to: addDays(from, 6) };
  }
  const from = weekStart(monthStart(anchor));
  const to = addDays(weekStart(monthEnd(anchor)), 6);
  return { from, to };
}

export function shiftAnchor(view: PlannerView, anchor: string, direction: -1 | 1) {
  return view === "week" ? addDays(weekStart(anchor), 7 * direction) : addMonths(anchor, direction);
}

/** Obiekt Date do formatowania (południe UTC, żeby strefa nie przesunęła dnia). */
export function displayDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`);
}
