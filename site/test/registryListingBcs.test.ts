import { describe, expect, test } from 'bun:test';
import {
  parseRegistryListingFieldBcs,
  registrySlugFieldId,
} from '../src/chain/registryListingBcs';

const FIELD_ID_BYTES = new Uint8Array(32).fill(0x11);
const OWNER_BYTES = new Uint8Array(32).fill(0x22);
const METADATA_HASH_BYTES = Uint8Array.from(
  { length: 32 },
  (_value, index) => index,
);

/**
 * Hand-encoded `Field<String, DappListing>` bytes.
 *
 * Written without the SDK's BCS helpers on purpose: encoding the layout
 * independently is what makes this a real check of the decoder against the Move
 * struct, rather than a round-trip of one struct definition against itself.
 */
function encodeListingField({
  categories,
  createdAtEpoch = 1n,
  metadataUri,
  slug,
  updatedAtEpoch = 2n,
}: {
  categories: string[];
  createdAtEpoch?: bigint;
  metadataUri: string;
  slug: string;
  updatedAtEpoch?: bigint;
}): Uint8Array {
  const bytes: number[] = [];
  const pushBytes = (values: Uint8Array | number[]) => {
    for (const value of values) bytes.push(value);
  };
  // Lengths are ULEB128; every value here is short enough to be one byte.
  const pushString = (value: string) => {
    const utf8 = new TextEncoder().encode(value);
    if (utf8.length > 127) throw new Error('fixture string too long');
    bytes.push(utf8.length);
    pushBytes(utf8);
  };
  const pushU64 = (value: bigint) => {
    for (let index = 0; index < 8; index++) {
      bytes.push(Number((value >> BigInt(index * 8)) & 0xffn));
    }
  };

  pushBytes(FIELD_ID_BYTES);
  pushString(slug);
  pushBytes(OWNER_BYTES);
  pushString(slug);
  pushString(metadataUri);
  bytes.push(METADATA_HASH_BYTES.length);
  pushBytes(METADATA_HASH_BYTES);
  bytes.push(categories.length);
  for (const category of categories) pushString(category);
  pushU64(createdAtEpoch);
  pushU64(updatedAtEpoch);

  return Uint8Array.from(bytes);
}

describe('parseRegistryListingFieldBcs', () => {
  test('decodes a dynamic field listing', () => {
    const contents = encodeListingField({
      slug: 'frontier-library',
      metadataUri: 'walrus://blob/9qBaT-Jsil6llZUpF7rkAHOdYN9vgpjAyoN133Xz1DA',
      categories: ['build', 'intel'],
    });

    expect(parseRegistryListingFieldBcs(contents)).toEqual({
      owner: `0x${'22'.repeat(32)}`,
      slug: 'frontier-library',
      metadata_uri: 'walrus://blob/9qBaT-Jsil6llZUpF7rkAHOdYN9vgpjAyoN133Xz1DA',
      metadata_hash: [...METADATA_HASH_BYTES],
      categories: ['build', 'intel'],
    });
  });

  test('decodes a listing with a single category', () => {
    const contents = encodeListingField({
      slug: 'test-30-june',
      metadataUri: 'https://example.test/metadata.json',
      categories: ['build'],
    });
    const listing = parseRegistryListingFieldBcs(contents);

    expect(listing?.slug).toBe('test-30-june');
    expect(listing?.categories).toEqual(['build']);
  });

  test('returns null for bytes that are not a listing field', () => {
    expect(parseRegistryListingFieldBcs(new Uint8Array())).toBeNull();
    expect(parseRegistryListingFieldBcs(Uint8Array.of(1, 2, 3))).toBeNull();
  });

  test('returns null when trailing epoch fields are missing', () => {
    const complete = encodeListingField({
      slug: 'truncated',
      metadataUri: 'https://example.test/metadata.json',
      categories: ['build'],
    });

    expect(parseRegistryListingFieldBcs(complete.slice(0, -8))).toBeNull();
  });
});

describe('registrySlugFieldId', () => {
  const registryId = `0x${'ab'.repeat(32)}`;

  test('derives a deterministic object id', () => {
    const first = registrySlugFieldId(registryId, 'frontier-library');
    const second = registrySlugFieldId(registryId, 'frontier-library');

    expect(first).toBe(second);
    expect(first).toMatch(/^0x[0-9a-f]{64}$/);
  });

  test('derives different ids per slug and per registry', () => {
    expect(registrySlugFieldId(registryId, 'slug-one')).not.toBe(
      registrySlugFieldId(registryId, 'slug-two'),
    );
    expect(registrySlugFieldId(registryId, 'slug-one')).not.toBe(
      registrySlugFieldId(`0x${'cd'.repeat(32)}`, 'slug-one'),
    );
  });
});
