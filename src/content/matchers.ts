import { MonitorConfig, MonitorResult } from '../shared/types';
import { runCustomPageChange } from './page-change';
import { generateSelector, pickHighlightParent } from './selector-utils';

interface MatchCandidate {
  matched: boolean;
  text?: string;
  selector?: string;
  parentSelector?: string | null;
  highlightRect?: MonitorResult['highlightRect'];
}

export function runMatchers(config: MonitorConfig): MonitorResult {
  if (config.template === 'custom') {
    return runCustomPageChange(config);
  }

  const candidates = config.expressions
    .map((expression) => expression.trim())
    .filter(Boolean)
    .map((expression) => matchExpression(expression, config.mode));

  const first = candidates.find((candidate) => candidate.matched);
  const matched = Boolean(first);
  const changed = computeTemplateChange(config, matched);

  return {
    matched,
    changed,
    matchedText: first?.text,
    selector: first?.selector,
    parentSelector: first?.parentSelector ?? null,
    highlightRect: first?.highlightRect,
  };
}

function matchExpression(expression: string, mode: MonitorConfig['mode']): MatchCandidate {
  if (mode === 'basic') {
    const bodyText = document.body?.innerText ?? '';
    const matched = bodyText.toLocaleLowerCase().includes(expression.toLocaleLowerCase());
    const anchor = matched ? findKeywordMatchAnchor(expression) : undefined;
    return {
      matched,
      text: expression,
      highlightRect: anchor?.highlightRect,
      parentSelector: anchor?.parentSelector ?? null,
    };
  }

  if (expression.startsWith('css:')) {
    return matchCss(expression.slice(4).trim());
  }

  if (expression.startsWith('xpath:')) {
    return matchXpath(expression.slice(6).trim());
  }

  if (expression.startsWith('/') && expression.lastIndexOf('/') > 0) {
    return matchRegex(expression);
  }

  return matchExpression(expression, 'basic');
}

function matchCss(selector: string): MatchCandidate {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    return { matched: false };
  }
  const parent = pickHighlightParent(element);
  return {
    matched: true,
    text: element.innerText || selector,
    selector,
    parentSelector: generateSelector(parent),
    highlightRect: toHighlightRect(element.getBoundingClientRect()),
  };
}

function matchXpath(xpath: string): MatchCandidate {
  const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  const element = result.singleNodeValue instanceof HTMLElement ? result.singleNodeValue : null;
  if (!element) {
    return { matched: false };
  }
  const parent = pickHighlightParent(element);
  return {
    matched: true,
    text: element.innerText || xpath,
    parentSelector: generateSelector(parent),
    highlightRect: toHighlightRect(element.getBoundingClientRect()),
  };
}

function matchRegex(expression: string): MatchCandidate {
  const lastSlash = expression.lastIndexOf('/');
  const source = expression.slice(1, lastSlash);
  const flags = expression.slice(lastSlash + 1);
  try {
    const regex = new RegExp(source, flags);
    const match = regex.exec(document.body?.innerText ?? '');
    const matched = Boolean(match);
    const anchor = match?.[0] ? findKeywordMatchAnchor(match[0]) : undefined;
    return {
      matched,
      text: match?.[0],
      highlightRect: anchor?.highlightRect,
      parentSelector: anchor?.parentSelector ?? null,
    };
  } catch {
    return { matched: false };
  }
}

function findRectFromRange(range: Range): MonitorResult['highlightRect'] | undefined {
  const rects = [...range.getClientRects()];
  const visible = rects.find((rect) => rect.width > 0 && rect.height > 0);
  const target = visible ?? range.getBoundingClientRect();
  if (target.width <= 0 || target.height <= 0) {
    return undefined;
  }
  return toHighlightRect(target);
}

function scrollRangeIntoView(range: Range): void {
  const element =
    range.startContainer instanceof Element
      ? range.startContainer
      : range.startContainer.parentElement;
  element?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' as ScrollBehavior });
}

function isTextNodeVisible(node: Node): boolean {
  const parent = node.parentElement;
  if (!parent) {
    return true;
  }
  const style = window.getComputedStyle(parent);
  return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0;
}

export function findKeywordHighlightRect(keyword: string): MonitorResult['highlightRect'] | undefined {
  return findKeywordMatchAnchor(keyword)?.highlightRect;
}

function findKeywordElement(keyword: string): HTMLElement | null {
  const needle = keyword.trim();
  if (!needle || !document.body) {
    return null;
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.nextNode();
  while (node) {
    if (isTextNodeVisible(node)) {
      const text = node.textContent ?? '';
      const index = text.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase());
      if (index >= 0 && node.parentElement) {
        return node.parentElement;
      }
    }
    node = walker.nextNode();
  }

  const findInPage = (window as unknown as { find?: (text: string, ...flags: boolean[]) => boolean }).find;
  if (!findInPage) {
    return null;
  }

  const selection = window.getSelection();
  if (!selection) {
    return null;
  }

  selection.removeAllRanges();
  const found = findInPage.call(window, needle, false, false, true, false, true, false);
  if (!found || selection.rangeCount === 0) {
    selection.removeAllRanges();
    return null;
  }

  const range = selection.getRangeAt(0);
  const element =
    (range.startContainer instanceof Element ? range.startContainer : range.startContainer.parentElement) as
      | HTMLElement
      | null;
  selection.removeAllRanges();
  return element;
}

function findTextNodeWithKeyword(root: Node, needle: string): Text | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.nextNode();
  while (node) {
    if (isTextNodeVisible(node)) {
      const text = node.textContent ?? '';
      if (text.toLocaleLowerCase().includes(needle.toLocaleLowerCase())) {
        return node as Text;
      }
    }
    node = walker.nextNode();
  }
  return null;
}

export function findKeywordMatchAnchor(
  keyword: string,
): { highlightRect: MonitorResult['highlightRect']; parentSelector: string } | undefined {
  const needle = keyword.trim();
  if (!needle || !document.body) {
    return undefined;
  }

  const element = findKeywordElement(needle);
  if (!element) {
    return undefined;
  }

  const textNode = findTextNodeWithKeyword(element, needle) ?? findTextNodeWithKeyword(document.body, needle);
  if (textNode) {
    const index = (textNode.textContent ?? '').toLocaleLowerCase().indexOf(needle.toLocaleLowerCase());
    if (index >= 0) {
      const range = document.createRange();
      range.setStart(textNode, index);
      range.setEnd(textNode, index + needle.length);
      scrollRangeIntoView(range);
      const rect = findRectFromRange(range);
      if (rect) {
        const parent = pickHighlightParent(element);
        return { highlightRect: rect, parentSelector: generateSelector(parent) };
      }
    }
  }

  const parent = pickHighlightParent(element);
  const rect = toHighlightRect(parent.getBoundingClientRect());
  if (!rect || rect.width <= 0 || rect.height <= 0) {
    return undefined;
  }
  return { highlightRect: rect, parentSelector: generateSelector(parent) };
}

function toHighlightRect(rect: DOMRect): MonitorResult['highlightRect'] {
  const padding = 4;
  return {
    top: Math.max(0, rect.top - padding),
    left: Math.max(0, rect.left - padding),
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

function computeTemplateChange(config: MonitorConfig, matched: boolean): boolean {
  if (config.template === 'found') {
    return matched && !config.previousMatch;
  }
  if (config.template === 'lost') {
    return !matched && config.previousMatch;
  }
  return matched !== config.previousMatch;
}
