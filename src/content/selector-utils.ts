export function generateSelector(element: HTMLElement): string {
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

export function pickHighlightParent(element: HTMLElement): HTMLElement {
  let current: HTMLElement | null = element;
  while (current && current !== document.body) {
    const rect = current.getBoundingClientRect();
    const style = window.getComputedStyle(current);
    const isBlockLike = ['block', 'flex', 'grid', 'list-item', 'table', 'table-row', 'table-cell'].includes(
      style.display,
    );
    if (isBlockLike && rect.width >= 24 && rect.height >= 12) {
      return current;
    }
    current = current.parentElement;
  }

  return element.parentElement ?? element;
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
