import { onRuntimeMessage } from '../shared/messaging';
import { getDomainSettings, normalizeDomainSettings, saveDomainSettings } from '../shared/storage';
import { DEFAULT_MONITOR, DEFAULT_TIMER_POSITION, RuntimeMessage } from '../shared/types';
import { RefreshEngine } from './refresh-engine';
import { TabSessionStore } from './session';

const store = new TabSessionStore();
const engine = new RefreshEngine(store);

let restorePromise: Promise<void> | null = null;

function ensureRestored(): Promise<void> {
  if (!restorePromise) {
    restorePromise = engine.restore();
  }
  return restorePromise;
}

chrome.runtime.onInstalled.addListener(() => {
  void ensureRestored();
});

chrome.runtime.onStartup.addListener(() => {
  restorePromise = null;
  void ensureRestored();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  void ensureRestored().then(() => engine.tickFromAlarm(alarm.name));
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void ensureRestored().then(() => engine.stop(tabId));
});

onRuntimeMessage(async (message: RuntimeMessage, sender) => {
  await ensureRestored();

  switch (message.type) {
    case 'START_SESSION':
      return engine.start(message.session);
    case 'STOP_SESSION':
      await engine.stop(message.tabId);
      return { ok: true };
    case 'PAUSE_SESSION':
      return engine.pause(message.tabId);
    case 'RESTART_SESSION':
      return engine.restart(message.tabId);
    case 'GET_SESSION':
      return engine.getSession(message.tabId);
    case 'GET_ALL_SESSIONS':
      return engine.getAllSessions();
    case 'SYNC_SESSION_SETTINGS':
      return engine.syncSettings(message.tabId, message.settings);
    case 'REQUEST_TICK':
      await engine.requestTick(message.tabId);
      return { ok: true };
    case 'USER_INTERACTION':
      if (sender.tab?.id !== undefined) {
        await engine.handleUserInteraction(sender.tab.id);
      }
      return { ok: true };
    case 'PICKER_RESULT':
      if (sender.tab?.id !== undefined) {
        const session = engine.getSession(sender.tab.id);
        if (session && !session.xhrSelectors.includes(message.result.selector)) {
          const next = {
            ...session,
            xhrSelectors: [...session.xhrSelectors, message.result.selector],
          };
          await engine.start(next);
        } else {
          const hostname = getHostname(sender.tab.url);
          if (!hostname) {
            return { ok: true };
          }
          const current = await getDomainSettings(hostname);
          if (current && !current.xhrSelectors.includes(message.result.selector)) {
            await saveDomainSettings(hostname, {
              ...current,
              refreshType: 'xhr',
              xhrSelectors: [...current.xhrSelectors, message.result.selector],
            });
          } else if (!current) {
            await saveDomainSettings(hostname, normalizeDomainSettings({
              refreshType: 'xhr',
              xhrSelectors: [message.result.selector],
              monitor: DEFAULT_MONITOR,
              timerPosition: DEFAULT_TIMER_POSITION,
              intervalMode: 'fixed',
            }));
          }
        }
      }
      return { ok: true };
    default:
      return undefined;
  }
});

void ensureRestored();

function getHostname(url: string | undefined): string {
  if (!url) {
    return '';
  }
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}
