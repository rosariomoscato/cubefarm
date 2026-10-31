import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ROBOT_DOG as R } from './robotDogParts';

const bounds = (g: THREE.BufferGeometry) => {
  g.computeBoundingBox();
  return g.boundingBox!;
};

describe('robot puppy geometry', () => {
  it('provides finite shared meshes and normals for every part', () => {
    for (const g of Object.values(R)) {
      expect(g.attributes.position.count).toBeGreaterThan(0);
      expect(g.attributes.normal.count).toBe(g.attributes.position.count);
      expect(Array.from(g.attributes.position.array).every(Number.isFinite)).toBe(true);
      expect(Array.from(g.attributes.normal.array).every(Number.isFinite)).toBe(true);
      g.computeBoundingSphere();
      expect(Number.isFinite(g.boundingSphere!.radius)).toBe(true);
    }
  });

  it('keeps paws on the old rig floor and the muzzle at its ball-carrying anchor', () => {
    expect(bounds(R.paw).min.y + 0.3).toBeGreaterThanOrEqual(-0.001);
    expect(bounds(R.paw).min.y + 0.3).toBeLessThan(0.01);
    expect(bounds(R.nose).max.x + 0.26).toBeLessThan(0.58);
    expect(bounds(R.body).min.y).toBeGreaterThanOrEqual(0.2);
    expect(bounds(R.body).max.z).toBeLessThanOrEqual(0.17);
  });

  it('keeps the luminous eyes in front of the visor, away from the muzzle and inside the screen', () => {
    const eyes = bounds(R.eyes).clone().translate(new THREE.Vector3(0.254, 0.095, 0));
    const visor = bounds(R.visor);
    expect(eyes.min.x).toBeGreaterThan(visor.max.x);
    expect(eyes.min.y).toBeGreaterThan(bounds(R.muzzle).max.y);
    expect(eyes.max.y).toBeLessThan(visor.max.y);
    expect(eyes.max.z).toBeLessThan(visor.max.z);
    expect(eyes.min.z).toBeGreaterThan(visor.min.z);
  });
});
