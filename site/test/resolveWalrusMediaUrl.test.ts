import { describe, expect, test } from 'bun:test';
import {
  WALRUS_AGGREGATOR_PROXY_TESTNET,
  WALRUS_AGGREGATOR_TESTNET_URL,
} from '@/constants';
import {
  resolveWalrusMetadataFetchUrl,
  resolveWalrusMetadataReadUrl,
} from '@/directory/resolveWalrusMediaUrl';

describe('resolveWalrusMetadataFetchUrl', () => {
  test('maps walrus blob URIs to aggregator read URLs', () => {
    const blobId = 'opzqxIqaBtQoEc2D9amT5lfh1rlqM9ihAdothsaC-sA';
    expect(
      resolveWalrusMetadataFetchUrl(`walrus://blob/${blobId}`),
    ).toBe(`${WALRUS_AGGREGATOR_TESTNET_URL}/v1/blobs/${blobId}`);
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
