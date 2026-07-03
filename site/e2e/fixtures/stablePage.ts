import type { Locator, Page } from '@playwright/test';

const DISABLE_MOTION_CSS = `
*, *::before, *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
  scroll-behavior: auto !important;
  caret-color: transparent !important;
}
`;

/**
 * Disable animations/transitions before app scripts run. Complements the
 * config's `animations: 'disabled'` for elements toggled during hydration.
 */
export async function stabilizePage(page: Page): Promise<void> {
  await page.addInitScript((css) => {
    const injectStyle = () => {
      const style = document.createElement('style');
      style.setAttribute('data-e2e-stabilize', '');
      style.textContent = css;
      (document.head ?? document.documentElement).appendChild(style);
    };
    if (document.head) {
      injectStyle();
    } else {
      document.addEventListener('DOMContentLoaded', injectStyle, { once: true });
    }
  }, DISABLE_MOTION_CSS);
}

/** Wait for web fonts so text metrics are stable before capturing. */
export async function waitForFonts(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

/**
 * Chain identifier readout hits a live RPC and cycles through
 * loading/error/success text, so mask it in screenshots.
 */
export function chainReadoutMask(page: Page): Locator {
  return page.locator('.ds-type-caption, .ds-type-caption-error');
}
