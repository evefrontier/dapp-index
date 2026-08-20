import { describe, expect, test } from 'bun:test';
import { putPresignedObject } from '../src/storage/s3Put';
import {
  stableMediaFilename,
  uploadManifestToS3,
  uploadMediaToS3,
} from '../src/storage/s3MetadataStorage';
import { UploadError } from '../src/storage/uploadErrors';
import { presignUpload } from '../src/storage/uploadApi';

const API_BASE = 'https://uploads.example.com';
const MEDIA_CDN_BASE = 'https://cdn.example';

describe('presignUpload', () => {
  test('throws when API base is missing', async () => {
    await expect(
      presignUpload({
        address: '0x1234',
        slug: 'demo',
        purpose: 'media',
        filename: 'thumbnail.png',
        contentType: 'image/png',
        contentLength: 12,
        sha256: 'a'.repeat(64),
        apiBase: '',
      }),
    ).rejects.toMatchObject({
      code: 'upload_api_unconfigured',
    });
  });

  test('maps network failures', async () => {
    await expect(
      presignUpload({
        address: '0x1234',
        slug: 'demo',
        purpose: 'media',
        filename: 'thumbnail.png',
        contentType: 'image/png',
        contentLength: 12,
        sha256: 'a'.repeat(64),
        apiBase: API_BASE,
        fetchImpl: async () => {
          throw new TypeError('Failed to fetch');
        },
      }),
    ).rejects.toMatchObject({
      code: 'presign_network',
      message: 'Could not reach upload service.',
    });
  });

  test('maps Lambda HTTP errors with message body', async () => {
    await expect(
      presignUpload({
        address: '0x1234',
        slug: 'demo',
        purpose: 'media',
        filename: 'thumbnail.png',
        contentType: 'image/png',
        contentLength: 12,
        sha256: 'a'.repeat(64),
        apiBase: API_BASE,
        fetchImpl: async () =>
          new Response(JSON.stringify({ message: 'slug is invalid' }), {
            status: 400,
          }),
      }),
    ).rejects.toMatchObject({
      code: 'presign_http',
      status: 400,
      message: 'Upload service rejected the request (slug is invalid).',
    });
  });

  test('maps malformed success JSON', async () => {
    await expect(
      presignUpload({
        address: '0x1234',
        slug: 'demo',
        purpose: 'media',
        filename: 'thumbnail.png',
        contentType: 'image/png',
        contentLength: 12,
        sha256: 'a'.repeat(64),
        apiBase: API_BASE,
        fetchImpl: async () => new Response('{not-json', { status: 200 }),
      }),
    ).rejects.toMatchObject({
      code: 'presign_invalid_response',
    });
  });

  test('rejects non-HTTPS upload and public URLs', async () => {
    const request = {
      address: '0x1234',
      slug: 'demo',
      purpose: 'media' as const,
      filename: 'thumbnail.png',
      contentType: 'image/png',
      contentLength: 12,
      sha256: 'a'.repeat(64),
      apiBase: API_BASE,
      mediaCdnBase: MEDIA_CDN_BASE,
    };

    await expect(
      presignUpload({
        ...request,
        fetchImpl: async () =>
          Response.json({
            uploadUrl: 'http://s3.example/put',
            headers: { 'Content-Type': 'image/png' },
            objectKey: 'testnet/0x1234/demo/thumbnail.png',
            publicUrl: 'https://cdn.example/thumbnail.png',
          }),
      }),
    ).rejects.toMatchObject({ code: 'presign_invalid_response' });

    await expect(
      presignUpload({
        ...request,
        fetchImpl: async () =>
          Response.json({
            uploadUrl: 'https://s3.example/put',
            headers: { 'Content-Type': 'image/png' },
            objectKey: 'testnet/0x1234/demo/thumbnail.png',
            publicUrl: 'javascript:alert(1)',
          }),
      }),
    ).rejects.toMatchObject({ code: 'presign_invalid_response' });
  });

  test('rejects CloudFront distribution publicUrl', async () => {
    await expect(
      presignUpload({
        address: '0x1234',
        slug: 'demo',
        purpose: 'media',
        filename: 'thumbnail.png',
        contentType: 'image/png',
        contentLength: 12,
        sha256: 'a'.repeat(64),
        apiBase: API_BASE,
        mediaCdnBase: MEDIA_CDN_BASE,
        fetchImpl: async () =>
          Response.json({
            uploadUrl: 'https://s3.example/put',
            headers: { 'Content-Type': 'image/png' },
            objectKey: 'testnet/0x1234/demo/thumbnail.png',
            publicUrl:
              'https://d111111abcdef8.cloudfront.net/testnet/0x1234/demo/thumbnail.png',
          }),
      }),
    ).rejects.toMatchObject({ code: 'presign_invalid_response' });
  });

  test('rejects publicUrl outside the media CDN', async () => {
    await expect(
      presignUpload({
        address: '0x1234',
        slug: 'demo',
        purpose: 'media',
        filename: 'thumbnail.png',
        contentType: 'image/png',
        contentLength: 12,
        sha256: 'a'.repeat(64),
        apiBase: API_BASE,
        mediaCdnBase: MEDIA_CDN_BASE,
        fetchImpl: async () =>
          Response.json({
            uploadUrl: 'https://s3.example/put',
            headers: { 'Content-Type': 'image/png' },
            objectKey: 'testnet/0x1234/demo/thumbnail.png',
            publicUrl: 'https://other-cdn.example/testnet/0x1234/demo/thumbnail.png',
          }),
      }),
    ).rejects.toMatchObject({ code: 'presign_invalid_response' });
  });

  test('returns a valid presign payload', async () => {
    const result = await presignUpload({
      address: '0x1234',
      slug: 'demo',
      purpose: 'media',
      filename: 'thumbnail.png',
      contentType: 'image/png',
      contentLength: 12,
      sha256: 'a'.repeat(64),
      apiBase: API_BASE,
      mediaCdnBase: MEDIA_CDN_BASE,
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            uploadUrl: 'https://s3.example/put',
            method: 'PUT',
            headers: { 'Content-Type': 'image/png' },
            objectKey: 'testnet/0x1234/demo/thumbnail.png',
            publicUrl: 'https://cdn.example/testnet/0x1234/demo/thumbnail.png',
            expiresInSeconds: 300,
          }),
          { status: 200 },
        ),
    });

    expect(result.uploadUrl).toBe('https://s3.example/put');
    expect(result.publicUrl).toContain('cdn.example');
    expect(result.headers['Content-Type']).toBe('image/png');
  });
});

