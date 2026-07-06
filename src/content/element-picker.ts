import { getAppSettings } from '../shared/storage';
import { Language, PickerResult } from '../shared/types';

type PickerCallback = (result: PickerResult) => void;

const PICK_GRACE_MS = 450;
const ACCENT = '#00ffb4';
const DIM_COLOR = 'rgba(0, 0, 0, 0.45)';
const OVERLAY_ID = 'page-refresh-pro-picker-overlay';
const HIGHLIGHT_ID = 'page-refresh-pro-picker-highlight';
const BANNER_ID = 'page-refresh-pro-picker-banner';

const PICKER_HINTS: Record<Language, string> = {
  tr: 'XHR Yenileme için bir element seçiniz…',
  en: 'Select an element for XHR Refresh…',
};

export async function getPickerHint(override?: string): Promise<string> {
  if (override?.trim()) {
    return override.trim();
  }
  try {
    const settings = await getAppSettings();
    return PICKER_HINTS[settings.language] ?? PICKER_HINTS.tr;
  } catch {
    return PICKER_HINTS.tr;
  }
}

let active = false;
let highlighted: HTMLElement | null = null;
let callback: PickerCallback | null = null;
let startedAt = 0;
let pointerDownTarget: HTMLElement | null = null;
let overlay: HTMLDivElement | null = null;
let highlightBox: HTMLDivElement | null = null;
let banner: HTMLDivElement | null = null;

export function startPicker(onPick: PickerCallback, hint = 'XHR Yenileme için bir element seçiniz…'): void {
  stopPicker();
  active = true;
  startedAt = Date.now();
  pointerDownTarget = null;
  callback = onPick;
  mountUi(hint);
  document.addEventListener('mouseover', onMouseOver, true);
  document.addEventListener('mouseout', onMouseOut, true);
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('scroll', onViewportChange, true);
  window.addEventListener('resize', onViewportChange);
}

export function stopPicker(): void {
  active = false;
  pointerDownTarget = null;
  highlighted = null;
  callback = null;
  unmountUi();
  document.removeEventListener('mouseover', onMouseOver, true);
  document.removeEventListener('mouseout', onMouseOut, true);
  document.removeEventListener('pointerdown', onPointerDown, true);
  document.removeEventListener('click', onClick, true);
  document.removeEventListener('keydown', onKeyDown, true);
  window.removeEventListener('scroll', onViewportChange, true);
  window.removeEventListener('resize', onViewportChange);
}

function mountUi(hint: string): void {
  overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:2147483646',
    `background:${DIM_COLOR}`,
    'pointer-events:none',
  ].join(';');

  highlightBox = document.createElement('div');
  highlightBox.id = HIGHLIGHT_ID;
  highlightBox.style.cssText = [
    'position:fixed',
    'z-index:2147483647',
    'display:none',
    'box-sizing:border-box',
    `border:2px dashed ${ACCENT}`,
    'border-radius:6px',
    `box-shadow:0 0 0 9999px ${DIM_COLOR}`,
    'pointer-events:none',
  ].join(';');

  banner = document.createElement('div');
  banner.id = BANNER_ID;
  banner.textContent = hint;
  banner.style.cssText = [
    'position:fixed',
    'top:20px',
    'left:50%',
    'transform:translateX(-50%)',
    'z-index:2147483648',
    'max-width:min(92vw, 420px)',
    'padding:12px 20px',
    'border-radius:12px',
    `border:1px solid rgba(0,255,180,0.42)`,
    'background:rgba(18,18,18,0.94)',
    'color:#f5f5f5',
    'font:600 14px/1.4 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    'text-align:center',
    'box-shadow:0 12px 32px rgba(0,0,0,0.35)',
    'pointer-events:none',
    'user-select:none',
  ].join(';');

  document.documentElement.append(overlay, highlightBox, banner);
}

function unmountUi(): void {
  overlay?.remove();
  highlightBox?.remove();
  banner?.remove();
  overlay = null;
  highlightBox = null;
  banner = null;
}

