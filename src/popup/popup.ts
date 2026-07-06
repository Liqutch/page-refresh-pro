import './popup.css';
import {
  ensureOriginPermission,
  ensureTabContentScript,
  hasOriginPermission,
  isRestrictedTabUrl,
  sendRuntimeMessage,
  sendTabMessage,
} from '../shared/messaging';
import { getDomainSettings, normalizeDomainSettings, PENDING_PICKER_TAB_KEY, sessionToDomainSettings } from '../shared/storage';
import { DEFAULT_MONITOR, RuntimeMessage, TabSession } from '../shared/types';
import { resolveNextIntervalMs } from '../shared/interval';
import {
  applyIntervalSettings,
  bindIntervalControls,
  readIntervalForm,
  updateIntervalSummary,
} from './interval-tab';
import {
  addTarget,
  applyMonitorSettings,
  bindMonitorControls,
  readMonitorForm,
  renderTargets,
  updateTemplateHint,
} from './monitor-tab';
import { fetchActiveTabRows, renderActiveTabs } from './tabs-tab';
import { showToast } from './toast';
import { bindI18nStorageSync, initI18n, t } from '../shared/i18n';
import {
  persistDomainSettingsNow,
  schedulePersistDomainSettings,
  setActiveSessionSyncHandler,
  setPersistHostname,
} from './domain-settings';

let activeTab: chrome.tabs.Tab | null = null;
let tabsRefreshTimer: ReturnType<typeof setInterval> | null = null;

document.addEventListener('DOMContentLoaded', () => {
  void init();
});

async function init(): Promise<void> {
  bindBrandLogo();
  await initI18n();
  bindI18nStorageSync(() => {
    const running = document.getElementById('startButton')?.classList.contains('running') ?? false;
    updateStartButton(running);
    void refreshActiveTabsList();
    updateIntervalSummary();
    updateTemplateHint();
  });
  activeTab = await getActiveTab();
  bindBrandContextMenuBlock();
  bindNavigation();
  bindScrollHint();
  bindIntervalControls();
  bindMonitorControls();
  bindActions();
  bindDomainSettingsPersistence();
  setActiveSessionSyncHandler(async (settings) => {
    if (!activeTab?.id) {
      return;
    }
    await sendRuntimeMessage({
      type: 'SYNC_SESSION_SETTINGS',
      tabId: activeTab.id,
      settings,
    });
  });
  renderTargets();

  await refreshActiveTabsList();
  startTabsAutoRefresh();

  if (!activeTab?.id) {
    showToast(t('toastNoActiveTab'));
    return;
  }

  const hostname = getHostname(activeTab.url);
  if (hostname) {
    setPersistHostname(hostname);
    const settings = await getDomainSettings(hostname);
    if (settings) {
      applyIntervalSettings(normalizeDomainSettings(settings));
      applyMonitorSettings(normalizeDomainSettings(settings));
    }
  }

  const session = await sendRuntimeMessage<TabSession | null>({
    type: 'GET_SESSION',
    tabId: activeTab.id,
  });
  if (session) {
    const sessionSettings = sessionToDomainSettings(session);
    applyIntervalSettings(sessionSettings);
    applyMonitorSettings(sessionSettings);
  }
  updateStartButton(Boolean(session?.active));
  await tryResumePendingPicker();
}

function bindBrandLogo(): void {
  const logo = document.querySelector<HTMLImageElement>('.brand-logo-img');
  if (logo) {
    logo.src = chrome.runtime.getURL('public/icons/icon-48.png');
  }
}

function bindBrandContextMenuBlock(): void {
  document.querySelector('.brand-icon')?.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });
}

function bindNavigation(): void {
  document.querySelectorAll<HTMLButtonElement>('.main-nav .tab-bar-item').forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab;
      const nextPanel = document.getElementById(`${tab}Panel`);
      const currentPanel = document.querySelector<HTMLElement>('.panel.active');
      if (!tab || !nextPanel || currentPanel === nextPanel) {
        return;
      }

      document.querySelectorAll('.main-nav .tab-bar-item').forEach((element) => element.classList.remove('active'));
      button.classList.add('active');

      currentPanel?.classList.remove('active');
      nextPanel.classList.add('active');

      if (tab === 'tabs') {
        void refreshActiveTabsList();
      }

      updateScrollHint();
    });
  });
}

function bindScrollHint(): void {
  const panels = document.getElementById('panels');
  if (!panels) {
    return;
  }

  panels.addEventListener('scroll', updateScrollHint, { passive: true });
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(updateScrollHint).observe(panels);
  }
  updateScrollHint();
}

function updateScrollHint(): void {
  const panels = document.getElementById('panels');
  const viewport = document.querySelector('.panels-viewport');
  const hint = document.getElementById('scrollHint');
  if (!panels || !viewport || !hint) {
    return;
  }
  const canScroll = panels.scrollHeight > panels.clientHeight + 4;
  const atBottom = panels.scrollTop + panels.clientHeight >= panels.scrollHeight - 10;
  const show = canScroll && !atBottom;
  viewport.classList.toggle('can-scroll', show);
  hint.classList.toggle('is-visible', show);
  hint.setAttribute('aria-hidden', String(!show));
}

function bindDomainSettingsPersistence(): void {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void persistDomainSettingsNow();
    }
  });
}

function bindActions(): void {
  document.getElementById('startButton')?.addEventListener('click', () => void toggleStartStop());
  document.getElementById('targetListEmpty')?.addEventListener('click', () => void startPicker());

  chrome.runtime.onMessage.addListener((message: RuntimeMessage) => {
    if (message.type === 'PICKER_RESULT') {
      addTarget(message.result.selector);
      schedulePersistDomainSettings();
      showToast(t('toastTargetAdded', { label: message.result.label }), 'info', 2500);
    }
  });
}

