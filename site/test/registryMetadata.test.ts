import { describe, expect, test } from 'bun:test';
import { validateRegistryMetadataJson } from '../src/utils/registryMetadata';

const validEntry = {
  id: 'frontier-map',
  name: 'Frontier Map',
  summary: 'A map for Frontier pilots.',
  categories: ['intel'],
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
