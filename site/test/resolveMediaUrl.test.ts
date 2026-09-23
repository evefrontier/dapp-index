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

  test('rewrites the configured legacy CloudFront host to the public CDN', () => {
    expect(
      resolveMediaUrl(
        'https://d111111abcdef8.cloudfront.net/testnet/0xabc/demo/gallery-1.png',
        { legacyCloudFrontHost: 'd111111abcdef8.cloudfront.net' },
      ),
    ).toBe(`${DAPP_MEDIA_CDN_ORIGIN}/testnet/0xabc/demo/gallery-1.png`);
  });

  test('leaves other CloudFront hosts untouched when no legacy host is configured', () => {
    // Without VITE_LEGACY_CLOUDFRONT_HOST set, no *.cloudfront.net URL is
    // rewritten — a builder-referenced third-party distribution must not be
    // redirected to a path that generally won't exist on our CDN.
    const thirdPartyUrl =
      'https://d222222xyz.cloudfront.net/some/other/project/asset.png';
    expect(resolveMediaUrl(thirdPartyUrl)).toBe(thirdPartyUrl);
  });

  test('does not rewrite a CloudFront host that does not match the configured legacy host', () => {
    const thirdPartyUrl =
      'https://d222222xyz.cloudfront.net/some/other/project/asset.png';
    expect(
      resolveMediaUrl(thirdPartyUrl, {
        legacyCloudFrontHost: 'd111111abcdef8.cloudfront.net',
      }),
    ).toBe(thirdPartyUrl);
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
