export function getOriginPattern(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return `${parsed.origin}/*`;
  } catch {
    return null;
  }
}

export async function hasSiteAccess(url: string): Promise<boolean> {
  const pattern = getOriginPattern(url);
  if (!pattern) {
    return false;
  }
  return (
    (await chrome.permissions.contains({ origins: [pattern] })) ||
    (await chrome.permissions.contains({ origins: ['<all_urls>'] }))
  );
}

export async function ensureSiteAccess(url: string): Promise<boolean> {
  if (await hasSiteAccess(url)) {
    return true;
  }

  const pattern = getOriginPattern(url);
  if (!pattern) {
    return false;
  }

  try {
    return await chrome.permissions.request({ origins: [pattern] });
  } catch {
    return false;
  }
}
