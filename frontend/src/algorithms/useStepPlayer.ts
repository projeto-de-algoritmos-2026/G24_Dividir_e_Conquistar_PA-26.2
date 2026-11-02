import { useCallback, useEffect, useState } from "react";

export const PLAYBACK_SPEEDS = [0.5, 1, 2, 4];
const BASE_INTERVAL_MS = 900;

export function useStepPlayer(totalFrames: number, resetKey: unknown) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const lastFrame = Math.max(0, totalFrames - 1);

  useEffect(() => {
    setFrame(0);
    setPlaying(false);
  }, [resetKey]);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setFrame((current) => {
        if (current >= lastFrame) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, BASE_INTERVAL_MS / speed);
    return () => clearInterval(timer);
  }, [playing, speed, lastFrame]);

  const togglePlaying = useCallback(() => {
    setFrame((current) => (current >= lastFrame ? 0 : current));
    setPlaying((value) => !value);
  }, [lastFrame]);

  const goTo = useCallback(
    (target: number) => {
      setPlaying(false);
      setFrame(Math.min(lastFrame, Math.max(0, target)));
    },
    [lastFrame],
  );

  return {
    frame: Math.min(frame, lastFrame),
    lastFrame,
    playing,
    speed,
    setSpeed,
    togglePlaying,
    goTo,
    next: () => goTo(frame + 1),
    previous: () => goTo(frame - 1),
    restart: () => goTo(0),
  };
}
