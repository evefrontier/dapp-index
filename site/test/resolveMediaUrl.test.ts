import { describe, expect, test } from 'bun:test';
import { DAPP_MEDIA_CDN_ORIGIN } from '../src/constants';
import { resolveMediaUrl } from '../src/utils/resolveMediaUrl';

describe('resolveMediaUrl', () => {
  test('passes through HTTPS CDN URLs', () => {
    expect(
      resolveMediaUrl(
        'https://cdn.example/testnet/0xabc/demo/thumbnail.webp',
      ),
    ).toBe('https://cdn.example/testnet/0xabc/demo/thumbnail.webp');
  });

  test('rewrites legacy CloudFront media URLs to the public CDN', () => {
    expect(
      resolveMediaUrl(
        'https://d111111abcdef8.cloudfront.net/testnet/0xabc/demo/gallery-1.png',
      ),
    ).toBe(`${DAPP_MEDIA_CDN_ORIGIN}/testnet/0xabc/demo/gallery-1.png`);
  });

  test('rejects http URLs', () => {
    expect(resolveMediaUrl('http://cdn.example/file.webp')).toBeNull();
    expect(resolveMediaUrl('https://')).toBeNull();
  });

  test('resolves walrus blob URIs when a helper is provided', () => {
    expect(
      resolveMediaUrl('walrus://blob/abc123', {
        resolveWalrusBlobId: (id) => `https://aggregator.example/v1/blobs/${id}`,
      }),
    ).toBe('https://aggregator.example/v1/blobs/abc123');
  });

  test('returns null for walrus when no helper is provided', () => {
    expect(resolveMediaUrl('walrus://blob/abc123')).toBeNull();
  });
});
