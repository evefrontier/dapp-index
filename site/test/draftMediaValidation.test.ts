import { describe, expect, test } from 'bun:test';
import {
  LISTING_MEDIA_IMAGE_MAX_BYTES,
  LISTING_MEDIA_VIDEO_MAX_BYTES,
} from '@/constants';
import { validateDraftMediaFile } from '../src/storage/draftStorage';
import { fileLike } from './draftTestUtils';

describe('draft media validation', () => {
  test('keeps only supported MIME types and sizes eligible for draft media', () => {
    expect(
      validateDraftMediaFile({
        kind: 'video',
        file: new File(['video'], 'trailer.webm', { type: 'video/webm' }),
      }).ok,
    ).toBe(true);

    expect(
      validateDraftMediaFile({
        kind: 'video',
        file: new File(['video'], 'trailer.mp4', { type: 'video/mp4' }),
      }).ok,
    ).toBe(false);

    expect(
      validateDraftMediaFile({
        kind: 'video',
        file: fileLike({
          size: LISTING_MEDIA_VIDEO_MAX_BYTES + 1,
          type: 'video/webm',
        }),
      }).ok,
    ).toBe(false);

    expect(
      validateDraftMediaFile({
        kind: 'screenshot',
        file: new File(['image'], 'screen.webp', { type: 'image/webp' }),
      }).ok,
    ).toBe(true);

    expect(
      validateDraftMediaFile({
        kind: 'screenshot',
        file: fileLike({
          size: LISTING_MEDIA_IMAGE_MAX_BYTES + 1,
          type: 'image/png',
        }),
      }).ok,
    ).toBe(false);
  });
});
