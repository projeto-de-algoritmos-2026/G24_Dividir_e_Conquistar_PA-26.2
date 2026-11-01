import type { LandingSequence } from "../types";

const ROW_HEIGHT = 46;
const TOP = 44;
const BOX_WIDTH = 150;
const BOX_HEIGHT = 32;
const WIDTH = 560;
const RIGHT_COLUMN_X = WIDTH - BOX_WIDTH;

type OrderCrossingDiagramProps = {
  sequence: LandingSequence;
  highlightedIds: Set<string>;
};

export function OrderCrossingDiagram({ sequence, highlightedIds }: OrderCrossingDiagramProps) {
  const invertedIds = new Set(sequence.inverted_pairs.flatMap((pair) => [pair.departed_first, pair.lands_first]));
  const rowY = (position: number) => TOP + (position - 1) * ROW_HEIGHT;
  const height = TOP + sequence.flights.length * ROW_HEIGHT;
  const focusing = highlightedIds.size > 0;

  const lineClass = (id: string) => {
    if (focusing) return highlightedIds.has(id) ? "order-link focus" : "order-link muted";
    return invertedIds.has(id) ? "order-link inverted" : "order-link";
  };

  return (
    <svg className="order-diagram" viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label="Ordem de decolagem e ordem de pouso">
      <text className="order-heading" x={0} y={16}>
        ORDEM DE DECOLAGEM
      </text>
      <text className="order-heading" x={WIDTH} y={16} textAnchor="end">
        ORDEM DE POUSO PREVISTA
      </text>
      {sequence.flights.map((flight) => (
        <path
          key={"link" + flight.id}
          className={lineClass(flight.id)}
          d={`M ${BOX_WIDTH} ${rowY(flight.departure_position) + BOX_HEIGHT / 2}
              C ${WIDTH / 2} ${rowY(flight.departure_position) + BOX_HEIGHT / 2},
                ${WIDTH / 2} ${rowY(flight.landing_position) + BOX_HEIGHT / 2},
                ${RIGHT_COLUMN_X} ${rowY(flight.landing_position) + BOX_HEIGHT / 2}`}
        />
      ))}
      {sequence.flights.map((flight) => (
        <g key={"departure" + flight.id}>
          <rect className="order-box" x={0} y={rowY(flight.departure_position)} width={BOX_WIDTH} height={BOX_HEIGHT} rx={7} />
          <text className="order-text" x={12} y={rowY(flight.departure_position) + 21}>
            {flight.departure_position}º · {flight.id}
          </text>
        </g>
      ))}
      {sequence.flights.map((flight) => (
        <g key={"landing" + flight.id}>
          <rect
            className="order-box"
            x={RIGHT_COLUMN_X}
            y={rowY(flight.landing_position)}
            width={BOX_WIDTH}
            height={BOX_HEIGHT}
            rx={7}
          />
          <text className="order-text" x={RIGHT_COLUMN_X + 12} y={rowY(flight.landing_position) + 21}>
            {flight.landing_position}º · {flight.id}
          </text>
        </g>
      ))}
    </svg>
  );
}
