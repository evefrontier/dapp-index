import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { applyDevCatalogFixtures } from '@/content/devCatalogFixtures';
import { resolveDevCatalogMediaUrl } from '@/content/devCatalogMediaUrls';
import { resolveWalrusBlobReadUrl } from '@/directory/resolveWalrusMediaUrl';

// Fixture data and the Walrus read path are both off by default. Enable them
// only for these cases and restore afterwards so file order cannot leak either
// flag into the defaults asserted by environmentFlags.test.ts.
beforeAll(() => {
  process.env.VITE_ENABLE_FIXTURE_DATA = 'true';
  process.env.VITE_ENABLE_WALRUS = 'true';
});

afterAll(() => {
  delete process.env.VITE_ENABLE_FIXTURE_DATA;
  delete process.env.VITE_ENABLE_WALRUS;
});

const onChainEntries = [
  { id: 'frontier-library', name: 'Sparse on-chain entry' },
  { id: 'other-listing', name: 'Other listing' },
] as never[];

describe('dev catalog fixtures', () => {
  test('overrides known slugs with rich dev entries when fixtures are enabled', () => {
    const merged = applyDevCatalogFixtures(onChainEntries);

    const frontier = merged.find((entry) => entry.id === 'frontier-library');
    const other = merged.find((entry) => entry.id === 'other-listing');

    expect(frontier?.name).toBe('Frontier Library');
    expect(frontier?.notes).toContain('Temporary dev fixture');
    expect(other?.name).toBe('Other listing');
  });

  test('maps dev fixture blob ids to local media urls', () => {
    expect(resolveDevCatalogMediaUrl('dev-frontier-thumbnail')).toBe(
      '/dev-catalog/eve-frontier-dashboard.png',
    );
    expect(resolveWalrusBlobReadUrl('walrus://blob/dev-frontier-thumbnail')).toBe(
      '/dev-catalog/eve-frontier-dashboard.png',
    );
  });
});
