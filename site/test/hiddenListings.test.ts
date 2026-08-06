import { describe, expect, test } from 'bun:test';
import {
  applyHiddenListings,
  parseHiddenListingsDocument,
  hiddenSlugSetFromDocument,
  getHiddenListingSlugs,
} from '../src/content/hiddenListings';
import { listDirectoryTestFixtures } from './directoryTestFixtures';

describe('hiddenListings', () => {
  test('parses a valid document and builds a slug set', () => {
    const document = parseHiddenListingsDocument({
      hidden: [
        {
          slug: 'bad-dapp',
          reason: 'inappropriate media',
          hiddenAt: '2026-08-05',
          hiddenBy: '@lead-builder',
        },
      ],
    });

    expect(document.hidden).toHaveLength(1);
    expect([...hiddenSlugSetFromDocument(document)]).toEqual(['bad-dapp']);
  });

  test('rejects an invalid document shape', () => {
    expect(() =>
      parseHiddenListingsDocument({
        hidden: [{ slug: 'Bad_Slug', reason: 'x' }],
      }),
    ).toThrow();

    expect(() => parseHiddenListingsDocument({ hidden: 'nope' })).toThrow();
    expect(() => parseHiddenListingsDocument({})).toThrow();
  });

  test('hard-hides matching listing ids and leaves others', () => {
    const entries = listDirectoryTestFixtures();
    const hidden = new Set(['frontier-library']);

    const visible = applyHiddenListings(entries, hidden).map(
      (entry) => entry.id,
    );

    expect(visible).not.toContain('frontier-library');
    expect(visible.length).toBe(entries.length - 1);
    expect(visible).toEqual(
      entries
        .filter((entry) => entry.id !== 'frontier-library')
        .map((entry) => entry.id),
    );
  });

  test('returns a copy when the denylist is empty', () => {
    const entries = listDirectoryTestFixtures();
    const visible = applyHiddenListings(entries, new Set());

    expect(visible).toEqual(entries);
    expect(visible).not.toBe(entries);
  });

  test('shipped hiddenListings.json parses and starts empty', () => {
    expect(getHiddenListingSlugs().size).toBe(0);
  });
});
