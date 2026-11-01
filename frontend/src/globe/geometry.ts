import * as THREE from "three";

export const DEGREES_TO_RADIANS = Math.PI / 180;
export const EARTH_RADIUS = 3;

export const toSphere = (latitude: number, longitude: number, radius = 3.03) => {
  const polar = (90 - latitude) * DEGREES_TO_RADIANS;
  const azimuth = (longitude + 180) * DEGREES_TO_RADIANS;
  return new THREE.Vector3(
    -radius * Math.sin(polar) * Math.cos(azimuth),
    radius * Math.cos(polar),
    radius * Math.sin(polar) * Math.sin(azimuth),
  );
};
