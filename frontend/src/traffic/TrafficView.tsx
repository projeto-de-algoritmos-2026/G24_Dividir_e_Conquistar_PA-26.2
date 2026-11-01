import { Eye, EyeOff, Pause, Plane, Play, Route } from "lucide-react";
import { useState } from "react";
import { formatNumber } from "../format";
import { AirspaceGlobe } from "../globe/AirspaceGlobe";
import type { Snapshot } from "../types";

export const SIMULATION_SPEEDS = [1, 10, 20, 60];

type TrafficViewProps = {
  mode: "traffic" | "conflicts";
  snapshot: Snapshot | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onShowTraffic: () => void;
  playing: boolean;
  onTogglePlaying: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  cameraKey: number;
};

export function TrafficView({
  mode,
  snapshot,
  selectedId,
  onSelect,
  onShowTraffic,
  playing,
  onTogglePlaying,
  speed,
  onSpeedChange,
  cameraKey,
}: TrafficViewProps) {
  const [showRoutes, setShowRoutes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const aircraft = snapshot?.aircraft ?? [];
  const conflicts = snapshot?.conflicts ?? [];
  const chosen = aircraft.find((plane) => plane.id === selectedId);
  const focusFlight = (id: string) => {
    onSelect(id);
    onShowTraffic();
  };

  return (
    <>
      <div className="work-grid">
        <section className="globe-panel">
          <div className="globe-top">
            <div>
              <span className="panel-overline">VISUALIZAÇÃO TRIDIMENSIONAL</span>
              <h2>
                Espaço aéreo <span>3D</span>
              </h2>
            </div>
            <span className="globe-state">
              <span className="live-dot" />
              {playing ? "EM MOVIMENTO" : "PAUSADO"}
            </span>
          </div>
          <div className="globe">
            {snapshot ? (
              <AirspaceGlobe
                snapshot={snapshot}
                selectedId={selectedId}
                onSelect={onSelect}
                showRoutes={showRoutes}
                showLabels={showLabels}
                cameraKey={cameraKey}
                playing={playing}
              />
            ) : (
              <div className="globe-loading">Conectando ao motor de simulação...</div>
            )}
            <div className="globe-overlay left">
              <span>REGIÃO · BRASIL</span>
              <span>CORREDORES DE VOO</span>
              {conflicts.length > 0 && <span>LIGAÇÕES ÂMBAR · POSIÇÕES ATUAIS DOS PARES PREVISTOS (ATÉ 8)</span>}
            </div>
            <div className="globe-overlay right">
              <span>ARRASTE PARA GIRAR</span>
              <span>SCROLL / PINÇA PARA ZOOM</span>
            </div>
            <div className="globe-gradient" />
          </div>
          <div className="globe-controls">
            <div className="play-controls">
              <button className="play" onClick={onTogglePlaying}>
                {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                {playing ? "Pausar" : "Iniciar"} simulação
              </button>
              <div className="separator" />
              <span className="control-label">TEMPO</span>
              {SIMULATION_SPEEDS.map((value) => (
                <button
                  key={value}
                  className={"speed " + (speed === value ? "chosen" : "")}
                  onClick={() => onSpeedChange(value)}
                >
                  {value}×
                </button>
              ))}
            </div>
            <div className="play-controls">
              <button
                className={"icon-btn " + (showRoutes ? "toggled" : "")}
                title="Mostrar ou ocultar rotas"
                onClick={() => setShowRoutes((visible) => !visible)}
              >
                <Route size={17} />
              </button>
              <button
                className={"icon-btn " + (showLabels ? "toggled" : "")}
                title="Mostrar ou ocultar identificação"
                onClick={() => setShowLabels((visible) => !visible)}
              >
                {showLabels ? <Eye size={17} /> : <EyeOff size={17} />}
              </button>
            </div>
          </div>
        </section>

        <aside className="inspector">
          <div className="inspector-title">
            <span className="panel-overline">{mode === "traffic" ? "AERONAVE SELECIONADA" : "AVALIAÇÃO DE PROXIMIDADE"}</span>
            <h2>{mode === "traffic" ? "Detalhes do voo" : "Conflitos simulados"}</h2>
          </div>
          {mode === "traffic" && chosen ? (
            <>
              <div className="aircraft-card">
                <div className="aircraft-icon">
                  <Plane size={26} />
                </div>
                <div>
                  <small>VOO</small>
                  <h3>{chosen.id}</h3>
                  <p>{chosen.carrier}</p>
                </div>
              </div>
              <div className="inspector-section">
                <h3>Itinerário</h3>
                <div className="detail">
                  <span>Origem</span>
                  <strong>
                    {chosen.origin} · {chosen.origin_name}
                  </strong>
                </div>
                <div className="detail">
                  <span>Destino</span>
                  <strong>
                    {chosen.destination} · {chosen.destination_name}
                  </strong>
                </div>
                <div className="detail">
                  <span>Progresso</span>
                  <strong>{formatNumber(chosen.progress * 100, 1)}%</strong>
                </div>
                <div className="progress-track">
                  <div style={{ width: chosen.progress * 100 + "%" }} />
                </div>
                <div className="detail">
                  <span>Chegada estimada</span>
                  <strong>{formatNumber(chosen.eta_minutes, 1)} min</strong>
                </div>
                <div className="detail">
                  <span>Altitude</span>
                  <strong>{formatNumber(chosen.alt_ft)} ft</strong>
                </div>
                <div className="detail">
                  <span>Velocidade</span>
                  <strong>{formatNumber(chosen.speed_kmh)} km/h</strong>
                </div>
                <div className="detail">
                  <span>Rumo</span>
                  <strong>{formatNumber(chosen.heading)}°</strong>
                </div>
              </div>
            </>
          ) : (
            <div className="inspector-section">
              <h3>Aproximações detectadas</h3>
              <p className="inspector-note">
                {conflicts.length
                  ? `${conflicts.length} par(es) com aproximação prevista para acompanhamento.`
                  : "Nenhuma aproximação relevante neste instante."}
              </p>
              {conflicts.slice(0, 5).map((conflict) => (
                <button key={conflict.a + conflict.b} className="conflict-item" onClick={() => focusFlight(conflict.a)}>
                  <strong>
                    {conflict.a} ↔ {conflict.b}
                  </strong>
                  <span>
                    {formatNumber(conflict.horizontal_km, 1)} km · CPA em {formatNumber(conflict.minutes, 1)} min
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="inspector-section">
            <div className="section-row">
              <h3>Aeronaves no setor</h3>
              <span>{aircraft.length}</span>
            </div>
            <div className="aircraft-list">
              {aircraft.map((plane) => (
                <button
                  key={plane.id}
                  className={selectedId === plane.id ? "selected" : ""}
                  onClick={() => focusFlight(plane.id)}
                >
                  <span className="plane-symbol">✈</span>
                  <span>
                    <strong>{plane.id}</strong>
                    <small>
                      {plane.origin} → {plane.destination}
                    </small>
                  </span>
                  <span className="list-alt">FL{Math.round(plane.alt_ft / 100)}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <section className="traffic-table">
        <div className="table-heading">
          <div>
            <span className="panel-overline">CENTRAL DE DADOS</span>
            <h2>{mode === "traffic" ? "Voos monitorados" : "Pares sob observação"}</h2>
          </div>
          <span>{mode === "traffic" ? `${aircraft.length} voos` : `${conflicts.length} alertas`}</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              {mode === "traffic" ? (
                <tr>
                  <th>Voo</th>
                  <th>Rota</th>
                  <th>Altitude</th>
                  <th>Velocidade</th>
                  <th>Progresso</th>
                  <th>ETA</th>
                </tr>
              ) : (
                <tr>
                  <th>Par</th>
                  <th>Distância atual</th>
                  <th>CPA em</th>
                  <th>Distância CPA</th>
                  <th>Separação vertical</th>
                  <th>Categoria</th>
                </tr>
              )}
            </thead>
            <tbody>
              {mode === "traffic"
                ? aircraft.map((plane) => (
                    <tr key={plane.id} className={selectedId === plane.id ? "current" : ""} onClick={() => onSelect(plane.id)}>
                      <td>
                        <strong>{plane.id}</strong>
                        <small>{plane.carrier}</small>
                      </td>
                      <td>
                        {plane.origin} → {plane.destination}
                      </td>
                      <td>{formatNumber(plane.alt_ft)} ft</td>
                      <td>{formatNumber(plane.speed_kmh)} km/h</td>
                      <td>{formatNumber(plane.progress * 100)}%</td>
                      <td>{formatNumber(plane.eta_minutes)} min</td>
                    </tr>
                  ))
                : conflicts.map((conflict) => (
                    <tr key={conflict.a + conflict.b} onClick={() => focusFlight(conflict.a)}>
                      <td>
                        <strong>
                          {conflict.a} / {conflict.b}
                        </strong>
                      </td>
                      <td>{formatNumber(conflict.now_km, 1)} km</td>
                      <td>{formatNumber(conflict.minutes, 1)} min</td>
                      <td>{formatNumber(conflict.horizontal_km, 1)} km</td>
                      <td>{formatNumber(conflict.vertical_ft)} ft</td>
                      <td>
                        <span className="table-pill">{conflict.level === "attention" ? "Atenção" : "Observação"}</span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
