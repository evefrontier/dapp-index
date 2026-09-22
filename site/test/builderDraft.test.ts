import { describe, expect, test } from 'bun:test';
import { createHomeDraftItem } from '../src/builder/homeModel';
import { createRegistrationDraft } from '../src/builder/registrationDraft';
import {
  TUTORIAL_STORAGE_KEY,
  tutorialPreference,
} from '../src/builder/tutorialStorage';
import { createMemoryLocalStorage } from '../src/storage/draftStorage';
import { draft } from './draftTestUtils';

describe('builder draft helpers', () => {
  test('creates a new registration draft at the first wizard step', () => {
    const draft = createRegistrationDraft({
      id: 'draft-123',
      now: () => new Date('2026-05-19T09:00:00.000Z'),
    });

    expect(draft).toEqual({
      id: 'draft-123',
      status: 'draft',
      currentStep: 'basics',
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

  test('formats draft home items with user-facing step labels', () => {
    expect(
      createHomeDraftItem({
        ...draft,
        currentStep: 'publish',
      }),
    ).toMatchObject({
      currentStep: 'publish',
      currentStepLabel: 'Publish',
      isPublished: false,
      statusLabel: 'Step: Publish',
      title: 'Frontier Map',
    });
  });

  test('marks published drafts as read-only records on the home list', () => {
    expect(
      createHomeDraftItem({
        ...draft,
        status: 'published',
        currentStep: 'publish',
      }),
    ).toMatchObject({
      isPublished: true,
      statusLabel: 'Published',
    });
  });

  test('stores the builder tutorial skip flag separately from drafts', () => {
    const storage = createMemoryLocalStorage();

    expect(tutorialPreference.read({ storage }).skipped).toBe(false);

    tutorialPreference.skip({ storage });

    expect(tutorialPreference.read({ storage }).skipped).toBe(true);
    expect(storage.getItem(TUTORIAL_STORAGE_KEY)).toBe('true');

    tutorialPreference.show({ storage });

    expect(tutorialPreference.read({ storage }).skipped).toBe(false);
    expect(storage.getItem(TUTORIAL_STORAGE_KEY)).toBeNull();
  });

  test('fails closed when tutorial storage reads are unavailable', () => {
    const storage = {
      getItem: () => {
        throw new Error('storage denied');
      },
      setItem: () => {},
      removeItem: () => {},
    };

    expect(tutorialPreference.read({ storage }).skipped).toBe(false);
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

    expect(() => tutorialPreference.skip({ storage })).not.toThrow();
    expect(() => tutorialPreference.show({ storage })).not.toThrow();
  });
});
