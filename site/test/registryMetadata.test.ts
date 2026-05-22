import { describe, expect, test } from 'bun:test';
import {
  DAPP_INDEX_METADATA_SCHEMA,
  DAPP_INDEX_METADATA_SCHEMA_VERSION,
} from '../src/constants';
import { validateRegistryMetadataJson } from '../src/utils/registryMetadata';

const validEntry = {
  schema: DAPP_INDEX_METADATA_SCHEMA,
  schemaVersion: DAPP_INDEX_METADATA_SCHEMA_VERSION,
  id: 'frontier-map',
  name: 'Frontier Map',
  summary: 'A map for Frontier pilots.',
  categories: ['intel'],
  suiPackages: [
    {
      network: 'mainnet',
      role: 'core',
      mvrName: '@frontier/map',
      packageId:
        '0x2222222222222222222222222222222222222222222222222222222222222222',
      packageInfoId:
        '0x3333333333333333333333333333333333333333333333333333333333333333',
    },
  ],
  liveUrl: 'https://example.com',
  serverTenant: 'stillness',
};

describe('registry metadata schema', () => {
  test('accepts a minimal valid registry entry', () => {
    expect(validateRegistryMetadataJson(validEntry).ok).toBe(true);
  });

  test('rejects invalid slugs and unknown categories', () => {
    expect(
      validateRegistryMetadataJson({
        ...validEntry,
        id: 'Frontier Map',
      }).ok,
    ).toBe(false);

    expect(
      validateRegistryMetadataJson({
        ...validEntry,
        categories: ['unknown'],
      }).ok,
    ).toBe(false);
  });
});
