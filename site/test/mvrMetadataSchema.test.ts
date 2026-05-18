import { describe, expect, test } from 'bun:test';
import { validateRegistryMetadataJson } from '../src/utils/registryMetadata';

const baseEntry = {
  id: 'frontier-map',
  name: 'Frontier Map',
  summary: 'A map for Frontier pilots.',
  categories: ['intel'],
  liveUrl: 'https://example.com',
  serverTenant: 'stillness',
};

const corePackage = {
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
  test('requires at least one core Sui package with Move Registry identity', () => {
    expect(validateRegistryMetadataJson(baseEntry).ok).toBe(false);

    expect(
      validateRegistryMetadataJson({
        ...baseEntry,
        packageIds: [
          '0x1111111111111111111111111111111111111111111111111111111111111111',
        ],
      }).ok,
    ).toBe(false);

    expect(
      validateRegistryMetadataJson({
        ...baseEntry,
        suiPackages: [corePackage],
      }).ok,
    ).toBe(true);
  });

  test('rejects package lists without a core package', () => {
    expect(
      validateRegistryMetadataJson({
        ...baseEntry,
        suiPackages: [
          {
            network: 'testnet',
            role: 'dependency',
            mvrName: '@frontier/library',
            packageId:
              '0x4444444444444444444444444444444444444444444444444444444444444444',
            packageInfoId:
              '0x5555555555555555555555555555555555555555555555555555555555555555',
          },
        ],
      }).ok,
    ).toBe(false);
  });

  test('rejects maintainer because package contact metadata belongs in MVR', () => {
    expect(
      validateRegistryMetadataJson({
        ...baseEntry,
        maintainer: 'Frontier Guild',
        suiPackages: [corePackage],
      }).ok,
    ).toBe(false);
  });
});
