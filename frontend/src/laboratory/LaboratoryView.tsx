import { FlaskConical } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { formatNumber, formatPercentage, savingsPercentage } from "../format";
import type { LaboratoryPattern, LaboratoryReport, LaboratoryRow } from "../types";
import { GrowthChart } from "./GrowthChart";

const SCALES = [
  { id: "small", label: "100 a 800", sizes: [100, 200, 400, 800] },
  { id: "large", label: "200 a 1.600", sizes: [200, 400, 800, 1600] },
  { id: "maximum", label: "250 a 2.000", sizes: [250, 500, 1000, 2000] },
];

const PATTERNS: { id: LaboratoryPattern; label: string }[] = [
  { id: "random", label: "Chegadas em ordem aleatória" },
  { id: "sorted", label: "Chegadas já ordenadas" },
];

type AlgorithmKey = "closest_pair" | "inversions" | "median";

const ALGORITHMS: {
  key: AlgorithmKey;
  title: string;
  question: string;
  fastLabel: string;
  slowLabel: string;
  unit: string;
  resultLabel: string;
  resultDigits: number;
}[] = [
  {
    key: "closest_pair",
    title: "Par de pontos mais próximos",
    question: "Quais dois aviões estão mais perto?",
    fastLabel: "Dividir e conquistar · O(n log n)",
    slowLabel: "Força bruta · O(n²)",
    unit: "cálculos de distância",
    resultLabel: "Menor distância (km)",
    resultDigits: 2,
  },
  {
    key: "inversions",
    title: "Contagem de inversões",
    question: "Quantos pares chegam fora de ordem?",
    fastLabel: "Merge · O(n log n)",
    slowLabel: "Todos os pares · O(n²)",
    unit: "comparações",
    resultLabel: "Inversões",
    resultDigits: 0,
  },
  {
    key: "median",
    title: "Mediana das medianas",
    question: "Qual é o tempo de chegada mediano?",
    fastLabel: "Mediana das medianas · O(n)",
    slowLabel: "Pivô ingênuo · O(n²) no pior caso",
    unit: "comparações",
    resultLabel: "Mediana (min)",
    resultDigits: 2,
  },
];

function MedianNote({ pattern, rows }: { pattern: LaboratoryPattern; rows: LaboratoryRow[] }) {
  const last = rows[rows.length - 1].median;
  if (pattern === "random") {
    return (
      <p className="lab-note">
        Com dados aleatórios o pivô ingênuo costuma acertar e gasta menos ({formatNumber(last.baseline.operations)} contra{" "}
        {formatNumber(last.divide_and_conquer.operations)}). A mediana das medianas paga uma constante maior para garantir O(n)
        sempre. Troque para <strong>chegadas já ordenadas</strong> e veja o pivô ingênuo degradar.
      </p>
    );
  }
  return (
    <p className="lab-note">
      Com as chegadas já ordenadas, o pivô ingênuo escolhe sempre o menor elemento e vira O(n²):{" "}
      {formatNumber(last.baseline.operations)} comparações. A mediana das medianas segue linear com{" "}
      {formatNumber(last.divide_and_conquer.operations)}.
    </p>
  );
}

export function LaboratoryView() {
  const [scale, setScale] = useState(SCALES[1]);
  const [pattern, setPattern] = useState<LaboratoryPattern>("random");
  const [report, setReport] = useState<LaboratoryReport | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const run = useCallback((sizes: number[], chosenPattern: LaboratoryPattern) => {
    setRunning(true);
    api
      .laboratory(sizes, chosenPattern)
      .then((result) => {
        setReport(result);
        setError("");
      })
      .catch(() => setError("Não foi possível executar o laboratório. Verifique se o back-end está em execução."))
      .finally(() => setRunning(false));
  }, []);

  useEffect(() => run(SCALES[1].sizes, "random"), [run]);

  return (
    <div className="laboratory">
      <section className="lab-controls">
        <div className="lab-control">
          <span className="control-label">QUANTIDADE DE AERONAVES</span>
          <div className="segmented">
            {SCALES.map((option) => (
              <button key={option.id} className={scale.id === option.id ? "chosen" : ""} onClick={() => setScale(option)}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="lab-control">
          <span className="control-label">TEMPOS DE CHEGADA</span>
          <div className="segmented">
            {PATTERNS.map((option) => (
              <button key={option.id} className={pattern === option.id ? "chosen" : ""} onClick={() => setPattern(option.id)}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <button className="play" onClick={() => run(scale.sizes, pattern)} disabled={running}>
          <FlaskConical size={16} /> {running ? "Executando..." : "Executar comparação"}
        </button>
      </section>

      {error && <div className="api-error">{error}</div>}

      {report && (
        <div className={running ? "lab-results refreshing" : "lab-results"}>
          {ALGORITHMS.map((algorithm) => {
            const sizes = report.rows.map((row) => row.size);
            const comparisons = report.rows.map((row) => row[algorithm.key]);
            const last = comparisons[comparisons.length - 1];
            const savings = savingsPercentage(last.divide_and_conquer.operations, last.baseline.operations);
            return (
              <article key={algorithm.key} className="lab-card">
                <header>
                  <span className="panel-overline">{algorithm.question.toUpperCase()}</span>
                  <h2>{algorithm.title}</h2>
                </header>
                <div className="lab-headline">
                  <strong className={savings > 0 ? "gain" : "loss"}>
                    {formatPercentage(savings)} {savings > 0 ? "menos" : "mais"}
                  </strong>
                  <span>
                    {algorithm.unit} com n = {formatNumber(sizes[sizes.length - 1])}
                  </span>
                </div>
                <GrowthChart
                  sizes={sizes}
                  series={[
                    { label: algorithm.slowLabel, className: "series-slow", values: comparisons.map((item) => item.baseline.operations) },
                    {
                      label: algorithm.fastLabel,
                      className: "series-fast",
                      values: comparisons.map((item) => item.divide_and_conquer.operations),
                    },
                  ]}
                />
                <ul className="legend horizontal">
                  <li><i className="swatch fast" /> {algorithm.fastLabel}</li>
                  <li><i className="swatch slow" /> {algorithm.slowLabel}</li>
                </ul>
                <div className="table-scroll">
                  <table className="lab-table">
                    <thead>
                      <tr>
                        <th>n</th>
                        <th>Dividir e conquistar</th>
                        <th>Alternativa</th>
                        <th>Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.rows.map((row) => {
                        const item = row[algorithm.key];
                        return (
                          <tr key={row.size}>
                            <td>{formatNumber(row.size)}</td>
                            <td>
                              {formatNumber(item.divide_and_conquer.operations)}
                              <small>{formatNumber(item.divide_and_conquer.milliseconds, 1)} ms</small>
                            </td>
                            <td>
                              {formatNumber(item.baseline.operations)}
                              <small>{formatNumber(item.baseline.milliseconds, 1)} ms</small>
                            </td>
                            <td title={`${algorithm.resultLabel}: ${formatNumber(item.result, algorithm.resultDigits)}`}>
                              <span className={item.same_result ? "verdict ok" : "verdict fail"}>
                                {item.same_result ? "igual" : "diferente"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {algorithm.key === "median" && <MedianNote pattern={report.pattern} rows={report.rows} />}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
