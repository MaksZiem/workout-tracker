import { addDays } from "@/lib/planner/dates";

export const STATS_RANGES = ["30d", "90d", "1y", "all"] as const;
export type StatsRange = (typeof STATS_RANGES)[number];
export const DEFAULT_RANGE: StatsRange = "90d";

const RANGE_DAYS: Record<Exclude<StatsRange, "all">, number> = { "30d": 30, "90d": 90, "1y": 365 };

export function parseRange(value: unknown): StatsRange {
  return STATS_RANGES.includes(value as StatsRange) ? (value as StatsRange) : DEFAULT_RANGE;
}

/** Granice zakresu (włącznie). „Cały czas” nie ma dolnej granicy. */
export function rangeBounds(range: StatsRange, today: string): { from?: string; to: string } {
  if (range === "all") return { to: today };
  return { from: addDays(today, -(RANGE_DAYS[range] - 1)), to: today };
}

export function inRange(date: string, bounds: { from?: string; to: string }) {
  return (!bounds.from || date >= bounds.from) && date <= bounds.to;
}

export const STATS_METRICS = ["e1rm", "top", "volume"] as const;
export type StatsMetric = (typeof STATS_METRICS)[number];

export function parseMetric(value: unknown): StatsMetric {
  return STATS_METRICS.includes(value as StatsMetric) ? (value as StatsMetric) : "e1rm";
}

/** Adres z zachowaniem zakresu (domyślny zakres nie trafia do URL). */
export function statsHref(path: string, params: { range?: StatsRange; metric?: StatsMetric }) {
  const search = new URLSearchParams();
  if (params.range && params.range !== DEFAULT_RANGE) search.set("range", params.range);
  if (params.metric && params.metric !== "e1rm") search.set("metric", params.metric);
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
