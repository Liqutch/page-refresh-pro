import { MonitorResult, MonitorTemplate, TabSession } from './types';

export const MONITOR_FAST_INTERVAL_MS = 5000;

export function isMonitorFastWatchActive(session: TabSession): boolean {
  return (
    session.monitor.continueAfterAlert &&
    (session.monitorFastWatchWhileMatched === true || session.monitorFastWatchWhileMatched === false)
  );
}

export function shouldUseFastInterval(session: TabSession): boolean {
  return isMonitorFastWatchActive(session);
}

export function resolveSessionIntervalMs(
  session: TabSession,
  resolveNormal: (session: TabSession) => number,
): number {
  if (shouldUseFastInterval(session)) {
    return MONITOR_FAST_INTERVAL_MS;
  }
  return resolveNormal(session);
}

function isStillInFastWatch(polarity: boolean, matched: boolean): boolean {
  return polarity ? matched : !matched;
}

export function resolveFastWatchPolarity(
  template: MonitorTemplate,
  matched: boolean,
): boolean {
  if (template === 'found') {
    return true;
  }
  if (template === 'lost') {
    return false;
  }
  return matched;
}

export interface MonitorWatchUpdate {
  monitorFastWatchWhileMatched: boolean | null;
  shouldNotify: boolean;
}

export function updateMonitorWatchState(
  session: TabSession,
  monitorResult: MonitorResult | null,
): MonitorWatchUpdate {
  if (!session.monitor.continueAfterAlert || !monitorResult) {
    return {
      monitorFastWatchWhileMatched: null,
      shouldNotify: monitorResult?.changed ?? false,
    };
  }

  let monitorFastWatchWhileMatched = session.monitorFastWatchWhileMatched ?? null;

  if (monitorResult.changed) {
    monitorFastWatchWhileMatched = resolveFastWatchPolarity(
      session.monitor.template,
      monitorResult.matched,
    );
    return { monitorFastWatchWhileMatched, shouldNotify: true };
  }

  if (monitorFastWatchWhileMatched === null) {
    return { monitorFastWatchWhileMatched: null, shouldNotify: false };
  }

  if (isStillInFastWatch(monitorFastWatchWhileMatched, monitorResult.matched)) {
    return { monitorFastWatchWhileMatched, shouldNotify: true };
  }

  return { monitorFastWatchWhileMatched: null, shouldNotify: false };
}
