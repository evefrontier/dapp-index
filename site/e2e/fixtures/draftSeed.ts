import type { Page } from '@playwright/test';
import { DRAFT_STORAGE_KEY, type Draft } from '../../src/storage/draftTypes';

/**
 * Deterministic draft used by builder/wizard screenshots. Fixed timestamps keep
 * the "Updated:" label stable (paired with the config's UTC + en-US locale).
 */
export const E2E_DRAFT_ID = 'e2e-draft';

export const e2eDraft: Draft = {
  id: E2E_DRAFT_ID,
  status: 'draft',
  currentStep: 'discovery',
  completedSteps: ['basics', 'about'],
  createdAt: '2026-01-02T09:00:00.000Z',
  updatedAt: '2026-01-02T09:30:00.000Z',
  fields: {
    name: 'Frontier Fleet Ops',
    slug: 'frontier-fleet-ops',
    summary:
      'Coordinate haulers, gates, and turret coverage across your constellation.',
    description:
      'Frontier Fleet Ops centralizes logistics for industrial tribes: plan hauling runs, track gate tolls, and monitor turret coverage from one dashboard.',
    liveUrl: 'https://fleet-ops.example.com',
    repositoryUrl: 'https://github.com/example/fleet-ops',
    documentationUrl: 'https://docs.example.com/fleet-ops',
    categories: ['logistics', 'infrastructure'],
    smartAssemblyTypes: ['gate', 'turret'],
    serverTenant: 'stillness',
  },
  media: [],
};

function toDraftRecord(drafts: readonly Draft[]): Record<string, Draft> {
  const record: Record<string, Draft> = {};
  for (const draft of drafts) {
    record[draft.id] = draft;
  }
  return record;
}

/**
 * Seed drafts into `localStorage` before any app script runs, so the builder
 * reads them on first render. Call before `page.goto`.
 */
export async function seedDrafts(
  page: Page,
  drafts: readonly Draft[] = [e2eDraft],
): Promise<void> {
  const payload = { key: DRAFT_STORAGE_KEY, value: JSON.stringify(toDraftRecord(drafts)) };
  await page.addInitScript((data) => {
    window.localStorage.setItem(data.key, data.value);
  }, payload);
}
