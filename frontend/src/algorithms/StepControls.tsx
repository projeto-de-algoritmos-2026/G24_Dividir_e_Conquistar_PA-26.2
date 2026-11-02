import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { PLAYBACK_SPEEDS, type useStepPlayer } from "./useStepPlayer";

type StepControlsProps = {
  player: ReturnType<typeof useStepPlayer>;
  phaseLabel: string;
};

export function StepControls({ player, phaseLabel }: StepControlsProps) {
  return (
    <div className="step-controls">
      <div className="play-controls">
        <button className="icon-btn" title="Voltar ao início" onClick={player.restart}>
          <RotateCcw size={16} />
        </button>
        <button className="icon-btn" title="Passo anterior" onClick={player.previous} disabled={player.frame === 0}>
          <ChevronLeft size={17} />
        </button>
        <button className="play" onClick={player.togglePlaying}>
          {player.playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          {player.playing ? "Pausar" : player.frame >= player.lastFrame ? "Reproduzir de novo" : "Reproduzir"}
        </button>
        <button
          className="icon-btn"
          title="Próximo passo"
          onClick={player.next}
          disabled={player.frame >= player.lastFrame}
        >
          <ChevronRight size={17} />
        </button>
        <div className="separator" />
        <span className="control-label">VELOCIDADE</span>
        {PLAYBACK_SPEEDS.map((value) => (
          <button
            key={value}
            className={"speed " + (player.speed === value ? "chosen" : "")}
            onClick={() => player.setSpeed(value)}
          >
            {value}×
          </button>
        ))}
      </div>
      <div className="step-scrubber">
        <span className="control-label">{phaseLabel}</span>
        <input
          type="range"
          min={0}
          max={player.lastFrame}
          value={player.frame}
          onChange={(event) => player.goTo(Number(event.target.value))}
          aria-label="Linha do tempo da execução"
        />
        <span className="step-counter">
          {player.frame + 1} / {player.lastFrame + 1}
        </span>
      </div>
    </div>
  );
}
