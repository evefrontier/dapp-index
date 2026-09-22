import { describe, expect, test } from 'bun:test';
import { isValidNamedPackage } from '@mysten/sui/utils';
import registryEntrySchema from '../../registry/schema/registry-entry.schema.json';
import { isValidMvrName } from '../src/chain/moveRegistry';
import {
  DAPP_INDEX_METADATA_SCHEMA,
  DAPP_INDEX_METADATA_SCHEMA_VERSION,
} from '../src/constants';
import { validateRegistryMetadataJson } from '../src/utils/registryMetadata';

const baseEntry = {
  schema: DAPP_INDEX_METADATA_SCHEMA,
  schemaVersion: DAPP_INDEX_METADATA_SCHEMA_VERSION,
  id: 'frontier-map',
  name: 'Frontier Map',
  summary: 'A map for Frontier pilots.',
  categories: ['intel'],
  liveUrl: 'https://example.com',
  serverTenant: 'stillness',
};

const packageEntry = {
  network: 'mainnet',
  role: 'core',
  mvrName: '@frontier/map',
  packageId:
    '0x2222222222222222222222222222222222222222222222222222222222222222',
  packageInfoId:
    '0x3333333333333333333333333333333333333333333333333333333333333333',
  modules: ['map'],
};

describe('registry metadata MVR package shape', () => {
  test('keeps MVR name validation aligned with the Sui SDK', () => {
    for (const name of [
      '@frontier/map',
      'frontier.sui/map',
      'team.frontier.sui/map',
      'team@frontier/map',
      '@frontier/my-app',
      '@frontier/my_app',
      '@frontier/a/0',
      '@frontier/a/01',
    ]) {
      expect(isValidMvrName(name)).toBe(isValidNamedPackage(name));
      expect(validateRegistryMetadataJson({
        ...baseEntry,
        suiPackages: [{ ...packageEntry, mvrName: name }],
      }).ok).toBe(isValidNamedPackage(name));
    }
  });

  test('allows listings without Sui packages', () => {
    expect(validateRegistryMetadataJson(baseEntry).ok).toBe(true);

    expect(
      validateRegistryMetadataJson({
        ...baseEntry,
        packageIds: [
          '0x1111111111111111111111111111111111111111111111111111111111111111',
        ],
      }).ok,
    ).toBe(false);
  });

  test('accepts package ID only and optional Move Registry identity fields', () => {
    expect(
      validateRegistryMetadataJson({
        ...baseEntry,
        suiPackages: [
          {
            network: 'mainnet',
            role: 'core',
            packageId: packageEntry.packageId,
          },
        ],
      }).ok,
    ).toBe(true);

    expect(
      validateRegistryMetadataJson({
        ...baseEntry,
        suiPackages: [packageEntry],
      }).ok,
    ).toBe(true);
  });

  test('rejects maintainer because package contact metadata belongs in MVR', () => {
    expect(
      validateRegistryMetadataJson({
        ...baseEntry,
        maintainer: 'Frontier Guild',
      }).ok,
    ).toBe(false);
  });
});
