export type RefreshType = 'full' | 'xhr';
export type IntervalMode = 'fixed' | 'random' | 'custom';
export type InteractionBehavior = 'stop' | 'pause' | 'restart';
export type MonitorMode = 'basic' | 'advanced';
export type MonitorTemplate = 'found' | 'lost' | 'custom';
export type Language = 'tr' | 'en';
export type TimerPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface MonitorConfig {
  mode: MonitorMode;
  template: MonitorTemplate;
  expressions: string[];
  autoClick: boolean;
  previousMatch: boolean;
  continueAfterAlert: boolean;
  highlightKeyword: boolean;
  lastKeywordParentSelector: string | null;
  previousPageSnapshot: string | null;
}

export interface TabSession {
  tabId: number;
  active: boolean;
  paused: boolean;
  refreshType: RefreshType;
  intervalMode: IntervalMode;
  intervalMs: number;
  randomMinMs: number;
  randomMaxMs: number;
  currentIntervalMs: number;
  hardRefresh: boolean;
  maxRefreshes: number | null;
  refreshCount: number;
  visualTimer: boolean;
  timerPosition: TimerPosition;
  interactionEnabled: boolean;
  interactionBehavior: InteractionBehavior;
  detectCaptcha: boolean;
  detectErrors: boolean;
  xhrSelectors: string[];
  monitor: MonitorConfig;
  monitorFastWatchWhileMatched: boolean | null;
  nextTickAt: number;
  hostname: string;
}

export interface AppSettings {
  language: Language;
  defaultIntervalMs: number;
  defaultHardRefresh: boolean;
  defaultVisualTimer: boolean;
}

export interface DomainSettings {
  intervalMode: IntervalMode;
  intervalMs: number;
  randomMinMs: number;
  randomMaxMs: number;
  hardRefresh: boolean;
  maxRefreshes: number | null;
  visualTimer: boolean;
  timerPosition: TimerPosition;
  interactionEnabled: boolean;
  interactionBehavior: InteractionBehavior;
  detectCaptcha: boolean;
  detectErrors: boolean;
  refreshType: RefreshType;
  xhrSelectors: string[];
  monitor: MonitorConfig;
}

export interface PickerResult {
  selector: string;
  label: string;
}

export interface MonitorResult {
  matched: boolean;
  changed: boolean;
  matchedText?: string;
  selector?: string;
  parentSelector?: string | null;
  highlightRect?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  pageSnapshot?: string;
  changedElementPath?: string;
}

export type RuntimeMessage =
  | { type: 'START_SESSION'; session: TabSession }
  | { type: 'STOP_SESSION'; tabId: number }
  | { type: 'PAUSE_SESSION'; tabId: number }
  | { type: 'RESTART_SESSION'; tabId: number }
  | { type: 'GET_SESSION'; tabId: number }
  | { type: 'GET_ALL_SESSIONS' }
  | { type: 'SYNC_SESSION_SETTINGS'; tabId: number; settings: DomainSettings }
  | { type: 'ENSURE_CONTENT_SCRIPT'; tabId: number }
  | { type: 'PING' }
  | { type: 'SESSION_UPDATED'; session: TabSession | null }
  | { type: 'SHOW_VISUAL_TIMER'; nextTickAt: number; intervalMs: number; position: TimerPosition }
  | { type: 'HIDE_VISUAL_TIMER' }
  | { type: 'CLICK_TARGETS'; selectors: string[] }
  | { type: 'RUN_MONITOR'; monitor: MonitorConfig }
  | { type: 'MONITOR_RESULT'; result: MonitorResult }
  | { type: 'PICKER_START'; hint?: string }
  | { type: 'PICKER_CANCEL' }
  | { type: 'PICKER_RESULT'; result: PickerResult }
  | { type: 'CHECK_CAPTCHA' }
  | { type: 'CAPTCHA_RESULT'; found: boolean }
  | { type: 'CHECK_ERROR_PAGE' }
  | { type: 'ERROR_PAGE_RESULT'; found: boolean; reason?: string }
  | { type: 'USER_INTERACTION'; behavior: InteractionBehavior }
  | { type: 'START_FAST_REFRESH'; tabId: number; intervalMs: number }
  | { type: 'STOP_FAST_REFRESH' }
  | { type: 'REQUEST_TICK'; tabId: number };

export const DEFAULT_MONITOR: MonitorConfig = {
  mode: 'basic',
  template: 'found',
  expressions: [],
  autoClick: false,
  previousMatch: false,
  continueAfterAlert: false,
  highlightKeyword: false,
  lastKeywordParentSelector: null,
  previousPageSnapshot: null,
};

export const DEFAULT_TIMER_POSITION: TimerPosition = 'top-right';

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'tr',
  defaultIntervalMs: 10000,
  defaultHardRefresh: false,
  defaultVisualTimer: false,
};

export const DEFAULT_KEYWORDS = ['Buy Now', 'In Stock', 'Available', 'Add to Cart', 'Sepete Ekle'];
