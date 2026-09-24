import { linePath, niceScale, xPositions, yPosition } from "@/lib/stats/chart";
import type { TrendPoint } from "@/lib/stats/model";

/**
 * Mały wykres trendu na karcie ćwiczenia. Oś X to daty (przerwy są widoczne),
 * ostatnia sesja ma kropkę, rekord z całej historii ma złotą kropkę.
 */
export function MiniTrend({ points, recordDate }: { points: TrendPoint[]; recordDate: string | null }) {
  const xs = xPositions(points.map((p) => p.date));
  const { lo, hi } = niceScale(points.map((p) => p.value), 2);
  const ys = points.map((p) => yPosition(p.value, lo, hi));
  const last = points.length - 1;
  const record = recordDate ? points.findLastIndex((p) => p.date === recordDate) : -1;

  return (
    <div aria-hidden className="relative h-12 text-foreground">
      {points.length > 1 ? (
        <svg viewBox="0 0 100 48" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
          <path
            d={linePath(xs, ys, 100, 48)}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            opacity={0.85}
          />
        </svg>
      ) : null}
      {record >= 0 && record !== last ? <Dot x={xs[record]} y={ys[record]} className="bg-pr" /> : null}
      <Dot x={xs[last]} y={ys[last]} className={record === last ? "bg-pr" : "bg-foreground"} />
    </div>
  );
}

function Dot({ x, y, className }: { x: number; y: number; className: string }) {
  return (
    <span
      className={`absolute size-2 -translate-x-1/2 translate-y-1/2 rounded-full ring-2 ring-surface ${className}`}
      style={{ left: `${x * 100}%`, bottom: `${y * 100}%` }}
    />
  );
}
