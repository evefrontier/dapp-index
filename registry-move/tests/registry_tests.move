#[test_only]
module dapp_registry::registry_tests;

use std::string;
use sui::test_scenario::Self;
use dapp_registry::registry::{Self, DappRegistry};

const SENDER: address = @0xA;
const OTHER: address = @0xB;

fun sample_hash(): vector<u8> {
    let mut h = vector::empty();
    let mut i = 0u64;
    while (i < 32u64) {
        vector::push_back(&mut h, 0u8);
        i = i + 1u64;
    };
    h
}

fun short_hash(): vector<u8> {
    let mut h = vector::empty();
    vector::push_back(&mut h, 0u8);
    h
}

fun sample_categories(): vector<std::string::String> {
    let mut v = vector::empty();
    vector::push_back(&mut v, string::utf8(b"infrastructure"));
    v
}

fun duplicate_categories(): vector<std::string::String> {
    let mut v = vector::empty();
    vector::push_back(&mut v, string::utf8(b"infrastructure"));
    vector::push_back(&mut v, string::utf8(b"infrastructure"));
    v
}

fun empty_categories(): vector<std::string::String> {
    vector::empty()
}

fun too_many_categories(): vector<std::string::String> {
    let mut v = vector::empty();
    vector::push_back(&mut v, string::utf8(b"one"));
    vector::push_back(&mut v, string::utf8(b"two"));
    vector::push_back(&mut v, string::utf8(b"three"));
    vector::push_back(&mut v, string::utf8(b"four"));
    vector::push_back(&mut v, string::utf8(b"five"));
    vector::push_back(&mut v, string::utf8(b"six"));
    v
}

fun register_sample(reg: &mut DappRegistry, scenario: &mut test_scenario::Scenario) {
    registry::register_app_for_test(
        reg,
        string::utf8(b"my-dapp"),
        string::utf8(b"https://example.com/meta.json"),
        sample_hash(),
        sample_categories(),
        test_scenario::ctx(scenario),
    );
}

#[test]
fun register_and_query_owner() {
    let mut scenario = test_scenario::begin(SENDER);
    registry::init_for_testing(test_scenario::ctx(&mut scenario));
    test_scenario::next_tx(&mut scenario, SENDER);
    {
        let mut reg = test_scenario::take_shared<DappRegistry>(&scenario);
        register_sample(&mut reg, &mut scenario);
        test_scenario::return_shared(reg);
    };
    test_scenario::next_tx(&mut scenario, SENDER);
    {
        let reg = test_scenario::take_shared<DappRegistry>(&scenario);
        assert!(registry::listing_owner(&reg, string::utf8(b"my-dapp")) == SENDER, 0);
        test_scenario::return_shared(reg);
    };
    test_scenario::end(scenario);
}

#[test]
fun update_by_owner_succeeds() {
    let mut scenario = test_scenario::begin(SENDER);
    registry::init_for_testing(test_scenario::ctx(&mut scenario));
    test_scenario::next_tx(&mut scenario, SENDER);
    {
        let mut reg = test_scenario::take_shared<DappRegistry>(&scenario);
        register_sample(&mut reg, &mut scenario);
        registry::update_app(
            &mut reg,
            string::utf8(b"my-dapp"),
            string::utf8(b"https://example.com/updated.json"),
            sample_hash(),
            sample_categories(),
            test_scenario::ctx(&mut scenario),
        );
        test_scenario::return_shared(reg);
    };
    test_scenario::end(scenario);
}

