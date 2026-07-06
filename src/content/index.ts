import { onRuntimeMessage, sendRuntimeMessage } from '../shared/messaging';
import { RuntimeMessage } from '../shared/types';
import { clickTargets } from './auto-click';
import { detectCaptcha } from './captcha-detector';
import { detectErrorPage } from './error-detector';
import { pickerApi } from './element-picker';
import { startFastRefresh, stopFastRefresh } from './fast-refresh';
import { runMonitor } from './monitor';
import { disarmUserInteraction, armUserInteraction } from './user-interaction';
import { hideVisualTimer, showVisualTimer } from './visual-timer';

const CONTENT_SCRIPT_FLAG = '__PAGE_REFRESH_PRO_CS__';

function getPickerApi() {
  return (
    (globalThis as Record<string, unknown>).__pageRefreshProPicker as typeof pickerApi | undefined
  ) ?? pickerApi;
}

function registerContentScript(): void {
  onRuntimeMessage(async (message: RuntimeMessage) => {
    const picker = getPickerApi();
    switch (message.type) {
      case 'PING':
        return { ok: true };
      case 'SHOW_VISUAL_TIMER':
        showVisualTimer(message.nextTickAt, message.intervalMs, message.position);
        return { ok: true };
      case 'HIDE_VISUAL_TIMER':
        hideVisualTimer();
        return { ok: true };
      case 'CLICK_TARGETS':
        return clickTargets(message.selectors);
      case 'RUN_MONITOR':
        return runMonitor(message.monitor);
      case 'START_FAST_REFRESH':
        startFastRefresh(message.tabId, message.intervalMs);
        return { ok: true };
      case 'STOP_FAST_REFRESH':
        stopFastRefresh();
        return { ok: true };
      case 'PICKER_START': {
        const hint = await picker.getPickerHint(message.hint);
        picker.startPicker((result) => {
          void sendRuntimeMessage({ type: 'PICKER_RESULT', result });
        }, hint);
        return { ok: true };
      }
      case 'PICKER_CANCEL':
        picker.stopPicker();
        return { ok: true };
      case 'CHECK_CAPTCHA':
        return { found: detectCaptcha() };
      case 'CHECK_ERROR_PAGE':
        return detectErrorPage();
      case 'START_SESSION':
        disarmUserInteraction();
        if (message.session.interactionEnabled) {
          armUserInteraction(message.session.interactionBehavior);
        }
        return { ok: true };
      case 'STOP_SESSION':
        stopFastRefresh();
        hideVisualTimer();
        disarmUserInteraction();
        return { ok: true };
      default:
        return undefined;
    }
  });
}

export function onExecute(): void {
  (globalThis as Record<string, unknown>).__pageRefreshProPicker = pickerApi;

  if ((globalThis as Record<string, unknown>)[CONTENT_SCRIPT_FLAG]) {
    return;
  }
  (globalThis as Record<string, unknown>)[CONTENT_SCRIPT_FLAG] = true;
  registerContentScript();
}

onExecute();
