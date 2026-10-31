// The office's own update, in plain words for the console and the HUD, and the reload that brings in the new client.
import type { OfficeUpdateView } from '../../shared/types';
import { translate, type Language } from '../../shared/i18n';

/** The server stops the sessions still running this long after it started draining (#37). */
export const DRAIN_TIMEOUT_MS = 20 * 60_000;

/** One line for the console's Office row, e.g. "3 updates ready" or "Waiting for 2 sessions to finish". */
export function officeUpdateText(u: OfficeUpdateView, language?: Language): string {
  const t = (text: string, values?: Record<string, string | number>) => translate(language, text, values);
  switch (u.state) {
    case 'none':
      return t('Up to date');
    case 'available':
      return u.behind > 0 ? t(u.behind === 1 ? '{count} update ready' : '{count} updates ready', { count: u.behind }) : t('An update is ready');
    case 'waiting':
    case 'draining':
      return u.running > 0 ? t(u.running === 1 ? 'Waiting for {count} session to finish' : 'Waiting for {count} sessions to finish', { count: u.running }) : t('Updating shortly…');
    case 'updating':
      return t('Updating…');
    case 'failed':
      return t('Last update failed: {detail}', { detail: u.detail || t('unknown error') });
  }
}

/** The HUD chip while an update is on its way; null when there's nothing to show. */
export function officeUpdateChip(u: OfficeUpdateView | undefined, language?: Language): string | null {
  if (!u) return null;
  if (u.state === 'updating') return translate(language, '⟳ Updating the office…');
  if (u.state !== 'waiting' && u.state !== 'draining') return null;
  return u.running > 0 ? translate(language, u.running === 1 ? '⟳ Updating the office after {count} session finishes' : '⟳ Updating the office after {count} sessions finish', { count: u.running }) : translate(language, '⟳ Updating the office shortly');
}

/** When a drain gives up on the sessions still running, or null when it isn't draining. */
export const drainDeadline = (u: OfficeUpdateView) => (u.state === 'draining' && u.drainingSince ? u.drainingSince + DRAIN_TIMEOUT_MS : null);

/** Update now: there's something to update, a launcher to do it, and it isn't already on its way. */
export const canUpdateNow = (u: OfficeUpdateView) => u.launcher && u.behind > 0 && (u.state === 'available' || u.state === 'waiting' || u.state === 'failed');

/** Later: postpone an update that is ready or about to start. */
export const canPostpone = (u: OfficeUpdateView) => u.launcher && (u.state === 'available' || u.state === 'waiting' || u.state === 'draining');

/** A dropped connection while the office is about to restart itself is expected, not an error. */
export const restartExpected = (u: OfficeUpdateView | undefined) => u?.state === 'draining' || u?.state === 'updating';

/**
 * Reload when the server comes back on a different commit, so the manager gets the matching client. At most once
 * per commit (remembered in sessionStorage), so a server that keeps reporting a new commit can't loop the page.
 */
export function shouldReload(before: string | null | undefined, after: string | null | undefined, reloadedFor: string | null): boolean {
  return !!before && !!after && before !== after && reloadedFor !== after;
}
