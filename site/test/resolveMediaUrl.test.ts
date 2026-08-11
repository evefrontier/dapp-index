import { describe, expect, test } from 'bun:test';
import { resolveMediaUrl } from '../src/utils/resolveMediaUrl';

describe('resolveMediaUrl', () => {
  test('passes through HTTPS CDN URLs', () => {
    expect(
      resolveMediaUrl(
        'https://cdn.example/testnet/0xabc/demo/thumbnail.webp',
      ),
    ).toBe('https://cdn.example/testnet/0xabc/demo/thumbnail.webp');
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
