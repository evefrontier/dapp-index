import { expect, test, type Page } from '@playwright/test';
import { E2E_DRAFT_ID, seedDrafts } from '../fixtures/draftSeed';
import { chainReadoutMask, stabilizePage, waitForFonts } from '../fixtures/stablePage';

test.beforeEach(async ({ page }) => {
  await stabilizePage(page);
});

async function captureFullPage(
  page: Page,
  name: string,
  options: { mask?: ReturnType<typeof chainReadoutMask>[] } = {},
): Promise<void> {
  await waitForFonts(page);
  await expect(page).toHaveScreenshot(name, {
    fullPage: true,
    mask: options.mask,
  });
}

test('index', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Discover EVE Frontier dapps' }),
  ).toBeVisible();
  // Let the chain readout settle out of its loading state so the masked box
  // has a stable size, then mask it (its value is RPC-dependent).
  const readout = chainReadoutMask(page);
  await expect(readout).toBeVisible();
  await expect(readout).not.toContainText('loading', { timeout: 15_000 });
  await captureFullPage(page, 'index.png', { mask: [readout] });
});

test('builder-home-empty', async ({ page }) => {
  await page.goto('/builder');
  await expect(
    page.getByRole('heading', { name: 'Dapp listings' }),
  ).toBeVisible();
  await expect(page.getByText('No drafts yet.')).toBeVisible();
  await captureFullPage(page, 'builder-home-empty.png');
});

test('builder-home-with-draft', async ({ page }) => {
  await seedDrafts(page);
  await page.goto('/builder');
  await expect(
    page.getByRole('heading', { name: 'Frontier Fleet Ops' }),
  ).toBeVisible();
  await captureFullPage(page, 'builder-home-with-draft.png');
});

const WIZARD_STEPS = ['basics', 'about', 'discovery', 'packages'] as const;

for (const step of WIZARD_STEPS) {
  const label = step.charAt(0).toUpperCase() + step.slice(1);

  test(`wizard-${step}`, async ({ page }) => {
    await seedDrafts(page);
    await page.goto(`/builder/listings/${E2E_DRAFT_ID}/${step}`);
    await expect(
      page.getByRole('heading', { level: 1, name: label }),
    ).toBeVisible();
    await captureFullPage(page, `wizard-${step}.png`);
  });
}
