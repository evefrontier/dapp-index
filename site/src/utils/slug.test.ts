import { describe, expect, test } from 'bun:test';
import { generateSlugSuggestion } from './slug';

describe('generateSlugSuggestion', () => {
  test('lowercases and hyphenates words from the name', () => {
    expect(generateSlugSuggestion('Route Planner', '')).toBe('route-planner');
  });

  test('strips punctuation and collapses hyphens', () => {
    expect(generateSlugSuggestion("Frontier's  Gate--Router!!", '')).toBe(
      'frontier-s-gate-router',
    );
  });

  test('trims leading and trailing hyphens', () => {
    expect(generateSlugSuggestion('  -Hello World-  ', '')).toBe(
      'hello-world',
    );
  });

  test('strips diacritics', () => {
    expect(generateSlugSuggestion('Café Déjà Vu', '')).toBe('cafe-deja-vu');
  });

  test('truncates to 50 characters without a trailing hyphen', () => {
    const long = 'a'.repeat(48) + ' b c';
    const result = generateSlugSuggestion(long, '');
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result.endsWith('-')).toBe(false);
  });

  test('prefers the name over the summary', () => {
    expect(generateSlugSuggestion('Route Planner', 'A logistics dapp')).toBe(
      'route-planner',
    );
  });

  test('falls back to the summary when the name is empty', () => {
    expect(generateSlugSuggestion('', 'A logistics dapp')).toBe(
      'a-logistics-dapp',
    );
  });

  test('falls back to the summary when the name has no slug-able characters', () => {
    expect(generateSlugSuggestion('!!!', 'A logistics dapp')).toBe(
      'a-logistics-dapp',
    );
  });

  test('returns empty string when neither field is usable', () => {
    expect(generateSlugSuggestion('', '')).toBe('');
    expect(generateSlugSuggestion('!!!', '')).toBe('');
  });
});
