import {
  DEFAULT_TIMER_POSITION,
  DomainSettings,
  InteractionBehavior,
  IntervalMode,
  TimerPosition,
} from '../shared/types';
import {
  clampIntervalMs,
  clampIntervalSeconds,
  formatIntervalSeconds,
  formatIntervalSummary,
  INTERVAL_STEP_SECONDS,
  MAX_INTERVAL_MS,
  MIN_INTERVAL_SECONDS,
  msFromParts,
  msToIntervalSeconds,
  partsFromMs,
} from '../shared/interval';
import { schedulePersistDomainSettings } from './domain-settings';

export interface IntervalFormValues {
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
}

let activeMode: IntervalMode = 'fixed';

export function readIntervalForm(): IntervalFormValues {
  const maxRefreshesEnabled = getInput('maxRefreshesEnabled').checked;
  const maxRefreshesValue = readNumber('maxRefreshes');
  const interactionEnabled = getInput('interactionEnabled').checked;
  const mode = activeMode;

  const base = {
    intervalMode: mode,
    hardRefresh: getInput('hardRefresh').checked,
    maxRefreshes: maxRefreshesEnabled && maxRefreshesValue > 0 ? maxRefreshesValue : null,
    visualTimer: getInput('visualTimer').checked,
    timerPosition: getRadioValue('timerPosition') as TimerPosition,
    interactionEnabled,
    interactionBehavior: interactionEnabled
      ? (getRadioValue('interactionBehavior') as InteractionBehavior)
      : 'stop',
    detectCaptcha: getInput('detectCaptcha').checked,
    detectErrors: getInput('detectErrors').checked,
  };

  if (mode === 'random') {
    const minSec = clampIntervalSeconds(readNumber('randomMin'));
    const maxSec = Math.max(minSec, clampIntervalSeconds(readNumber('randomMax')));
    return {
      ...base,
      intervalMs: clampIntervalMs(minSec * 1000),
      randomMinMs: clampIntervalMs(minSec * 1000),
      randomMaxMs: clampIntervalMs(maxSec * 1000),
    };
  }

  if (mode === 'custom') {
    const parts = readCustomParts();
    const intervalMs = msFromParts(parts.hours, parts.minutes, parts.seconds);
    return {
      ...base,
      intervalMs,
      randomMinMs: 5000,
      randomMaxMs: 30000,
    };
  }

  const seconds = clampIntervalSeconds(readNumber('intervalSeconds'));
  return {
    ...base,
    intervalMs: clampIntervalMs(seconds * 1000),
    randomMinMs: 5000,
    randomMaxMs: 30000,
  };
}

export function applyIntervalSettings(settings: DomainSettings): void {
  setIntervalMode(settings.intervalMode ?? 'fixed');
  applyIntervalMs(settings.intervalMs);
  const randomMinSec = msToIntervalSeconds(settings.randomMinMs);
  const randomMaxSec = msToIntervalSeconds(settings.randomMaxMs);
  getInput('randomMin').value = formatIntervalSeconds(clampIntervalSeconds(Math.min(randomMinSec, randomMaxSec)));
  getInput('randomMax').value = formatIntervalSeconds(clampIntervalSeconds(Math.max(randomMinSec, randomMaxSec)));

  const custom = partsFromMs(Math.min(settings.intervalMs, MAX_INTERVAL_MS));
  getInput('customHours').value = String(custom.hours);
  getInput('customMinutes').value = String(custom.minutes);
  getInput('customSeconds').value = formatIntervalSeconds(custom.seconds);
  clampCustomInterval();

  getInput('hardRefresh').checked = settings.hardRefresh;
  getInput('visualTimer').checked = settings.visualTimer;
  getInput('interactionEnabled').checked = settings.interactionEnabled;
  setRadioValue('timerPosition', settings.timerPosition ?? DEFAULT_TIMER_POSITION);
  getInput('detectCaptcha').checked = settings.detectCaptcha;
  getInput('detectErrors').checked = settings.detectErrors;
  const hasLimit = settings.maxRefreshes !== null && settings.maxRefreshes > 0;
  getInput('maxRefreshesEnabled').checked = hasLimit;
  getInput('maxRefreshes').value = hasLimit ? String(settings.maxRefreshes) : '';
  setRadioValue('interactionBehavior', settings.interactionBehavior);
  syncConditionalPanels();
  updateIntervalSummary();
}

