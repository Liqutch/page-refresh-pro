const CAPTCHA_SELECTORS = [
  'iframe[src*="recaptcha"]',
  'iframe[src*="hcaptcha"]',
  '.g-recaptcha',
  '.h-captcha',
  '[data-sitekey]',
  '#challenge-form',
  '[class*="cf-challenge"]',
  '[id*="cf-challenge"]',
];

export function detectCaptcha(): boolean {
  return CAPTCHA_SELECTORS.some((selector) => Boolean(document.querySelector(selector)));
}
