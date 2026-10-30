import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { state, release, micOpen } = vi.hoisted(() => ({
  state: {
    settings: { language: 'it', listen: { provider: 'browser', autoSend: false, handsFree: false }, voice: { provider: 'off' } },
    voiceKeySet: false,
    pushToast: vi.fn(),
  },
  release: vi.fn(), micOpen: vi.fn(),
}));
vi.mock('../store', () => ({ useStore: { getState: () => state } }));
vi.mock('../api', () => ({ api: {} }));
vi.mock('./Confirm', () => ({ isConfirmOpen: () => false }));
vi.mock('./controls', () => ({ bindings: () => ({ talk: ['KeyV'] }) }));
vi.mock('./music', () => ({ holdMusicDuck: () => release }));
vi.mock('./sfx', () => ({
  getAudioPrefs: () => ({ muted: false }), listenChime: vi.fn(),
  setMicOpen: micOpen, subscribeAudio: () => () => undefined,
}));

class Recognition {
  static last: Recognition;
  lang = '';
  onstart: (() => void) | null = null;
  onresult: ((e: { results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  constructor() { Recognition.last = this; }
  start() {}
  stop() { this.onend?.(); }
  abort = vi.fn(() => this.onend?.()); // exercise browsers which fire onend synchronously
}

let mic: typeof import('./mic');
let unregister: (() => void) | undefined;
let draft: string;
const send = vi.fn();

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance'] });
  vi.stubGlobal('window', { SpeechRecognition: Recognition, addEventListener: vi.fn() });
  vi.stubGlobal('document', { addEventListener: vi.fn(), visibilityState: 'visible' });
  vi.stubGlobal('navigator', {});
  state.settings.language = 'it';
  draft = 'Draft';
  mic = await import('./mic');
  unregister = mic.registerTarget({ id: 'chat', kind: 'phone', form: () => null,
    text: () => draft, setText: (text) => { draft = text; }, send, disabled: () => false });
});
afterEach(() => {
  unregister?.();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('microphone startup', () => {
  it('reports a stalled startup, releases audio, preserves the draft and can retry', () => {
    mic.listen('chat', 'tap');
    const first = Recognition.last;
    const lateStart = first.onstart!;
    expect(first.lang).toBe('it-IT');
    expect(mic.useMic.getState()).toMatchObject({ state: 'listening', live: false });
    vi.advanceTimersByTime(10_100);
    expect(mic.useMic.getState()).toMatchObject({ state: 'error', live: false });
    expect(state.pushToast).toHaveBeenCalledWith('error', expect.stringContaining('non si è avviato'));
    expect(state.pushToast).toHaveBeenCalledWith('error', expect.stringContaining('Brave'));
    expect(first.abort).toHaveBeenCalledOnce();
    expect(release).toHaveBeenCalledOnce();
    expect(micOpen).toHaveBeenLastCalledWith(false);
    expect(draft).toBe('Draft');
    expect(send).not.toHaveBeenCalled();
    mic.listen('chat', 'tap');
    lateStart();
    expect(mic.useMic.getState().live).toBe(false);
    Recognition.last.onstart?.();
    expect(mic.useMic.getState().live).toBe(true);
  });

  it('does not time out a live recognition and still delivers Italian text', () => {
    mic.listen('chat', 'hold');
    Recognition.last.onstart?.();
    vi.advanceTimersByTime(10_100);
    expect(state.pushToast).not.toHaveBeenCalled();
    Recognition.last.onresult?.({ results: [{ isFinal: true, 0: { transcript: 'ciao CEO' } }] });
    mic.finishListening('chat');
    expect(draft).toBe('Draft ciao CEO');
    expect(mic.useMic.getState().state).toBe('idle');
    expect(send).not.toHaveBeenCalled();
  });

  it('shows errors even when the browser never emits onend', () => {
    state.settings.language = 'en';
    mic.listen('chat', 'tap');
    Recognition.last.onerror?.({ error: 'not-allowed' });
    expect(state.pushToast).toHaveBeenCalledWith('error', expect.stringContaining('microphone is blocked'));
    expect(mic.useMic.getState().state).toBe('error');
    expect(release).toHaveBeenCalledOnce();
  });

  it('cancels quietly when the manager stops before startup', () => {
    mic.listen('chat', 'tap');
    mic.stopListening();
    vi.advanceTimersByTime(11_000);
    expect(mic.useMic.getState().state).toBe('idle');
    expect(state.pushToast).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
});
