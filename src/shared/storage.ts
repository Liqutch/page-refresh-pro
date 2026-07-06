import {
  AppSettings,
  DEFAULT_MONITOR,
  DEFAULT_SETTINGS,
  DEFAULT_TIMER_POSITION,
  DomainSettings,
  MonitorConfig,
  TabSession,
} from './types';

const ACTIVE_SESSIONS_KEY = 'activeSessions';
const APP_SETTINGS_KEY = 'appSettings';
export const PENDING_PICKER_TAB_KEY = 'pendingPickerTabId';

export function domainSettingsKey(hostname: string): string {
  return `settings:${hostname}`;
}

export async function getAppSettings(): Promise<AppSettings> {
  const stored = await chrome.storage.local.get(APP_SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(stored[APP_SETTINGS_KEY] as Partial<AppSettings> | undefined) };
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  await chrome.storage.local.set({ [APP_SETTINGS_KEY]: settings });
}

export async function getDomainSettings(hostname: string): Promise<DomainSettings | null> {
  const key = domainSettingsKey(hostname);
  const stored = await chrome.storage.local.get(key);
  return (stored[key] as DomainSettings | undefined) ?? null;
}

export async function saveDomainSettings(hostname: string, settings: DomainSettings): Promise<void> {
  await chrome.storage.local.set({ [domainSettingsKey(hostname)]: settings });
}

export async function getStoredSessions(): Promise<TabSession[]> {
  const stored = await chrome.storage.local.get(ACTIVE_SESSIONS_KEY);
  return (stored[ACTIVE_SESSIONS_KEY] as TabSession[] | undefined) ?? [];
}

export async function saveStoredSessions(sessions: TabSession[]): Promise<void> {
  await chrome.storage.local.set({ [ACTIVE_SESSIONS_KEY]: sessions });
}

export function stripRuntimeMonitorFields(monitor: MonitorConfig): MonitorConfig {
  return {
    ...monitor,
    previousMatch: false,
    lastKeywordParentSelector: null,
    previousPageSnapshot: null,
  };
}

export function sessionToDomainSettings(session: TabSession): DomainSettings {
  return {
    intervalMode: session.intervalMode,
    intervalMs: session.intervalMs,
    randomMinMs: session.randomMinMs,
    randomMaxMs: session.randomMaxMs,
    hardRefresh: session.hardRefresh,
    maxRefreshes: session.maxRefreshes,
    visualTimer: session.visualTimer,
    timerPosition: session.timerPosition,
    interactionEnabled: session.interactionEnabled,
    interactionBehavior: session.interactionBehavior,
    detectCaptcha: session.detectCaptcha,
    detectErrors: session.detectErrors,
    refreshType: session.refreshType,
    xhrSelectors: session.xhrSelectors,
    monitor: stripRuntimeMonitorFields(normalizeMonitorConfig(session.monitor)),
  };
}

export function normalizeMonitorConfig(monitor?: Partial<MonitorConfig>): MonitorConfig {
  return {
    mode: monitor?.mode ?? DEFAULT_MONITOR.mode,
    template: monitor?.template ?? DEFAULT_MONITOR.template,
    expressions: monitor?.expressions ?? [],
    autoClick: monitor?.autoClick ?? false,
    previousMatch: monitor?.previousMatch ?? false,
    continueAfterAlert: monitor?.continueAfterAlert ?? false,
    highlightKeyword: monitor?.highlightKeyword ?? false,
    lastKeywordParentSelector: null,
    previousPageSnapshot: null,
  };
}

export function normalizeDomainSettings(settings: Partial<DomainSettings>): DomainSettings {
  return {
    intervalMode: settings.intervalMode ?? 'fixed',
    intervalMs: settings.intervalMs ?? 10000,
    randomMinMs: settings.randomMinMs ?? 5000,
    randomMaxMs: settings.randomMaxMs ?? 30000,
    hardRefresh: settings.hardRefresh ?? false,
    maxRefreshes: settings.maxRefreshes ?? null,
    visualTimer: settings.visualTimer ?? false,
    timerPosition: settings.timerPosition ?? DEFAULT_TIMER_POSITION,
    interactionEnabled: settings.interactionEnabled ?? false,
    interactionBehavior: settings.interactionBehavior ?? 'stop',
    detectCaptcha: settings.detectCaptcha ?? false,
    detectErrors: settings.detectErrors ?? false,
    refreshType: settings.refreshType ?? 'full',
    xhrSelectors: settings.xhrSelectors ?? [],
    monitor: normalizeMonitorConfig(settings.monitor),
  };
}
