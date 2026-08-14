/**
 * BCS decoding for registry listings read over gRPC.
 *
 * Catalog listing uses `listDynamicFields` with `include: { value: true }`,
 * which returns a bare `DappListing` value. The struct layout must stay in
 * sync with `DappListing` in `registry/move/sources/registry.move`.
 */

import { bcs } from '@mysten/sui/bcs';

export type OnChainListing = {
  owner: string;
  slug: string;
  metadata_uri: string;
  metadata_hash: number[];
  categories: string[];
};

/**
 * The epoch fields are unused downstream but must be declared: BCS is a
 * positional format, so omitting them would misalign the decode.
 */
const DappListingBcs = bcs.struct('DappListing', {
  owner: bcs.Address,
  slug: bcs.String,
  metadata_uri: bcs.String,
  metadata_hash: bcs.vector(bcs.u8()),
  categories: bcs.vector(bcs.String),
  created_at_epoch: bcs.u64(),
  updated_at_epoch: bcs.u64(),
});

/**
 * Decode a bare `DappListing` value (as returned by listDynamicFields with
 * `include: { value: true }`).
 */
export function parseDappListingBcs(contents: Uint8Array): OnChainListing | null {
  try {
    const value = DappListingBcs.parse(contents);
    return {
      owner: value.owner,
      slug: value.slug,
      metadata_uri: value.metadata_uri,
      metadata_hash: value.metadata_hash,
      categories: value.categories,
    };
  } catch {
    return null;
  }
}
