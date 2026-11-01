import { useMemo } from "react";
import * as THREE from "three";

export function JetModel({ color }: { color: string }) {
  const fuselage = useMemo(() => new THREE.MeshStandardMaterial({ color, metalness: 0.65, roughness: 0.25 }), [color]);
  const glass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#172b3e", metalness: 0.35, roughness: 0.18 }),
    [],
  );
  return (
    <group rotation={[0, Math.PI, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={fuselage}>
        <cylinderGeometry args={[0.07, 0.13, 1.12, 16]} />
      </mesh>
      <mesh position={[0, 0, 0.64]} rotation={[Math.PI / 2, 0, 0]} material={fuselage}>
        <coneGeometry args={[0.07, 0.24, 16]} />
      </mesh>
      <mesh position={[0, 0.015, -0.05]} material={fuselage}>
        <boxGeometry args={[1.65, 0.035, 0.21]} />
      </mesh>
      <mesh position={[0, 0.02, -0.49]} material={fuselage}>
        <boxGeometry args={[0.61, 0.03, 0.15]} />
      </mesh>
      <mesh position={[0, 0.18, -0.54]} material={fuselage}>
        <boxGeometry args={[0.025, 0.36, 0.2]} />
      </mesh>
      <mesh position={[0, 0.075, 0.32]} material={glass}>
        <sphereGeometry args={[0.073, 12, 8]} />
      </mesh>
      {[-0.5, 0.5].map((offset) => (
        <mesh key={offset} position={[offset, -0.065, -0.09]} rotation={[Math.PI / 2, 0, 0]} material={glass}>
          <cylinderGeometry args={[0.075, 0.075, 0.28, 12]} />
        </mesh>
      ))}
    </group>
  );
}
