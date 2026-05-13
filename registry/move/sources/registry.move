/// On-chain dapp registry: shared `DappRegistry` with listings keyed by slug (dynamic fields).
module dapp_registry::registry;

use std::string::{Self, String};
use sui::dynamic_field as df;
use sui::event;

// --- errors ---
const E_EMPTY_SLUG: u64 = 0;
const E_SLUG_TOO_LONG: u64 = 1;
const E_EMPTY_METADATA_URI: u64 = 2;
const E_METADATA_URI_TOO_LONG: u64 = 3;
const E_METADATA_HASH_LEN: u64 = 4;
const E_TOO_MANY_CATEGORIES: u64 = 5;
const E_CATEGORY_TOO_LONG: u64 = 6;
const E_DUPLICATE_SLUG: u64 = 7;
const E_NOT_OWNER: u64 = 8;
const E_EMPTY_CATEGORIES: u64 = 9;
const E_DUPLICATE_CATEGORY: u64 = 10;
const E_NOT_FOUND: u64 = 11;
const E_INVALID_SLUG_CHAR: u64 = 12;

const MAX_SLUG_LEN: u64 = 50;
const MAX_METADATA_URI_LEN: u64 = 512;
const MAX_CATEGORIES: u64 = 5;
const MAX_CATEGORY_LEN: u64 = 64;
/// Expected SHA-256 digest length on-chain.
const METADATA_HASH_LEN: u64 = 32;

public struct DappRegistry has key {
    id: sui::object::UID,
}

public struct DappListing has copy, drop, store {
    owner: address,
    slug: String,
    metadata_uri: String,
    metadata_hash: vector<u8>,
    categories: vector<String>,
    created_at_epoch: u64,
    updated_at_epoch: u64,
}

public struct DappRegistered has copy, drop {
    owner: address,
    slug: String,
}

public struct DappUpdated has copy, drop {
    owner: address,
    slug: String,
}

public struct DappRemoved has copy, drop {
    owner: address,
    slug: String,
}

fun init(ctx: &mut sui::tx_context::TxContext) {
    let registry = DappRegistry {
        id: sui::object::new(ctx),
    };
    sui::transfer::share_object(registry);
}

fun assert_slug(slug: &String) {
    let bytes = string::as_bytes(slug);
    let len = vector::length(bytes);
    assert!(len > 0, E_EMPTY_SLUG);
    assert!(len <= MAX_SLUG_LEN, E_SLUG_TOO_LONG);
    let mut i = 0u64;
    while (i < len) {
        let b = *vector::borrow(bytes, i);
        // a-z, 0-9, or hyphen
        assert!(
            (b >= 97 && b <= 122) ||
            (b >= 48 && b <= 57)  ||
            b == 45,
            E_INVALID_SLUG_CHAR
        );
        i = i + 1;
    };
}

fun assert_metadata_uri(uri: &String) {
    let len = string::length(uri);
    assert!(len > 0, E_EMPTY_METADATA_URI);
    assert!(len <= MAX_METADATA_URI_LEN, E_METADATA_URI_TOO_LONG);
}

fun assert_metadata_hash(hash: &vector<u8>) {
    assert!(vector::length(hash) == METADATA_HASH_LEN, E_METADATA_HASH_LEN);
}

fun assert_categories(categories: &vector<String>) {
    let n = vector::length(categories);
    assert!(n > 0, E_EMPTY_CATEGORIES);
    assert!(n <= MAX_CATEGORIES, E_TOO_MANY_CATEGORIES);
    let mut i = 0u64;
    while (i < n) {
        let c = vector::borrow(categories, i);
        assert!(string::length(c) <= MAX_CATEGORY_LEN, E_CATEGORY_TOO_LONG);

        let mut j = i + 1;
        while (j < n) {
            assert!(c != vector::borrow(categories, j), E_DUPLICATE_CATEGORY);
            j = j + 1;
        };

        i = i + 1;
    };
}

fun assert_listing_exists(registry: &DappRegistry, slug: String) {
    assert!(df::exists_(&registry.id, slug), E_NOT_FOUND);
}

