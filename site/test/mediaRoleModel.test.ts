import { describe, expect, test } from 'bun:test';
import {
  getDefaultMediaRoleForKind,
  getMediaRoleLabel,
  getMediaRoleOptionsForKind,
} from '../src/builder/mediaRoleModel';

describe('media role model', () => {
  test('offers image roles for screenshots', () => {
    expect(getMediaRoleOptionsForKind('screenshot').map((option) => option.role)).toEqual(
      ['thumbnail', 'hero', 'gallery', 'logo'],
    );
  });

  test('offers video roles for demos and gallery stills', () => {
    expect(getMediaRoleOptionsForKind('video').map((option) => option.role)).toEqual(
      ['gallery', 'demo'],
    );
  });

  test('defaults new uploads by media kind', () => {
    expect(getDefaultMediaRoleForKind('screenshot')).toBe('gallery');
    expect(getDefaultMediaRoleForKind('video')).toBe('demo');
  });

  test('maps roles to builder-facing labels', () => {
    expect(getMediaRoleLabel('thumbnail')).toBe('Thumbnail');
    expect(getMediaRoleLabel('demo')).toBe('Demo');
  });
});