function onViewportChange(): void {
  if (highlighted) {
    positionHighlight(highlighted);
  }
}

function isPickerElement(element: HTMLElement): boolean {
  return (
    element.id === OVERLAY_ID ||
    element.id === HIGHLIGHT_ID ||
    element.id === BANNER_ID ||
    !!element.closest(`#${OVERLAY_ID}, #${HIGHLIGHT_ID}, #${BANNER_ID}`)
  );
}

function onMouseOver(event: MouseEvent): void {
  if (!active || !(event.target instanceof HTMLElement)) {
    return;
  }
  if (isPickerElement(event.target)) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  highlight(event.target);
}

function onMouseOut(event: MouseEvent): void {
  if (!active) {
    return;
  }
  if (event.relatedTarget instanceof HTMLElement && isPickerElement(event.relatedTarget)) {
    return;
  }
  clearHighlight();
}

function onPointerDown(event: PointerEvent): void {
  if (!active || !(event.target instanceof HTMLElement)) {
    return;
  }
  if (isPickerElement(event.target)) {
    return;
  }
  if (Date.now() - startedAt < PICK_GRACE_MS) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  pointerDownTarget = event.target;
  highlight(event.target);
}

function onClick(event: MouseEvent): void {
  if (!active || !(event.target instanceof HTMLElement)) {
    return;
  }
  if (isPickerElement(event.target)) {
    return;
  }
  if (Date.now() - startedAt < PICK_GRACE_MS) {
    return;
  }
  if (event.target !== pointerDownTarget) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  const target = event.target;
  const selector = generateSelector(target);
  callback?.({
    selector,
    label: target.innerText.trim().slice(0, 60) || target.getAttribute('aria-label') || target.tagName.toLowerCase(),
  });
  stopPicker();
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    stopPicker();
  }
}

function highlight(element: HTMLElement): void {
  if (highlighted === element) {
    positionHighlight(element);
    return;
  }
  highlighted = element;
  positionHighlight(element);
}

function clearHighlight(): void {
  highlighted = null;
  showFullOverlay();
}

function positionHighlight(element: HTMLElement): void {
  if (!highlightBox || !overlay) {
    return;
  }

  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 && rect.height <= 0) {
    showFullOverlay();
    return;
  }

  overlay.style.display = 'none';
  highlightBox.style.display = 'block';
  highlightBox.style.top = `${rect.top}px`;
  highlightBox.style.left = `${rect.left}px`;
  highlightBox.style.width = `${Math.max(rect.width, 1)}px`;
  highlightBox.style.height = `${Math.max(rect.height, 1)}px`;
}

function showFullOverlay(): void {
  if (!highlightBox || !overlay) {
    return;
  }
  highlightBox.style.display = 'none';
  overlay.style.display = 'block';
}

function generateSelector(element: HTMLElement): string {
  if (element.id && isUnique(`#${cssEscape(element.id)}`)) {
    return `#${cssEscape(element.id)}`;
  }

  const path: string[] = [];
  let current: HTMLElement | null = element;
  while (current && current !== document.body) {
    const tag = current.tagName.toLowerCase();
    const className = [...current.classList].find((name) => isUnique(`${tag}.${cssEscape(name)}`));
    if (className) {
      path.unshift(`${tag}.${cssEscape(className)}`);
      const selector = path.join(' > ');
      if (isUnique(selector)) {
        return selector;
      }
    } else {
      path.unshift(`${tag}:nth-child(${indexInParent(current)})`);
    }
    current = current.parentElement;
  }
  return path.join(' > ');
}

function indexInParent(element: HTMLElement): number {
  if (!element.parentElement) {
    return 1;
  }
  return [...element.parentElement.children].indexOf(element) + 1;
}

function isUnique(selector: string): boolean {
  try {
    return document.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}

function cssEscape(value: string): string {
  return window.CSS?.escape ? window.CSS.escape(value) : value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

export const pickerApi = {
  startPicker,
  stopPicker,
  getPickerHint,
};

(globalThis as Record<string, unknown>).__pageRefreshProPicker = pickerApi;
