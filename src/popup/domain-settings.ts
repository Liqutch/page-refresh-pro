import { normalizeDomainSettings, saveDomainSettings } from '../shared/storage';
import { DomainSettings } from '../shared/types';
import { readIntervalForm } from './interval-tab';
import { readMonitorForm } from './monitor-tab';

let hostname = '';
let timer: ReturnType<typeof setTimeout> | null = null;
let syncActiveSession: ((settings: DomainSettings) => Promise<void>) | null = null;

export function setPersistHostname(value: string): void {
  hostname = value;
}

export function setActiveSessionSyncHandler(handler: (settings: DomainSettings) => Promise<void>): void {
  syncActiveSession = handler;
}

export function buildDomainSettingsFromForms(): DomainSettings {
  const interval = readIntervalForm();
  const monitor = readMonitorForm();
  return normalizeDomainSettings({
    intervalMode: interval.intervalMode,
    intervalMs: interval.intervalMs,
    randomMinMs: interval.randomMinMs,
    randomMaxMs: interval.randomMaxMs,
    hardRefresh: interval.hardRefresh,
    maxRefreshes: interval.maxRefreshes,
    visualTimer: interval.visualTimer,
    timerPosition: interval.timerPosition,
    interactionEnabled: interval.interactionEnabled,
    interactionBehavior: interval.interactionBehavior,
    detectCaptcha: interval.detectCaptcha,
    detectErrors: interval.detectErrors,
    refreshType: monitor.refreshType,
    xhrSelectors: monitor.xhrSelectors,
    monitor: monitor.monitor,
  });
}

export function schedulePersistDomainSettings(): void {
  if (!hostname) {
    return;
  }
  if (timer) {
    clearTimeout(timer);
  }
  timer = window.setTimeout(() => {
    timer = null;
    void flushDomainSettings();
  }, 200);
}

async function flushDomainSettings(): Promise<void> {
  if (!hostname) {
    return;
  }
  const settings = buildDomainSettingsFromForms();
  await saveDomainSettings(hostname, settings);
  await syncActiveSession?.(settings);
}

export async function persistDomainSettingsNow(): Promise<void> {
  if (!hostname) {
    return;
  }
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  await flushDomainSettings();
}
