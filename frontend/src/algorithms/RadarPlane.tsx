import { useMemo } from "react";
import { formatNumber } from "../format";
import type { PlanePoint } from "../types";

export type SplitLine = { x: number; depth: number; emphasized: boolean };
export type HorizontalBand = { from: number; to: number };
export type HighlightedPair = { a: string; b: string; label?: string };

type RadarPlaneProps = {
  points: PlanePoint[];
  splitLines?: SplitLine[];
  region?: HorizontalBand;
  strip?: HorizontalBand;
  regionIds?: Set<string>;
  stripIds?: Set<string>;
  bestPair?: HighlightedPair;
  candidatePairs?: HighlightedPair[];
};

const MARGIN_KM = 140;
const GRID_STEP_KM = 500;

export function RadarPlane({
  points,
  splitLines = [],
  region,
  strip,
  regionIds,
  stripIds,
  bestPair,
  candidatePairs = [],
}: RadarPlaneProps) {
  const frame = useMemo(() => {
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs) - MARGIN_KM;
    const maxX = Math.max(...xs) + MARGIN_KM;
    const minY = Math.min(...ys) - MARGIN_KM;
    const maxY = Math.max(...ys) + MARGIN_KM;
    return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
  }, [points]);

  const toScreenX = (x: number) => x - frame.minX;
  const toScreenY = (y: number) => frame.maxY - y;
  const byId = new Map(points.map((point) => [point.id, point]));
  const dotRadius = frame.width / 170;
  const fontSize = frame.width / 62;
  const pairIds = new Set(candidatePairs.flatMap((pair) => [pair.a, pair.b]));
  const bestIds = new Set(bestPair ? [bestPair.a, bestPair.b] : []);
  const focusing = Boolean(regionIds && regionIds.size);

  const gridXs = [];
  for (let x = Math.ceil(frame.minX / GRID_STEP_KM) * GRID_STEP_KM; x <= frame.maxX; x += GRID_STEP_KM) gridXs.push(x);
  const gridYs = [];
  for (let y = Math.ceil(frame.minY / GRID_STEP_KM) * GRID_STEP_KM; y <= frame.maxY; y += GRID_STEP_KM) gridYs.push(y);

  const clamp = (value: number) => Math.min(frame.maxX, Math.max(frame.minX, value));
  const bandRect = (band: HorizontalBand, className: string) => {
    const from = clamp(band.from);
    const to = clamp(band.to);
    const width = Math.max(to - from, dotRadius * 2);
    return (
      <rect
        className={className}
        x={toScreenX(from) - (to - from < dotRadius * 2 ? dotRadius : 0)}
        y={0}
        width={width}
        height={frame.height}
      />
    );
  };

  const pointClass = (id: string) => {
    if (bestIds.has(id)) return "radar-point best";
    if (stripIds?.has(id)) return "radar-point strip";
    if (regionIds?.has(id)) return "radar-point region";
    if (pairIds.has(id)) return "radar-point paired";
    return focusing ? "radar-point faded" : "radar-point";
  };

  return (
    <svg className="radar-plane" viewBox={`0 0 ${frame.width} ${frame.height}`} preserveAspectRatio="xMidYMid meet">
      <rect className="radar-ground" x={0} y={0} width={frame.width} height={frame.height} />
      {gridXs.map((x) => (
        <line key={"gx" + x} className="radar-grid" x1={toScreenX(x)} x2={toScreenX(x)} y1={0} y2={frame.height} />
      ))}
      {gridYs.map((y) => (
        <line key={"gy" + y} className="radar-grid" x1={0} x2={frame.width} y1={toScreenY(y)} y2={toScreenY(y)} />
      ))}

      {region && bandRect(region, "radar-region")}
      {strip && bandRect(strip, "radar-strip")}

      {splitLines.map((line) => (
        <line
          key={`split-${line.depth}-${line.x}`}
          className={line.emphasized ? "radar-split emphasized" : "radar-split"}
          style={{ opacity: line.emphasized ? 1 : Math.max(0.25, 0.85 - line.depth * 0.13) }}
          x1={toScreenX(line.x)}
          x2={toScreenX(line.x)}
          y1={0}
          y2={frame.height}
        />
      ))}

      {candidatePairs.map((pair) => {
        const first = byId.get(pair.a);
        const second = byId.get(pair.b);
        if (!first || !second) return null;
        return (
          <line
            key={pair.a + pair.b}
            className="radar-candidate"
            x1={toScreenX(first.x)}
            y1={toScreenY(first.y)}
            x2={toScreenX(second.x)}
            y2={toScreenY(second.y)}
          />
        );
      })}

      {points.map((point) => (
        <circle
          key={point.id}
          className={pointClass(point.id)}
          cx={toScreenX(point.x)}
          cy={toScreenY(point.y)}
          r={bestIds.has(point.id) ? dotRadius * 1.5 : dotRadius}
        >
          <title>
            {point.id} · destino {point.destination}
          </title>
        </circle>
      ))}

      {bestPair &&
        (() => {
          const first = byId.get(bestPair.a);
          const second = byId.get(bestPair.b);
          if (!first || !second) return null;
          const labelX = (toScreenX(first.x) + toScreenX(second.x)) / 2;
          const labelY = Math.min(toScreenY(first.y), toScreenY(second.y)) - dotRadius * 3;
          return (
            <g>
              <line
                className="radar-best-line"
                x1={toScreenX(first.x)}
                y1={toScreenY(first.y)}
                x2={toScreenX(second.x)}
                y2={toScreenY(second.y)}
              />
              <circle className="radar-best-ring" cx={toScreenX(first.x)} cy={toScreenY(first.y)} r={dotRadius * 3} />
              <circle className="radar-best-ring" cx={toScreenX(second.x)} cy={toScreenY(second.y)} r={dotRadius * 3} />
              {bestPair.label && (
                <text className="radar-label" x={labelX} y={labelY} fontSize={fontSize} textAnchor="middle">
                  {bestPair.label}
                </text>
              )}
            </g>
          );
        })()}

      <g transform={`translate(${frame.width - GRID_STEP_KM - fontSize * 2} ${frame.height - fontSize * 1.6})`}>
        <line className="radar-scale" x1={0} x2={GRID_STEP_KM} y1={0} y2={0} />
        <text className="radar-scale-text" x={GRID_STEP_KM / 2} y={-fontSize * 0.5} fontSize={fontSize * 0.85} textAnchor="middle">
          {formatNumber(GRID_STEP_KM)} km
        </text>
      </g>
    </svg>
  );
}
