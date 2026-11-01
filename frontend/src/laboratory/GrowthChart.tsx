import { formatCompact, formatNumber } from "../format";

type Series = { label: string; className: string; values: number[] };

type GrowthChartProps = {
  sizes: number[];
  series: Series[];
};

const WIDTH = 420;
const HEIGHT = 210;
const PADDING = { top: 16, right: 18, bottom: 34, left: 56 };

export function GrowthChart({ sizes, series }: GrowthChartProps) {
  const largestSize = Math.max(...sizes);
  const smallestSize = Math.min(...sizes);
  const largestValue = Math.max(1, ...series.flatMap((line) => line.values));
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const toX = (size: number) =>
    PADDING.left + (largestSize === smallestSize ? plotWidth / 2 : ((size - smallestSize) / (largestSize - smallestSize)) * plotWidth);
  const toY = (value: number) => PADDING.top + plotHeight - (value / largestValue) * plotHeight;
  const valueTicks = [0, largestValue / 2, largestValue];

  return (
    <svg className="growth-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Crescimento de operações por tamanho">
      {valueTicks.map((tick) => (
        <g key={tick}>
          <line className="chart-grid" x1={PADDING.left} x2={WIDTH - PADDING.right} y1={toY(tick)} y2={toY(tick)} />
          <text className="chart-tick" x={PADDING.left - 8} y={toY(tick) + 4} textAnchor="end">
            {formatCompact(tick)}
          </text>
        </g>
      ))}
      {sizes.map((size) => (
        <text key={size} className="chart-tick" x={toX(size)} y={HEIGHT - PADDING.bottom + 18} textAnchor="middle">
          {formatNumber(size)}
        </text>
      ))}
      <text className="chart-axis" x={WIDTH - PADDING.right} y={HEIGHT - 4} textAnchor="end">
        n (aeronaves)
      </text>
      {series.map((line) => (
        <g key={line.label} className={line.className}>
          <polyline
            className="chart-line"
            points={line.values.map((value, index) => `${toX(sizes[index])},${toY(value)}`).join(" ")}
          />
          {line.values.map((value, index) => (
            <circle key={sizes[index]} className="chart-dot" cx={toX(sizes[index])} cy={toY(value)} r={3.5}>
              <title>
                {line.label}: {formatNumber(value)} com n = {formatNumber(sizes[index])}
              </title>
            </circle>
          ))}
        </g>
      ))}
    </svg>
  );
}
