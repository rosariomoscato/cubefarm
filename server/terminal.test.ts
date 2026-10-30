import { describe, expect, it } from 'vitest';
import { AgentTerminal } from './terminal.ts';

describe('AgentTerminal', () => {
  it('keeps what was printed, so a late viewer sees the same screen', async () => {
    const t = new AgentTerminal();
    t.write('\x1b[32mhello\x1b[0m world\r\n');
    await t.flush();
    expect(t.screen()).toContain('hello world');
    const again = new AgentTerminal();
    again.write(t.snapshot());
    await again.flush();
    expect(again.screen()).toContain('hello world');
    t.dispose();
    again.dispose();
  });

  it('sends keystrokes and sizes to the running CLI, within sane bounds', () => {
    const t = new AgentTerminal();
    const got: string[] = [];
    t.bind({ write: (d) => got.push(d), resize: (c, r) => got.push(`${c}x${r}`) });
    expect(got).toEqual([`${t.cols}x${t.rows}`]);
    t.resize(5000, 1);
    expect([t.cols, t.rows]).toEqual([400, 5]);
    expect(got.at(-1)).toBe('400x5');
    t.bind(null);
    expect(t.live).toBe(false);
    t.dispose();
  });

  it('retains a closed full-screen reply across shrinking and reconnecting', async () => {
    const t = new AgentTerminal();
    const again = new AgentTerminal();
    try {
      t.resize(79, 17);
      t.write('\x1b[?1049h\x1b[HReply in the first row\x1b[17;1HWaiting');
      await t.flush();
      t.retainReply('Risposta finale salvata.\nNessun progetto collegato.');
      await t.flush();
      t.resize(35, 16);
      expect(t.screen()).toContain('Risposta finale salvata.');
      expect(t.screen()).toContain('Nessun progetto collegato.');
      again.resize(t.cols, t.rows);
      again.write(t.snapshot());
      await again.flush();
      expect(again.screen()).toContain('Risposta finale salvata.');
      expect(again.screen()).toContain('Nessun progetto collegato.');
    } finally {
      t.dispose();
      again.dispose();
    }
  });

  it('does not interpret control sequences in a retained reply', async () => {
    const t = new AgentTerminal();
    try {
      t.retainReply('Keep this\x1b[2J\x1b[H and this');
      await t.flush();
      expect(t.screen()).toContain('Keep this and this');
    } finally {
      t.dispose();
    }
  });
});
