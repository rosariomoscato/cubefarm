import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Shared robot-puppy shells, in the original dog's +X-facing rig. Feet and muzzle retain their anchors.
const round = (x: number, y: number, z: number, r: number) => new RoundedBoxGeometry(x, y, z, 2, r);
const ball = (r: number) => new THREE.SphereGeometry(r, 12, 8);
function merge(...parts: THREE.BufferGeometry[]) {
  const flat = parts.map(g => g.index ? g.toNonIndexed() : g);
  const result = mergeGeometries(flat)!;
  new Set([...parts, ...flat]).forEach(g => g.dispose());
  return result;
}
function rod(a: [number, number, number], b: [number, number, number], radius: number) {
  const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b);
  const d = to.clone().sub(from);
  return new THREE.CylinderGeometry(radius, radius, d.length(), 10)
    .applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()))
    .translate(...from.add(to).multiplyScalar(0.5).toArray());
}
const paw = () => merge(ball(0.022).scale(1.2, 1, 0.25), ...[-1, 0, 1].map((i) => ball(0.011).scale(1, 1.2, 0.4).translate(i * 0.021, 0.031 - Math.abs(i) * 0.008, 0)));

export const ROBOT_DOG = {
  body: round(0.62, 0.3, 0.32, 0.125).translate(0, 0.36, 0),
  backPanel: round(0.26, 0.025, 0.205, 0.012).translate(-0.06, 0.51, 0),
  sideDiscs: merge(...[-1, 1].map(s => new THREE.CylinderGeometry(0.06, 0.06, 0.015, 20).rotateX(Math.PI / 2).translate(-0.065, 0.365, s * 0.162))),
  pawMarks: merge(...[-1, 1].map(s => paw().rotateY(s < 0 ? Math.PI : 0).translate(-0.065, 0.36, s * 0.174))),
  legJoint: merge(ball(0.057), ball(0.038).translate(0, -0.215, 0)),
  leg: round(0.095, 0.16, 0.105, 0.035).translate(0, -0.12, 0),
  ankle: new THREE.CylinderGeometry(0.048, 0.048, 0.024, 12).translate(0, -0.205, 0),
  paw: merge(round(0.13, 0.065, 0.125, 0.025).translate(0.022, -0.265, 0), ...[-1, 0, 1].map(i => round(0.055, 0.04, 0.033, 0.012).translate(0.078, -0.274, i * 0.039))),
  toeMarks: merge(...[-1, 0, 1].map(i => round(0.025, 0.005, 0.018, 0.002).translate(0.081, -0.251, i * 0.039))),
  head: round(0.33, 0.34, 0.39, 0.105).translate(0.06, 0.06, 0),
  visor: round(0.065, 0.235, 0.32, 0.06).translate(0.211, 0.075, 0),
  // Eye-space origin is on the visor at eye height: scale Y for blinking/sleep without sliding the eyes.
  eyes: merge(...[-1, 1].map(s => new THREE.TorusGeometry(0.034, 0.008, 6, 18, Math.PI).rotateY(Math.PI / 2).translate(0, 0, s * 0.075))),
  muzzle: ball(0.071).scale(1.2, 0.66, 1.13).translate(0.215, -0.023, 0),
  nose: round(0.042, 0.035, 0.058, 0.014).translate(0.286, 0.008, 0),
  mouth: merge(rod([0.292, -0.009, 0], [0.299, -0.029, 0], 0.0035), ...[-1, 1].map(s => rod([0.299, -0.029, 0], [0.282, -0.034, s * 0.029], 0.0035))),
  tongue: round(0.065, 0.012, 0.035, 0.005),
  ear: round(0.105, 0.22, 0.052, 0.026).rotateZ(-0.12).translate(-0.012, -0.084, 0),
  earJoint: new THREE.CylinderGeometry(0.033, 0.033, 0.065, 14).rotateX(Math.PI / 2),
  earTrim: round(0.04, 0.11, 0.058, 0.019).rotateZ(-0.12).translate(-0.014, -0.065, 0),
  antenna: merge(ball(0.02).translate(0.025, 0.228, 0), rod([0.025, 0.23, 0], [-0.005, 0.302, 0], 0.008)),
  antennaTip: ball(0.022).translate(-0.005, 0.31, 0),
  headTrim: round(0.075, 0.012, 0.034, 0.005).translate(0.065, 0.232, 0),
  tailJoints: merge(ball(0.038), ball(0.027).translate(-0.075, 0.105, 0)),
  tail: merge(rod([-0.012, 0.02, 0], [-0.061, 0.083, 0], 0.032), rod([-0.082, 0.13, 0], [-0.086, 0.205, 0], 0.025)),
  tailTip: ball(0.027).translate(-0.085, 0.215, 0),
  collar: new THREE.TorusGeometry(0.115, 0.022, 8, 20),
  tag: new THREE.CylinderGeometry(0.032, 0.032, 0.012, 16),
};
