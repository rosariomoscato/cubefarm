// Robot cosmetics use the existing saved style; old human fields remain intact for compatibility.
// Pure and shared with the 2D portrait: importing this never loads three.js in pocket mode.
import type { AgentLook, AgentRole } from '../../../shared/types';
import type { AgentStyle, Outfit } from '../../../shared/looks';
import { appearanceFor, type Appearance } from './appearance';

export const ROBOT = { shell: '#eee9dd', joint: '#243644', visor: '#081725', led: '#56dfff', gold: '#ffbd50' } as const;
export const ROBOT_ACCENTS = ['#ff951e', '#00b9e7', '#b673e2', '#ffbd50', '#37c879', '#ef5261'] as const;
export const PANEL_LABELS: Record<Outfit, string> = {
  tee: 'Code module', hoodie: 'Code module · reinforced', stripe: 'Planning module',
  cardigan: 'Planning module · reinforced', sweater: 'Inspection module', turtleneck: 'Inspection module · reinforced',
};
export type RobotModule = 'code' | 'plan' | 'inspect' | 'coordinate';
export const robotModule = (look: Appearance, role: AgentRole): RobotModule => role === 'ceo' ? 'coordinate'
  : look.outfit === 'sweater' || look.outfit === 'turtleneck' ? 'inspect'
    : look.outfit === 'stripe' || look.outfit === 'cardigan' ? 'plan' : 'code';
export const robotAccent = (look: Appearance, _role: AgentRole) => ROBOT_ACCENTS[look.accent];

export function robotAppearanceFor(agent: { id: string; look: AgentLook; role: AgentRole; style?: AgentStyle | null }): Appearance {
  const look = appearanceFor(agent);
  // A robot has no hair to obstruct hats or ear modules; saved accessory choices take precedence.
  const headwear = agent.style?.headwear ?? look.headwear;
  const module = robotModule(look, agent.role);
  const accent = agent.style?.accent ?? (module === 'coordinate' ? 3 : module === 'inspect' ? 2 : module === 'plan' ? 1 : 0);
  return { ...look, hair: 'buzz', facialHair: 'none', skin: ROBOT.shell, hairColor: ROBOT.joint,
    accent, headwear, headphones: headwear === 'none' && (look.headphones || module === 'code') };
}
