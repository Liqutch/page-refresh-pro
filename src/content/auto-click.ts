export async function clickTargets(selectors: string[]): Promise<{ clicked: number; missing: string[] }> {
  let clicked = 0;
  const missing: string[] = [];

  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) {
      missing.push(selector);
      continue;
    }
    element.click();
    clicked += 1;
  }

  return { clicked, missing };
}
