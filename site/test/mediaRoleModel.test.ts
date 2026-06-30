import { describe, expect, test } from 'bun:test';
import {
  getMediaPublishApprovalEstimateCopy,
  getMediaRoleLabel,
  getMediaSlotFormatBullets,
  getMediaStepGuideCopy,
  getMediaStepGuideSections,
  getPublishStepGuidanceCopy,
  MEDIA_STEP_GUIDANCE,
} from '../src/builder/mediaRoleModel';
import { getMediaSlotDefinition } from '../src/builder/mediaSlotModel';

describe('media role model', () => {
  test('derives metadata role labels from slot definitions', () => {
    expect(getMediaRoleLabel('thumbnail')).toBe('Thumbnail');
    expect(getMediaRoleLabel('demo')).toBe('Video');
    expect(getMediaRoleLabel('logo')).toBe('Logo');
    expect(getMediaRoleLabel('gallery')).toBe('Gallery');
    expect(getMediaRoleLabel('unknown' as 'gallery')).toBe('unknown');
  });

  test('exposes slot-based media limits in guidance copy', () => {
    expect(MEDIA_STEP_GUIDANCE.imageLimit).toBe('5 MB');
    expect(MEDIA_STEP_GUIDANCE.videoLimit).toBe('60 MB');
    expect(MEDIA_STEP_GUIDANCE.totalLimit).toBe('150 MB');
    expect(MEDIA_STEP_GUIDANCE.itemLimit).toBe(6);
    expect(MEDIA_STEP_GUIDANCE.galleryLimit).toBe(3);
  });

  test('estimates publish approval copy from media count', () => {
    expect(getMediaPublishApprovalEstimateCopy(6)).toContain('15 wallet approvals');
  });

  test('builds publish step guidance from media count', () => {
    const guidance = getPublishStepGuidanceCopy(2);

    expect(guidance).toHaveLength(3);
    expect(guidance[1]).toContain('7 wallet approvals');
    expect(guidance[1]).toContain('2 files');
    expect(guidance[2]).toContain('discoverable');
  });

  test('builds media step guide copy from media count', () => {
    const guidance = getMediaStepGuideCopy(2);

    expect(guidance).toHaveLength(3);
    expect(guidance[0]).toContain('Logo, thumbnail');
    expect(guidance[2]).toContain('Walrus');
  });

  test('builds media step guide sections with slot bullets', () => {
    const { intro, sections } = getMediaStepGuideSections(2);

    expect(intro).toContain('required before publish');
    expect(sections.map((section) => section.title)).toEqual([
      'Logo',
      'Thumbnail',
      'Video',
      'Gallery images',
      'Overall limits',
    ]);
    expect(sections[0]?.bullets).toContain('Square image, about 256px or larger');
    expect(sections[4]?.bullets.at(-1)).toContain('7 wallet approvals');
  });

  test('builds per-slot format bullets', () => {
    expect(getMediaSlotFormatBullets(getMediaSlotDefinition('logo'))).toContain(
      'PNG, JPEG, or WebP up to 5 MB',
    );
    expect(
      getMediaSlotFormatBullets(getMediaSlotDefinition('gallery-1')),
    ).toContain('Alt text is required before publish');
  });
});
