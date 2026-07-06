import { DomainSettings, MonitorConfig, MonitorTemplate, RefreshType } from '../shared/types';
import { t } from '../shared/i18n';
import { schedulePersistDomainSettings } from './domain-settings';

export interface MonitorFormValues {
  refreshType: RefreshType;
  xhrSelectors: string[];
  monitor: MonitorConfig;
}

let currentSelectors: string[] = [];
let currentKeywords: string[] = [];

const TEMPLATE_HINT_KEYS: Record<MonitorTemplate, string> = {
  found: 'templateHintFound',
  lost: 'templateHintLost',
  custom: 'templateHintCustom',
};

export function readMonitorForm(): MonitorFormValues {
  return {
    refreshType: getActiveRefreshType(),
    xhrSelectors: [...currentSelectors],
    monitor: {
      mode: 'basic',
      template: getActiveTemplate(),
      expressions: [...currentKeywords],
      autoClick: getInput('autoClick').checked,
      continueAfterAlert: getInput('continueAfterAlert').checked,
      highlightKeyword: getInput('highlightKeyword').checked,
      previousMatch: false,
      lastKeywordParentSelector: null,
      previousPageSnapshot: null,
    },
  };
}

export function applyMonitorSettings(settings: DomainSettings): void {
  setRefreshType(settings.refreshType);
  currentSelectors = [...settings.xhrSelectors];
  currentKeywords = [...settings.monitor.expressions];
  setTemplate(settings.monitor.template);
  getInput('autoClick').checked = settings.monitor.autoClick;
  getInput('continueAfterAlert').checked = settings.monitor.continueAfterAlert;
  getInput('highlightKeyword').checked = settings.monitor.highlightKeyword;
  renderTargets();
  renderKeywords();
  updateTemplateHint();
  syncKeywordSection();
  syncRefreshPanels();
}

export function bindMonitorControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-refresh-type]').forEach((button) => {
    button.addEventListener('click', () => {
      const type = button.dataset.refreshType;
      if (type === 'full' || type === 'xhr') {
        setRefreshType(type);
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-template]').forEach((button) => {
    button.addEventListener('click', () => {
      const template = button.dataset.template;
      if (template === 'found' || template === 'lost' || template === 'custom') {
        setTemplate(template);
      }
    });
  });

  document.getElementById('addKeyword')?.addEventListener('click', () => addKeywordFromInput());
  document.getElementById('keywordInput')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addKeywordFromInput();
    }
  });
  document.getElementById('clearKeywords')?.addEventListener('click', clearKeywords);
  getInput('autoClick').addEventListener('change', () => schedulePersistDomainSettings());
  getInput('continueAfterAlert').addEventListener('change', () => schedulePersistDomainSettings());
  getInput('highlightKeyword').addEventListener('change', () => schedulePersistDomainSettings());
}

export function addTarget(selector: string): void {
  if (!currentSelectors.includes(selector)) {
    currentSelectors.push(selector);
    renderTargets();
    syncRefreshPanels();
    schedulePersistDomainSettings();
  }
}

function addKeywordFromInput(): void {
  const input = getInput('keywordInput');
  const value = input.value.trim();
  if (!value || currentKeywords.includes(value)) {
    return;
  }
  currentKeywords.push(value);
  input.value = '';
  renderKeywords();
  schedulePersistDomainSettings();
}

export function clearKeywords(): void {
  currentKeywords = [];
  renderKeywords();
  schedulePersistDomainSettings();
}

export function renderTargets(): void {
  const list = document.getElementById('targetList') as HTMLUListElement;
  const empty = document.getElementById('targetListEmpty');
  if (!list) {
    return;
  }
  list.replaceChildren();
  if (empty) {
    empty.hidden = currentSelectors.length > 0;
  }
  currentSelectors.forEach((selector) => {
    const item = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = selector;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      currentSelectors = currentSelectors.filter((current) => current !== selector);
      renderTargets();
      syncRefreshPanels();
      schedulePersistDomainSettings();
    });
    item.append(label, remove);
    list.append(item);
  });
}

function renderKeywords(): void {
  const list = document.getElementById('keywordList') as HTMLUListElement;
  const empty = document.getElementById('keywordListEmpty');
  if (!list) {
    return;
  }
  list.replaceChildren();
  if (empty) {
    empty.hidden = currentKeywords.length > 0;
  }
  currentKeywords.forEach((keyword) => {
    const item = document.createElement('li');
    item.className = 'keyword-chip';
    item.textContent = keyword;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '×';
    remove.disabled = getActiveTemplate() === 'custom';
    remove.addEventListener('click', () => {
      currentKeywords = currentKeywords.filter((current) => current !== keyword);
      renderKeywords();
      schedulePersistDomainSettings();
    });
    item.append(remove);
    list.append(item);
  });
}

