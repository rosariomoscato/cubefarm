import { describe, expect, it } from 'vitest';
import { phoneAccessInfo } from './phoneAccess.ts';

describe('phone access metadata', () => {
  it('uses the actual bound port and exports no hostnames or settings', () => {
    expect(phoneAccessInfo({ address: '127.0.0.1', family: 'IPv4', port: 4437 })).toEqual({ port: 4437, loopbackOnly: true, supportsLoopbackProxy: true });
  });
  it('distinguishes wildcard, LAN-only and IPv6-only bindings for the manual IPv4 proxy command', () => {
    for (const [address, loopbackOnly, supportsLoopbackProxy] of [
      ['0.0.0.0', false, true], ['::', false, true], ['192.168.1.20', false, false], ['100.64.1.2', false, false], ['::1', true, false], ['127.0.0.2', true, false],
    ] as const) expect(phoneAccessInfo({ address, family: address.includes(':') ? 'IPv6' : 'IPv4', port: 9876 })).toEqual({ port: 9876, loopbackOnly, supportsLoopbackProxy });
  });
});
