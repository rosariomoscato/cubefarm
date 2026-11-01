import { describe, expect, it } from 'vitest';
import { finding, type Problem } from './watchdog';
import type { OpsAlarm, UsageView } from '../shared/types';
import { alarmText, doctorFindingText } from '../client/src/ui/operationText';
import { usageMeter } from '../client/src/ops';
import { clock } from '../shared/usage';

const NOW = new Date(2026, 9, 31, 12).getTime();
const name = "Settings $& {name}'s on PR #77";
const problem = (kind: Problem['kind'], extra: Partial<Problem> = {}): Problem => ({ kind, key: kind, repoId: 'owner/Settings', agentId: 'a', prNumber: 77, issueNumber: 12, since: NOW - 45 * 60_000, ...extra });

describe('structured operation text', () => {
  it.each(['quiet', 'preparing', 'stale', 'qa-orphan', 'fix-orphan', 'unclosed'] as const)('localizes canonical %s findings and preserves English', (kind) => {
    const f = finding(problem(kind), () => name, 'merged', NOW);
    expect(doctorFindingText(f, name, 'en')).toBe(f.text);
    expect(doctorFindingText(f, name)).toBe(f.text);
    const text = doctorFindingText(f, name, 'it');
    expect(text).not.toBe(f.text);
    expect(text).toContain('77');
    if (['quiet', 'preparing', 'stale', 'fix-orphan'].includes(kind)) expect(text).toContain(name);
    expect(doctorFindingText({ ...f, text: f.text + ' extra' }, name, 'it')).toBe(f.text + ' extra');
  });

  it('covers issue tasks, closed work, missing names and all canonical durations', () => {
    for (const minutes of [1, 45, 120]) {
      for (const kind of ['quiet', 'preparing', 'unclosed'] as const) {
        const f = finding(problem(kind, { agentId: null, prNumber: kind === 'unclosed' ? 77 : null, since: NOW - minutes * 60_000 }), () => null, 'closed', NOW);
        const text = doctorFindingText(f, undefined, 'it');
        expect(text).not.toBe(f.text);
        expect(text).toContain(minutes === 120 ? '2 ore' : minutes === 1 ? '1 minuto' : '45 minuti');
      }
    }
    for (const kind of ['stale', 'fix-orphan'] as const) {
      const f = finding(problem(kind, { agentId: null }), () => null, 'closed', NOW);
      expect(doctorFindingText(f, undefined, 'it')).not.toBe(f.text);
    }
    const f = finding(problem('quiet'), () => name, 'open', NOW);
    expect(doctorFindingText(f, 'renamed', 'it')).toBe(f.text);
  });

  it('translates verified alarm headings only and keeps diagnostic suffixes literal', () => {
    const suffix = ': Error $& {name}: Settings\nraw output';
    for (const kind of ['pr', 'agent'] as const) {
      const prefix = kind === 'pr' ? 'PR #77 needs you' : `${name} is stuck on an error`;
      const alarm = { kind, prNumber: 77, text: prefix + suffix } as OpsAlarm;
      const text = alarmText(alarm, name, 'it');
      expect(text).not.toBe(alarm.text);
      expect(text.endsWith(suffix)).toBe(true);
      expect(alarmText(alarm, name, 'en')).toBe(alarm.text);
      expect(alarmText({ ...alarm, text: prefix + ' unknown' }, name, 'it')).toBe(prefix + ' unknown');
    }
  });

  it('localizes usage and reset weekdays without changing fallback English or unknown limits', () => {
    const u: UsageView = { state: 'pacing', until: NOW + 86400000, warning: { limit: null, pct: null, resetsAt: null, at: NOW } };
    expect(usageMeter(u, NOW).limit).toBe('AI usage');
    expect(usageMeter(u, NOW, 'it').limit).toBe('Utilizzo AI');
    expect(usageMeter(u, NOW, 'it').state).toBe('Rallentato');
    expect(usageMeter(u, NOW, 'it').resets).toMatch(/^dom /);
    for (const limit of ['5-hour limit', 'weekly limit', 'weekly Opus limit', 'weekly Sonnet limit']) {
      expect(usageMeter({ ...u, warning: { ...u.warning!, limit } }, NOW, 'it').limit).not.toBe(limit);
    }
    const limit = 'Settings $& {limit}';
    expect(usageMeter({ ...u, warning: { ...u.warning!, limit } }, NOW, 'it').limit).toBe(limit);
    expect(clock(NOW, NOW, 'it-IT')).toBe('12:00');
    expect(clock(NOW + 86400000, NOW, 'it-IT')).toMatch(/^dom /);
    expect(clock(NOW + 86400000, NOW)).toMatch(/^Sun /);
  });
});
