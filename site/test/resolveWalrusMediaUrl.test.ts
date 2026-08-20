import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import {
  WALRUS_AGGREGATOR_PROXY_TESTNET,
  WALRUS_AGGREGATOR_TESTNET_URL,
} from '@/constants';
import {
  resolveWalrusBlobReadUrl,
  resolveWalrusMetadataFetchUrl,
  resolveWalrusMetadataReadUrl,
} from '@/directory/resolveWalrusMediaUrl';

// The Walrus read path is off by default; enable it only for these cases
// and restore afterwards so file order cannot leak the flag.
beforeAll(() => {
  process.env.VITE_ENABLE_WALRUS = 'true';
});

afterAll(() => {
  delete process.env.VITE_ENABLE_WALRUS;
});

describe('resolveWalrusMetadataFetchUrl', () => {
  test('maps walrus blob URIs to aggregator read URLs', () => {
    const blobId = 'opzqxIqaBtQoEc2D9amT5lfh1rlqM9ihAdothsaC-sA';
    expect(
      resolveWalrusMetadataFetchUrl(`walrus://blob/${blobId}`),
    ).toBe(`${WALRUS_AGGREGATOR_TESTNET_URL}/v1/blobs/${blobId}`);
  });

  test('passes HTTPS CDN media URLs through for S3-published listings', () => {
    const cdnUrl =
      'https://cdn.example/testnet/0xabc/demo/thumbnail.webp';
    expect(resolveWalrusBlobReadUrl(cdnUrl)).toBe(cdnUrl);
    expect(resolveWalrusMetadataFetchUrl(cdnUrl)).toBe(cdnUrl);
  });

  test('rejects non-HTTPS media URLs', () => {
    expect(resolveWalrusBlobReadUrl('http://cdn.example/file.webp')).toBeNull();
  });

  test('rewrites aggregator HTTPS URLs through the dev proxy when enabled', () => {
    const blobId = 'opzqxIqaBtQoEc2D9amT5lfh1rlqM9ihAdothsaC-sA';
    const aggregatorUrl = `${WALRUS_AGGREGATOR_TESTNET_URL}/v1/blobs/${blobId}`;

    expect(
      resolveWalrusMetadataFetchUrl(aggregatorUrl, {
        origin: 'http://localhost:5173',
        devProxy: true,
      }),
    ).toBe(
      `http://localhost:5173${WALRUS_AGGREGATOR_PROXY_TESTNET}/v1/blobs/${blobId}`,
    );
  });

  test('resolveWalrusMetadataReadUrl matches fetch URL without dev proxy', () => {
    const blobId = 'opzqxIqaBtQoEc2D9amT5lfh1rlqM9ihAdothsaC-sA';
    const uri = `walrus://blob/${blobId}`;

    expect(resolveWalrusMetadataReadUrl(uri)).toBe(
      resolveWalrusMetadataFetchUrl(uri),
    );
  });
});
