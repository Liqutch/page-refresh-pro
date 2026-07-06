import { ensureTabContentScript, sendTabMessage, waitForTabPing } from '../shared/messaging';
import { CHROME_ALARM_MIN_MS, resolveNextIntervalMs } from '../shared/interval';
import {
  resolveSessionIntervalMs,
  updateMonitorWatchState,
} from '../shared/monitor-watch';
import { getAppSettings, saveDomainSettings, sessionToDomainSettings, stripRuntimeMonitorFields, normalizeMonitorConfig } from '../shared/storage';
import { tForLanguage } from '../shared/i18n';
import { DomainSettings, Language, MonitorResult, TabSession } from '../shared/types';
import { TabSessionStore } from './session';

const ALARM_PREFIX = 'refresh:';
const BADGE_COLOR = '#00ffb4';
const BADGE_TEXT_COLOR = '#000000';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export class RefreshEngine {
  private badgeTimer: ReturnType<typeof setInterval> | null = null;
  private tickingTabs = new Set<number>();

  constructor(private readonly store: TabSessionStore) {}

  async restore(): Promise<void> {
    await this.store.restore();
    await Promise.all(
      this.store.getAll().map(async (session) => {
        await sendTabMessage(session.tabId, { type: 'START_SESSION', session });
        await this.schedule(session);
        await this.updateBadge(session);
        await this.showTimer(session);
      }),
    );
    this.syncBadgeTimer();
  }

  async start(session: TabSession): Promise<TabSession> {
    const firstWait = resolveSessionIntervalMs(session, resolveNextIntervalMs);
    const next: TabSession = {
      ...session,
      active: true,
      paused: false,
      refreshCount: 0,
      monitorFastWatchWhileMatched: null,
      monitor: stripRuntimeMonitorFields(normalizeMonitorConfig(session.monitor)),
      currentIntervalMs: firstWait,
      nextTickAt: Date.now() + firstWait,
    };

    await this.store.set(next);
    await saveDomainSettings(next.hostname, sessionToDomainSettings(next));
    await sendTabMessage(next.tabId, { type: 'START_SESSION', session: next });

    const tickStartedAt = Date.now();
    const afterImmediate = await this.executeRefresh(next);
    if (!afterImmediate) {
      await this.schedule(next);
      await this.updateBadge(next);
      await this.showTimer(next);
      this.syncBadgeTimer();
      return next;
    }

    if (afterImmediate.maxRefreshes !== null && afterImmediate.refreshCount >= afterImmediate.maxRefreshes) {
      await this.stop(afterImmediate.tabId);
      return afterImmediate;
    }

    const nextWait = this.resolveNextWaitMs(
      afterImmediate,
      Date.now() - tickStartedAt,
      resolveSessionIntervalMs(afterImmediate, resolveNextIntervalMs),
    );
    const scheduled: TabSession = {
      ...afterImmediate,
      currentIntervalMs: resolveSessionIntervalMs(afterImmediate, resolveNextIntervalMs),
      nextTickAt: Date.now() + nextWait,
    };
    await this.store.set(scheduled);
    await this.schedule(scheduled);
    await this.updateBadge(scheduled);
    await this.showTimer(scheduled);
    this.syncBadgeTimer();
    return scheduled;
  }

  async stop(tabId: number): Promise<void> {
    await this.disarmFastRefresh(tabId);
    await chrome.alarms.clear(this.alarmName(tabId));
    await this.store.delete(tabId);
    await chrome.action.setBadgeText({ tabId, text: '' });
    await sendTabMessage(tabId, { type: 'HIDE_VISUAL_TIMER' });
    this.syncBadgeTimer();
  }

  async pause(tabId: number): Promise<TabSession | null> {
    await this.disarmFastRefresh(tabId);
    await chrome.alarms.clear(this.alarmName(tabId));
    const session = await this.store.update(tabId, (current) => ({ ...current, paused: true }));
    if (session) {
      await this.updateBadge(session, '||');
    }
    this.syncBadgeTimer();
    return session;
  }

  async restart(tabId: number): Promise<TabSession | null> {
    const session = await this.store.update(tabId, (current) => {
      const wait = resolveSessionIntervalMs(current, resolveNextIntervalMs);
      return {
        ...current,
        paused: false,
        currentIntervalMs: wait,
        nextTickAt: Date.now() + wait,
      };
    });
    if (session) {
      await this.schedule(session);
      await this.updateBadge(session);
      await this.showTimer(session);
      this.syncBadgeTimer();
    }
    return session;
  }

  async requestTick(tabId: number): Promise<void> {
    if (this.tickingTabs.has(tabId)) {
      return;
    }
    this.tickingTabs.add(tabId);
    try {
      await this.tickFromAlarm(this.alarmName(tabId));
    } finally {
      this.tickingTabs.delete(tabId);
    }
  }

  async tickFromAlarm(alarmName: string): Promise<void> {
    if (!alarmName.startsWith(ALARM_PREFIX)) {
      return;
    }
    const tabId = Number(alarmName.slice(ALARM_PREFIX.length));
    const session = this.store.get(tabId);
    if (!session || session.paused || !session.active) {
      return;
    }

    const tickStartedAt = Date.now();
    const afterRefresh = await this.executeRefresh(session);
    if (!afterRefresh) {
      return;
    }

    if (afterRefresh.maxRefreshes !== null && afterRefresh.refreshCount >= afterRefresh.maxRefreshes) {
      await this.stop(tabId);
      return;
    }

    const intervalMs = resolveSessionIntervalMs(afterRefresh, resolveNextIntervalMs);
    const nextWait = this.resolveNextWaitMs(afterRefresh, Date.now() - tickStartedAt, intervalMs);
    const scheduled: TabSession = {
      ...afterRefresh,
      currentIntervalMs: intervalMs,
      nextTickAt: Date.now() + nextWait,
    };
    await this.store.set(scheduled);
    if (!this.shouldUseFastRefresh(scheduled)) {
      await this.schedule(scheduled);
    }
    await this.updateBadge(scheduled);
    await this.showTimer(scheduled);
    this.syncBadgeTimer();
  }

  async handleUserInteraction(tabId: number): Promise<void> {
    const session = this.store.get(tabId);
    if (!session || !session.interactionEnabled) {
      return;
    }
    if (session.interactionBehavior === 'stop') {
      await this.stop(tabId);
      return;
    }
    if (session.interactionBehavior === 'pause') {
      await this.pause(tabId);
      return;
    }
    await this.restart(tabId);
  }

  getSession(tabId: number): TabSession | null {
    return this.store.get(tabId);
  }

  getAllSessions(): TabSession[] {
    return this.store.getAll().filter((session) => session.active);
  }

  async syncSettings(tabId: number, settings: DomainSettings): Promise<TabSession | null> {
    const session = this.store.get(tabId);
    if (!session?.active) {
      return null;
    }

    const updatedIntervalMs = resolveSessionIntervalMs(
      {
        ...session,
        intervalMode: settings.intervalMode,
        intervalMs: settings.intervalMs,
        randomMinMs: settings.randomMinMs,
        randomMaxMs: settings.randomMaxMs,
      },
      resolveNextIntervalMs,
    );

    const next: TabSession = {
      ...session,
      intervalMode: settings.intervalMode,
      intervalMs: settings.intervalMs,
      randomMinMs: settings.randomMinMs,
      randomMaxMs: settings.randomMaxMs,
      hardRefresh: settings.hardRefresh,
      maxRefreshes: settings.maxRefreshes,
      visualTimer: settings.visualTimer,
      timerPosition: settings.timerPosition,
      interactionEnabled: settings.interactionEnabled,
      interactionBehavior: settings.interactionBehavior,
      detectCaptcha: settings.detectCaptcha,
      detectErrors: settings.detectErrors,
      refreshType: settings.refreshType,
      xhrSelectors: settings.xhrSelectors,
      monitor: settings.monitor,
      monitorFastWatchWhileMatched: session.monitorFastWatchWhileMatched ?? null,
      currentIntervalMs: updatedIntervalMs,
      nextTickAt: Date.now() + updatedIntervalMs,
    };

    await this.store.set(next);
    await saveDomainSettings(next.hostname, settings);
    await this.schedule(next);
    await sendTabMessage(next.tabId, { type: 'START_SESSION', session: next });
    if (next.visualTimer) {
      await this.showTimer(next);
    } else {
      await sendTabMessage(next.tabId, { type: 'HIDE_VISUAL_TIMER' });
    }
    await this.updateBadge(next);
    return next;
  }

  private async executeRefresh(session: TabSession): Promise<TabSession | null> {
    const isFastCycle = session.currentIntervalMs < CHROME_ALARM_MIN_MS;
    await this.ensureContentScriptReady(session.tabId, isFastCycle);

    if (session.detectCaptcha && (await this.checkCaptcha(session))) {
      await this.pauseWithNotification(session, 'Captcha algılandı', 'Yenileme duraklatıldı.');
      return null;
    }

    if (session.detectErrors) {
      const errorResult = await sendTabMessage<{ found: boolean; reason?: string }>(session.tabId, {
        type: 'CHECK_ERROR_PAGE',
      });
      if (errorResult?.found) {
        await this.pauseWithNotification(session, 'Hata sayfası algılandı', errorResult.reason ?? 'Yenileme duraklatıldı.');
        return null;
      }
    }

    if (session.refreshType === 'xhr') {
      await sendTabMessage(session.tabId, { type: 'CLICK_TARGETS', selectors: session.xhrSelectors });
      if (!isFastCycle) {
        await delay(250);
      }
    } else {
      await chrome.tabs.reload(session.tabId, { bypassCache: session.hardRefresh });
      await this.ensureContentScriptReady(session.tabId, false);
      await delay(isFastCycle ? 100 : 200);
    }

    const monitorResult = await sendTabMessage<MonitorResult>(session.tabId, {
      type: 'RUN_MONITOR',
      monitor: session.monitor,
    });

    const watchUpdate = updateMonitorWatchState(session, monitorResult);

    const nextSession: TabSession = {
      ...session,
      refreshCount: session.refreshCount + 1,
      monitorFastWatchWhileMatched: watchUpdate.monitorFastWatchWhileMatched,
      monitor: monitorResult
        ? {
            ...session.monitor,
            previousMatch:
              session.monitor.template === 'custom' ? false : monitorResult.matched,
            previousPageSnapshot:
              session.monitor.template === 'custom' && monitorResult.pageSnapshot !== undefined
                ? monitorResult.pageSnapshot
                : session.monitor.previousPageSnapshot,
            lastKeywordParentSelector:
              session.monitor.template === 'custom'
                ? session.monitor.lastKeywordParentSelector
                : monitorResult.matched
                  ? monitorResult.parentSelector ?? session.monitor.lastKeywordParentSelector
                  : session.monitor.lastKeywordParentSelector,
          }
        : session.monitor,
    };

    if (watchUpdate.shouldNotify && monitorResult) {
      await this.notifyMonitor(session, monitorResult, watchUpdate);
      if (monitorResult.changed && session.monitor.autoClick && monitorResult.selector) {
        await sendTabMessage(session.tabId, { type: 'CLICK_TARGETS', selectors: [monitorResult.selector] });
      }
    }

    await this.store.set(nextSession);

    return nextSession;
  }

  private async schedule(session: TabSession): Promise<void> {
    await chrome.alarms.clear(this.alarmName(session.tabId));
    await this.disarmFastRefresh(session.tabId);

    if (this.shouldUseFastRefresh(session)) {
      await ensureTabContentScript(session.tabId);
      await sendTabMessage(session.tabId, {
        type: 'START_FAST_REFRESH',
        tabId: session.tabId,
        intervalMs: session.currentIntervalMs,
      });
      return;
    }

    const delayMs = Math.max(0, session.nextTickAt - Date.now());
    await chrome.alarms.create(this.alarmName(session.tabId), {
      when: Date.now() + delayMs,
    });
  }

  private shouldUseFastRefresh(session: TabSession): boolean {
    return session.refreshType === 'xhr' && session.currentIntervalMs < CHROME_ALARM_MIN_MS;
  }

  private async disarmFastRefresh(tabId: number): Promise<void> {
    await sendTabMessage(tabId, { type: 'STOP_FAST_REFRESH' });
  }

  private async showTimer(session: TabSession): Promise<void> {
    if (!session.visualTimer) {
      await sendTabMessage(session.tabId, { type: 'HIDE_VISUAL_TIMER' });
      return;
    }
    await sendTabMessage(session.tabId, {
      type: 'SHOW_VISUAL_TIMER',
      nextTickAt: session.nextTickAt,
      intervalMs: session.currentIntervalMs,
      position: session.timerPosition,
    });
  }

  private async ensureContentScriptReady(tabId: number, fast: boolean): Promise<boolean> {
    if (fast) {
      const ready = await waitForTabPing(tabId);
      if (ready) {
        return true;
      }
    }
    return ensureTabContentScript(tabId);
  }

  private resolveNextWaitMs(session: TabSession, elapsedMs: number, intervalMs?: number): number {
    const targetInterval = intervalMs ?? resolveSessionIntervalMs(session, resolveNextIntervalMs);
    return Math.max(0, targetInterval - elapsedMs);
  }

  private async checkCaptcha(session: TabSession): Promise<boolean> {
    const result = await sendTabMessage<{ found: boolean }>(session.tabId, { type: 'CHECK_CAPTCHA' });
    return result?.found ?? false;
  }

  private async pauseWithNotification(session: TabSession, title: string, message: string): Promise<void> {
    await this.pause(session.tabId);
    await this.notify(title, message);
  }

  private async updateBadge(session: TabSession, text?: string): Promise<void> {
    await chrome.action.setBadgeBackgroundColor({ tabId: session.tabId, color: BADGE_COLOR });
    await chrome.action.setBadgeTextColor({ tabId: session.tabId, color: BADGE_TEXT_COLOR });
    const seconds = Math.max(0, Math.ceil((session.nextTickAt - Date.now()) / 1000));
    const badge = text ?? (seconds > 99 ? '99+' : String(seconds));
    await chrome.action.setBadgeText({ tabId: session.tabId, text: badge });
  }

  private syncBadgeTimer(): void {
    const hasActive = this.store.getAll().some((session) => session.active && !session.paused);
    if (hasActive && !this.badgeTimer) {
      this.badgeTimer = setInterval(() => {
        for (const session of this.store.getAll()) {
          if (session.active && !session.paused) {
            void this.updateBadge(session);
            if (session.visualTimer) {
              void this.showTimer(session);
            }
          }
        }
      }, 1000);
      return;
    }
    if (!hasActive && this.badgeTimer) {
      clearInterval(this.badgeTimer);
      this.badgeTimer = null;
    }
  }

  private async notifyMonitor(
    session: TabSession,
    monitorResult: MonitorResult,
    watchUpdate: { monitorFastWatchWhileMatched: boolean | null; shouldNotify: boolean },
  ): Promise<void> {
    const settings = await getAppSettings();
    const keyword = monitorResult.matchedText ?? session.monitor.expressions[0] ?? '';
    const { title, message } = this.getMonitorNotificationCopy(
      settings.language,
      session,
      monitorResult,
      watchUpdate,
      keyword,
    );
    await this.notify(title, message);
  }

  private getMonitorNotificationCopy(
    language: Language,
    session: TabSession,
    monitorResult: MonitorResult,
    watchUpdate: { monitorFastWatchWhileMatched: boolean | null; shouldNotify: boolean },
    keyword: string,
  ): { title: string; message: string } {
    const isRepeat = watchUpdate.shouldNotify && !monitorResult.changed;
    if (isRepeat) {
      const watchingKey =
        session.monitor.template === 'lost' || session.monitorFastWatchWhileMatched === false
          ? 'monitorNotifyWatchingLost'
          : 'monitorNotifyWatchingFound';
      return {
        title: tForLanguage(language, 'monitorNotifyWatchingTitle'),
        message: tForLanguage(language, watchingKey, { keyword }),
      };
    }

    if (session.monitor.template === 'lost') {
      return {
        title: tForLanguage(language, 'monitorNotifyLostTitle'),
        message: tForLanguage(language, 'monitorNotifyLostMessage', { keyword }),
      };
    }
    if (session.monitor.template === 'custom') {
      return {
        title: tForLanguage(language, 'monitorNotifyCustomTitle'),
        message: tForLanguage(language, 'monitorNotifyCustomMessage'),
      };
    }
    return {
      title: tForLanguage(language, 'monitorNotifyFoundTitle'),
      message: tForLanguage(language, 'monitorNotifyFoundMessage', { keyword }),
    };
  }

  private async notify(title: string, message: string): Promise<void> {
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'public/icons/icon-128.png',
      title,
      message,
    });
  }

  private alarmName(tabId: number): string {
    return `${ALARM_PREFIX}${tabId}`;
  }
}