fun register_app_impl(
    registry: &mut DappRegistry,
    slug: String,
    metadata_uri: String,
    metadata_hash: vector<u8>,
    categories: vector<String>,
    _ctx: &mut sui::tx_context::TxContext,
) {
    assert_slug(&slug);
    assert_metadata_uri(&metadata_uri);
    assert_metadata_hash(&metadata_hash);
    assert_categories(&categories);

    assert!(!df::exists_(&registry.id, copy slug), E_DUPLICATE_SLUG);

    let sender = sui::tx_context::sender(_ctx);
    let now = sui::tx_context::epoch(_ctx);
    let slug_for_event = copy slug;
    let slug_for_field = copy slug;

    let listing = DappListing {
        owner: sender,
        slug,
        metadata_uri,
        metadata_hash,
        categories,
        created_at_epoch: now,
        updated_at_epoch: now,
    };

    df::add(&mut registry.id, slug_for_field, listing);

    event::emit(DappRegistered {
        owner: sender,
        slug: slug_for_event,
    });
}

public fun register_app(
    registry: &mut DappRegistry,
    slug: String,
    metadata_uri: String,
    metadata_hash: vector<u8>,
    categories: vector<String>,
    ctx: &mut sui::tx_context::TxContext,
) {
    register_app_impl(registry, slug, metadata_uri, metadata_hash, categories, ctx);
}

public fun update_app(
    registry: &mut DappRegistry,
    slug: String,
    metadata_uri: String,
    metadata_hash: vector<u8>,
    categories: vector<String>,
    ctx: &mut sui::tx_context::TxContext,
) {
    assert_slug(&slug);
    assert_metadata_uri(&metadata_uri);
    assert_metadata_hash(&metadata_hash);
    assert_categories(&categories);
    assert_listing_exists(registry, copy slug);

    let sender = sui::tx_context::sender(ctx);
    let listing = df::borrow_mut<String, DappListing>(&mut registry.id, slug);
    assert!(listing.owner == sender, E_NOT_OWNER);

    listing.metadata_uri = metadata_uri;
    listing.metadata_hash = metadata_hash;
    listing.categories = categories;
    listing.updated_at_epoch = sui::tx_context::epoch(ctx);

    let slug_copy = copy listing.slug;
    event::emit(DappUpdated {
        owner: sender,
        slug: slug_copy,
    });
}

public fun remove_app(registry: &mut DappRegistry, slug: String, ctx: &mut sui::tx_context::TxContext) {
    assert_slug(&slug);
    assert_listing_exists(registry, copy slug);

    let sender = sui::tx_context::sender(ctx);
    let owner_check = {
        let r = df::borrow<String, DappListing>(&registry.id, copy slug);
        r.owner
    };
    assert!(owner_check == sender, E_NOT_OWNER);

    let listing = df::remove<String, DappListing>(&mut registry.id, slug);
    let slug_ev = copy listing.slug;
    let DappListing { owner: _, slug: _, metadata_uri: _, metadata_hash: _, categories: _, created_at_epoch: _, updated_at_epoch: _ } = listing;

    event::emit(DappRemoved {
        owner: sender,
        slug: slug_ev,
    });
}

// === test helpers ===

#[test_only]
public fun init_for_testing(ctx: &mut sui::tx_context::TxContext) {
    let registry = DappRegistry {
        id: sui::object::new(ctx),
    };
    sui::transfer::share_object(registry);
}

#[test_only]
public fun register_app_for_test(
    registry: &mut DappRegistry,
    slug: String,
    metadata_uri: String,
    metadata_hash: vector<u8>,
    categories: vector<String>,
    ctx: &mut sui::tx_context::TxContext,
) {
    register_app_impl(registry, slug, metadata_uri, metadata_hash, categories, ctx);
}

#[test_only]
public fun listing_owner(registry: &DappRegistry, slug: String): address {
    let l = df::borrow<String, DappListing>(&registry.id, slug);
    l.owner
}
