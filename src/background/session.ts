import { getStoredSessions, normalizeMonitorConfig, saveStoredSessions } from '../shared/storage';
import { TabSession } from '../shared/types';

export class TabSessionStore {
  private readonly sessions = new Map<number, TabSession>();

  async restore(): Promise<void> {
    const stored = await getStoredSessions();
    this.sessions.clear();
    stored.forEach((session) =>
      this.sessions.set(session.tabId, {
        ...session,
        monitor: normalizeMonitorConfig(session.monitor),
        monitorFastWatchWhileMatched: session.monitorFastWatchWhileMatched ?? null,
      }),
    );
  }

  get(tabId: number): TabSession | null {
    return this.sessions.get(tabId) ?? null;
  }

  getAll(): TabSession[] {
    return [...this.sessions.values()];
  }

  async set(session: TabSession): Promise<void> {
    this.sessions.set(session.tabId, session);
    await this.persist();
  }

  async update(tabId: number, updater: (session: TabSession) => TabSession): Promise<TabSession | null> {
    const current = this.sessions.get(tabId);
    if (!current) {
      return null;
    }
    const next = updater(current);
    this.sessions.set(tabId, next);
    await this.persist();
    return next;
  }

  async delete(tabId: number): Promise<void> {
    this.sessions.delete(tabId);
    await this.persist();
  }

  private async persist(): Promise<void> {
    await saveStoredSessions(this.getAll());
  }
}
