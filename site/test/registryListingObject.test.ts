import { describe, expect, test } from 'bun:test';
import { parseRegistryListingObject } from '../src/chain/registryListingObject';

const owner =
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

describe('parseRegistryListingObject', () => {
  test('parses direct listing fields from a move object', () => {
    const listing = parseRegistryListingObject({
      data: {
        content: {
          dataType: 'moveObject',
          fields: {
            owner,
            slug: 'frontier-library',
            metadata_uri: 'https://example.test/metadata.json',
            metadata_hash: [1, 2, 3],
            categories: ['build'],
          },
        },
      },
    });

    expect(listing).toEqual({
      owner,
      slug: 'frontier-library',
      metadata_uri: 'https://example.test/metadata.json',
      metadata_hash: [1, 2, 3],
      categories: ['build'],
    });
  });

  test('parses nested dynamic-field listing wrappers', () => {
    const listing = parseRegistryListingObject({
      data: {
        content: {
          dataType: 'moveObject',
          fields: {
            value: {
              fields: {
                owner,
                slug: { bytes: btoa('nested-slug') },
                metadata_uri: 'https://example.test/nested.json',
                metadata_hash: [9],
                categories: [{ bytes: btoa('play') }],
              },
            },
          },
        },
      },
    });

    expect(listing).toEqual({
      owner,
      slug: 'nested-slug',
      metadata_uri: 'https://example.test/nested.json',
      metadata_hash: [9],
      categories: ['play'],
    });
  });

  test('returns null for malformed listing objects', () => {
    expect(parseRegistryListingObject({})).toBeNull();
    expect(
      parseRegistryListingObject({
        data: {
          content: {
            dataType: 'moveObject',
            fields: {
              owner,
              slug: 'missing-fields',
            },
          },
        },
      }),
    ).toBeNull();
  });
});
