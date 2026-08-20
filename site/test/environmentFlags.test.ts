import { describe, expect, test } from 'bun:test';
import { viteFixtureDataEnabled, viteWalrusEnabled } from '@/chain/env';
import { applyDevCatalogFixtures } from '@/content/devCatalogFixtures';
import { resolveDevCatalogMediaUrl } from '@/content/devCatalogMediaUrls';
import { resolveWalrusBlobReadUrl } from '@/directory/resolveWalrusMediaUrl';

/**
 * The `test` and `live` environments leave both flags unset. These cases pin
 * that default: chain/S3 data only, and no Walrus network reads.
 */
describe('environment flags default to off', () => {
  test('both flags are off when unset', () => {
    expect(viteFixtureDataEnabled()).toBe(false);
    expect(viteWalrusEnabled()).toBe(false);
  });

  test('fixtures are not merged into the catalog', () => {
    const onChain = [{ id: 'frontier-library', name: 'On-chain name' }] as never[];

    expect(applyDevCatalogFixtures(onChain)).toEqual(onChain);
    expect(resolveDevCatalogMediaUrl('dev-frontier-thumbnail')).toBeNull();
  });

  test('walrus blob URIs do not resolve to an aggregator', () => {
    expect(resolveWalrusBlobReadUrl('walrus://blob/someBlobId')).toBeNull();
  });

  test('https CDN media still resolves with walrus disabled', () => {
    const cdnUrl = 'https://dapp-media.evefrontier.com/testnet/0xabc/thumb.webp';

    expect(resolveWalrusBlobReadUrl(cdnUrl)).toBe(cdnUrl);
  });
});
