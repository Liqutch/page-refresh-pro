import { RuntimeMessage } from './types';

const PING_TIMEOUT_MS = 3000;
const PING_INTERVAL_MS = 100;

export function isRestrictedTabUrl(url: string | undefined): boolean {
  if (!url) {
    return true;
  }
  const blockedPrefixes = ['chrome://', 'chrome-extension://', 'edge://', 'about:', 'devtools://', 'view-source:'];
  return blockedPrefixes.some((prefix) => url.startsWith(prefix));
}

export function getOriginPatterns(url: string): string[] {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return [`${parsed.protocol}//${parsed.host}/*`];
    }
    if (parsed.protocol === 'file:') {
      return ['file:///*'];
    }
  } catch {
    return [];
  }
  return [];
}

export async function hasOriginPermission(url: string): Promise<boolean> {
  const origins = getOriginPatterns(url);
  if (!origins.length) {
    return false;
  }
  return chrome.permissions.contains({ origins });
}

export async function ensureOriginPermission(url: string): Promise<boolean> {
  const origins = getOriginPatterns(url);
  if (!origins.length) {
    return false;
  }

  const hasPermission = await chrome.permissions.contains({ origins });
  if (hasPermission) {
    return true;
  }

  try {
    return await chrome.permissions.request({ origins });
  } catch {
    return false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function sendTabMessage<TResponse = unknown>(
  tabId: number,
  message: RuntimeMessage,
): Promise<TResponse | null> {
  try {
    return (await chrome.tabs.sendMessage(tabId, message)) as TResponse;
  } catch {
    return null;
  }
}

export async function waitForTabPing(tabId: number): Promise<boolean> {
  const deadline = Date.now() + PING_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const response = await sendTabMessage<{ ok: boolean }>(tabId, { type: 'PING' });
    if (response?.ok) {
      return true;
    }
    await delay(PING_INTERVAL_MS);
  }
  return false;
}

export async function ensureTabContentScript(tabId: number): Promise<boolean> {
  await injectContentScriptFiles(tabId);
  const ready = await waitForTabPing(tabId);
  return ready;
}

async function injectContentScriptFiles(tabId: number): Promise<void> {
  const manifest = chrome.runtime.getManifest();
  const files = manifest.content_scripts?.[0]?.js;
  if (!files?.length) {
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [...files],
    });
  } catch {
    // Script may already be present; global picker API is still refreshed on execute.
  }
}

export async function sendTabMessageEnsured<TResponse = unknown>(
  tabId: number,
  message: RuntimeMessage,
): Promise<TResponse | null> {
  const ready = await ensureTabContentScript(tabId);
  if (!ready) {
    return null;
  }
  return sendTabMessage<TResponse>(tabId, message);
}

export async function sendRuntimeMessage<TResponse = unknown>(
  message: RuntimeMessage,
): Promise<TResponse> {
  return chrome.runtime.sendMessage(message) as Promise<TResponse>;
}

export function onRuntimeMessage(
  handler: (
    message: RuntimeMessage,
    sender: chrome.runtime.MessageSender,
  ) => Promise<unknown> | unknown,
): void {
  chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
    Promise.resolve(handler(message, sender))
      .then(sendResponse)
      .catch((error: unknown) => {
        console.error(error);
        sendResponse({ ok: false, error: String(error) });
      });
    return true;
  });
}
