import type { DoctorFinding, OpsAlarm } from '../../../shared/types';
import { translate, type Language } from '../../../shared/i18n';

/** Only replace a known, structured office prefix. The diagnostic suffix is never translated. */
export function alarmText(alarm: OpsAlarm, name: string | undefined, language?: Language): string {
  if (language !== 'it') return alarm.text;
  const prefix = alarm.kind === 'pr' && alarm.prNumber !== null ? `PR #${alarm.prNumber} needs you` : alarm.kind === 'agent' && name ? `${name} is stuck on an error` : null;
  if (!prefix || !(alarm.text === prefix || alarm.text.startsWith(prefix + ': '))) return alarm.text;
  const localized = alarm.kind === 'pr'
    ? translate(language, 'PR #{number} needs you', { number: alarm.prNumber! })
    : translate(language, '{name} is stuck on an error', { name: name! });
  return localized + alarm.text.slice(prefix.length);
}

function durationBetween(text: string, prefix: string, suffix: string, language: Language): string | null {
  if (!text.startsWith(prefix) || !text.endsWith(suffix)) return null;
  const match = /^(\d+) (minute|minutes|hours)$/.exec(text.slice(prefix.length, -suffix.length));
  return match ? translate(language, `{count} ${match[2]}`, { count: match[1] }) : null;
}

/** Localize the watchdog's exact known messages, not arbitrary text or old/unknown formats. */
export function doctorFindingText(f: DoctorFinding, name: string | undefined, language?: Language): string {
  if (language !== 'it') return f.text;
  const who = name ?? 'Someone';
  const values = { name: name ?? translate(language, 'Someone'), task: f.prNumber !== null ? `PR #${f.prNumber}` : `#${f.issueNumber}`, issue: f.issueNumber ?? '?', pr: f.prNumber ?? '?' };
  const t = (text: string, extra: Record<string, string | number> = {}) => translate(language, text, { ...values, ...extra });
  if (f.kind === 'quiet') {
    const duration = durationBetween(f.text, `${who} has been quiet for `, ` on ${values.task}, even after a nudge. Stop them, or put the work back in line?`, language);
    if (duration) return t('{name} has been quiet for {duration} on {task}, even after a nudge. Stop them, or put the work back in line?', { duration });
  } else if (f.kind === 'preparing') {
    const duration = durationBetween(f.text, `${who} has been setting up a desk for ${values.task} for `, '. Put the work back in line?', language);
    if (duration) return t('{name} has been setting up a desk for {task} for {duration}. Put the work back in line?', { duration });
  } else if (f.kind === 'stale') {
    if (f.text === `${who}'s last task ${values.task} is already merged. Clear the desk?`) return t('{name}’s last task {task} is already merged. Clear the desk?');
    if (f.text === `${who}'s last task ${values.task} is already closed. Clear the desk?`) return t('{name}’s last task {task} is already closed. Clear the desk?');
  } else if (f.kind === 'qa-orphan') {
    if (f.text === `PR #${f.prNumber} is marked as in QA, but nobody is testing it. Test it again?`) return t('PR #{pr} is marked as in QA, but nobody is testing it. Test it again?');
  } else if (f.kind === 'fix-orphan') {
    if (f.text === `PR #${f.prNumber} is waiting for a fix, but ${f.agentId ? `${who} is on something else` : 'nobody is on it'}. Hand it to a free agent?`) {
      return t(f.agentId ? 'PR #{pr} is waiting for a fix, but {name} is on something else. Hand it to a free agent?' : 'PR #{pr} is waiting for a fix, but nobody is on it. Hand it to a free agent?');
    }
  } else if (f.kind === 'unclosed') {
    const duration = durationBetween(f.text, `Issue #${f.issueNumber} is still open, but PR #${f.prNumber}, which closes it, was merged `, ' ago. Close it?', language);
    if (duration) return t('Issue #{issue} is still open, but PR #{pr}, which closes it, was merged {duration} ago. Close it?', { duration });
  }
  return f.text;
}
