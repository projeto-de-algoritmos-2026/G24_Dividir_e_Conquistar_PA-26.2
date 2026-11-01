import type { Object3DNode } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import type { Aircraft } from "../types";
import { toSphere } from "./geometry";

const ThreeLine = "line" as unknown as React.FC<Object3DNode<THREE.Line, typeof THREE.Line>>;
const ARC_SAMPLES = 90;

export function FlightPath({ aircraft, selected }: { aircraft: Aircraft; selected: boolean }) {
  const [origin, destination] = aircraft.route;
  const arc = useMemo(() => {
    const start = toSphere(origin.lat, origin.lon, 3.08).normalize();
    const end = toSphere(destination.lat, destination.lon, 3.08).normalize();
    const angle = start.angleTo(end);
    const sine = Math.sin(angle);
    return Array.from({ length: ARC_SAMPLES }, (_, index) => {
      const fraction = index / (ARC_SAMPLES - 1);
      const point =
        sine < 1e-5
          ? start.clone()
          : start
              .clone()
              .multiplyScalar(Math.sin((1 - fraction) * angle) / sine)
              .add(end.clone().multiplyScalar(Math.sin(fraction * angle) / sine));
      return point.normalize().multiplyScalar(3.085 + 0.1 * Math.sin(Math.PI * fraction));
    });
  }, [origin.lat, origin.lon, destination.lat, destination.lon]);

  const travelledSamples = Math.max(2, Math.floor(aircraft.progress * (ARC_SAMPLES - 1)));
  const travelled = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(arc.slice(0, travelledSamples)),
    [arc, travelledSamples],
  );
  const remaining = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(arc.slice(travelledSamples - 1)),
    [arc, travelledSamples],
  );

  return (
    <group>
      <ThreeLine geometry={travelled}>
        <lineBasicMaterial color={selected ? "#62f2d0" : "#4a8f9a"} transparent opacity={selected ? 0.95 : 0.45} />
      </ThreeLine>
      <ThreeLine geometry={remaining}>
        <lineBasicMaterial color={selected ? "#e6f8ff" : "#6799b6"} transparent opacity={selected ? 0.9 : 0.4} />
      </ThreeLine>
    </group>
  );
}
