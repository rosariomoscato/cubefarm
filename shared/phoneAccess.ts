/** Browser capabilities, not forwarded headers, decide whether the preview worker can run. */
export type PhoneAccessState = 'local' | 'https' | 'remote-http' | 'unsupported';
export interface PhoneConnection {
  local: boolean;
  protocol: string;
  secure: boolean;
  serviceWorker: boolean;
}
export interface PhoneAccessInfo {
  port: number;
  loopbackOnly: boolean;
  supportsLoopbackProxy: boolean;
}
export function phoneAccessState(c: PhoneConnection): PhoneAccessState {
  if (c.local) return 'local';
  if (c.protocol !== 'https:') return 'remote-http';
  return c.secure && c.serviceWorker ? 'https' : 'unsupported';
}
export const needsPhoneAccess = (c: PhoneConnection) => ['remote-http', 'unsupported'].includes(phoneAccessState(c));

/** Only the server's actual numeric listening port enters a copyable shell command. */
export function tailscaleServeCommand(port: number): string | null {
  return Number.isInteger(port) && port > 0 && port <= 65535 ? `tailscale serve --bg --https=443 http://127.0.0.1:${port}` : null;
}

/** Navigation only: never a server-side URL probe, and never credentials or non-root mounts. */
export function httpsOfficeUrl(input: string): string | null {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    return `${url.origin}/?pocket=1`;
  } catch {
    return null;
  }
}

export const PREVIEW_CHECK_PATH = '/preview/0/__cubefarm_check__';
export const PREVIEW_CHECK_EVENT = 'cubefarm-preview-check';
export interface PreviewCheckResult { type: typeof PREVIEW_CHECK_EVENT; nonce: string; worker: boolean; script: boolean; styles: boolean }
export function previewCheckResult(value: unknown, nonce: string): value is PreviewCheckResult {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<PreviewCheckResult>;
  return v.type === PREVIEW_CHECK_EVENT && v.nonce === nonce && typeof v.worker === 'boolean' && typeof v.script === 'boolean' && typeof v.styles === 'boolean';
}
