import { IntervalMode, TabSession } from './types';
import { t } from './i18n';

export const MIN_INTERVAL_MS = 100;
export const MAX_INTERVAL_MS = 86_400_000;
export const INTERVAL_STEP_MS = 50;
export const INTERVAL_STEP_SECONDS = INTERVAL_STEP_MS / 1000;
export const MIN_INTERVAL_SECONDS = MIN_INTERVAL_MS / 1000;
/** chrome.alarms fires at most once per ~30s in production; use setTimeout below this. */
export const CHROME_ALARM_MIN_MS = 30_000;

export function clampIntervalMs(ms: number): number {
  if (!Number.isFinite(ms)) {
    return 1000;
  }
  const stepped = Math.round(ms / INTERVAL_STEP_MS) * INTERVAL_STEP_MS;
  return Math.max(MIN_INTERVAL_MS, Math.min(MAX_INTERVAL_MS, stepped));
}

export function clampIntervalSeconds(value: number, allowBelowMin = false): number {
  if (!Number.isFinite(value)) {
    return allowBelowMin ? 0 : MIN_INTERVAL_SECONDS;
  }
  const stepped = Math.round(value / INTERVAL_STEP_SECONDS) * INTERVAL_STEP_SECONDS;
  const rounded = Math.round(stepped * 100) / 100;
  const min = allowBelowMin ? 0 : MIN_INTERVAL_SECONDS;
  return Math.max(min, Math.min(MAX_INTERVAL_MS / 1000, rounded));
}

export function formatIntervalSeconds(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  return rounded.toFixed(2).replace(/0$/, '');
}

export function msToIntervalSeconds(ms: number): number {
  return clampIntervalMs(ms) / 1000;
}

export function resolveNextIntervalMs(
  session: Pick<TabSession, 'intervalMode' | 'intervalMs' | 'randomMinMs' | 'randomMaxMs'>,
): number {
  if (session.intervalMode === 'random') {
    const minMs = clampIntervalMs(Math.min(session.randomMinMs, session.randomMaxMs));
    const maxMs = clampIntervalMs(Math.max(session.randomMinMs, session.randomMaxMs));
    if (minMs === maxMs) {
      return minMs;
    }
    const steps = Math.floor((maxMs - minMs) / INTERVAL_STEP_MS);
    const randomStep = Math.floor(Math.random() * (steps + 1));
    return minMs + randomStep * INTERVAL_STEP_MS;
  }
  return clampIntervalMs(session.intervalMs);
}

export function formatIntervalSummary(
  session: Pick<TabSession, 'intervalMode' | 'intervalMs' | 'randomMinMs' | 'randomMaxMs'>,
): string {
  if (session.intervalMode === 'random') {
    const minMs = clampIntervalMs(Math.min(session.randomMinMs, session.randomMaxMs));
    const maxMs = clampIntervalMs(Math.max(session.randomMinMs, session.randomMaxMs));
    return t('intervalSummaryRandom', {
      min: formatIntervalSeconds(minMs / 1000),
      max: formatIntervalSeconds(maxMs / 1000),
    });
  }

  const ms = clampIntervalMs(session.intervalMs);
  const totalSeconds = ms / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round((totalSeconds - hours * 3600 - minutes * 60) * 100) / 100;

  if (hours === 0 && minutes === 0) {
    return t('intervalSummarySeconds', { s: formatIntervalSeconds(seconds) });
  }

  return t('intervalSummaryFixed', {
    h: hours,
    m: minutes,
    s: formatIntervalSeconds(seconds),
  });
}

export function msFromParts(hours: number, minutes: number, seconds: number): number {
  const totalMs = ((hours * 60 + minutes) * 60 + seconds) * 1000;
  return clampIntervalMs(totalMs);
}

export function partsFromMs(intervalMs: number): { hours: number; minutes: number; seconds: number } {
  const ms = clampIntervalMs(intervalMs);
  const totalSeconds = ms / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round((totalSeconds - hours * 3600 - minutes * 60) * 100) / 100;
  return { hours, minutes, seconds };
}

export function isIntervalMode(value: string): value is IntervalMode {
  return value === 'fixed' || value === 'random' || value === 'custom';
}
