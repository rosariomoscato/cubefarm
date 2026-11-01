import { mayStart, PACING_MS, waived, warningView, usageView, type UsageWarning, type Waiver, type WorkKind } from './pacing.ts';
import type { UsageWarningView } from '../shared/types.ts';

export interface QuotaWindow {
  pausedUntil: number;
  pacingUntil: number;
  limit: string | null;
  waiver: Waiver | null;
  warning: UsageWarningView | null;
  warnings?: Record<string, { until: number; waiver: Waiver | null }>;
}

/** Resource-local gates: no provider list, cross-tool sharing or automatic fallback is inferred here. */
export class QuotaGate {
  constructor(readonly windows: Record<string, QuotaWindow> = {}) {}

  private window(key: string): QuotaWindow {
    let w = this.windows[key];
    if (!w) this.windows[key] = w = { pausedUntil: 0, pacingUntil: 0, limit: null, waiver: null, warning: null };
    return w;
  }

  limit(key: string, resetsAt: number | null, now: number): void {
    if (resetsAt !== null && !Number.isFinite(resetsAt)) resetsAt = null;
    const w = this.window(key);
    // A retry without reset information must not extend an already-known pause on every attempt.
    if (resetsAt === null && w.pausedUntil > now) return;
    w.pausedUntil = Math.max(w.pausedUntil, resetsAt !== null && resetsAt > now ? resetsAt : now + 5 * 60_000);
    w.warning = { limit: 'rate limit', pct: null, resetsAt, at: now };
  }

  warn(key: string, info: UsageWarning, now: number): void {
    info = { ...info, resetsAt: info.resetsAt !== null && Number.isFinite(info.resetsAt) ? info.resetsAt : null, utilization: info.utilization !== null && Number.isFinite(info.utilization) ? info.utilization : null };
    if (info.resetsAt !== null && info.resetsAt <= now) return;
    const w = this.window(key);
    w.warning = warningView(info, now);
    const type = JSON.stringify(info.rateLimitType);
    const legacyWaiver = w.warnings === undefined ? w.waiver : null;
    const warnings = w.warnings ??= {};
    const window = warnings[type] ??= { until: 0, waiver: null };
    if (waived(info, window.waiver ?? legacyWaiver, now)) return;
    window.until = Math.max(window.until, info.resetsAt !== null && info.resetsAt > now ? info.resetsAt : now + PACING_MS);
    w.pacingUntil = Math.max(w.pacingUntil, window.until);
    w.limit = info.rateLimitType;
  }

  allows(key: string, kind: WorkKind, now: number, running: number, pacingSessions: number): boolean {
    const w = this.windows[key];
    return !w || mayStart(kind, { ...w, now, running, pacingSessions });
  }

  resume(key: string, now: number): boolean {
    const w = this.windows[key];
    if (!w || now < w.pausedUntil || now >= w.pacingUntil) return false;
    w.waiver = { until: w.pacingUntil, limit: w.limit };
    for (const [type, window] of Object.entries(w.warnings ?? {})) {
      window.waiver = { until: window.until, limit: JSON.parse(type) as string | null };
      window.until = 0;
    }
    w.pacingUntil = 0;
    return true;
  }

  view(key: string, now: number) {
    const w = this.windows[key];
    return usageView({ now, pausedUntil: w?.pausedUntil ?? 0, pacingUntil: w?.pacingUntil ?? 0 }, w?.warning ?? null);
  }

  /** A manager's regrouping never erases an already-observed window. */
  transfer(from: string, to: string) {
    const old = this.windows[from];
    if (!old || from === to) return;
    const target = this.windows[to];
    const warnings = structuredClone(target?.warnings ?? {});
    for (const [type, window] of Object.entries(old.warnings ?? {})) {
      warnings[type] = { until: Math.max(window.until, warnings[type]?.until ?? 0), waiver: null };
    }
    this.windows[to] = { ...structuredClone(old), warnings, waiver: null,
      pausedUntil: Math.max(old.pausedUntil, target?.pausedUntil ?? 0),
      pacingUntil: Math.max(old.pacingUntil, target?.pacingUntil ?? 0) };
  }
}