export function bindIntervalControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-interval-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.intervalMode;
      if (mode === 'fixed' || mode === 'random' || mode === 'custom') {
        setIntervalMode(mode);
      }
    });
  });

  document.getElementById('intervalMinus')?.addEventListener('click', () => {
    setIntervalSeconds(getIntervalSeconds() - INTERVAL_STEP_SECONDS);
  });
  document.getElementById('intervalPlus')?.addEventListener('click', () => {
    setIntervalSeconds(getIntervalSeconds() + INTERVAL_STEP_SECONDS);
  });

  document.querySelectorAll<HTMLButtonElement>('[data-interval]').forEach((button) => {
    button.addEventListener('click', () => {
      if (activeMode !== 'fixed') {
        setIntervalMode('fixed');
      }
      applyIntervalMs(Number(button.dataset.interval));
      schedulePersistDomainSettings();
    });
  });

  ['randomMin', 'randomMax', 'customHours', 'customMinutes', 'customSeconds'].forEach((id) => {
    const input = getInput(id);
    input.addEventListener('input', updateIntervalSummary);
    input.addEventListener('blur', () => {
      if (id === 'randomMin' || id === 'randomMax') {
        clampRandomRange();
      } else {
        clampCustomInterval();
      }
      updateIntervalSummary();
      schedulePersistDomainSettings();
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        input.blur();
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-adjust]').forEach((button) => {
    button.addEventListener('click', () => {
      const fieldId = button.dataset.adjust;
      const delta = Number(button.dataset.delta);
      if (!fieldId || !Number.isFinite(delta)) {
        return;
      }
      if (fieldId === 'randomMin' || fieldId === 'randomMax') {
        adjustRandomField(fieldId, delta);
      } else if (fieldId === 'maxRefreshes') {
        const next = Math.max(1, Math.round(readNumber('maxRefreshes') + delta));
        getInput('maxRefreshes').value = String(next);
      } else {
        adjustCustomField(fieldId, delta);
      }
      schedulePersistDomainSettings();
    });
  });

  const intervalInput = getInput('intervalSeconds');
  intervalInput.addEventListener('input', () => {
    syncPresetHighlight(clampIntervalMs(getIntervalSeconds() * 1000));
    updateIntervalSummary();
  });
  intervalInput.addEventListener('blur', () => {
    setIntervalSeconds(getIntervalSeconds());
  });
  intervalInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      intervalInput.blur();
    }
  });

  getInput('maxRefreshesEnabled').addEventListener('change', () => {
    syncConditionalPanels();
    schedulePersistDomainSettings();
  });
  getInput('interactionEnabled').addEventListener('change', () => {
    syncConditionalPanels();
    schedulePersistDomainSettings();
  });
  getInput('visualTimer').addEventListener('change', () => {
    syncConditionalPanels();
    schedulePersistDomainSettings();
  });

  const intervalPanel = document.getElementById('intervalPanel');
  intervalPanel?.addEventListener('change', () => schedulePersistDomainSettings());

  document.getElementById('optionsToggle')?.addEventListener('click', () => {
    const block = document.querySelector('.options-block');
    const toggle = document.getElementById('optionsToggle');
    if (!block || !toggle) {
      return;
    }
    const open = !block.classList.contains('is-open');
    block.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });

  syncConditionalPanels();
  updateIntervalSummary();
}

function setIntervalMode(mode: IntervalMode): void {
  activeMode = mode;
  document.querySelectorAll<HTMLButtonElement>('[data-interval-mode]').forEach((button) => {
    button.classList.toggle('active', button.dataset.intervalMode === mode);
  });
  showIntervalPanel('fixedPanel', mode === 'fixed');
  showIntervalPanel('randomPanel', mode === 'random');
  showIntervalPanel('customPanel', mode === 'custom');
  updateIntervalSummary();
  schedulePersistDomainSettings();
}

function showIntervalPanel(id: string, visible: boolean): void {
  const panel = document.getElementById(id);
  if (panel) {
    panel.classList.toggle('is-active', visible);
  }
}

function getIntervalSeconds(): number {
  return clampIntervalSeconds(readNumber('intervalSeconds'));
}

function setIntervalSeconds(seconds: number): void {
  const value = clampIntervalSeconds(seconds);
  getInput('intervalSeconds').value = formatIntervalSeconds(value);
  syncPresetHighlight(clampIntervalMs(value * 1000));
  updateIntervalSummary();
  schedulePersistDomainSettings();
}

function applyIntervalMs(intervalMs: number): void {
  getInput('intervalSeconds').value = formatIntervalSeconds(msToIntervalSeconds(intervalMs));
  syncPresetHighlight(clampIntervalMs(intervalMs));
}

