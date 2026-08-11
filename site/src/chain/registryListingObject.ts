import {
  asPlainRecord,
  coerceU8Vector,
  moveStringToUtf8,
} from '@/chain/moveObjectFields';

export type OnChainListing = {
  owner: string;
  slug: string;
  metadata_uri: string;
  metadata_hash: number[];
  categories: string[];
};

/** Minimal object-response shape used by the legacy JSON listing parser. */
type ListingObjectResponse = {
  data?: {
    content?: unknown;
  } | null;
};

function parseListingFields(
  fields: Record<string, unknown>,
): OnChainListing | null {
  const owner = typeof fields.owner === 'string' ? fields.owner : null;
  const slug = moveStringToUtf8(fields.slug);
  const metadata_uri = moveStringToUtf8(fields.metadata_uri);
  const metadata_hash = coerceU8Vector(fields.metadata_hash);
  const categoriesRaw = fields.categories;
  if (
    !owner ||
    !slug ||
    !metadata_uri ||
    !metadata_hash ||
    !Array.isArray(categoriesRaw)
  ) {
    return null;
  }

  const categories: string[] = [];
  for (const category of categoriesRaw) {
    const normalized = moveStringToUtf8(category);
    if (!normalized) return null;
    categories.push(normalized);
  }

  return { owner, slug, metadata_uri, metadata_hash, categories };
}

function extractListingFromMoveObjectContent(
  content: unknown,
): OnChainListing | null {
  const record = asPlainRecord(content);
  if (!record || record.dataType !== 'moveObject') return null;
  const fields = asPlainRecord(record.fields);
  if (!fields) return null;
  if ('value' in fields) {
    const inner = asPlainRecord(fields.value);
    if (inner) {
      const innerFields = asPlainRecord(inner.fields);
      return parseListingFields(innerFields ?? inner);
    }
  }
  if ('owner' in fields && 'slug' in fields) {
    return parseListingFields(fields);
  }
  return null;
}

export function parseRegistryListingObject(
  response: ListingObjectResponse,
): OnChainListing | null {
  const data = response.data;
  if (!data?.content) return null;
  return extractListingFromMoveObjectContent(data.content);
}
