import { formatNumber, formatPercentage, savingsPercentage } from "../format";

type ComparisonBarsProps = {
  caption: string;
  fastLabel: string;
  fastValue: number;
  slowLabel: string;
  slowValue: number;
  matches?: boolean;
};

export function ComparisonBars({ caption, fastLabel, fastValue, slowLabel, slowValue, matches }: ComparisonBarsProps) {
  const largest = Math.max(fastValue, slowValue, 1);
  const savings = savingsPercentage(fastValue, slowValue);
  return (
    <div className="comparison-bars">
      <div className="comparison-caption">{caption}</div>
      <div className="comparison-row">
        <span>{fastLabel}</span>
        <div className="comparison-track">
          <div className="comparison-fill fast" style={{ width: `${(fastValue / largest) * 100}%` }} />
        </div>
        <strong>{formatNumber(fastValue)}</strong>
      </div>
      <div className="comparison-row">
        <span>{slowLabel}</span>
        <div className="comparison-track">
          <div className="comparison-fill slow" style={{ width: `${(slowValue / largest) * 100}%` }} />
        </div>
        <strong>{formatNumber(slowValue)}</strong>
      </div>
      <div className="comparison-footer">
        {savings > 0 ? (
          <span className="savings">{formatPercentage(savings)} menos trabalho</span>
        ) : (
          <span>Sem ganho neste tamanho</span>
        )}
        {matches !== undefined && (
          <span className={matches ? "verdict ok" : "verdict fail"}>
            {matches ? "Mesmo resultado da força bruta" : "Resultado diferente da força bruta"}
          </span>
        )}
      </div>
    </div>
  );
}
