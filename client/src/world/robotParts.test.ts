import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ROBOT_PARTS as R } from './robotParts';
import { FACES, MORPHS, MORPH_AT, EYES } from './face';
import { robotAppearanceFor, robotAccent, robotModule, PANEL_LABELS, ROBOT_ACCENTS } from './robotAppearance';
import { cleanStyle, ACCENT_COLORS, OUTFITS } from '../../../shared/looks';
import { translate } from '../../../shared/i18n';

describe('robot integration', () => {
  it('keeps legacy style data intact and applies accessories without hair restrictions', () => {
    const agent = { id: 'robot', role: 'agent' as const, look: 'feminine' as const,
      style: { hair: 'afro' as const, skin: '#8d5524', hairColor: '#2b2118', headwear: 'cap' as const, glasses: 'square' as const, outfit: 'sweater' as const, accent: 4 } };
    const saved = JSON.stringify(agent);
    const look = robotAppearanceFor(agent);
    expect(look.headwear).toBe('cap');
    expect(look.headphones).toBe(false);
    expect(look.glasses).toBe('square');
    expect(robotModule(look, agent.role)).toBe('inspect');
    expect(robotAccent(look, agent.role)).toBe(ROBOT_ACCENTS[4]);
    expect(JSON.stringify(agent)).toBe(saved);
  });

  it('uses server-valid cosmetic indices and translates every module without changing jobs', () => {
    expect(ROBOT_ACCENTS).toHaveLength(ACCENT_COLORS.length);
    for (const outfit of OUTFITS) for (const accent of ROBOT_ACCENTS.keys()) {
      const style = { outfit, accent };
      expect(cleanStyle(style)).toEqual(style);
      expect(translate('it', PANEL_LABELS[outfit])).not.toBe(PANEL_LABELS[outfit]);
      expect(translate('en', PANEL_LABELS[outfit])).toBe(PANEL_LABELS[outfit]);
    }
  });

  it('builds finite shared geometry, including normals and bounds for culling', () => {
    const geometries = [...Object.values(R).filter((g): g is THREE.BufferGeometry => g instanceof THREE.BufferGeometry), ...Object.values(R.emblems)];
    for (const g of geometries) {
      expect(g.attributes.position.count).toBeGreaterThan(0);
      expect(Array.from(g.attributes.position.array).every(Number.isFinite)).toBe(true);
      expect(Array.from(g.attributes.normal.array).every(Number.isFinite)).toBe(true);
      g.computeBoundingSphere();
      expect(Number.isFinite(g.boundingSphere!.radius)).toBe(true);
    }
  });

  it('keeps every animated LED in front of the visor and inside its face area', () => {
    const base = R.face.attributes.position;
    const targets = R.face.morphAttributes.position!;
    expect(targets).toHaveLength(MORPHS);
    for (const weights of Object.values(FACES)) {
      for (let v = 0; v < base.count; v++) {
        const p = new THREE.Vector3().fromBufferAttribute(base, v);
        for (let m = 0; m < MORPHS; m++) {
          p.addScaledVector(new THREE.Vector3().fromBufferAttribute(targets[m], v).sub(new THREE.Vector3().fromBufferAttribute(base, v)), weights[m]);
        }
        expect(p.z).toBeLessThan(-0.2545); // visor front
        expect(Math.abs(p.x)).toBeLessThan(0.24);
        expect(p.y).toBeGreaterThan(-0.16);
        expect(p.y).toBeLessThan(0.15);
      }
    }
    const closed = targets[MORPH_AT.eyes + EYES.closed];
    const height = (a: typeof base) => {
      const ys = Array.from({ length: 198 }, (_, i) => a.getY(i)); // both eye spheres, before brows/mouth
      return Math.max(...ys) - Math.min(...ys);
    };
    expect(height(closed)).toBeLessThan(height(base) * 0.6);
  });
});
