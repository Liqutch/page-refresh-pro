import { formatIntervalSummary } from '../shared/interval';
import { t } from '../shared/i18n';
import { TabSession } from '../shared/types';
export interface ActiveTabRow {
  tabId: number;
  title: string;
  hostname: string;
  intervalLabel: string;
  remainingSeconds: number;
  refreshCount: number;
  paused: boolean;
  refreshType: string;
}

export async function fetchActiveTabRows(sessions: TabSession[]): Promise<ActiveTabRow[]> {
  const tabs = await chrome.tabs.query({});
  const tabMap = new Map(tabs.map((tab) => [tab.id, tab]));

  return sessions.map((session) => {
    const tab = tabMap.get(session.tabId);
    const seconds = Math.max(0, Math.ceil((session.nextTickAt - Date.now()) / 1000));
    return {
      tabId: session.tabId,
      title: tab?.title || session.hostname,
      hostname: session.hostname,
      intervalLabel: formatIntervalSummary(session),
      remainingSeconds: seconds,
      refreshCount: session.refreshCount,
      paused: session.paused,
      refreshType: session.refreshType === 'xhr' ? t('refreshTypeXhr') : t('refreshTypeFull'),
    };
  });
}

export function renderActiveTabs(rows: ActiveTabRow[], onStop: (tabId: number) => void): void {
  const list = document.getElementById('activeTabsList');
  const empty = document.getElementById('activeTabsEmpty');
  const count = document.getElementById('activeTabsCount');
  if (!list || !empty) {
    return;
  }

  if (count) {
    count.textContent = String(rows.length);
  }

  const hasRows = rows.length > 0;
  empty.toggleAttribute('hidden', hasRows);
  list.toggleAttribute('hidden', !hasRows);
  list.classList.toggle('is-scrollable', rows.length > 3);
  list.replaceChildren();

  rows.forEach((row) => {
    const item = document.createElement('li');
    item.className = 'refreshing-item';

    const meta = document.createElement('div');
    meta.className = 'refreshing-item-meta';

    const title = document.createElement('strong');
    title.className = 'refreshing-item-title';
    title.textContent = row.title;

    const subtitle = document.createElement('span');
    subtitle.className = 'refreshing-item-subtitle';
    subtitle.textContent = `${row.hostname} · ${row.refreshType}`;

    const interval = document.createElement('span');
    interval.className = 'refreshing-item-interval';
    interval.textContent = row.intervalLabel;

    const stats = document.createElement('span');
    stats.className = 'refreshing-item-stats';
    const status = row.paused ? t('paused') : t('remaining', { n: row.remainingSeconds });
    stats.textContent = `${status} · ${t('refreshCount', { n: row.refreshCount })}`;

    meta.append(title, subtitle, interval, stats);

    const actions = document.createElement('div');
    actions.className = 'refreshing-item-actions';

    const focusBtn = document.createElement('button');
    focusBtn.type = 'button';
    focusBtn.className = 'mini-btn';
    focusBtn.textContent = t('go');
    focusBtn.addEventListener('click', () => {
      void chrome.tabs.update(row.tabId, { active: true });
      window.close();
    });

    const stopBtn = document.createElement('button');
    stopBtn.type = 'button';
    stopBtn.className = 'mini-btn danger';
    stopBtn.textContent = t('stopTab');
    stopBtn.addEventListener('click', () => onStop(row.tabId));

    actions.append(focusBtn, stopBtn);
    item.append(meta, actions);
    list.append(item);
  });
}
