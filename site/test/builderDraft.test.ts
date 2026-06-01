import { describe, expect, test } from 'bun:test';
import { createRegistrationDraft } from '../src/builder/registrationDraft';
import {
  BUILDER_TUTORIAL_STORAGE_KEY,
  getBuilderTutorialSkipped,
  setBuilderTutorialSkipped,
} from '../src/builder/tutorialStorage';
import { createMemoryLocalStorage } from '../src/storage/draftStorage';

describe('builder draft helpers', () => {
  test('creates a new registration draft at the first wizard step', () => {
    const draft = createRegistrationDraft({
      id: 'draft-123',
      now: () => new Date('2026-05-19T09:00:00.000Z'),
    });

    expect(draft).toEqual({
      id: 'draft-123',
      status: 'draft',
      currentStep: 'profile',
      completedSteps: [],
      createdAt: '2026-05-19T09:00:00.000Z',
      updatedAt: '2026-05-19T09:00:00.000Z',
      fields: {},
      media: [],
    });
  });

  test('uses crypto.randomUUID when a draft id is not supplied', () => {
    const draft = createRegistrationDraft({
      randomUUID: () => 'generated-id',
      now: () => new Date('2026-05-19T09:15:00.000Z'),
    });

    expect(draft.id).toBe('generated-id');
  });

  test('stores the builder tutorial skip flag separately from drafts', () => {
    const localStorage = createMemoryLocalStorage();

    expect(getBuilderTutorialSkipped({ localStorage })).toBe(false);

    setBuilderTutorialSkipped(true, { localStorage });

    expect(getBuilderTutorialSkipped({ localStorage })).toBe(true);
    expect(localStorage.getItem(BUILDER_TUTORIAL_STORAGE_KEY)).toBe('true');

    setBuilderTutorialSkipped(false, { localStorage });

    expect(getBuilderTutorialSkipped({ localStorage })).toBe(false);
    expect(localStorage.getItem(BUILDER_TUTORIAL_STORAGE_KEY)).toBeNull();
  });
});
