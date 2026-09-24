/** Geometria wykresów: pozycje w ułamkach 0..1, rysowane w SVG i HTML. */

const DAY = 86_400_000;

function time(iso: string) {
  return Date.parse(`${iso}T00:00:00Z`);
}

/** Pozycja X według daty, żeby przerwy w treningach były widoczne na osi. */
export function xPositions(dates: string[]) {
  if (dates.length < 2) return dates.map(() => 0.5);
  const first = time(dates[0]);
  const span = Math.max(time(dates.at(-1)!) - first, DAY);
  return dates.map((d) => (time(d) - first) / span);
}

/** „Ładna” skala osi Y: 3–5 podziałek na okrągłych wartościach. */
export function niceScale(values: number[], targetTicks = 4) {
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    const pad = Math.max(Math.abs(min) * 0.1, 5);
    min -= pad;
    max += pad;
  }
  const raw = (max - min) / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? 10 * magnitude;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(6)));
  return { lo, hi, ticks };
}

/** Pozycja Y (0 = dół, 1 = góra). */
export function yPosition(value: number, lo: number, hi: number) {
  return hi === lo ? 0.5 : (value - lo) / (hi - lo);
}

/** Ścieżka SVG w układzie viewBox szerokości `w` i wysokości `h`. */
export function linePath(xs: number[], ys: number[], w: number, h: number) {
  return xs.map((x, i) => `${i ? "L" : "M"}${(x * w).toFixed(2)},${((1 - ys[i]) * h).toFixed(2)}`).join(" ");
}

/** Indeks punktu najbliższego pozycji X. */
export function nearestIndex(xs: number[], x: number) {
  let best = 0;
  for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i;
  return best;
}
