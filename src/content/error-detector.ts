const ERROR_PATTERNS = [
  /404/i,
  /not found/i,
  /page not found/i,
  /site can't be reached/i,
  /err_internet_disconnected/i,
  /err_name_not_resolved/i,
  /offline/i,
];

export function detectErrorPage(): { found: boolean; reason?: string } {
  const text = `${document.title}\n${document.body?.innerText ?? ''}`;
  const pattern = ERROR_PATTERNS.find((candidate) => candidate.test(text));
  return pattern
    ? { found: true, reason: `Eşleşen hata göstergesi: ${pattern.source}` }
    : { found: false };
}
