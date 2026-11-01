import type { Analysis, LaboratoryPattern, LaboratoryReport, Snapshot } from "./types";

async function call<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch("/api/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error("API " + response.status);
  return response.json();
}

export const api = {
  snapshot: () => call<Snapshot>("snapshot"),
  advance: (seconds: number) => call<Snapshot>("advance", { seconds }),
  reset: () => call<Snapshot>("reset", {}),
  speed: (value: number) => call<Snapshot>("speed", { value }),
  analysis: () => call<Analysis>("analysis"),
  laboratory: (sizes: number[], pattern: LaboratoryPattern) =>
    call<LaboratoryReport>("laboratory", { sizes, pattern }),
};
