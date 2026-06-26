import { describe, expect, test } from 'bun:test';
import {
  getMediaPublishApprovalEstimateCopy,
  getMediaRoleLabel,
  getPublishStepGuidanceCopy,
  MEDIA_STEP_GUIDANCE,
} from '../src/builder/mediaRoleModel';

describe('media role model', () => {
  test('derives metadata role labels from slot definitions', () => {
    expect(getMediaRoleLabel('thumbnail')).toBe('Thumbnail');
    expect(getMediaRoleLabel('demo')).toBe('Video');
    expect(getMediaRoleLabel('logo')).toBe('Logo');
    expect(getMediaRoleLabel('gallery')).toBe('Gallery');
    expect(getMediaRoleLabel('hero')).toBe('Hero');
  });

  test('exposes slot-based media limits in guidance copy', () => {
    expect(MEDIA_STEP_GUIDANCE.imageLimit).toBe('5 MB');
    expect(MEDIA_STEP_GUIDANCE.videoLimit).toBe('60 MB');
    expect(MEDIA_STEP_GUIDANCE.totalLimit).toBe('150 MB');
    expect(MEDIA_STEP_GUIDANCE.itemLimit).toBe(6);
    expect(MEDIA_STEP_GUIDANCE.galleryLimit).toBe(3);
    expect(MEDIA_STEP_GUIDANCE.videoLimitCount).toBe(1);
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
});
