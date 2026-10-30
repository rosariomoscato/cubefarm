import { afterEach, expect, it, vi } from 'vitest';
import { elevenLabs } from './elevenlabs.ts';

afterEach(() => vi.unstubAllGlobals());

it('adds Italian hints to synthesis and transcription but preserves legacy English payloads', async () => {
  const requests: RequestInit[] = [];
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
    requests.push(init);
    return init.body instanceof FormData ? Response.json({ text: 'Ciao' }) : new Response(new Uint8Array([1, 2, 3]));
  }));
  const signal = new AbortController().signal;
  const req = { voiceId: 'voice', model: 'eleven_multilingual_v2', text: 'Ciao' };
  await elevenLabs.synthesize('fake-key', req, signal);
  await elevenLabs.synthesize('fake-key', { ...req, language: 'it' }, signal);
  expect(JSON.parse(requests[0].body as string)).toEqual({ text: 'Ciao', model_id: req.model });
  expect(JSON.parse(requests[1].body as string)).toEqual({ text: 'Ciao', model_id: req.model, language_code: 'it' });
  const clip = { audio: Buffer.alloc(10), type: 'audio/webm' };
  await elevenLabs.transcribe('fake-key', clip, signal);
  await elevenLabs.transcribe('fake-key', { ...clip, language: 'it' }, signal);
  expect((requests[2].body as FormData).has('language_code')).toBe(false);
  expect((requests[3].body as FormData).get('language_code')).toBe('it');
});
