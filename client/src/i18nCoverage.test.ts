import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseSync } from 'rolldown/utils';
import { italian, translate } from '../../shared/i18n';
import { NOTIFY_EVENTS } from '../../shared/notify';
import { THEME_INFO } from '../../shared/themes';
import { BUILDS, FACIAL_HAIR, GLASSES, HEADWEAR } from '../../shared/looks';
import { QA_BADGE } from './ui/channels';
import { KIND_WORD, PALETTE_LABELS } from './ui/statusLook';
import { doingText, floorRows } from './ui/floorRows';
import { doing } from './pocket/pocketData';
import { qaCardNote } from './qaCard';
import { officeUpdateText } from './officeUpdate';
import type { OfficeUpdateView } from '../../shared/types';
import type { Agent } from './store';

const surfaces = [
  'ui/ManagerConsole.tsx', 'ui/KanbanView.tsx', 'ui/TerminalView.tsx', 'ui/AgentSettings.tsx',
  'ui/AccessibilitySettings.tsx', 'ui/ProfileSettings.tsx', 'ui/OutsideSettings.tsx',
  'ui/ThemeSettings.tsx', 'ui/NotifySettings.tsx', 'ui/VoiceSettings.tsx', 'ui/CloudSettings.tsx',
  'ui/FloorList.tsx', 'ui/Phone.tsx', 'ui/AppViewer.tsx', 'ui/ProjectPicker.tsx', 'ui/Tutorial.tsx', 'pocket/Pocket.tsx', 'pocket/PocketTeam.tsx', 'pocket/PocketApprovals.tsx',
];

describe('Italian interface coverage', () => {
  it('has translations for literal messages explicitly marked on the covered surfaces', () => {
    const keys = new Set<string>();
    type Node = { type?: string; [key: string]: unknown };
    const literals = (node: Node | undefined) => {
      if (node?.type === 'Literal' && typeof node.value === 'string' && node.value) keys.add(node.value);
      if (node?.type === 'ConditionalExpression') {
        literals(node.consequent as Node);
        literals(node.alternate as Node);
      }
    };
    const visit = (node: Node) => {
      const callee = node.callee as Node | undefined;
      if (node.type === 'CallExpression' && (callee?.name === 't' || (callee?.type === 'MemberExpression' && (callee.property as Node)?.name === 't'))) literals((node.arguments as Node[])[0]);
      if (node.type === 'JSXElement' && ((node.openingElement as Node).name as Node)?.name === 'T') {
        for (const child of node.children as Node[]) {
          if (child.type === 'JSXText') keys.add((child.value as string).replace(/\s+/g, ' ').trim());
          if (child.type === 'JSXExpressionContainer') literals(child.expression as Node);
        }
      }
      for (const value of Object.values(node)) {
        if (Array.isArray(value)) {
          for (const item of value) if (item && typeof item === 'object') visit(item as Node);
        } else if (value && typeof value === 'object') visit(value as Node);
      }
    };
    for (const file of surfaces) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8');
      const parsed = parseSync(file, source);
      expect(parsed.errors, file).toEqual([]);
      visit(parsed.program as unknown as Node);
    }
    expect(keys.size).toBeGreaterThan(200);
    for (const key of keys) expect(Object.hasOwn(italian, key), key).toBe(true);
  });

  it('covers the settings labels supplied by shared data', () => {
    const keys = [
      ...NOTIFY_EVENTS.map((event) => event.label), ...Object.values(PALETTE_LABELS), ...Object.values(KIND_WORD),
      ...Object.values(THEME_INFO).flatMap((theme) => [theme.name, theme.when]),
      ...Object.values(QA_BADGE),
      ...[...BUILDS, ...FACIAL_HAIR, ...GLASSES, ...HEADWEAR].map((value) => value[0].toUpperCase() + value.slice(1)),
    ];
    for (const key of keys) expect(Object.hasOwn(italian, key), key).toBe(true);
  });

  it('localizes status and task framing, not repository titles, names or model IDs', () => {
    const agent = { id: 'a', name: 'Settings', role: 'agent', status: 'working', task: 'qa', prNumber: 15, issueTitle: 'Save $& {name}', cli: 'opencode', host: 'local' } as Agent;
    expect(doingText(agent, 'it')).toBe('Verifica della PR #15: Save $& {name}');
    expect(doingText(agent)).toBe('Testing PR #15: Save $& {name}');
    expect(doing(agent, 'it')).toBe('Verifica della PR #15: Save $& {name}');
    const row = floorRows([agent], { runtime: 'terminal', defaultCli: 'opencode', language: 'it' }, [{ id: 'opencode', label: 'OpenCode', installed: true, version: '2', integrated: true }])[0];
    expect(row.name).toBe('Settings');
    expect(row.agent).toBe('OpenCode');
    expect(row.status).toBe('Al lavoro');
    expect(row.doing).toContain(agent.issueTitle);
    expect(translate('it', 'provider/model#variant')).toBe('provider/model#variant');
  });

  it('localizes generated notes without rewriting technical details', () => {
    const pull = { isDraft: false, mergeable: 'MERGEABLE', checks: 'passing' } as const;
    expect(qaCardNote({ status: 'fixing', round: 2, mergeNote: null, ceoLooking: false }, pull, false, 'it').note).toBe('🔧 correzione · ciclo 2');
    expect(qaCardNote({ status: 'passed', round: 1, mergeNote: 'Save $& {detail}', ceoLooking: false }, pull, false, 'it').note).toBe('QA ✓ · Save $& {detail}');
    expect(officeUpdateText({ state: 'available', behind: 2 } as OfficeUpdateView, 'it')).toBe('2 aggiornamenti pronti');
    expect(officeUpdateText({ state: 'failed', detail: 'Error $& {detail}' } as OfficeUpdateView, 'it')).toBe('Ultimo aggiornamento fallito: Error $& {detail}');
  });
});
