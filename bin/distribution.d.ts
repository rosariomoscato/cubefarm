export function isNewer(candidate: string, current: string): boolean;
export function updateInfo(name: string, version: string): { channel: string; command: string; url: string };
export function releaseInfo(version: string, ref: string): { tag: string; channel: string };