export function updateIntervalSummary(): void {
  const summary = document.getElementById('intervalSummaryText');
  if (!summary) {
    return;
  }

  if (activeMode === 'custom') {
    const parts = readCustomParts();
    summary.textContent = formatIntervalSummary({
      intervalMode: 'custom',
      intervalMs: msFromParts(parts.hours, parts.minutes, parts.seconds),
      randomMinMs: 0,
      randomMaxMs: 0,
    });
    return;
  }

  summary.textContent = formatIntervalSummary(readIntervalForm());
}

function syncConditionalPanels(): void {
  togglePanel('maxRefreshesOptions', getInput('maxRefreshesEnabled').checked);
  togglePanel('interactionOptions', getInput('interactionEnabled').checked);
  togglePanel('timerOptions', getInput('visualTimer').checked);
}

function syncPresetHighlight(intervalMs: number): void {
  document.querySelectorAll<HTMLButtonElement>('[data-interval]').forEach((button) => {
    const presetMs = Number(button.dataset.interval);
    button.classList.toggle('active', presetMs === intervalMs);
  });
}

function togglePanel(id: string, visible: boolean): void {
  const panel = document.getElementById(id);
  if (!panel) {
    return;
  }
  if (panel.classList.contains('collapse-extra')) {
    panel.classList.toggle('is-open', visible);
    return;
  }
  panel.hidden = !visible;
}

function clampRandomRange(): void {
  const min = clampIntervalSeconds(readNumber('randomMin'));
  const max = Math.max(min, clampIntervalSeconds(readNumber('randomMax')));
  getInput('randomMin').value = formatIntervalSeconds(min);
  getInput('randomMax').value = formatIntervalSeconds(max);
}

function adjustRandomField(fieldId: 'randomMin' | 'randomMax', delta: number): void {
  const current = clampIntervalSeconds(readNumber(fieldId) + delta);
  getInput(fieldId).value = formatIntervalSeconds(current);
  clampRandomRange();
  updateIntervalSummary();
}

function readCustomParts(): { hours: number; minutes: number; seconds: number } {
  clampCustomInterval();
  return {
    hours: readNumber('customHours'),
    minutes: readNumber('customMinutes'),
    seconds: readNumber('customSeconds'),
  };
}

function clampCustomInterval(): void {
  let hours = Math.max(0, Math.min(24, Math.round(readNumber('customHours'))));
  let minutes = Math.max(0, Math.min(59, Math.round(readNumber('customMinutes'))));
  let seconds = clampIntervalSeconds(readNumber('customSeconds'), hours > 0 || minutes > 0);

  if (hours === 24) {
    minutes = 0;
    seconds = 0;
  }

  if (hours === 0 && minutes === 0) {
    seconds = clampIntervalSeconds(seconds);
  } else {
    seconds = Math.max(0, Math.min(59.95, Math.round(seconds / INTERVAL_STEP_SECONDS) * INTERVAL_STEP_SECONDS));
    seconds = Math.round(seconds * 100) / 100;
  }

  let totalMs = msFromParts(hours, minutes, seconds);
  if (totalMs > MAX_INTERVAL_MS) {
    hours = 24;
    minutes = 0;
    seconds = 0;
    totalMs = MAX_INTERVAL_MS;
  }
  if (totalMs < MIN_INTERVAL_SECONDS * 1000) {
    hours = 0;
    minutes = 0;
    seconds = MIN_INTERVAL_SECONDS;
  }

  getInput('customHours').value = String(hours);
  getInput('customMinutes').value = String(minutes);
  getInput('customSeconds').value = formatIntervalSeconds(seconds);
}

function adjustCustomField(fieldId: string, delta: number): void {
  const limits: Record<string, { min: number; max: number }> = {
    customHours: { min: 0, max: 24 },
    customMinutes: { min: 0, max: 59 },
    customSeconds: { min: 0, max: 59 },
  };
  const limit = limits[fieldId];
  if (!limit) {
    return;
  }

  const deltaSeconds = fieldId === 'customSeconds' ? INTERVAL_STEP_SECONDS : 1;
  const next =
    fieldId === 'customSeconds'
      ? clampIntervalSeconds(readNumber(fieldId) + delta * deltaSeconds, true)
      : Math.max(limit.min, Math.min(limit.max, Math.round(readNumber(fieldId) + delta)));
  getInput(fieldId).value =
    fieldId === 'customSeconds' ? formatIntervalSeconds(next) : String(next);
  clampCustomInterval();
  updateIntervalSummary();
}

function readNumber(id: string): number {
  const value = Number(getInput(id).value);
  return Number.isFinite(value) ? value : 0;
}

function getInput(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}

function getRadioValue(name: string): string {
  const selected = document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement | null;
  return selected?.value ?? 'stop';
}

function setRadioValue(name: string, value: string): void {
  const input = document.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement | null;
  if (input) {
    input.checked = true;
  }
}
