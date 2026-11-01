import { useEffect, useMemo } from "react";
import type { Object3DNode } from "@react-three/fiber";
import * as THREE from "three";
import type { Snapshot } from "../types";
import { toSphere } from "./geometry";

const ThreeLine = "line" as unknown as React.FC<Object3DNode<THREE.Line, typeof THREE.Line>>;

// Connect the two aircraft associated with each predicted conflict.
export function ConflictOverlay({ snapshot }: { snapshot: Snapshot }) {
  const lines = useMemo(() => snapshot.conflicts.slice(0, 8).flatMap((conflict) => {
    const a = snapshot.aircraft.find(p => p.id === conflict.a);
    const b = snapshot.aircraft.find(p => p.id === conflict.b);
    if (!a || !b) return [];
    // Draw the detected pair's current positions and highlight its association.
    const start = toSphere(a.lat, a.lon, 3.18);
    const end = toSphere(b.lat, b.lon, 3.18);
    const points = Array.from({length: 24}, (_, i) => {
      const t = i / 23;
      return start.clone().lerp(end, t).normalize().multiplyScalar(3.19 + 0.035 * Math.sin(Math.PI * t));
    });
    return [{id: conflict.a + conflict.b, geometry: new THREE.BufferGeometry().setFromPoints(points), attention: conflict.level === "attention"}];
  }), [snapshot]);
  useEffect(() => () => { lines.forEach(line => line.geometry.dispose()); }, [lines]);
  return <group>{lines.map(line => <ThreeLine key={line.id} geometry={line.geometry}><lineBasicMaterial color={line.attention ? "#ff845f" : "#ffca70"} transparent opacity={0.85}/></ThreeLine>)}</group>;
}
