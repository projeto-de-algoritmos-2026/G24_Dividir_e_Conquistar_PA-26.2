import { Html } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { formatNumber } from "../format";
import type { Aircraft } from "../types";
import { DEGREES_TO_RADIANS, toSphere } from "./geometry";
import { JetModel } from "./JetModel";

type AircraftMarkerProps = {
  aircraft: Aircraft;
  selected: boolean;
  alerted: boolean;
  onSelect: () => void;
  playing: boolean;
};

const UP = new THREE.Vector3(0, 1, 0);

export function AircraftMarker({ aircraft, selected, alerted, onSelect, playing }: AircraftMarkerProps) {
  const position = toSphere(aircraft.lat, aircraft.lon, 3.15);
  const markerRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const from = useRef(position.clone());
  const to = useRef(position.clone());
  const animationStart = useRef(0);
  const firstUpdate = useRef(true);
  const lastProgress = useRef(aircraft.progress);
  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      from.current.copy(position);
      to.current.copy(position);
      markerRef.current?.position.copy(position);
      lastProgress.current = aircraft.progress;
      return;
    }
    const restarted = aircraft.progress < lastProgress.current;
    lastProgress.current = aircraft.progress;
    from.current.copy(restarted ? position : markerRef.current?.position ?? to.current);
    to.current.copy(position);
    animationStart.current = performance.now();
  }, [aircraft.lat, aircraft.lon, aircraft.progress]);
  useFrame(({ camera }) => {
    if (modelRef.current && markerRef.current) {
      const distance = camera.position.distanceTo(markerRef.current.position);
      const lod = THREE.MathUtils.clamp(4.5 / Math.max(distance, 0.1), 0.27, 0.85);
      modelRef.current.scale.setScalar((selected ? 0.13 : 0.085) * lod);
    }
    if (!markerRef.current) return;
    const progress = playing ? Math.min(1, (performance.now() - animationStart.current) / 1000) : 1;
    markerRef.current.position.copy(from.current).lerp(to.current, progress).normalize().multiplyScalar(3.15);
  });
  const orientation = useMemo(() => {
    const surfaceNormal = toSphere(aircraft.lat, aircraft.lon, 3.15).normalize();
    const standing = new THREE.Quaternion().setFromUnitVectors(UP, surfaceNormal);
    return standing.multiply(new THREE.Quaternion().setFromAxisAngle(UP, -aircraft.heading * DEGREES_TO_RADIANS));
  }, [aircraft.lat, aircraft.lon, aircraft.heading]);
  const bodyColor = alerted ? "#ffb477" : aircraft.carrier === "GOL" ? "#ffc78e" : "#e6f2ff";

  return (
    <group ref={markerRef} quaternion={orientation}>
      <group ref={modelRef} scale={0.06}>
        <JetModel color={bodyColor} />
      </group>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {(selected || alerted) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.12, 0.135, 32]} />
          <meshBasicMaterial color={alerted ? "#ffb477" : "#67f2d6"} side={THREE.DoubleSide} />
        </mesh>
      )}
      {selected && (
        <Html position={[0, 0.29, 0]} center distanceFactor={7} style={{ pointerEvents: "none" }}>
          <div className="world-label">
            {aircraft.id}
            <span>
              {formatNumber(aircraft.alt_ft)} FT · {aircraft.destination}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}
