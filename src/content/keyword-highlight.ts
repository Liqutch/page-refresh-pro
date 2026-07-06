import { MonitorResult } from '../shared/types';
import { findKeywordHighlightRect } from './matchers';
import { pickHighlightParent } from './selector-utils';

const ROOT_ID = 'prp-keyword-highlight-root';
const STYLE_ID = 'prp-keyword-highlight-style';

export function highlightChangedElement(element: HTMLElement): void {
  const target = pickHighlightParent(element);

  const show = (): void => {
    target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' as ScrollBehavior });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const padding = 6;
        const rect = target.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
          return;
        }
        renderHighlight({
          top: Math.max(0, rect.top - padding),
          left: Math.max(0, rect.left - padding),
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });
      });
    });
  };

  requestAnimationFrame(show);
}

export function highlightStoredParent(selector: string): void {
  const show = (): void => {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) {
      return;
    }
    element.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' as ScrollBehavior });
    const padding = 6;
    const rect = element.getBoundingClientRect();
    renderHighlight({
      top: Math.max(0, rect.top - padding),
      left: Math.max(0, rect.left - padding),
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(show);
  });
}

export function highlightKeywordForMatch(
  keyword: string,
  fallbackRect?: MonitorResult['highlightRect'],
  useFallbackOnly = false,
): void {
  const show = (): void => {
    const rect = useFallbackOnly
      ? fallbackRect
      : findKeywordHighlightRect(keyword) ?? fallbackRect;
    if (!rect) {
      return;
    }
    renderHighlight(rect);
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(show);
  });
}

function renderHighlight(rect: NonNullable<MonitorResult['highlightRect']>): void {
  cleanup();
  ensureStyles();

  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.className = 'prp-keyword-highlight-root';

  const frame = document.createElement('div');
  frame.className = 'prp-keyword-highlight-frame';
  frame.style.top = `${rect.top}px`;
  frame.style.left = `${rect.left}px`;
  frame.style.width = `${rect.width}px`;
  frame.style.height = `${rect.height}px`;

  root.append(frame);
  (document.body ?? document.documentElement).append(root);

  window.setTimeout(cleanup, 1000);
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .prp-keyword-highlight-root {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      pointer-events: none;
    }

    .prp-keyword-highlight-frame {
      position: fixed;
      box-sizing: border-box;
      border: 2px dashed #00ffb4;
      border-radius: 6px;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
      animation: prp-keyword-frame-pulse 1s ease-in-out forwards;
    }

    @keyframes prp-keyword-frame-pulse {
      0% {
        opacity: 0;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0);
      }
      20% {
        opacity: 1;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
      }
      55% {
        opacity: 1;
        border-color: #00ffb4;
      }
      100% {
        opacity: 0;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0);
      }
    }
  `;
  document.documentElement.append(style);
}

function cleanup(): void {
  document.getElementById(ROOT_ID)?.remove();
}
