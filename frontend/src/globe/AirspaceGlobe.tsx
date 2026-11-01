import { OrbitControls, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import type { Snapshot } from "../types";
import { AircraftMarker } from "./AircraftMarker";
import { Earth } from "./Earth";
import { FlightPath } from "./FlightPath";
import { ConflictOverlay } from "./ConflictOverlay";

type AirspaceGlobeProps = {
  snapshot: Snapshot;
  selectedId: string | null;
  onSelect: (id: string) => void;
  showRoutes: boolean;
  showLabels: boolean;
  cameraKey: number;
  playing: boolean;
};

export function AirspaceGlobe({ snapshot, selectedId, onSelect, showRoutes, showLabels, cameraKey, playing }: AirspaceGlobeProps) {
  const alertedIds = new Set(snapshot.conflicts.flatMap((conflict) => [conflict.a, conflict.b]));
  return (
    <Canvas
      key={cameraKey}
      camera={{ position: [4.6, 2.1, 6.3], fov: 42, near: 0.1, far: 100 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ touchAction: "none", cursor: "grab" }}
    >
      <color attach="background" args={["#050d18"]} />
      <ambientLight intensity={1.9} />
      <directionalLight position={[6, 4, 8]} intensity={2.6} />
      <Stars radius={65} depth={40} count={1800} factor={2} fade speed={0.2} />
      <Earth />
      {showRoutes &&
        snapshot.aircraft.map((aircraft) => (
          <FlightPath key={aircraft.id} aircraft={aircraft} selected={selectedId === aircraft.id} />
        ))}
      <ConflictOverlay snapshot={snapshot} />
      {snapshot.aircraft.map((aircraft) => (
        <AircraftMarker
          key={aircraft.id}
          aircraft={aircraft}
          selected={showLabels && selectedId === aircraft.id}
          alerted={alertedIds.has(aircraft.id)}
          playing={playing}
          onSelect={() => onSelect(aircraft.id)}
        />
      ))}
      <OrbitControls
        makeDefault
        enableRotate
        enableZoom
        enablePan={false}
        minDistance={3.45}
        maxDistance={15}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        rotateSpeed={0.8}
        enableDamping
        dampingFactor={0.09}
        mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
      />
    </Canvas>
  );
}
