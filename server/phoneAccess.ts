import type { AddressInfo } from 'node:net';
import type { PhoneAccessInfo } from '../shared/phoneAccess.ts';
import { isLoopback } from './config.ts';

/** Use the bound socket, not Host/X-Forwarded-* or a guessed external URL. */
export function phoneAccessInfo(address: AddressInfo): PhoneAccessInfo {
  return {
    port: address.port,
    loopbackOnly: isLoopback(address.address),
    supportsLoopbackProxy: ['127.0.0.1', '0.0.0.0', '::'].includes(address.address),
  };
}
