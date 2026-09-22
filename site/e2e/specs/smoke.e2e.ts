import { expect, test } from '@playwright/test';
import { E2E_DRAFT_ID, seedDrafts } from '../fixtures/draftSeed';
import { stabilizePage } from '../fixtures/stablePage';

test.beforeEach(async ({ page }) => {
  await stabilizePage(page);
});

test('home renders the directory heading and nav', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Discover EVE Frontier dapps' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Builder' })).toBeVisible();
});

test('builder home renders listings header and new-draft action', async ({
  page,
}) => {
  await page.goto('/builder');

  await expect(
    page.getByRole('heading', { name: 'Dapp listings' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'New draft' })).toBeVisible();
});

test('seeded draft appears on the builder home', async ({ page }) => {
  await seedDrafts(page);
  await page.goto('/builder');

  await expect(
    page.getByRole('heading', { name: 'Frontier Fleet Ops' }),
  ).toBeVisible();
  await expect(page.getByText(E2E_DRAFT_ID)).toBeVisible();
});

test('wizard step renders the step navigation for a seeded draft', async ({
  page,
}) => {
  await seedDrafts(page);
  await page.goto(`/builder/listings/${E2E_DRAFT_ID}/discovery`);

  await expect(
    page.getByRole('heading', { level: 1, name: 'Discovery' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Basics/ })).toBeVisible();
});
