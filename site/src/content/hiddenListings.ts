import { z } from 'zod';
import { SlugSchema } from '@/schemas/shared';
import type { DappIndexEntry } from '@/types/dapp-index';
import hiddenListingsDocumentJson from './hiddenListings.json';

/**
 * Temporary site-only denylist. Hide a listing from the Dapp Index by adding
 * its slug here and merging via PR. On-chain curator visibility (ADR-003) is
 * the long-term replacement.
 */
export const HiddenListingEntrySchema = z.object({
  slug: SlugSchema,
  reason: z.string().trim().min(1),
  hiddenAt: z.string().trim().min(1),
  hiddenBy: z.string().trim().min(1),
});

export const HiddenListingsDocumentSchema = z.object({
  hidden: z.array(HiddenListingEntrySchema),
});

export type HiddenListingEntry = z.infer<typeof HiddenListingEntrySchema>;
export type HiddenListingsDocument = z.infer<typeof HiddenListingsDocumentSchema>;

export function parseHiddenListingsDocument(
  value: unknown,
): HiddenListingsDocument {
  return HiddenListingsDocumentSchema.parse(value);
}

export function hiddenSlugSetFromDocument(
  document: HiddenListingsDocument,
): ReadonlySet<string> {
  return new Set(document.hidden.map((entry) => entry.slug));
}

const HIDDEN_SLUGS = hiddenSlugSetFromDocument(
  parseHiddenListingsDocument(hiddenListingsDocumentJson),
);

export function getHiddenListingSlugs(): ReadonlySet<string> {
  return HIDDEN_SLUGS;
}

export function applyHiddenListings(
  entries: readonly DappIndexEntry[],
  hiddenSlugs: ReadonlySet<string> = HIDDEN_SLUGS,
): DappIndexEntry[] {
  if (hiddenSlugs.size === 0) return [...entries];
  return entries.filter((entry) => !hiddenSlugs.has(entry.id));
}
