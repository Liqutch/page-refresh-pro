import { TimerPosition } from '../shared/types';

const TIMER_ID = 'page-refresh-pro-timer';
const ACCENT = '#00ffb4';

let intervalId: number | null = null;
let nextTickAt = 0;

const POSITION_STYLES: Record<TimerPosition, string> = {
  'top-right': 'top:16px;right:16px;left:auto;bottom:auto;',
  'top-left': 'top:16px;left:16px;right:auto;bottom:auto;',
  'bottom-right': 'bottom:16px;right:16px;left:auto;top:auto;',
  'bottom-left': 'bottom:16px;left:16px;right:auto;top:auto;',
};

export function showVisualTimer(nextTick: number, _intervalMs: number, position: TimerPosition): void {
  nextTickAt = nextTick;
  const element = ensureTimer(position);
  updateTimer(element);

  if (intervalId !== null) {
    window.clearInterval(intervalId);
  }
  intervalId = window.setInterval(() => updateTimer(element), 250);
}

export function hideVisualTimer(): void {
  if (intervalId !== null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
  document.getElementById(TIMER_ID)?.remove();
}

function ensureTimer(position: TimerPosition): HTMLElement {
  const existing = document.getElementById(TIMER_ID);
  if (existing) {
    applyPosition(existing, position);
    return existing;
  }

  const element = document.createElement('div');
  element.id = TIMER_ID;
  element.style.cssText = [
    'position:fixed',
    'z-index:2147483647',
    'display:flex',
    'flex-direction:column',
    'gap:2px',
    'min-width:88px',
    'padding:10px 14px',
    'border-radius:12px',
    'border:1px solid rgba(0,229,181,0.35)',
    'background:rgba(8,8,8,0.92)',
    'color:#fff',
    'font:600 11px/1.2 system-ui,sans-serif',
    'box-shadow:0 12px 32px rgba(0,0,0,0.45)',
    'backdrop-filter:blur(8px)',
    'user-select:none',
    'pointer-events:none',
    POSITION_STYLES[position],
  ].join(';');

  const label = document.createElement('span');
  label.textContent = 'Yenileme';
  label.style.cssText = `color:${ACCENT};font-size:10px;letter-spacing:0.04em;text-transform:uppercase;`;

  const value = document.createElement('strong');
  value.dataset.role = 'countdown';
  value.style.cssText = 'font-size:22px;line-height:1;';

  element.append(label, value);
  document.documentElement.append(element);
  return element;
}

function applyPosition(element: HTMLElement, position: TimerPosition): void {
  element.style.cssText = element.style.cssText.replace(
    /top:[^;]+;|right:[^;]+;|bottom:[^;]+;|left:[^;]+;/g,
    '',
  );
  element.style.cssText += POSITION_STYLES[position];
}

function updateTimer(element: HTMLElement): void {
  const value = element.querySelector<HTMLElement>('[data-role="countdown"]');
  if (!value) {
    return;
  }
  const remaining = Math.max(0, nextTickAt - Date.now());
  const totalSeconds = Math.ceil(remaining / 1000);
  value.textContent = `${totalSeconds}s`;
}
