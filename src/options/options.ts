import { applyTranslations, initI18n, setLanguage, t } from '../shared/i18n';
import { getAppSettings, saveAppSettings } from '../shared/storage';
import { Language } from '../shared/types';

let statusTimer: ReturnType<typeof setTimeout> | null = null;

document.addEventListener('DOMContentLoaded', () => {
  void init();
});

async function init(): Promise<void> {
  const logo = document.querySelector<HTMLImageElement>('.options-logo');
  if (logo) {
    logo.src = chrome.runtime.getURL('public/icons/icon-48.png');
  }

  await initI18n();
  const settings = await getAppSettings();
  bindLanguageDropdown();
  setLanguageControl(settings.language);

  document.getElementById('saveButton')?.addEventListener('click', () => void save());
  bindLegalToggle('termsToggle', 'termsBody', 'privacyToggle', 'privacyBody');
  bindLegalToggle('privacyToggle', 'privacyBody', 'termsToggle', 'termsBody');
}

function bindLanguageDropdown(): void {
  const root = document.getElementById('languageDropdown');
  const trigger = document.getElementById('languageTrigger');
  const menu = document.getElementById('languageMenu');
  if (!root || !trigger || !menu) {
    return;
  }

  trigger.addEventListener('click', () => {
    const willOpen = menu.hasAttribute('hidden');
    setLanguageMenuOpen(willOpen);
  });

  menu.querySelectorAll<HTMLElement>('[data-lang]').forEach((option) => {
    option.addEventListener('click', () => {
      const language = option.dataset.lang as Language;
      if (language !== 'tr' && language !== 'en') {
        return;
      }
      selectLanguage(language);
      setLanguageMenuOpen(false);
    });
  });

  document.addEventListener('click', (event) => {
    if (!root.contains(event.target as Node)) {
      setLanguageMenuOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setLanguageMenuOpen(false);
      trigger.focus();
    }
  });
}

function setLanguageMenuOpen(open: boolean): void {
  const root = document.getElementById('languageDropdown');
  const trigger = document.getElementById('languageTrigger');
  const menu = document.getElementById('languageMenu');
  if (!root || !trigger || !menu) {
    return;
  }

  menu.hidden = !open;
  root.classList.toggle('is-open', open);
  trigger.setAttribute('aria-expanded', String(open));
}

function selectLanguage(language: Language): void {
  getSelect('language').value = language;
  setLanguage(language);
  applyTranslations();
  setLanguageControl(language);
}

function bindLegalToggle(
  toggleId: string,
  bodyId: string,
  otherToggleId: string,
  otherBodyId: string,
): void {
  const toggle = document.getElementById(toggleId);
  const body = document.getElementById(bodyId);
  const otherToggle = document.getElementById(otherToggleId);
  const otherBody = document.getElementById(otherBodyId);
  if (!toggle || !body) {
    return;
  }

  toggle.addEventListener('click', () => {
    const willOpen = body.hasAttribute('hidden');

    if (willOpen && otherBody && otherToggle) {
      otherBody.hidden = true;
      otherToggle.classList.remove('is-active');
      otherToggle.setAttribute('aria-expanded', 'false');
    }

    body.hidden = !willOpen;
    toggle.classList.toggle('is-active', willOpen);
    toggle.setAttribute('aria-expanded', String(willOpen));
  });
}

function setLanguageControl(language: Language): void {
  getSelect('language').value = language;

  document.querySelectorAll<HTMLElement>('.lang-dropdown-option').forEach((option) => {
    const isSelected = option.dataset.lang === language;
    option.classList.toggle('is-selected', isSelected);
    option.setAttribute('aria-selected', String(isSelected));
  });

  const selectedOption = document.querySelector<HTMLElement>(`.lang-dropdown-option[data-lang="${language}"]`);
  const valueLabel = document.querySelector('.lang-dropdown-value');
  if (selectedOption && valueLabel) {
    valueLabel.textContent = selectedOption.textContent?.trim() ?? language;
  }
}

async function save(): Promise<void> {
  const language = getSelect('language').value as Language;
  const current = await getAppSettings();
  await saveAppSettings({
    ...current,
    language,
  });
  setLanguage(language);
  applyTranslations();
  setLanguageControl(language);
  showStatus(t('savedStatus'));
}

function showStatus(text: string): void {
  const status = document.getElementById('status');
  if (!status) {
    return;
  }
  status.textContent = text;
  status.hidden = false;
  if (statusTimer) {
    clearTimeout(statusTimer);
  }
  statusTimer = setTimeout(() => {
    status.hidden = true;
  }, 2600);
}

function getSelect(id: string): HTMLSelectElement {
  return document.getElementById(id) as HTMLSelectElement;
}
