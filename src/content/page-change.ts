import { MonitorConfig, MonitorResult } from '../shared/types';

const MAX_TRACKED_ELEMENTS = 800;
const HIGHLIGHT_ROOT_ID = 'prp-keyword-highlight-root';

interface StoredPageState {
  g: string;
  e: [string, string][];
}

export function runCustomPageChange(config: MonitorConfig): MonitorResult {
  const currentState = capturePageState();
  const snapshot = serializePageState(currentState);
  const hasBaseline = config.previousPageSnapshot !== null;
  const changed = hasBaseline && snapshot !== config.previousPageSnapshot;

  if (!changed || !hasBaseline) {
    return {
      matched: false,
      changed: false,
      pageSnapshot: snapshot,
    };
  }

  const previousState = parsePageState(config.previousPageSnapshot);
  const highlight = findBestChangedElement(previousState, currentState);

  return {
    matched: true,
    changed: true,
    pageSnapshot: snapshot,
    changedElementPath: highlight?.path,
    selector: highlight?.path,
  };
}

export function resolveElementPath(path: string): HTMLElement | null {
  if (!path || !document.body) {
    return null;
  }

  const parts = path.split('/');
  let current: Element = document.body;

  for (const part of parts) {
    const at = part.lastIndexOf('@');
    if (at < 0) {
      return null;
    }

    const tag = part.slice(0, at);
    const index = Number(part.slice(at + 1));
    if (!Number.isInteger(index) || index < 0) {
      return null;
    }

    const child = current.children[index];
    if (!child || child.tagName.toLowerCase() !== tag) {
      return null;
    }

    current = child;
  }

  return current instanceof HTMLElement ? current : null;
}

function capturePageState(): StoredPageState {
  return {
    g: captureGlobalHash(),
    e: captureElementFingerprints(),
  };
}

function serializePageState(state: StoredPageState): string {
  return JSON.stringify(state);
}

function parsePageState(value: string | null): StoredPageState {
  if (!value) {
    return { g: '', e: [] };
  }

  try {
    const parsed = JSON.parse(value) as StoredPageState;
    if (parsed && typeof parsed.g === 'string' && Array.isArray(parsed.e)) {
      return parsed;
    }
  } catch {
    // Legacy global-only snapshot from older builds.
  }

  return { g: value, e: [] };
}

export function captureGlobalHash(): string {
  const body = document.body;
  if (!body) {
    return '';
  }

  const text = (body.innerText ?? '').replace(/\s+/g, ' ').trim();
  return `${body.childElementCount}:${body.innerHTML.length}:${hashString(text)}`;
}

function captureElementFingerprints(): [string, string][] {
  const body = document.body;
  if (!body) {
    return [];
  }

  const fingerprints: [string, string][] = [];
  const elements = body.querySelectorAll<HTMLElement>('*');

  for (const element of elements) {
    if (!shouldTrackElement(element)) {
      continue;
    }

    fingerprints.push([elementPath(element), fingerprintElement(element)]);
    if (fingerprints.length >= MAX_TRACKED_ELEMENTS) {
      break;
    }
  }

  return fingerprints;
}

function elementPath(element: HTMLElement): string {
  const parts: string[] = [];
  let node: HTMLElement | null = element;

  while (node && node !== document.body) {
    const parent: HTMLElement | null = node.parentElement;
    if (!parent) {
      break;
    }

    const index = Array.prototype.indexOf.call(parent.children, node);
    parts.unshift(`${node.tagName.toLowerCase()}@${index}`);
    node = parent;
  }

  return parts.join('/');
}

function shouldTrackElement(element: HTMLElement): boolean {
  if (element === document.body || element === document.documentElement) {
    return false;
  }

  if (element.id === HIGHLIGHT_ROOT_ID || element.closest(`#${HIGHLIGHT_ROOT_ID}`)) {
    return false;
  }

  const tag = element.tagName;
  if (['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT', 'SVG', 'PATH'].includes(tag)) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) {
    return false;
  }

  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0;
}

function fingerprintElement(element: HTMLElement): string {
  const text = (element.innerText ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
  const attrs = `${element.className}:${element.getAttribute('aria-label') ?? ''}:${element.getAttribute('data-testid') ?? ''}`;
  return `${element.childElementCount}:${element.innerHTML.length}:${hashString(`${text}:${attrs}`)}`;
}

function findBestChangedElement(
  previous: StoredPageState,
  current: StoredPageState,
): { path: string } | null {
  const previousMap = new Map(previous.e);
  const viewportArea = window.innerWidth * window.innerHeight;
  let best: { path: string; area: number; score: number } | null = null;

  for (const [path, hash] of current.e) {
    const previousHash = previousMap.get(path);
    if (previousHash === hash) {
      continue;
    }

    const element = resolveElementPath(path);
    if (!element || !shouldTrackElement(element)) {
      continue;
    }

    const text = (element.innerText ?? '').replace(/\s+/g, ' ').trim();
    if (!text) {
      continue;
    }

    const rect = element.getBoundingClientRect();
    const area = rect.width * rect.height;
    if (area <= 0 || area > viewportArea * 0.85) {
      continue;
    }

    const score = previousHash === undefined ? 0 : 1;

    if (!best || score > best.score || (score === best.score && area < best.area)) {
      best = { path, area, score };
    }
  }

  return best ? { path: best.path } : null;
}

function hashString(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}
