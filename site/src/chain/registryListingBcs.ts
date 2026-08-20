/**
 * BCS decoding for registry listings read over gRPC.
 *
 * Listings live as dynamic fields on the shared `DappRegistry` object, keyed by
 * the listing slug (`0x1::string::String`). gRPC returns raw BCS bytes rather
 * than the decoded JSON shape the old JSON-RPC API produced, so the struct
 * layout here must stay in sync with `DappListing` in
 * `registry/move/sources/registry.move`.
 *
 * Two read shapes exist, so both decoders are needed: a single slug read
 * returns the `Field` wrapper, while catalog reads via `listDynamicFields`
 * with `include: { value: true }` return a bare `DappListing`.
 */

import { bcs, TypeTagSerializer } from '@mysten/sui/bcs';
import { deriveDynamicFieldID } from '@mysten/sui/utils';

export type OnChainListing = {
  owner: string;
  slug: string;
  metadata_uri: string;
  metadata_hash: number[];
  categories: string[];
};

const SLUG_FIELD_NAME_TYPE = '0x1::string::String';

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

/** `0x2::dynamic_field::Field<0x1::string::String, DappListing>`. */
const RegistryListingFieldBcs = bcs.struct('Field', {
  id: bcs.Address,
  name: bcs.String,
  value: DappListingBcs,
});

/** Object id of the dynamic field holding `slug`, derived without a chain read. */
export function registrySlugFieldId(registryId: string, slug: string): string {
  return deriveDynamicFieldID(
    registryId,
    TypeTagSerializer.parseFromStr(SLUG_FIELD_NAME_TYPE),
    bcs.String.serialize(slug).toBytes(),
  );
}

/**
 * Decode the contents of a registry slug dynamic field object.
 *
 * Returns `null` when the bytes do not match the expected layout, which happens
 * if the object is not a registry listing or the Move struct has changed.
 */
export function parseRegistryListingFieldBcs(
  contents: Uint8Array,
): OnChainListing | null {
  try {
    const { value } = RegistryListingFieldBcs.parse(contents);
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

/**
 * Decode a bare `DappListing` value (as returned by listDynamicFields with
 * `include: { value: true }`).
 */
export function parseDappListingBcs(
  contents: Uint8Array,
): OnChainListing | null {
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
