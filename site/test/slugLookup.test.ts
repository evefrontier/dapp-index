import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { registrySlugFieldId } from '../src/chain/registryListingBcs';
import type { RegistryObjectReader } from '../src/chain/registryObjectReader';
import { lookupRegistrySlug } from '../src/chain/slugLookup';

const PACKAGE_ID = `0x${'11'.repeat(32)}`;
const REGISTRY_ID = `0x${'ab'.repeat(32)}`;
const OWNER = `0x${'22'.repeat(32)}`;

function listingContents(slug: string): Uint8Array {
  const bytes: number[] = [];
  const pushBytes = (values: Uint8Array | number[]) => {
    for (const value of values) bytes.push(value);
  };
  const pushString = (value: string) => {
    const utf8 = new TextEncoder().encode(value);
    bytes.push(utf8.length);
    pushBytes(utf8);
  };

  pushBytes(new Uint8Array(32).fill(0x33));
  pushString(slug);
  pushBytes(new Uint8Array(32).fill(0x22));
  pushString(slug);
  pushString('https://example.test/metadata.json');
  bytes.push(32);
  pushBytes(new Uint8Array(32).fill(0x44));
  bytes.push(1);
  pushString('build');
  pushBytes(new Uint8Array(16));

  return Uint8Array.from(bytes);
}

let previousEnv: { packageId?: string; registryId?: string };

beforeEach(() => {
  previousEnv = {
    packageId: process.env.VITE_PACKAGE_ID,
    registryId: process.env.VITE_REGISTRY_ID,
  };
  process.env.VITE_PACKAGE_ID = PACKAGE_ID;
  process.env.VITE_REGISTRY_ID = REGISTRY_ID;
});

afterEach(() => {
  restoreEnv('VITE_PACKAGE_ID', previousEnv.packageId);
  restoreEnv('VITE_REGISTRY_ID', previousEnv.registryId);
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = value;
}

describe('lookupRegistrySlug', () => {
  test('reports an available slug when the dynamic field does not exist', async () => {
    const reader: RegistryObjectReader = async () => ({ status: 'notFound' });

    await expect(lookupRegistrySlug('free-slug', { readObject: reader })).resolves.toEqual({
      status: 'available',
    });
  });

  test('reads the dynamic field derived from the normalized slug', async () => {
    const requested: string[] = [];
    const reader: RegistryObjectReader = async (objectId) => {
      requested.push(objectId);
      return { status: 'notFound' };
    };

    await lookupRegistrySlug('  Frontier-Library  ', { readObject: reader });

    expect(requested).toEqual([
      registrySlugFieldId(REGISTRY_ID, 'frontier-library'),
    ]);
  });

  test('passes an abort signal so a hung fullnode call is cancelled', async () => {
    let signal: AbortSignal | undefined;
    const reader: RegistryObjectReader = async (_objectId, options) => {
      signal = options?.signal;
      return { status: 'notFound' };
    };

    await lookupRegistrySlug('free-slug', { readObject: reader });

    expect(signal).toBeInstanceOf(AbortSignal);
  });

  test('reports a taken slug with the decoded listing', async () => {
    const reader: RegistryObjectReader = async () => ({
      status: 'found',
      contents: listingContents('frontier-library'),
    });

    await expect(
      lookupRegistrySlug('frontier-library', { readObject: reader }),
    ).resolves.toEqual({
      status: 'taken',
      listing: {
        owner: OWNER,
        slug: 'frontier-library',
        metadata_uri: 'https://example.test/metadata.json',
        metadata_hash: Array.from({ length: 32 }, () => 0x44),
        categories: ['build'],
      },
    });
  });

  test('reports an error instead of availability when the read fails', async () => {
    const reader: RegistryObjectReader = async () => ({
      status: 'failed',
      message: 'Fullnode returned gRPC status 14.',
    });

    await expect(
      lookupRegistrySlug('frontier-library', { readObject: reader }),
    ).resolves.toEqual({
      status: 'error',
      message: 'Fullnode returned gRPC status 14.',
    });
  });

  test('reports an error when the reader throws', async () => {
    const reader: RegistryObjectReader = async () => {
      throw new Error('network unreachable');
    };

    await expect(
      lookupRegistrySlug('frontier-library', { readObject: reader }),
    ).resolves.toEqual({
      status: 'error',
      message: 'network unreachable',
    });
  });

  test('reports an error when the field object is not a listing', async () => {
    const reader: RegistryObjectReader = async () => ({
      status: 'found',
      contents: Uint8Array.of(1, 2, 3),
    });

    await expect(
      lookupRegistrySlug('frontier-library', { readObject: reader }),
    ).resolves.toEqual({
      status: 'error',
      message: 'Registry listing could not be decoded.',
    });
  });

  test('rejects an empty slug before reading the chain', async () => {
    let called = false;
    const reader: RegistryObjectReader = async () => {
      called = true;
      return { status: 'notFound' };
    };

    await expect(lookupRegistrySlug('   ', { readObject: reader })).resolves.toEqual({
      status: 'error',
      message: 'Slug is empty.',
    });
    expect(called).toBe(false);
  });

  test('reports unconfigured when the registry env is missing', async () => {
    delete process.env.VITE_REGISTRY_ID;
    let called = false;
    const reader: RegistryObjectReader = async () => {
      called = true;
      return { status: 'notFound' };
    };

    await expect(
      lookupRegistrySlug('frontier-library', { readObject: reader }),
    ).resolves.toEqual({ status: 'unconfigured' });
    expect(called).toBe(false);
  });
});
