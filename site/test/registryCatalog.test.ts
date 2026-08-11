import { describe, expect, test } from 'bun:test';
import { bcs } from '@mysten/sui/bcs';
import {
  fetchOnChainCatalogEntries,
  type CatalogDynamicFieldPage,
} from '../src/chain/registryCatalog';
import { parseDappListingBcs } from '../src/chain/registryListingBcs';

const OWNER_BYTES = new Uint8Array(32).fill(0x22);
const METADATA_HASH_BYTES = Uint8Array.from(
  { length: 32 },
  (_value, index) => index,
);

function encodeDappListing({
  categories,
  metadataUri,
  slug,
}: {
  categories: string[];
  metadataUri: string;
  slug: string;
}): Uint8Array {
  return bcs
    .struct('DappListing', {
      owner: bcs.Address,
      slug: bcs.String,
      metadata_uri: bcs.String,
      metadata_hash: bcs.vector(bcs.u8()),
      categories: bcs.vector(bcs.String),
      created_at_epoch: bcs.u64(),
      updated_at_epoch: bcs.u64(),
    })
    .serialize({
      owner: `0x${Buffer.from(OWNER_BYTES).toString('hex')}`,
      slug,
      metadata_uri: metadataUri,
      metadata_hash: [...METADATA_HASH_BYTES],
      categories,
      created_at_epoch: 1n,
      updated_at_epoch: 2n,
    })
    .toBytes();
}

describe('parseDappListingBcs', () => {
  test('decodes a bare listing value', () => {
    const contents = encodeDappListing({
      slug: 'route-planner',
      metadataUri: 'https://cdn.example/testnet/0x/demo/metadata.json',
      categories: ['build'],
    });

    expect(parseDappListingBcs(contents)).toEqual({
      owner: `0x${'22'.repeat(32)}`,
      slug: 'route-planner',
      metadata_uri: 'https://cdn.example/testnet/0x/demo/metadata.json',
      metadata_hash: [...METADATA_HASH_BYTES],
      categories: ['build'],
    });
  });
});

describe('fetchOnChainCatalogEntries', () => {
  test('returns empty when registry env is missing and no injectables are provided', async () => {
    expect(await fetchOnChainCatalogEntries()).toEqual([]);
  });

  test('hydrates entries from gRPC dynamic field values and HTTPS metadata', async () => {
    const listingBytes = encodeDappListing({
      slug: 'route-planner',
      metadataUri: 'https://cdn.example/testnet/0x/demo/metadata.json',
      categories: ['build'],
    });

    const page: CatalogDynamicFieldPage = {
      dynamicFields: [{ value: { type: 'DappListing', bcs: listingBytes } }],
      cursor: null,
      hasNextPage: false,
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input) => {
      expect(String(input)).toBe(
        'https://cdn.example/testnet/0x/demo/metadata.json',
      );
      return new Response(
        JSON.stringify({
          schema: 'evefrontier.dapp-index.metadata',
          schemaVersion: 1,
          id: 'route-planner',
          name: 'Route Planner',
          summary: 'Plans routes.',
          categories: ['build'],
          liveUrl: 'https://route-planner.example',
          serverTenant: 'stillness',
          suiPackages: [],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }) as typeof fetch;

    try {
      const entries = await fetchOnChainCatalogEntries({
        registryId: `0x${'81'.repeat(32)}`,
        listDynamicFields: async () => page,
      });

      expect(entries).toEqual([
        expect.objectContaining({
          id: 'route-planner',
          name: 'Route Planner',
          metadataUri: 'https://cdn.example/testnet/0x/demo/metadata.json',
          registryOwner: `0x${'22'.repeat(32)}`,
        }),
      ]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
