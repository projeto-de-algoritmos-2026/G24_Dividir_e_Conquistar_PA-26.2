import { ChevronRight, Navigation2, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ClosestPairView } from "./algorithms/ClosestPairView";
import { api } from "./api";
import { formatNumber } from "./format";
import { LaboratoryView } from "./laboratory/LaboratoryView";
import { LandingView } from "./landing/LandingView";
import { MetricsStrip } from "./layout/MetricsStrip";
import { findView, viewFromHash, type ViewId } from "./layout/navigation";
import { Sidebar } from "./layout/Sidebar";
import { TrafficView } from "./traffic/TrafficView";
import type { Snapshot } from "./types";

const TICK_MS = 1000;

export function App() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(20);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewId>(() => viewFromHash(window.location.hash));
  const [cameraKey, setCameraKey] = useState(0);
  const [error, setError] = useState("");
  const requestInFlight = useRef(false);
  const view = findView(activeView);
  const showsGlobe = activeView === "traffic" || activeView === "conflicts";

  useEffect(() => {
    const followAddress = () => setActiveView(viewFromHash(window.location.hash));
    window.addEventListener("hashchange", followAddress);
    return () => window.removeEventListener("hashchange", followAddress);
  }, []);

  useEffect(() => {
    const expectedHash = "#" + findView(activeView).hash;
    if (window.location.hash !== expectedHash) window.history.replaceState(null, "", expectedHash);
  }, [activeView]);

  useEffect(() => {
    api
      .snapshot()
      .then(setSnapshot)
      .catch(() => setError("Não foi possível conectar à API. Verifique se o back-end está em execução."));
  }, []);

  useEffect(() => {
    api
      .speed(speed)
      .then(setSnapshot)
      .catch(() => undefined);
  }, [speed]);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(async () => {
      if (requestInFlight.current) return;
      requestInFlight.current = true;
      try {
        setSnapshot(await api.advance(1));
        setError("");
      } catch {
        setError("Conexão com o motor de simulação interrompida.");
      } finally {
        requestInFlight.current = false;
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [playing]);

  const reset = async () => {
    setPlaying(false);
    setSnapshot(await api.reset());
    setSelectedId(null);
  };

  return (
    <div className="app">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <main className="main">
        <header className="header">
          <div className="crumb">
            CENTRO DE CONTROLE <ChevronRight size={14} />
            <span>{view.crumb}</span>
          </div>
          <div className="header-right">
            <span className="utc">T+ {formatNumber(snapshot?.elapsed_seconds ?? 0)}s</span>
          </div>
        </header>

        <div className="page-heading">
          <div>
            <div className="overline">{view.overline}</div>
            <h1>{view.title}</h1>
            <p>{view.summary}</p>
          </div>
          <div className="heading-actions">
            {showsGlobe ? (
              <button className="secondary-btn" onClick={() => setCameraKey((key) => key + 1)}>
                <Navigation2 size={15} /> Recentrar câmera
              </button>
            ) : (
              <button className="secondary-btn" onClick={() => setPlaying((value) => !value)}>
                {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? "Pausar" : "Retomar"} simulação
              </button>
            )}
            <button className="secondary-btn" onClick={reset}>
              <RotateCcw size={15} /> Reiniciar
            </button>
          </div>
        </div>

        {error && <div className="api-error">{error}</div>}
        <MetricsStrip snapshot={snapshot} />

        {showsGlobe && (
          <TrafficView
            mode={activeView === "conflicts" ? "conflicts" : "traffic"}
            snapshot={snapshot}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onShowTraffic={() => setActiveView("traffic")}
            playing={playing}
            onTogglePlaying={() => setPlaying((value) => !value)}
            speed={speed}
            onSpeedChange={setSpeed}
            cameraKey={cameraKey}
          />
        )}
        {activeView === "closest" && <ClosestPairView />}
        {activeView === "landing" && <LandingView snapshot={snapshot} />}
        {activeView === "laboratory" && <LaboratoryView />}

        <footer className="footer">
          <span>Ambiente de simulação acadêmica</span>
          <span>AERIS · FASTAPI · THREE.JS</span>
        </footer>
      </main>
    </div>
  );
}