function setRefreshType(type: RefreshType): void {
  document.querySelectorAll<HTMLButtonElement>('[data-refresh-type]').forEach((button) => {
    const isActive = button.dataset.refreshType === type;
    button.classList.toggle('active', isActive);
    if (isActive) {
      pulseButton(button);
    }
  });
  syncRefreshPanels();
  schedulePersistDomainSettings();
}

function setTemplate(template: MonitorTemplate): void {
  document.querySelectorAll<HTMLButtonElement>('[data-template]').forEach((button) => {
    const isActive = button.dataset.template === template;
    button.classList.toggle('active', isActive);
    if (isActive) {
      pulseButton(button);
    }
  });
  updateTemplateHint();
  syncKeywordSection();
  schedulePersistDomainSettings();
}

function pulseButton(button: HTMLButtonElement): void {
  button.classList.remove('soft-pulse');
  void button.offsetWidth;
  button.classList.add('soft-pulse');
}

function getActiveRefreshType(): RefreshType {
  const active = document.querySelector<HTMLButtonElement>('[data-refresh-type].active');
  return (active?.dataset.refreshType as RefreshType) ?? 'full';
}

function getActiveTemplate(): MonitorTemplate {
  const active = document.querySelector<HTMLButtonElement>('[data-template].active');
  return (active?.dataset.template as MonitorTemplate) ?? 'found';
}

function syncRefreshPanels(): void {
  const xhrPanel = document.getElementById('xhrPanel');
  const isXhr = getActiveRefreshType() === 'xhr';
  const fullHint = document.getElementById('fullRefreshHint');
  if (fullHint) {
    fullHint.hidden = getActiveRefreshType() !== 'full';
  }
  setRevealPanel(xhrPanel, isXhr);
}

function setRevealPanel(panel: HTMLElement | null, visible: boolean): void {
  if (!panel) {
    return;
  }

  if (visible) {
    panel.hidden = false;
    panel.classList.remove('is-closing');
    requestAnimationFrame(() => {
      panel.classList.add('is-visible');
    });
    return;
  }

  if (panel.hidden) {
    return;
  }

  panel.classList.remove('is-visible');
  panel.classList.add('is-closing');

  const finalize = (event?: TransitionEvent): void => {
    if (event && event.propertyName !== 'max-height') {
      return;
    }
    panel.removeEventListener('transitionend', finalize);
    if (!panel.classList.contains('is-visible')) {
      panel.hidden = true;
      panel.classList.remove('is-closing');
    }
  };

  panel.addEventListener('transitionend', finalize);
  window.setTimeout(() => finalize(), 420);
}

export function updateTemplateHint(): void {
  const hint = document.getElementById('templateHint');
  if (hint) {
    hint.textContent = t(TEMPLATE_HINT_KEYS[getActiveTemplate()]);
  }
}

function syncKeywordSection(): void {
  const isCustom = getActiveTemplate() === 'custom';
  const section = document.getElementById('keywordSection');
  section?.classList.toggle('is-disabled', isCustom);

  const keywordInput = getInput('keywordInput');
  keywordInput.disabled = isCustom;
  if (isCustom) {
    keywordInput.value = '';
  }

  const addKeyword = document.getElementById('addKeyword') as HTMLButtonElement | null;
  if (addKeyword) {
    addKeyword.disabled = isCustom;
  }

  const clearKeywords = document.getElementById('clearKeywords') as HTMLButtonElement | null;
  if (clearKeywords) {
    clearKeywords.disabled = isCustom;
  }

  syncHighlightOption();
}

function syncHighlightOption(): void {
  const isCustom = getActiveTemplate() === 'custom';
  const row = getInput('highlightKeyword').closest('.option-row');
  const title = row?.querySelector('strong');
  const desc = row?.querySelector('small');
  if (title) {
    title.textContent = t(isCustom ? 'highlightChangeTitle' : 'highlightKeywordTitle');
  }
  if (desc) {
    desc.textContent = t(isCustom ? 'highlightChangeDesc' : 'highlightKeywordDesc');
  }
}

function getInput(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}
