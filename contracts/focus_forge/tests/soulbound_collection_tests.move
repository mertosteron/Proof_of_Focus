#[test_only]
module focus_forge::soulbound_collection_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::test_utils;
    use std::string;
    use focus_forge::soulbound_collection::{
        Self,
        CollectionRegistry,
        CollectionAdminCap,
        UserCollection,
        SkillSBT,
        StarterNFT
    };

    const ADMIN: address = @0xAD;
    const USER1: address = @0x1;
    const USER2: address = @0x2;

    fun setup_test(): Scenario {
        let mut scenario = ts::begin(ADMIN);
        {
            soulbound_collection::init_for_testing(ts::ctx(&mut scenario));
        };
        scenario
    }

    #[test]
    fun test_register_user() {
        let mut scenario = setup_test();
        
        // Admin gets the admin cap
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<CollectionAdminCap>(&scenario);
            ts::return_to_sender(&scenario, admin_cap);
        };

        // User1 registers
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<CollectionRegistry>(&scenario);
            soulbound_collection::register_user(&mut registry, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        // Check user got StarterNFT
        ts::next_tx(&mut scenario, USER1);
        {
            let starter = ts::take_from_sender<StarterNFT>(&scenario);
            assert!(soulbound_collection::starter_name(&starter) == &string::utf8(b"Novice Explorer"), 0);
            ts::return_to_sender(&scenario, starter);
        };

        // Check UserCollection was created
        ts::next_tx(&mut scenario, USER1);
        {
            let collection = ts::take_shared<UserCollection>(&scenario);
            assert!(soulbound_collection::collection_owner(&collection) == USER1, 1);
            ts::return_shared(collection);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_mint_skill_badge() {
        let mut scenario = setup_test();
        
        // Setup: Admin gets cap, User registers
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<CollectionAdminCap>(&scenario);
            ts::return_to_sender(&scenario, admin_cap);
        };

        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<CollectionRegistry>(&scenario);
            soulbound_collection::register_user(&mut registry, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        // Admin mints a Python badge for User1
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<CollectionAdminCap>(&scenario);
            let mut collection = ts::take_shared<UserCollection>(&scenario);
            
            soulbound_collection::mint_skill_badge(
                &admin_cap,
                &mut collection,
                string::utf8(b"Python"),
                ts::ctx(&mut scenario)
            );
            
            // Check badge is tracked
            assert!(soulbound_collection::has_skill_badge(&collection, string::utf8(b"Python")), 2);
            
            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(collection);
        };

        // User1 should have the badge
        ts::next_tx(&mut scenario, USER1);
        {
            let badge = ts::take_from_sender<SkillSBT>(&scenario);
            assert!(soulbound_collection::badge_skill_name(&badge) == &string::utf8(b"Python"), 3);
            assert!(soulbound_collection::badge_level(&badge) == 1, 4); // Novice
            assert!(soulbound_collection::badge_total_minutes(&badge) == 0, 5);
            ts::return_to_sender(&scenario, badge);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_skill_evolution() {
        let mut scenario = setup_test();
        
        // Setup
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<CollectionRegistry>(&scenario);
            soulbound_collection::register_user(&mut registry, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<CollectionAdminCap>(&scenario);
            let mut collection = ts::take_shared<UserCollection>(&scenario);
            
            soulbound_collection::mint_skill_badge(
                &admin_cap,
                &mut collection,
                string::utf8(b"Move"),
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(collection);
        };

        // Add hours to trigger evolution to Apprentice (600 minutes = 10 hours)
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<CollectionAdminCap>(&scenario);
            let mut collection = ts::take_shared<UserCollection>(&scenario);
            let mut badge = ts::take_from_address<SkillSBT>(&scenario, USER1);
            
            soulbound_collection::add_skill_hours(
                &admin_cap,
                &mut collection,
                &mut badge,
                600, // 10 hours
                ts::ctx(&mut scenario)
            );
            
            // Check evolution to Apprentice
            assert!(soulbound_collection::badge_level(&badge) == 2, 6);
            assert!(soulbound_collection::badge_level_name(&badge) == &string::utf8(b"Apprentice"), 7);
            assert!(soulbound_collection::badge_total_minutes(&badge) == 600, 8);
            
            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(collection);
            ts::return_to_address(USER1, badge);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_set_profile_picture() {
        let mut scenario = setup_test();
        
        // Setup: Register user and mint a badge
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<CollectionRegistry>(&scenario);
            soulbound_collection::register_user(&mut registry, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<CollectionAdminCap>(&scenario);
            let mut collection = ts::take_shared<UserCollection>(&scenario);
            
            soulbound_collection::mint_skill_badge(
                &admin_cap,
                &mut collection,
                string::utf8(b"Design"),
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(collection);
        };

        // Get badge ID
        ts::next_tx(&mut scenario, USER1);
        {
            let badge = ts::take_from_sender<SkillSBT>(&scenario);
            let badge_id = object::id(&badge);
            ts::return_to_sender(&scenario, badge);

            // Set PFP to the skill badge
            let mut collection = ts::take_shared<UserCollection>(&scenario);
            soulbound_collection::set_profile_picture(
                &mut collection,
                2, // Skill badge type
                badge_id,
                ts::ctx(&mut scenario)
            );
            
            let (pfp_type, pfp_id) = soulbound_collection::get_active_pfp(&collection);
            assert!(pfp_type == 2, 9);
            assert!(option::is_some(&pfp_id), 10);
            
            ts::return_shared(collection);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = soulbound_collection::EUserAlreadyRegistered)]
    fun test_cannot_register_twice() {
        let mut scenario = setup_test();
        
        // User1 registers
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<CollectionRegistry>(&scenario);
            soulbound_collection::register_user(&mut registry, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        // User1 tries to register again - should fail
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<CollectionRegistry>(&scenario);
            soulbound_collection::register_user(&mut registry, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = soulbound_collection::EBadgeAlreadyExists)]
    fun test_cannot_mint_duplicate_badge() {
        let mut scenario = setup_test();
        
        // Setup
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<CollectionRegistry>(&scenario);
            soulbound_collection::register_user(&mut registry, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        // Mint Python badge
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<CollectionAdminCap>(&scenario);
            let mut collection = ts::take_shared<UserCollection>(&scenario);
            
            soulbound_collection::mint_skill_badge(
                &admin_cap,
                &mut collection,
                string::utf8(b"Python"),
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(collection);
        };

        // Try to mint Python badge again - should fail
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<CollectionAdminCap>(&scenario);
            let mut collection = ts::take_shared<UserCollection>(&scenario);
            
            soulbound_collection::mint_skill_badge(
                &admin_cap,
                &mut collection,
                string::utf8(b"Python"),
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(collection);
        };

        ts::end(scenario);
    }
}
