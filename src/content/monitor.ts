import { MonitorConfig, MonitorResult } from '../shared/types';
import { highlightChangedElement, highlightKeywordForMatch, highlightStoredParent } from './keyword-highlight';
import { resolveElementPath } from './page-change';
import { runMatchers } from './matchers';

export function runMonitor(config: MonitorConfig): MonitorResult {
  const result = runMatchers(config);

  if (!config.highlightKeyword) {
    return result;
  }

  if (config.template === 'custom') {
    if (result.changed) {
      const path = result.changedElementPath ?? result.selector;
      const element = path ? resolveElementPath(path) : null;
      if (element) {
        highlightChangedElement(element);
      }
    }
    return result;
  }

  const keyword = result.matchedText ?? config.expressions.find((entry) => entry.trim()) ?? '';

  if (config.template === 'lost') {
    if (!result.matched && result.changed && config.previousMatch && config.lastKeywordParentSelector) {
      highlightStoredParent(config.lastKeywordParentSelector);
    }
    return result;
  }

  if (config.template === 'found') {
    if (result.matched) {
      highlightKeywordForMatch(keyword, result.highlightRect, Boolean(result.selector));
    }
    return result;
  }

  if (result.changed) {
    if (result.matched) {
      highlightKeywordForMatch(keyword, result.highlightRect, Boolean(result.selector));
    } else if (config.lastKeywordParentSelector) {
      highlightStoredParent(config.lastKeywordParentSelector);
    }
  }

  return result;
}
