import { sendRuntimeMessage } from '../shared/messaging';
import { MIN_INTERVAL_MS } from '../shared/interval';

let refreshTimer: ReturnType<typeof setInterval> | null = null;
let activeTabId: number | null = null;

export function startFastRefresh(tabId: number, intervalMs: number): void {
  stopFastRefresh();
  activeTabId = tabId;
  const waitMs = Math.max(MIN_INTERVAL_MS, intervalMs);

  refreshTimer = setInterval(() => {
    if (activeTabId === null) {
      return;
    }
    void sendRuntimeMessage({ type: 'REQUEST_TICK', tabId: activeTabId });
  }, waitMs);
}

export function stopFastRefresh(): void {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  activeTabId = null;
}
