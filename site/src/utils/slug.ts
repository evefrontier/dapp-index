import { SLUG_MAX_LENGTH } from '@/schemas/shared';

const COMBINING_DIACRITICS_PATTERN = /[\u0300-\u036f]/g;

/**
 * Converts free text into a slug matching `SlugSchema`
 * (lowercase alphanumeric segments joined by single hyphens).
 */
function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(COMBINING_DIACRITICS_PATTERN, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, '');
}

/**
 * Generates a slug suggestion for the builder's basics step, preferring the
 * dapp name and falling back to the summary when the name yields nothing.
 * Returns an empty string when neither field contains slug-able characters.
 */
export function generateSlugSuggestion(name: string, summary: string): string {
  const fromName = slugify(name);
  if (fromName) return fromName;

  return slugify(summary);
}
