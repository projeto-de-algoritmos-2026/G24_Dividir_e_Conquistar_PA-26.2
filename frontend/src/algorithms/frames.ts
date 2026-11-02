import type { ClosestPairStep, MedianSplit } from "../types";

export type ClosestPairFrame =
  | { phase: "divide"; depth: number }
  | { phase: "conquer"; step: ClosestPairStep }
  | { phase: "result" };

export type RadiusSearchFrame = { phase: "split"; depth: number } | { phase: "pairs" };

const deepestLevel = (depths: number[]) => (depths.length ? Math.max(...depths) : 0);

export function buildClosestPairFrames(steps: ClosestPairStep[]): ClosestPairFrame[] {
  const combineDepths = steps.filter((step) => step.kind === "combine").map((step) => step.depth);
  const divideFrames = Array.from({ length: deepestLevel(combineDepths) + 1 }, (_, depth) => ({
    phase: "divide" as const,
    depth,
  }));
  return [...divideFrames, ...steps.map((step) => ({ phase: "conquer" as const, step })), { phase: "result" }];
}

export function buildRadiusSearchFrames(splits: MedianSplit[]): RadiusSearchFrame[] {
  const splitFrames = Array.from({ length: deepestLevel(splits.map((split) => split.depth)) + 1 }, (_, depth) => ({
    phase: "split" as const,
    depth,
  }));
  return [...splitFrames, { phase: "pairs" }];
}
