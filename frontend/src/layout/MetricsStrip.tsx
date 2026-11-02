import { formatNumber, padTwo } from "../format";
import type { Snapshot } from "../types";

export function MetricsStrip({ snapshot }: { snapshot: Snapshot | null }) {
  const closest = snapshot?.closest;
  const landingInversions = snapshot?.landing_sequences.reduce((total, sequence) => total + sequence.inversions, 0);
  return (
    <div className="metrics">
      <div>
        <span>AERONAVES</span>
        <strong>{padTwo(snapshot?.aircraft.length ?? 0)}</strong>
        <small>Voos cadastrados</small>
      </div>
      <div>
        <span>PAR MAIS PRÓXIMO</span>
        <strong>
          {closest ? formatNumber(closest.distance_km, 1) : "-"} <em>km</em>
        </strong>
        <small>{closest ? `${closest.a} / ${closest.b}` : "Aguardando dados"}</small>
      </div>
      <div>
        <span>PARES CANDIDATOS</span>
        <strong>{snapshot?.candidates_count ?? "-"}</strong>
        <small>Busca espacial em raio de {snapshot?.candidate_search.radius_km ?? 85} km</small>
      </div>
      <div>
        <span>CONFLITOS POTENCIAIS</span>
        <strong>{padTwo(snapshot?.conflicts.length ?? 0)}</strong>
        <small>Projeção para 15 min</small>
      </div>
      <div>
        <span>INVERSÕES NA FILA</span>
        <strong>{landingInversions ?? "-"}</strong>
        <small>Decolou depois, pousa antes</small>
      </div>
    </div>
  );
}
