// Canvas-only robot portrait: safe to load in pocket mode without three.js.
import { ROBOT, robotAccent, robotAppearanceFor, robotModule } from '../world/robotAppearance';
import type { Agent } from '../store';

export function drawPortrait(ctx: CanvasRenderingContext2D, s: number, agent: Pick<Agent, 'id' | 'look' | 'role' | 'color' | 'hair' | 'skin'> & Partial<Pick<Agent, 'style'>>) {
  const look = robotAppearanceFor(agent);
  const accent = robotAccent(look, agent.role);
  const module = robotModule(look, agent.role);
  ctx.save();
  ctx.scale(s / 160, s / 160);
  ctx.clearRect(0, 0, 160, 160);
  const rect = (x: number, y: number, w: number, h: number, r: number, fill: string) => {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
  };
  const circle = (x: number, y: number, r: number, fill: string) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
  };
  rect(0, 0, 160, 160, 26, '#e2edf0');
  rect(49, 113, 62, 54, 20, ROBOT.shell);
  rect(58, 121, 44, 5, 2, accent);
  circle(80, 143, 12, ROBOT.joint);
  ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = accent; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
  ctx.fillText(module === 'inspect' ? '✓' : module === 'plan' ? '◇' : module === 'coordinate' ? '◎' : '<>', 80, 148);
  rect(19, 60, 20, 38, 9, accent); rect(121, 60, 20, 38, 9, accent);
  rect(22, 65, 10, 28, 5, ROBOT.joint); rect(128, 65, 10, 28, 5, ROBOT.joint);
  ctx.strokeStyle = ROBOT.joint; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(90, 41); ctx.lineTo(98, 20); ctx.stroke();
  circle(99, 16, 6, accent);
  rect(31, 35, 98, 81, 25, ROBOT.shell);
  rect(38, 48, 84, 56, 18, ROBOT.visor);
  rect(67, 36, 26, 4, 2, accent);
  ctx.strokeStyle = '#304858'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(49, 59); ctx.quadraticCurveTo(50, 54, 64, 54); ctx.stroke();
  ctx.strokeStyle = ROBOT.led; ctx.lineWidth = 4;
  for (const x of [62, 98]) {
    ctx.beginPath(); ctx.moveTo(x - 7, 80); ctx.bezierCurveTo(x - 7, 62, x + 7, 62, x + 7, 80); ctx.stroke();
  }
  ctx.strokeStyle = '#d8f6ff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(75, 93); ctx.quadraticCurveTo(80, 96, 85, 93); ctx.stroke();
  if (look.glasses !== 'none') {
    ctx.strokeStyle = accent; ctx.lineWidth = 2;
    for (const x of [62, 98]) {
      ctx.beginPath();
      if (look.glasses === 'square') ctx.roundRect(x - 14, 59, 28, 28, 6);
      else ctx.arc(x, 73, 15, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(77, 72); ctx.lineTo(83, 72); ctx.stroke();
  }
  if (look.headphones) {
    ctx.strokeStyle = ROBOT.joint; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(25, 66); ctx.quadraticCurveTo(26, 26, 61, 31); ctx.stroke();
  }
  if (look.headwear !== 'none') {
    rect(33, 30, 94, 21, 10, accent);
    if (look.headwear === 'cap') rect(72, 45, 63, 6, 3, accent);
    else circle(80, 26, 7, ROBOT.shell);
  }
  ctx.restore();
}
