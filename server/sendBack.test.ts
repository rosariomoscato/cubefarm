import { describe, expect, it } from 'vitest';
import { HttpError } from './httpError.ts';
import { MAX_SEND_BACK_NOTE, parseSendBackNote, sendBackPatch, type SendBackRecord } from './sendBack.ts';

const open = { state: 'OPEN', mergeable: 'MERGEABLE', mergeState: 'CLEAN' } as const;
const record = (r: Partial<SendBackRecord> = {}): SendBackRecord => ({ status: 'needs-human', fixInstructions: 'Make the toolbar wrap below 480px.', retests: 1, passedSha: null, ...r });

const status = (fn: () => unknown) => {
  try {
    fn();
  } catch (err) {
    return err instanceof HttpError ? err.status : 'not an HttpError';
  }
  return 'no error';
};

describe('sendBackPatch', () => {
  it('turns a needs-human PR into a failed one with QA’s instructions plus the note, and one more QA round', () => {
    expect(sendBackPatch(108, open, record(), 'main', '  merge main and keep both e2e tests ')).toEqual({
      status: 'failed',
      fixReason: 'qa',
      fixInstructions: 'Make the toolbar wrap below 480px.\n\nFrom the manager: merge main and keep both e2e tests',
      sessionFailures: 0,
      retests: 2,
      mergeNote: null,
    });
  });

  it('keeps the instructions as they are without a note, and uses the note alone when QA left none', () => {
    expect(sendBackPatch(108, open, record(), 'main').fixInstructions).toBe('Make the toolbar wrap below 480px.');
    expect(sendBackPatch(108, open, record(), 'main', '   ').fixInstructions).toBe('Make the toolbar wrap below 480px.');
    expect(sendBackPatch(108, open, record({ fixInstructions: null }), 'main', 'Rebase it').fixInstructions).toBe('From the manager: Rebase it');
    expect(sendBackPatch(108, open, record({ fixInstructions: null }), 'main').fixInstructions).toBeNull();
  });

  it('also takes a PR that failed QA and is waiting for a developer', () => {
    expect(sendBackPatch(108, open, record({ status: 'failed' }), 'main', 'Check the README too').status).toBe('failed');
  });

  it('requires an explicit manager action and a nonblank note to reopen a passed PR', () => {
    const passed = Object.freeze(record({ status: 'passed', passedSha: 'old-pass' }));
    expect(status(() => sendBackPatch(108, open, passed, 'main', 'Refine layout'))).toBe(409);
    expect(status(() => sendBackPatch(108, open, passed, 'main', ' ', undefined, true))).toBe(400);
    const patch = sendBackPatch(108, { ...open, headSha: 'current-head' }, passed, 'main', 'Use three cells', undefined, true);
    expect(patch).toMatchObject({ status: 'failed', fixReason: 'manager', requestedSha: 'current-head', fixInstructions: 'From the manager: Use three cells', retests: 2 });
    expect(patch).not.toHaveProperty('passedSha');
    expect(patch).not.toHaveProperty('testedSha');
    expect(patch).not.toHaveProperty('summary');
    expect(passed.passedSha).toBe('old-pass');
    expect(passed.status).toBe('passed');
  });

  it('keeps busy/closed/untested PR guards for manager refinements and handles conflicts without bypassing QA', () => {
    for (const s of ['testing', 'fixing', 'queued'] as const) {
      expect(status(() => sendBackPatch(108, open, record({ status: s }), 'main', 'Refine', undefined, true))).toBe(409);
    }
    expect(status(() => sendBackPatch(108, { ...open, state: 'MERGED' }, record({ status: 'passed' }), 'main', 'Refine', undefined, true))).toBe(404);
    const patch = sendBackPatch(108, { ...open, mergeable: 'CONFLICTING' }, record({ status: 'passed', passedSha: 'ok' }), 'main', 'Refine', undefined, true);
    expect(patch.fixReason).toBe('manager');
    expect(patch.fixInstructions).toContain('conflicts with main');
    expect(patch.fixInstructions).not.toContain('Make the toolbar');
  });

  it('retains the manager-request reason when a pending request is sent back again', () => {
    const patch = sendBackPatch(108, open, record({ status: 'failed', fixReason: 'manager', fixInstructions: 'From the manager: Use three cells' }), 'main', 'Keep the borders');
    expect(patch.fixReason).toBe('manager');
    expect(patch.fixInstructions).toContain('Use three cells');
    expect(patch.fixInstructions).toContain('Keep the borders');
  });

  it('says conflict when the PR conflicts now, and qa otherwise', () => {
    expect(sendBackPatch(108, { ...open, mergeable: 'CONFLICTING' }, record(), 'main').fixReason).toBe('conflict');
    expect(sendBackPatch(108, { ...open, mergeState: 'DIRTY' }, record(), 'main').fixReason).toBe('conflict');
    expect(sendBackPatch(108, { ...open, mergeable: 'UNKNOWN', mergeState: 'UNKNOWN' }, record(), 'main').fixReason).toBe('qa');
  });

  it('adds the merge to the instructions of a conflicting PR QA never passed, once', () => {
    const conflicting = { ...open, mergeable: 'CONFLICTING' } as const;
    const sent = sendBackPatch(108, conflicting, record(), 'main', 'keep both tests');
    expect(sent.fixInstructions).toMatch(/^Make the toolbar wrap below 480px\.\n\nFrom the manager: keep both tests\n\nIt also conflicts with main: /);
    const again = sendBackPatch(108, conflicting, record({ fixInstructions: sent.fixInstructions }), 'main');
    expect(again.fixInstructions).toBe(sent.fixInstructions);
    // QA passed it: the merge-fix prompt already says to merge
    expect(sendBackPatch(108, conflicting, record({ passedSha: 'abc' }), 'main').fixInstructions).toBe('Make the toolbar wrap below 480px.');
  });

  it('is a 404 for an unknown or closed PR', () => {
    expect(status(() => sendBackPatch(108, undefined, record(), 'main'))).toBe(404);
    expect(status(() => sendBackPatch(108, { ...open, state: 'CLOSED' }, record(), 'main'))).toBe(404);
    expect(status(() => sendBackPatch(108, { ...open, state: 'MERGED' }, record(), 'main'))).toBe(404);
  });

  it('is a 409 while the PR is being tested or fixed, or when nobody is waiting on it', () => {
    for (const s of ['testing', 'fixing', 'queued', 'passed'] as const) expect(status(() => sendBackPatch(108, open, record({ status: s }), 'main'))).toBe(409);
    expect(status(() => sendBackPatch(108, open, undefined, 'main'))).toBe(409);
  });
});

describe('parseSendBackNote', () => {
  it('reads an optional one-line note', () => {
    expect(parseSendBackNote({ note: ' keep both tests ' })).toBe('keep both tests');
    expect(parseSendBackNote({ note: '' })).toBeUndefined();
    expect(parseSendBackNote({})).toBeUndefined();
    expect(parseSendBackNote(undefined)).toBeUndefined();
  });

  it('refuses a note that is too long or not text', () => {
    expect(parseSendBackNote({ note: 'x'.repeat(MAX_SEND_BACK_NOTE) })).toHaveLength(MAX_SEND_BACK_NOTE);
    expect(status(() => parseSendBackNote({ note: 'x'.repeat(MAX_SEND_BACK_NOTE + 1) }))).toBe(400);
    expect(status(() => parseSendBackNote({ note: 42 }))).toBe(400);
  });
});
