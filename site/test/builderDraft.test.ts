import { describe, expect, test } from 'bun:test';
import { createRegistrationDraft } from '../src/builder/registrationDraft';
import {
  BUILDER_TUTORIAL_STORAGE_KEY,
  builderTutorialPreference,
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
    const storage = createMemoryLocalStorage();

    expect(builderTutorialPreference.read({ storage }).skipped).toBe(false);

    builderTutorialPreference.skip({ storage });

    expect(builderTutorialPreference.read({ storage }).skipped).toBe(true);
    expect(storage.getItem(BUILDER_TUTORIAL_STORAGE_KEY)).toBe('true');

    builderTutorialPreference.show({ storage });

    expect(builderTutorialPreference.read({ storage }).skipped).toBe(false);
    expect(storage.getItem(BUILDER_TUTORIAL_STORAGE_KEY)).toBeNull();
  });

  test('fails closed when tutorial storage reads are unavailable', () => {
    const storage = {
      getItem: () => {
        throw new Error('storage denied');
      },
      setItem: () => {},
      removeItem: () => {},
    };

    expect(builderTutorialPreference.read({ storage }).skipped).toBe(false);
  });

  test('ignores tutorial storage write failures', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('storage denied');
      },
      removeItem: () => {
        throw new Error('storage denied');
      },
    };

    expect(() => builderTutorialPreference.skip({ storage })).not.toThrow();
    expect(() => builderTutorialPreference.show({ storage })).not.toThrow();
  });
});
