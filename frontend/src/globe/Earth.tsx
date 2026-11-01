import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { EARTH_RADIUS } from "./geometry";

export function Earth() {
  const surface = useLoader(THREE.TextureLoader, "/textures/earth_atmos_2048.jpg");
  const clouds = useLoader(THREE.TextureLoader, "/textures/earth_clouds_1024.png");
  return (
    <group>
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
        <meshStandardMaterial map={surface} roughness={1} />
      </mesh>
      <mesh>
        <sphereGeometry args={[3.018, 64, 64]} />
        <meshStandardMaterial map={clouds} transparent opacity={0.15} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[3.08, 64, 64]} />
        <meshBasicMaterial color="#65b7f5" side={THREE.BackSide} transparent opacity={0.06} />
      </mesh>
    </group>
  );
}
