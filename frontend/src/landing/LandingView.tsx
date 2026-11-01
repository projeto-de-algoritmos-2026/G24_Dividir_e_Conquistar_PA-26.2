import { PlaneLanding } from "lucide-react";
import { useState } from "react";
import { ComparisonBars } from "../algorithms/ComparisonBars";
import { formatNumber } from "../format";
import type { Snapshot } from "../types";
import { OrderCrossingDiagram } from "./OrderCrossingDiagram";

export function LandingView({ snapshot }: { snapshot: Snapshot | null }) {
  const [airport, setAirport] = useState<string | null>(null);
  const [focusedPair, setFocusedPair] = useState<string[]>([]);
  const sequences = snapshot?.landing_sequences ?? [];

  if (!sequences.length) {
    return <div className="algorithm-loading">Aguardando o tráfego para montar as filas de pouso...</div>;
  }

  const selected = sequences.find((sequence) => sequence.airport === airport) ?? sequences[0];
  const sectorInversions = sequences.reduce((total, sequence) => total + sequence.inversions, 0);
  const flightsById = new Map(selected.flights.map((flight) => [flight.id, flight]));

  return (
    <div className="landing-grid">
      <aside className="inspector airport-list">
        <div className="inspector-title">
          <span className="panel-overline">AEROPORTOS COM 2 OU MAIS CHEGADAS</span>
          <h2>{formatNumber(sectorInversions)} inversões no setor</h2>
        </div>
        <div className="airport-options">
          {sequences.map((sequence) => (
            <button
              key={sequence.airport}
              className={sequence.airport === selected.airport ? "selected" : ""}
              onClick={() => {
                setAirport(sequence.airport);
                setFocusedPair([]);
              }}
            >
              <span>
                <strong>{sequence.airport}</strong>
                <small>
                  {sequence.airport_name} · {sequence.flights.length} voos
                </small>
              </span>
              <span className="inversion-badge">
                {sequence.inversions}
                <small>/{sequence.total_pairs}</small>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className="globe-panel landing-panel">
        <div className="globe-top">
          <div>
            <span className="panel-overline">
              {selected.airport} · {selected.airport_name.toUpperCase()}
            </span>
            <h2>
              <PlaneLanding size={17} /> {selected.inversions} de {selected.total_pairs} pares invertidos
            </h2>
          </div>
        </div>
        <div className="landing-stage">
          <OrderCrossingDiagram sequence={selected} highlightedIds={new Set(focusedPair)} />
        </div>
        <p className="landing-caption">
          Cada linha liga o mesmo voo nas duas ordens. Quando duas linhas se cruzam, o voo que decolou depois vai pousar
          antes: isso é uma inversão. O total de cruzamentos é exatamente o número de inversões.
        </p>
      </section>

      <aside className="inspector">
        <div className="inspector-title">
          <span className="panel-overline">CONTAGEM DE INVERSÕES</span>
          <h2>Pares invertidos</h2>
        </div>
        <div className="inspector-section">
          <ComparisonBars
            caption={`Comparações para ${selected.flights.length} voos`}
            fastLabel="Merge (dividir e conquistar)"
            fastValue={selected.comparisons}
            slowLabel="Todos os pares"
            slowValue={selected.brute_force_comparisons}
            matches={selected.matches_brute_force}
          />
          <p className="inspector-note">
            Com poucos voos a diferença é pequena. O ganho de O(n log n) contra O(n²) aparece em escala: veja o Laboratório.
          </p>
        </div>
        <div className="inspector-section">
          <h3>Quem passa na frente</h3>
          {selected.inverted_pairs.length === 0 && (
            <p className="inspector-note">Os voos vão pousar na mesma ordem em que decolaram.</p>
          )}
          <div className="pair-list">
            {selected.inverted_pairs.map((pair) => {
              const departedFirst = flightsById.get(pair.departed_first);
              const landsFirst = flightsById.get(pair.lands_first);
              const key = pair.departed_first + pair.lands_first;
              const focused = focusedPair.join() === [pair.departed_first, pair.lands_first].join();
              return (
                <button
                  key={key}
                  className={focused ? "selected" : ""}
                  onMouseEnter={() => setFocusedPair([pair.departed_first, pair.lands_first])}
                  onMouseLeave={() => setFocusedPair([])}
                  onFocus={() => setFocusedPair([pair.departed_first, pair.lands_first])}
                  onBlur={() => setFocusedPair([])}
                >
                  <strong>
                    {pair.lands_first} passa {pair.departed_first}
                  </strong>
                  <small>
                    decolou depois, chega em {formatNumber(landsFirst?.eta_minutes ?? 0)} min contra{" "}
                    {formatNumber(departedFirst?.eta_minutes ?? 0)} min
                  </small>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
