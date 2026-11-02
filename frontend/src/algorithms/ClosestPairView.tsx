import { Camera, Crosshair, SquareSplitHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { formatNumber } from "../format";
import type { Analysis, ClosestPairStep } from "../types";
import { ComparisonBars } from "./ComparisonBars";
import { buildClosestPairFrames, buildRadiusSearchFrames, type ClosestPairFrame, type RadiusSearchFrame } from "./frames";
import { RadarPlane, type SplitLine } from "./RadarPlane";
import { StepControls } from "./StepControls";
import { useStepPlayer } from "./useStepPlayer";

type Mode = "closest" | "radius";

type StepDescription = { phase: string; title: string; body: string; outcome?: string };

const pairLabel = (pair: [string, string]) => `${pair[0]} / ${pair[1]}`;

function closestPairSplitLines(steps: ClosestPairStep[], maximumDepth: number, emphasizedDepth: number | null): SplitLine[] {
  return steps
    .filter((step) => step.kind === "combine" && step.split_x !== null && step.depth <= maximumDepth)
    .map((step) => ({ x: step.split_x as number, depth: step.depth, emphasized: step.depth === emphasizedDepth }));
}

function describeClosestPairFrame(frame: ClosestPairFrame, analysis: Analysis): StepDescription {
  const result = analysis.closest_pair;
  if (frame.phase === "divide") {
    const regions = 2 ** (frame.depth + 1);
    return {
      phase: "DIVIDIR",
      title: `Nível ${frame.depth}: cortar ao meio`,
      body: `A linha vertical separa os aviões em duas metades com a mesma quantidade. Repetindo em cada metade, o espaço fica dividido em até ${regions} regiões, até restarem grupos de 2 ou 3 aviões.`,
    };
  }
  if (frame.phase === "result") {
    return {
      phase: "RESULTADO",
      title: `${result.a} / ${result.b} a ${formatNumber(result.distance_km, 2)} km`,
      body: `Par mais próximo do setor encontrado com ${formatNumber(result.distance_checks)} cálculos de distância. A força bruta precisaria de ${formatNumber(result.brute_force_checks)}, comparando todos os pares.`,
    };
  }
  const step = frame.step;
  if (step.kind === "base") {
    return {
      phase: "CONQUISTAR",
      title: `Caso base com ${step.region_ids.length} aviões`,
      body: `Grupo pequeno: compara todos entre si. Menor distância local: ${formatNumber(step.best_distance, 1)} km (${pairLabel(step.best_pair)}).`,
    };
  }
  const halves = step.halves_distance ?? step.best_distance;
  const crossedTheLine = step.best_distance < halves;
  return {
    phase: "COMBINAR",
    title: `Combinação no nível ${step.depth}`,
    body: `A melhor distância das duas metades é δ = ${formatNumber(halves, 1)} km. Só um par que atravessa a linha pode ser melhor, então basta olhar a faixa de largura 2δ: ${step.strip_ids.length} avião(ões), cada um comparado com no máximo 7 vizinhos.`,
    outcome: crossedTheLine
      ? `A faixa achou um par melhor que atravessa a linha: ${pairLabel(step.best_pair)} a ${formatNumber(step.best_distance, 1)} km.`
      : `Nenhum par da faixa supera δ. Continua ${pairLabel(step.best_pair)} a ${formatNumber(step.best_distance, 1)} km.`,
  };
}

function describeRadiusFrame(frame: RadiusSearchFrame, analysis: Analysis): StepDescription {
  const search = analysis.radius_search;
  if (frame.phase === "split") {
    const level = search.splits.filter((split) => split.depth === frame.depth);
    const comparisons = level.reduce((total, split) => total + split.comparisons, 0);
    return {
      phase: "DIVIDIR",
      title: `Nível ${frame.depth}: ${level.length} mediana(s) encontrada(s)`,
      body: `Para cortar cada grupo ao meio sem ordenar, a Mediana das Medianas agrupa os aviões de 5 em 5, pega a mediana de cada grupo e usa a mediana dessas medianas como pivô. Isso garante o avião do meio em O(n). Neste nível: ${formatNumber(comparisons)} comparações.`,
    };
  }
  return {
    phase: "RESULTADO",
    title: `${search.pairs.length} pares a menos de ${search.radius_km} km`,
    body: `Cada metade procura seus pares e, na combinação, só os aviões a até ${search.radius_km} km da linha são cruzados. Esses pares candidatos seguem para a projeção de conflito de 15 minutos.`,
  };
}

export function ClosestPairView() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [mode, setMode] = useState<Mode>("closest");
  const [error, setError] = useState("");

  const capture = useCallback(() => {
    api
      .analysis()
      .then((captured) => {
        setAnalysis(captured);
        setError("");
      })
      .catch(() => setError("Não foi possível capturar o instante. Verifique se o back-end está em execução."));
  }, []);

  useEffect(capture, [capture]);

  const closestFrames = useMemo(
    () => (analysis ? buildClosestPairFrames(analysis.closest_pair.steps) : []),
    [analysis],
  );
  const radiusFrames = useMemo(() => (analysis ? buildRadiusSearchFrames(analysis.radius_search.splits) : []), [analysis]);
  const player = useStepPlayer(mode === "closest" ? closestFrames.length : radiusFrames.length, `${mode}-${analysis?.elapsed_seconds}`);

  if (!analysis) {
    return <div className="algorithm-loading">{error || "Capturando um instante do tráfego..."}</div>;
  }

  const result = analysis.closest_pair;
  let plane;
  let description: StepDescription;

  if (mode === "closest") {
    const frame = closestFrames[player.frame];
    description = describeClosestPairFrame(frame, analysis);
    if (frame.phase === "divide") {
      plane = <RadarPlane points={analysis.points} splitLines={closestPairSplitLines(result.steps, frame.depth, frame.depth)} />;
    } else if (frame.phase === "result") {
      plane = (
        <RadarPlane
          points={analysis.points}
          splitLines={closestPairSplitLines(result.steps, Infinity, null)}
          bestPair={{ a: result.a, b: result.b, label: `${formatNumber(result.distance_km, 2)} km` }}
        />
      );
    } else {
      const step = frame.step;
      const halves = step.halves_distance ?? 0;
      plane = (
        <RadarPlane
          points={analysis.points}
          splitLines={step.split_x === null ? [] : [{ x: step.split_x, depth: step.depth, emphasized: true }]}
          region={{ from: step.min_x, to: step.max_x }}
          strip={step.split_x === null ? undefined : { from: Math.max(step.min_x, step.split_x - halves), to: Math.min(step.max_x, step.split_x + halves) }}
          regionIds={new Set(step.region_ids)}
          stripIds={new Set(step.strip_ids)}
          bestPair={{ a: step.best_pair[0], b: step.best_pair[1], label: `${formatNumber(step.best_distance, 1)} km` }}
        />
      );
    }
  } else {
    const frame = radiusFrames[player.frame];
    description = describeRadiusFrame(frame, analysis);
    const search = analysis.radius_search;
    const visibleDepth = frame.phase === "split" ? frame.depth : Infinity;
    const splitLines = search.splits
      .filter((split) => split.depth <= visibleDepth)
      .map((split) => ({ x: split.split_x, depth: split.depth, emphasized: frame.phase === "split" && split.depth === frame.depth }));
    plane = (
      <RadarPlane
        points={analysis.points}
        splitLines={splitLines}
        candidatePairs={frame.phase === "pairs" ? search.pairs : []}
      />
    );
  }

  return (
    <div className="work-grid">
      <section className="globe-panel radar-panel">
        <div className="globe-top">
          <div>
            <span className="panel-overline">INSTANTE CONGELADO · T+ {formatNumber(analysis.elapsed_seconds)}s</span>
            <h2>
              Radar <span>2D</span>
            </h2>
          </div>
          <div className="play-controls">
            <div className="segmented">
              <button className={mode === "closest" ? "chosen" : ""} onClick={() => setMode("closest")}>
                <Crosshair size={14} /> Par mais próximo
              </button>
              <button className={mode === "radius" ? "chosen" : ""} onClick={() => setMode("radius")}>
                <SquareSplitHorizontal size={14} /> Mediana das medianas
              </button>
            </div>
            <button className="secondary-btn" onClick={capture}>
              <Camera size={15} /> Capturar instante atual
            </button>
          </div>
        </div>
        <div className="radar-stage">{plane}</div>
        <StepControls player={player} phaseLabel={description.phase} />
      </section>

      <aside className="inspector">
        <div className="inspector-title">
          <span className="panel-overline">{description.phase}</span>
          <h2>{description.title}</h2>
        </div>
        <div className="inspector-section">
          <p className="step-text">{description.body}</p>
          {description.outcome && <p className="step-outcome">{description.outcome}</p>}
        </div>
        <div className="inspector-section">
          {mode === "closest" ? (
            <ComparisonBars
              caption="Cálculos de distância neste instante"
              fastLabel="Dividir e conquistar"
              fastValue={result.distance_checks}
              slowLabel="Força bruta"
              slowValue={result.brute_force_checks}
              matches={result.matches_brute_force}
            />
          ) : (
            <ComparisonBars
              caption="Operações da busca por raio (distâncias + medianas)"
              fastLabel="Dividir e conquistar"
              fastValue={analysis.radius_search.distance_checks + analysis.radius_search.median_comparisons}
              slowLabel="Força bruta"
              slowValue={analysis.radius_search.brute_force_checks}
              matches={analysis.radius_search.matches_brute_force}
            />
          )}
          {mode === "radius" && (
            <>
              <div className="detail">
                <span>Cálculos de distância</span>
                <strong>{formatNumber(analysis.radius_search.distance_checks)}</strong>
              </div>
              <div className="detail">
                <span>Comparações para achar as medianas</span>
                <strong>{formatNumber(analysis.radius_search.median_comparisons)}</strong>
              </div>
            </>
          )}
        </div>
        <div className="inspector-section">
          <h3>Legenda</h3>
          <ul className="legend">
            <li><i className="swatch split" /> Linha de divisão</li>
            {mode === "closest" ? (
              <>
                <li><i className="swatch region" /> Região sendo resolvida</li>
                <li><i className="swatch strip" /> Faixa central de largura 2δ</li>
                <li><i className="swatch best" /> Melhor par até agora</li>
              </>
            ) : (
              <li><i className="swatch candidate" /> Par a menos de {analysis.radius_search.radius_km} km</li>
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}
