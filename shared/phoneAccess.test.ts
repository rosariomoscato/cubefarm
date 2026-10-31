import { describe, expect, it } from 'vitest';
import { httpsOfficeUrl, needsPhoneAccess, phoneAccessState, PREVIEW_CHECK_EVENT, previewCheckResult, tailscaleServeCommand, type PhoneConnection } from './phoneAccess.ts';

const connection = (patch: Partial<PhoneConnection> = {}): PhoneConnection => ({ local: false, protocol: 'https:', secure: true, serviceWorker: true, ...patch });

describe('phone access guidance', () => {
  it('keeps local use unchanged and detects insecure or unsupported remote browsers', () => {
    expect(phoneAccessState(connection({ local: true, protocol: 'http:', secure: false, serviceWorker: false }))).toBe('local');
    expect(needsPhoneAccess(connection({ local: true, protocol: 'http:' }))).toBe(false);
    expect(phoneAccessState(connection())).toBe('https');
    expect(needsPhoneAccess(connection())).toBe(false);
    expect(phoneAccessState(connection({ protocol: 'http:' }))).toBe('remote-http');
    expect(needsPhoneAccess(connection({ protocol: 'http:', secure: false }))).toBe(true);
    expect(phoneAccessState(connection({ secure: false }))).toBe('unsupported');
    expect(phoneAccessState(connection({ serviceWorker: false }))).toBe('unsupported');
  });

  it('generates manual Serve commands for the actual port only, never host or shell input', () => {
    expect(tailscaleServeCommand(4437)).toBe('tailscale serve --bg --https=443 http://127.0.0.1:4437');
    expect(tailscaleServeCommand(4317)).toContain(':4317');
    for (const port of [0, -1, 65536, 1.5, NaN, Infinity, '4317; whoami', '4317'] as unknown as number[]) expect(tailscaleServeCommand(port)).toBeNull();
  });

  it('accepts an HTTPS root address for navigation only, never unsafe schemes or credentials', () => {
    expect(httpsOfficeUrl(' https://office.example:8443/ ')).toBe('https://office.example:8443/?pocket=1');
    for (const url of ['http://office.example', 'javascript:alert(1)', '//office.example', 'file:///tmp/a', 'https://user:password@office.example', 'https://office.example/sub/', 'https://office.example/?token=private', 'https://office.example/#a', 'not a url']) expect(httpsOfficeUrl(url)).toBeNull();
  });

  it('validates result type, exact nonce and boolean checks before accepting a message', () => {
    const valid = { type: PREVIEW_CHECK_EVENT, nonce: 'abc', worker: true, script: true, styles: false };
    expect(previewCheckResult(valid, 'abc')).toBe(true);
    for (const value of [null, '', {}, { ...valid, nonce: 'other' }, { ...valid, type: 'other' }, { ...valid, worker: 'true' }, { ...valid, styles: undefined }]) expect(previewCheckResult(value, 'abc')).toBe(false);
  });
});
