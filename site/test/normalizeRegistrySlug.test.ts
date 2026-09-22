import { describe, expect, test } from 'bun:test';
import { normalizeRegistrySlug } from '../src/chain/normalizeRegistrySlug';

describe('normalizeRegistrySlug', () => {
  test('trims whitespace and lowercases slugs', () => {
    expect(normalizeRegistrySlug('  My-Slug  ')).toBe('my-slug');
  });

  test('returns empty string for whitespace-only input', () => {
    expect(normalizeRegistrySlug('   ')).toBe('');
  });
});
