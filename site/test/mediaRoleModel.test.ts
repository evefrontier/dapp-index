import { describe, expect, test } from 'bun:test';
import {
  getMediaPublishApprovalEstimateCopy,
  getMediaRoleLabel,
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
  });

  test('estimates publish approval copy from media count', () => {
    expect(getMediaPublishApprovalEstimateCopy(6)).toContain('15 wallet approvals');
  });
});
