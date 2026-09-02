import { describe, expect, test } from 'bun:test';
import { resolveDetailGallerySlides } from '../src/directory/resolveDetailMedia';
import { listDirectoryTestFixtures } from './directoryTestFixtures';

describe('resolveDetailGallerySlides', () => {
  test('resolves an S3/CDN-hosted video slide with its poster and source URLs intact', () => {
    const entry = listDirectoryTestFixtures().find(
      (fixture) => fixture.id === 's3-route-planner',
    );
    expect(entry).toBeDefined();
    if (!entry) return;

    const slides = resolveDetailGallerySlides(entry);

    expect(slides).toHaveLength(1);
    const [slide] = slides;
    expect(slide?.kind).toBe('video');
    if (slide?.kind !== 'video') return;

    expect(slide.sourceUrl).toBe(
      'https://cdn.example/testnet/0xabc/s3-route-planner/demo.webm',
    );
    expect(slide.posterUrl).toBe(
      'https://cdn.example/testnet/0xabc/s3-route-planner/demo-poster.webp',
    );
    expect(slide.caption).toBe(
      'Creating a route and handing it off to a fleet',
    );
  });

  test('drops a video slide when its source URL fails validation', () => {
    const entry = listDirectoryTestFixtures().find(
      (fixture) => fixture.id === 's3-route-planner',
    );
    expect(entry).toBeDefined();
    if (!entry) return;

    const invalidSourceEntry = {
      ...entry,
      media: {
        ...entry.media,
        items: entry.media?.items.map((item) =>
          item.kind === 'video'
            ? {
                ...item,
                sources: [{ ...item.sources[0], uri: 'http://cdn.example/demo.webm' }],
              }
            : item,
        ),
      },
    };

    const slides = resolveDetailGallerySlides(invalidSourceEntry);
    expect(slides.some((slide) => slide.kind === 'video')).toBe(false);
  });
});
