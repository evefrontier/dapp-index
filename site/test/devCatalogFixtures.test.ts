import { describe, expect, test } from 'bun:test';
import { applyDevCatalogFixtures } from '@/content/devCatalogFixtures';
import { resolveDevCatalogMediaUrl } from '@/content/devCatalogMediaUrls';
import { resolveWalrusBlobReadUrl } from '@/directory/resolveWalrusMediaUrl';

describe('dev catalog fixtures', () => {
  test('overrides known slugs with rich dev entries in development', () => {
    const merged = applyDevCatalogFixtures([
      {
        id: 'frontier-library',
        name: 'Sparse on-chain entry',
      } as never,
      {
        id: 'other-listing',
        name: 'Other listing',
      } as never,
    ]);

    const frontier = merged.find((entry) => entry.id === 'frontier-library');
    const other = merged.find((entry) => entry.id === 'other-listing');

    if (!import.meta.env.DEV) {
      expect(frontier?.name).toBe('Sparse on-chain entry');
      expect(other?.name).toBe('Other listing');
      return;
    }

    expect(frontier?.name).toBe('Frontier Library');
    expect(frontier?.notes).toContain('Temporary dev fixture');
    expect(other?.name).toBe('Other listing');
  });

  test('maps dev fixture blob ids to local media urls in development', () => {
    if (!import.meta.env.DEV) return;

    expect(resolveDevCatalogMediaUrl('dev-frontier-thumbnail')).toBe(
      '/dev-catalog/eve-frontier-dashboard.png',
    );
    expect(resolveWalrusBlobReadUrl('walrus://blob/dev-frontier-thumbnail')).toBe(
      '/dev-catalog/eve-frontier-dashboard.png',
    );
  });
});