#[test]
fun remove_by_owner_succeeds() {
    let mut scenario = test_scenario::begin(SENDER);
    registry::init_for_testing(test_scenario::ctx(&mut scenario));
    test_scenario::next_tx(&mut scenario, SENDER);
    {
        let mut reg = test_scenario::take_shared<DappRegistry>(&scenario);
        register_sample(&mut reg, &mut scenario);
        registry::remove_app(
            &mut reg,
            string::utf8(b"my-dapp"),
            test_scenario::ctx(&mut scenario),
        );
        test_scenario::return_shared(reg);
    };
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = dapp_registry::registry::E_DUPLICATE_SLUG)]
fun duplicate_slug_aborts() {
    let mut scenario = test_scenario::begin(SENDER);
    registry::init_for_testing(test_scenario::ctx(&mut scenario));
    test_scenario::next_tx(&mut scenario, SENDER);
    {
        let mut reg = test_scenario::take_shared<DappRegistry>(&scenario);
        register_sample(&mut reg, &mut scenario);
        registry::register_app_for_test(
            &mut reg,
            string::utf8(b"my-dapp"),
            string::utf8(b"https://example.com/other.json"),
            sample_hash(),
            sample_categories(),
            test_scenario::ctx(&mut scenario),
        );
        test_scenario::return_shared(reg);
    };
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = dapp_registry::registry::E_NOT_OWNER)]
fun update_by_non_owner_aborts() {
    let mut scenario = test_scenario::begin(SENDER);
    registry::init_for_testing(test_scenario::ctx(&mut scenario));
    test_scenario::next_tx(&mut scenario, SENDER);
    {
        let mut reg = test_scenario::take_shared<DappRegistry>(&scenario);
        register_sample(&mut reg, &mut scenario);
        test_scenario::return_shared(reg);
    };
    test_scenario::next_tx(&mut scenario, OTHER);
    {
        let mut reg = test_scenario::take_shared<DappRegistry>(&scenario);
        registry::update_app(
            &mut reg,
            string::utf8(b"my-dapp"),
            string::utf8(b"https://example.com/updated.json"),
            sample_hash(),
            sample_categories(),
            test_scenario::ctx(&mut scenario),
        );
        test_scenario::return_shared(reg);
    };
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = dapp_registry::registry::E_NOT_OWNER)]
fun remove_by_non_owner_aborts() {
    let mut scenario = test_scenario::begin(SENDER);
    registry::init_for_testing(test_scenario::ctx(&mut scenario));
    test_scenario::next_tx(&mut scenario, SENDER);
    {
        let mut reg = test_scenario::take_shared<DappRegistry>(&scenario);
        register_sample(&mut reg, &mut scenario);
        test_scenario::return_shared(reg);
    };
    test_scenario::next_tx(&mut scenario, OTHER);
    {
        let mut reg = test_scenario::take_shared<DappRegistry>(&scenario);
        registry::remove_app(
            &mut reg,
            string::utf8(b"my-dapp"),
            test_scenario::ctx(&mut scenario),
        );
        test_scenario::return_shared(reg);
    };
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = dapp_registry::registry::E_NOT_FOUND)]
fun update_missing_slug_aborts() {
    let mut scenario = test_scenario::begin(SENDER);
    registry::init_for_testing(test_scenario::ctx(&mut scenario));
    test_scenario::next_tx(&mut scenario, SENDER);
    {
        let mut reg = test_scenario::take_shared<DappRegistry>(&scenario);
        registry::update_app(
            &mut reg,
            string::utf8(b"missing"),
            string::utf8(b"https://example.com/updated.json"),
            sample_hash(),
            sample_categories(),
            test_scenario::ctx(&mut scenario),
        );
        test_scenario::return_shared(reg);
    };
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = dapp_registry::registry::E_NOT_FOUND)]
fun remove_missing_slug_aborts() {
    let mut scenario = test_scenario::begin(SENDER);
    registry::init_for_testing(test_scenario::ctx(&mut scenario));
    test_scenario::next_tx(&mut scenario, SENDER);
    {
        let mut reg = test_scenario::take_shared<DappRegistry>(&scenario);
        registry::remove_app(
            &mut reg,
            string::utf8(b"missing"),
            test_scenario::ctx(&mut scenario),
        );
        test_scenario::return_shared(reg);
    };
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = dapp_registry::registry::E_METADATA_HASH_LEN)]
fun invalid_hash_length_aborts() {
    let mut scenario = test_scenario::begin(SENDER);
    registry::init_for_testing(test_scenario::ctx(&mut scenario));
    test_scenario::next_tx(&mut scenario, SENDER);
    {
        let mut reg = test_scenario::take_shared<DappRegistry>(&scenario);
        registry::register_app_for_test(
            &mut reg,
            string::utf8(b"bad-hash"),
            string::utf8(b"https://example.com/meta.json"),
            short_hash(),
            sample_categories(),
            test_scenario::ctx(&mut scenario),
        );
        test_scenario::return_shared(reg);
    };
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = dapp_registry::registry::E_EMPTY_SLUG)]
fun empty_slug_aborts() {
    let mut scenario = test_scenario::begin(SENDER);
    registry::init_for_testing(test_scenario::ctx(&mut scenario));
    test_scenario::next_tx(&mut scenario, SENDER);
    {
        let mut reg = test_scenario::take_shared<DappRegistry>(&scenario);
        registry::register_app_for_test(
            &mut reg,
            string::utf8(b""),
            string::utf8(b"https://example.com/meta.json"),
            sample_hash(),
            sample_categories(),
            test_scenario::ctx(&mut scenario),
        );
        test_scenario::return_shared(reg);
    };
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = dapp_registry::registry::E_EMPTY_CATEGORIES)]
fun empty_categories_abort() {
    let mut scenario = test_scenario::begin(SENDER);
    registry::init_for_testing(test_scenario::ctx(&mut scenario));
    test_scenario::next_tx(&mut scenario, SENDER);
    {
        let mut reg = test_scenario::take_shared<DappRegistry>(&scenario);
        registry::register_app_for_test(
            &mut reg,
            string::utf8(b"empty-cats"),
            string::utf8(b"https://example.com/meta.json"),
            sample_hash(),
            empty_categories(),
            test_scenario::ctx(&mut scenario),
        );
        test_scenario::return_shared(reg);
    };
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = dapp_registry::registry::E_TOO_MANY_CATEGORIES)]
fun too_many_categories_abort() {
    let mut scenario = test_scenario::begin(SENDER);
    registry::init_for_testing(test_scenario::ctx(&mut scenario));
    test_scenario::next_tx(&mut scenario, SENDER);
    {
        let mut reg = test_scenario::take_shared<DappRegistry>(&scenario);
        registry::register_app_for_test(
            &mut reg,
            string::utf8(b"too-many-cats"),
            string::utf8(b"https://example.com/meta.json"),
            sample_hash(),
            too_many_categories(),
            test_scenario::ctx(&mut scenario),
        );
        test_scenario::return_shared(reg);
    };
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = dapp_registry::registry::E_DUPLICATE_CATEGORY)]
fun duplicate_categories_abort() {
    let mut scenario = test_scenario::begin(SENDER);
    registry::init_for_testing(test_scenario::ctx(&mut scenario));
    test_scenario::next_tx(&mut scenario, SENDER);
    {
        let mut reg = test_scenario::take_shared<DappRegistry>(&scenario);
        registry::register_app_for_test(
            &mut reg,
            string::utf8(b"dup-cats"),
            string::utf8(b"https://example.com/meta.json"),
            sample_hash(),
            duplicate_categories(),
            test_scenario::ctx(&mut scenario),
        );
        test_scenario::return_shared(reg);
    };
    test_scenario::end(scenario);
}
