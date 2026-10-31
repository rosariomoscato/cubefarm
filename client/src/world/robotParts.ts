import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PARTS } from './characterParts';
import { EYES, MORPH_AT } from './face';

// Shared, low-poly shells; the original rig's hand/hip/knee anchors stay unchanged.
const rounded = (x: number, y: number, z: number, r: number) => new RoundedBoxGeometry(x, y, z, 2, r);
const ball = (r: number) => new THREE.SphereGeometry(r, 12, 8);
const ring = (r: number, tube = 0.012) => new THREE.TorusGeometry(r, tube, 6, 24);
function merge(...parts: THREE.BufferGeometry[]) {
  const flat = parts.map((g) => g.index ? g.toNonIndexed() : g);
  const out = mergeGeometries(flat)!;
  new Set([...parts, ...flat]).forEach((g) => g.dispose());
  return out;
}
function rod(a: [number, number, number], b: [number, number, number], r = 0.012) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const delta = end.clone().sub(start);
  return new THREE.CylinderGeometry(r, r, delta.length(), 8)
    .applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()))
    .translate(...start.add(end).multiplyScalar(0.5).toArray());
}
function face() {
  const g = PARTS.face.clone();
  const base = PARTS.face.attributes.position;
  // Flatten all absolute morph targets onto the visor, preserving the expression/blink contract.
  [g.attributes.position, ...(g.morphAttributes.position ?? [])].forEach((a, target) => {
    for (let i = 0; i < a.count; i++) {
      let y = a.getY(i);
      const eye = base.getY(i) >= -0.011 && base.getY(i) <= 0.051;
      if (eye && target !== MORPH_AT.eyes + EYES.wide + 1) {
        const dx = (base.getX(i) - Math.sign(base.getX(i)) * 0.07) / 0.03;
        const bend = target === MORPH_AT.eyes + EYES.closed + 1 ? -0.004 : target === MORPH_AT.eyes + EYES.happy + 1 ? 0.043 : 0.033;
        y = 0.012 + bend * (1 - dx * dx) + (base.getY(i) - 0.02) * 0.34;
      }
      if (base.getY(i) > 0.051) y = 0.078 + (y - 0.078) * 0.65;
      a.setXYZ(i, a.getX(i) * 1.6, y * 1.15, -0.269 + (a.getZ(i) + 0.2) * 0.04);
    }
  });
  g.computeVertexNormals();
  return g;
}
const badgeZ = -0.208;
const code = merge(rod([-0.03, 0.31, badgeZ], [-0.055, 0.285, badgeZ], 0.007), rod([-0.055, 0.285, badgeZ], [-0.03, 0.26, badgeZ], 0.007),
  rod([0.03, 0.31, badgeZ], [0.055, 0.285, badgeZ], 0.007), rod([0.055, 0.285, badgeZ], [0.03, 0.26, badgeZ], 0.007), rod([0.012, 0.315, badgeZ], [-0.012, 0.255, badgeZ], 0.006));
const plan = merge(...[[-0.04, 0.26], [0.04, 0.26], [0, 0.32]].map(([x, y]) => rounded(0.028, 0.025, 0.008, 0.004).translate(x, y, badgeZ)),
  rod([0, 0.31, badgeZ], [-0.04, 0.27, badgeZ], 0.004), rod([0, 0.31, badgeZ], [0.04, 0.27, badgeZ], 0.004));
const inspect = merge(rod([-0.04, 0.285, badgeZ], [-0.01, 0.26, badgeZ], 0.009), rod([-0.01, 0.26, badgeZ], [0.04, 0.315, badgeZ], 0.009));
const coordinate = merge(ring(0.035, 0.007).translate(0, 0.285, badgeZ), ...[-1, 1].map((s) => rod([s * 0.025, 0.285, badgeZ], [s * 0.055, 0.285, badgeZ], 0.007)));

