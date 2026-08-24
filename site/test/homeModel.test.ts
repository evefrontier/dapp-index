import { describe, expect, test } from 'bun:test';
import { createHomeDraftItem } from '../src/builder/homeModel';
import type { Draft } from '../src/storage/draftStorage';

function createDraft(overrides: Partial<Draft> = {}): Draft {
  return {
    id: 'draft-1',
    status: 'draft',
    currentStep: 'about',
    completedSteps: ['basics'],
    createdAt: '2026-05-18T12:00:00.000Z',
    updatedAt: '2026-05-18T12:00:00.000Z',
    fields: { name: 'Frontier Map', slug: 'frontier-map' },
    media: [],
    ...overrides,
  };
}

describe('createHomeDraftItem', () => {
  test('labels an unpublished draft as a plain delete', () => {
    const item = createHomeDraftItem(createDraft());

    expect(item.isPublished).toBe(false);
    expect(item.statusLabel).toBe('Step: About');
    expect(item.deleteLabel).toBe('Delete');
    expect(item.deleteConfirmMessage).toBe('Delete this draft?');
  });

  test('scopes deletion of a published draft to the local copy', () => {
    const item = createHomeDraftItem(
      createDraft({ status: 'published', currentStep: 'publish' }),
    );

    expect(item.isPublished).toBe(true);
    expect(item.statusLabel).toBe('Published');
    expect(item.deleteLabel).toBe('Remove local copy');
    expect(item.deleteConfirmMessage).toContain(
      'on-chain listing is not affected',
    );
  });

  test('falls back through name, slug, then a placeholder title', () => {
    expect(createHomeDraftItem(createDraft()).title).toBe('Frontier Map');
    expect(
      createHomeDraftItem(createDraft({ fields: { slug: 'frontier-map' } }))
        .title,
    ).toBe('frontier-map');
    expect(createHomeDraftItem(createDraft({ fields: {} })).title).toBe(
      'Untitled draft',
    );
  });

  test('reports an unparseable timestamp rather than a bogus date', () => {
    expect(
      createHomeDraftItem(createDraft({ updatedAt: 'not-a-date' }))
        .updatedAtLabel,
    ).toBe('Unknown');
  });
});