describe('putPresignedObject', () => {
  test('maps S3 HTTP 403', async () => {
    await expect(
      putPresignedObject({
        uploadUrl: 'https://s3.example/put',
        headers: { 'Content-Type': 'image/png' },
        body: new Uint8Array([1, 2, 3]),
        fetchImpl: async () =>
          new Response('<Error>AccessDenied</Error>', { status: 403 }),
      }),
    ).rejects.toMatchObject({
      code: 'put_http',
      status: 403,
    });
  });

  test('maps network failures', async () => {
    await expect(
      putPresignedObject({
        uploadUrl: 'https://s3.example/put',
        headers: { 'Content-Type': 'image/png' },
        body: new Uint8Array([1, 2, 3]),
        fetchImpl: async () => {
          throw new TypeError('CORS blocked');
        },
      }),
    ).rejects.toMatchObject({
      code: 'put_network',
    });
  });
});

describe('s3MetadataStorage', () => {
  test('uploadMediaToS3 presigns then PUTs', async () => {
    const calls: string[] = [];
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const result = await uploadMediaToS3({
      address: '0xabc',
      slug: 'route-planner',
      filename: 'thumbnail.png',
      contentType: 'image/png',
      bytes,
      sha256: 'b'.repeat(64),
      apiBase: API_BASE,
      mediaCdnBase: MEDIA_CDN_BASE,
      fetchImpl: async (input, init) => {
        const url = String(input);
        calls.push(`${init?.method ?? 'GET'} ${url}`);
        if (url.endsWith('/uploads/presign')) {
          return new Response(
            JSON.stringify({
              uploadUrl: 'https://s3.example/put-media',
              headers: { 'Content-Type': 'image/png' },
              objectKey: 'testnet/0xabc/route-planner/thumbnail.png',
              publicUrl:
                'https://cdn.example/testnet/0xabc/route-planner/thumbnail.png',
            }),
            { status: 200 },
          );
        }
        expect(url).toBe('https://s3.example/put-media');
        expect(init?.method).toBe('PUT');
        return new Response(null, { status: 200 });
      },
    });

    expect(result.uri).toContain('cdn.example');
    expect(result.sizeBytes).toBe(4);
    expect(calls[0]).toContain('/uploads/presign');
    expect(calls[1]).toContain('put-media');
  });

  test('uploadManifestToS3 uses metadata.json', async () => {
    let presignBody: unknown;
    await uploadManifestToS3({
      address: '0xabc',
      slug: 'route-planner',
      bytes: new TextEncoder().encode('{"id":"route-planner"}'),
      sha256: 'c'.repeat(64),
      apiBase: API_BASE,
      mediaCdnBase: MEDIA_CDN_BASE,
      fetchImpl: async (input, init) => {
        const url = String(input);
        if (url.endsWith('/uploads/presign')) {
          presignBody = JSON.parse(String(init?.body));
          return new Response(
            JSON.stringify({
              uploadUrl: 'https://s3.example/put-meta',
              headers: { 'Content-Type': 'application/json' },
              objectKey: 'testnet/0xabc/route-planner/metadata.json',
              publicUrl:
                'https://cdn.example/testnet/0xabc/route-planner/metadata.json',
            }),
            { status: 200 },
          );
        }
        return new Response(null, { status: 200 });
      },
    });

    expect(presignBody).toMatchObject({
      purpose: 'manifest',
      filename: 'metadata.json',
      contentType: 'application/json',
    });
  });

  test('stableMediaFilename maps mime types', () => {
    expect(stableMediaFilename('thumbnail', 'image/webp')).toBe(
      'thumbnail.webp',
    );
    expect(stableMediaFilename('gallery-1', 'image/png')).toBe('gallery-1.png');
    expect(stableMediaFilename('demo', 'video/webm')).toBe('demo.webm');
  });

  test('isUploadError recognizes UploadError', () => {
    const err = new UploadError('put_http', 'failed', { status: 403 });
    expect(err).toBeInstanceOf(UploadError);
    expect(err.code).toBe('put_http');
  });
});
