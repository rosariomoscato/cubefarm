import { useLayoutEffect, type RefObject } from 'react';
import * as THREE from 'three';
import type { AgentLook, AgentRole } from '../../../shared/types';
import { BUILD_SHAPE, type Appearance } from './appearance';
import { PARTS } from './characterParts';
import { ROBOT_PARTS as R } from './robotParts';
import { ROBOT, robotAccent, robotModule } from './robotAppearance';
import { EYES, MORPHS, MORPH_AT, type FaceState } from './face';
import { Part, Piece, useBatches } from './Batched';
import { look as batchLook } from './batch';

// The same robot parts serve the animated office rig and the appearance editor.
// Shells are instanced; LEDs use the existing glow batch, including on Low graphics.
export const INK = ROBOT.joint;
type Who = { role: AgentRole; color: string; look: AgentLook };
export const torsoWidth = (look: Appearance) => BUILD_SHAPE[look.build].width * look.shoulders;
const visorBatch = new THREE.MeshPhongMaterial({ color: '#ffffff', specular: '#4c7184', shininess: 90 });
const visorPlain = new THREE.MeshPhongMaterial({ color: ROBOT.visor, specular: '#4c7184', shininess: 90 });

export function TorsoWear({ agent, look }: { agent: Who; look: Appearance; busy: boolean }) {
  const accent = robotAccent(look, agent.role);
  const module = robotModule(look, agent.role);
  return (
    <group scale={[torsoWidth(look), 1, BUILD_SHAPE[look.build].depth]}>
      <Piece geometry={R.torso} color={ROBOT.shell} castShadow outline={0.009} />
      <Piece geometry={R.neck} color={INK} />
      <Piece geometry={R.torsoTrim} color={accent} />
      {['hoodie', 'cardigan', 'turtleneck'].includes(look.outfit) && <Piece geometry={R.guards} color={accent} />}
      <Piece geometry={R.badge} color={ROBOT.visor} />
      <Piece geometry={R.badgeRing} color={accent} />
      <Part look={batchLook(R.emblems[module], { shading: 'glow' })} color={accent} />
      {module === 'inspect' && (
        // Holstered beside the hip: the hands remain free for typing, mugs and office activities.
        <group position={[0.29, 0.24, -0.1]} rotation={[0, 0, -0.35]}>
          <Piece geometry={R.lensHandle} color={INK} />
          <Piece geometry={R.lensRim} color={accent} />
          <Piece geometry={R.lensGlass} color="#a8deed" />
          <Piece geometry={R.lensReflection} color="#f4fcff" />
        </group>
      )}
    </group>
  );
}

export function Sleeve({ agent, look }: { agent: Who; look: Appearance }) {
  return <>
    <Piece geometry={R.armJoints} color={INK} />
    <Piece geometry={R.arm} color={ROBOT.shell} castShadow outline={0.006} />
    <Piece geometry={R.wrist} color={robotAccent(look, agent.role)} />
    <Piece geometry={R.hand} color={INK} castShadow />
  </>;
}

/** Preserve every expression and blink from the existing animation system. */
export function applyFace(face: RefObject<THREE.Mesh | null>, f: FaceState, lid: number) {
  const w = face.current?.morphTargetInfluences;
  if (!w) return;
  for (let i = 0; i < MORPHS; i++) w[i] = f.w[i];
  for (let i = MORPH_AT.eyes; i < MORPH_AT.brows; i++) w[i] *= 1 - lid;
  w[MORPH_AT.eyes + EYES.closed] += lid;
}

export function HeadParts({ agent, look, busy, face }: { agent: Who; look: Appearance; busy: boolean; face: RefObject<THREE.Mesh | null> }) {
  const batches = useBatches();
  const accent = robotAccent(look, agent.role);
  const glasses = PARTS.glasses[look.glasses];
  const hat = PARTS.headwear[look.headwear];
  useLayoutEffect(() => face.current?.updateMorphTargets(), [face]);
  return <>
    <Piece geometry={R.head} color={ROBOT.shell} castShadow outline={0.008} />
    <Part look={batchLook(R.visor, { material: batches ? visorBatch : visorPlain })} color={ROBOT.visor} />
    <Piece geometry={R.ears} color={INK} />
    <Piece geometry={R.earRings} color={accent} />
    <Piece geometry={R.antenna} color={INK} />
    <Part look={batchLook(R.antennaTip, { shading: 'glow' })} color={accent} />
    <Piece geometry={R.headTrim} color={accent} />
    <Part ref={face} look={batchLook(R.face, { shading: 'glow' })} color={ROBOT.led} />
    {glasses && <Piece geometry={glasses} color={accent} scale={[1.6, 1.4, 1]} position={[0, 0, -0.07]} />}
    {hat && <Piece geometry={hat} color={accent} scale={[1.42, 1.1, 1.14]} position={[0, 0.07, 0.015]} castShadow />}
    {look.headphones && <group scale={[1.45, 1.16, 1.15]} position={[0, 0.018, 0]}>
      <Piece geometry={PARTS.headphones.shell} color={INK} castShadow />
      <Piece geometry={PARTS.headphones.covers} color={accent} />
    </group>}
    {busy && <Part look={batchLook(R.badgeRing, { shading: 'glow' })} color={ROBOT.led} scale={0.16} position={[0, -0.235, -0.19]} />}
  </>;
}