async function toggleStartStop(): Promise<void> {
  if (!activeTab?.id) {
    showToast(t('toastNoActiveTab'));
    return;
  }

  const current = await sendRuntimeMessage<TabSession | null>({
    type: 'GET_SESSION',
    tabId: activeTab.id,
  });

  if (current?.active) {
    await stop();
    return;
  }

  await start();
}

async function start(): Promise<void> {
  if (!activeTab?.id) {
    return;
  }

  const interval = readIntervalForm();
  const monitor = readMonitorForm();
  const firstWait = resolveNextIntervalMs(interval);

  const session: TabSession = {
    tabId: activeTab.id,
    active: true,
    paused: false,
    refreshType: monitor.refreshType,
    intervalMode: interval.intervalMode,
    intervalMs: interval.intervalMs,
    randomMinMs: interval.randomMinMs,
    randomMaxMs: interval.randomMaxMs,
    currentIntervalMs: firstWait,
    hardRefresh: interval.hardRefresh,
    maxRefreshes: interval.maxRefreshes,
    refreshCount: 0,
    visualTimer: interval.visualTimer,
    timerPosition: interval.timerPosition,
    interactionEnabled: interval.interactionEnabled,
    interactionBehavior: interval.interactionBehavior,
    detectCaptcha: interval.detectCaptcha,
    detectErrors: interval.detectErrors,
    xhrSelectors: monitor.xhrSelectors,
    monitor: monitor.monitor ?? DEFAULT_MONITOR,
    monitorFastWatchWhileMatched: null,
    nextTickAt: Date.now() + firstWait,
    hostname: getHostname(activeTab.url) || 'unknown',
  };

  await sendRuntimeMessage<TabSession>({ type: 'START_SESSION', session });
  updateStartButton(true);
  await refreshActiveTabsList();
}

async function stop(tabId = activeTab?.id): Promise<void> {
  if (!tabId) {
    return;
  }
  await sendRuntimeMessage({ type: 'STOP_SESSION', tabId });
  if (tabId === activeTab?.id) {
    updateStartButton(false);
  }
  await refreshActiveTabsList();
}

async function startPicker(): Promise<void> {
  activeTab = await getActiveTab();
  if (!activeTab?.id || !activeTab.url) {
    showToast(t('toastNoActiveTab'));
    return;
  }

  if (isRestrictedTabUrl(activeTab.url)) {
    showToast(t('toastPickerRestricted'));
    return;
  }

  const permitted = await hasOriginPermission(activeTab.url);
  if (!permitted) {
    await chrome.storage.session.set({ [PENDING_PICKER_TAB_KEY]: activeTab.id });
    const granted = await ensureOriginPermission(activeTab.url);
    if (!granted) {
      await chrome.storage.session.remove(PENDING_PICKER_TAB_KEY);
      showToast(t('toastPermissionDenied'));
      return;
    }
  }

  await launchPicker(activeTab);
}

async function tryResumePendingPicker(): Promise<void> {
  if (!activeTab?.id || !activeTab.url || isRestrictedTabUrl(activeTab.url)) {
    return;
  }

  const stored = await chrome.storage.session.get(PENDING_PICKER_TAB_KEY);
  const pendingTabId = stored[PENDING_PICKER_TAB_KEY] as number | undefined;
  if (pendingTabId !== activeTab.id) {
    return;
  }

  if (!(await hasOriginPermission(activeTab.url))) {
    return;
  }

  await chrome.storage.session.remove(PENDING_PICKER_TAB_KEY);
  showToast(t('toastPickerResume'), 'info', 2200);
  await launchPicker(activeTab);
}

async function launchPicker(tab: chrome.tabs.Tab): Promise<void> {
  if (!tab.id || !tab.url || isRestrictedTabUrl(tab.url)) {
    return;
  }

  await chrome.storage.session.remove(PENDING_PICKER_TAB_KEY);

  const ready = await ensureTabContentScript(tab.id);
  if (!ready) {
    showToast(t('toastScriptFailed'));
    return;
  }

  const response = await sendTabMessage<{ ok?: boolean }>(tab.id, {
    type: 'PICKER_START',
    hint: t('pickerSelectElement'),
  });
  if (!response?.ok) {
    showToast(t('toastPickerFailed'));
    return;
  }

  window.close();
}

async function refreshActiveTabsList(): Promise<void> {
  try {
    const sessions = await sendRuntimeMessage<TabSession[]>({ type: 'GET_ALL_SESSIONS' });
    const rows = await fetchActiveTabRows(Array.isArray(sessions) ? sessions : []);
    renderActiveTabs(rows, (tabId) => {
      void stop(tabId);
    });
  } catch {
    renderActiveTabs([], (tabId) => {
      void stop(tabId);
    });
  }
  requestAnimationFrame(updateScrollHint);
}

function startTabsAutoRefresh(): void {
  stopTabsAutoRefresh();
  tabsRefreshTimer = setInterval(() => {
    void refreshActiveTabsList();
  }, 1000);
}

function stopTabsAutoRefresh(): void {
  if (tabsRefreshTimer) {
    clearInterval(tabsRefreshTimer);
    tabsRefreshTimer = null;
  }
}

async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

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

const PLAY_ICON =
  '<svg class="ui-icon start-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
const STOP_ICON =
  '<svg class="ui-icon start-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor"/></svg>';

function updateStartButton(running: boolean): void {
  const button = document.getElementById('startButton');
  if (!button) {
    return;
  }
  button.classList.toggle('running', running);
  button.innerHTML = running ? `${STOP_ICON}<span>${t('stop')}</span>` : `${PLAY_ICON}<span>${t('start')}</span>`;
}