export const ROBOT_PARTS = {
  head: rounded(0.62, 0.49, 0.43, 0.13).translate(0, 0.025, 0),
  visor: rounded(0.535, 0.355, 0.085, 0.095).translate(0, 0.01, -0.212),
  face: face(),
  ears: merge(...[-1, 1].map((s) => new THREE.CylinderGeometry(0.104, 0.104, 0.065, 20).rotateZ(Math.PI / 2).translate(s * 0.325, 0.015, 0))),
  earRings: merge(...[-1, 1].map((s) => ring(0.075, 0.012).rotateY(Math.PI / 2).translate(s * 0.365, 0.015, 0))),
  antenna: merge(ball(0.035).translate(0.09, 0.27, 0.04), rod([0.09, 0.27, 0.04], [0.14, 0.405, 0.04], 0.013)),
  antennaTip: ball(0.035).translate(0.14, 0.425, 0.04),
  headTrim: merge(rounded(0.14, 0.015, 0.12, 0.006).translate(0, 0.272, -0.015), rounded(0.07, 0.012, 0.012, 0.004).translate(0, -0.193, -0.208)),
  torso: rounded(0.4, 0.4, 0.33, 0.115).translate(0, 0.29, 0),
  neck: new THREE.CylinderGeometry(0.075, 0.075, 0.12, 12).translate(0, 0.52, 0),
  torsoTrim: merge(rounded(0.27, 0.035, 0.025, 0.008).translate(0, 0.425, -0.158), rounded(0.25, 0.025, 0.025, 0.008).translate(0, 0.13, -0.15)),
  guards: merge(...[-1, 1].map((s) => rounded(0.06, 0.23, 0.035, 0.012).translate(s * 0.16, 0.29, -0.135))),
  badge: new THREE.CylinderGeometry(0.077, 0.077, 0.025, 24).rotateX(Math.PI / 2).translate(0, 0.285, -0.178),
  badgeRing: ring(0.074, 0.008).translate(0, 0.285, -0.197),
  emblems: { code, plan, inspect, coordinate },
  arm: merge(rounded(0.14, 0.14, 0.15, 0.04).translate(0, 0, -0.13), rounded(0.15, 0.15, 0.17, 0.045).translate(0, 0, -0.34)),
  armJoints: merge(ball(0.075), ball(0.059).translate(0, 0, -0.235), ball(0.057).translate(0, 0, -0.445)),
  wrist: new THREE.CylinderGeometry(0.077, 0.077, 0.025, 14).rotateX(Math.PI / 2).translate(0, 0, -0.414),
  hand: merge(rounded(0.13, 0.095, 0.105, 0.03).translate(0, 0, -0.5), ...[-0.04, 0, 0.04].map((x) => rounded(0.028, 0.04, 0.065, 0.012).translate(x, 0.012, -0.55))),
  joint: ball(0.074),
  thigh: rounded(0.15, 0.23, 0.16, 0.045).translate(0, -0.16, 0),
  shin: rounded(0.15, 0.26, 0.15, 0.045).translate(0, -0.23, 0),
  shoe: rounded(0.17, 0.12, 0.25, 0.045).translate(0, -0.44, -0.065),
  legs: merge(...[-0.11, 0.11].flatMap((x) => [rounded(0.15, 0.16, 0.31, 0.045).translate(x, 0.5, -0.17), rounded(0.15, 0.32, 0.15, 0.045).translate(x, 0.25, -0.36)])),
  shoes: merge(...[-0.11, 0.11].map((x) => rounded(0.17, 0.12, 0.25, 0.045).translate(x, 0.06, -0.42))),
  lensRim: ring(0.09, 0.014),
  lensHandle: rod([0, -0.09, 0], [0, -0.23, 0], 0.019),
  lensGlass: new THREE.CircleGeometry(0.076, 24).rotateY(Math.PI),
  lensReflection: merge(rod([-0.042, 0.005, -0.004], [0.012, 0.055, -0.004], 0.006), rod([-0.018, -0.025, -0.004], [0.035, 0.025, -0.004], 0.004)),
};
