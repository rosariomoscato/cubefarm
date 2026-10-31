import * as THREE from 'three';
import { glow } from './materials';
import { OFFICE } from './officeAppearance';

const unit = new THREE.BoxGeometry(1, 1, 1);
const ignoreRay = () => {};

/** Surface inlay only: no collider, hit target, state, animation or real light. */
export function Inlay({ at, size, color = OFFICE.cyan }: {
  at: [number, number, number]; size: [number, number, number]; color?: string;
}) {
  return <mesh geometry={unit} material={glow(color)} position={at} scale={size} raycast={ignoreRay} />;
}
