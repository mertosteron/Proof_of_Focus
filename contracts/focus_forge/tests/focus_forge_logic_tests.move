#[test_only]
module focus_forge::focus_forge_logic_tests {
    use std::string;
    use sui::test_scenario as ts;
    use sui::clock;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;

    use focus_forge::identity::{Self, UserProfile};
    use focus_forge::focus_block;
    use focus_forge::accountability_pool::{Self, Pool};

    const ALICE: address = @0xA11CE;

    // --- identity: stats become user-updatable (no AdminCap) ---

    #[test]
    fun test_mint_and_update_tracks_stats_and_levels_up() {
        let mut sc = ts::begin(ALICE);
        {
            let ctx = ts::ctx(&mut sc);
            identity::create_profile(string::utf8(b"alice"), ctx);
        };

        ts::next_tx(&mut sc, ALICE);
        {
            let mut profile = ts::take_from_sender<UserProfile>(&sc);
            {
                let ctx = ts::ctx(&mut sc);
                // 120 minutes -> 120 XP -> level 2 (1 + 120/100)
                identity::mint_and_update(
                    &mut profile, 120, string::utf8(b"Coding"), vector[], 5, true, ctx
                );
            };
            assert!(identity::profile_total_minutes(&profile) == 120, 0);
            assert!(identity::profile_total_sessions(&profile) == 1, 1);
            assert!(identity::profile_xp(&profile) == 120, 2);
            assert!(identity::profile_level(&profile) == 2, 3);
            ts::return_to_sender(&sc, profile);
        };
        ts::end(sc);
    }

    // --- pool: full happy path with a real FocusBlock proof ---

    #[test]
    fun test_pool_join_proof_and_claim() {
        let mut sc = ts::begin(ALICE);
        let mut clk = clock::create_for_testing(ts::ctx(&mut sc));
        clock::set_for_testing(&mut clk, 1000);

        // create pool: stake 100, join window 5s, exec 10s, target 60_000ms (1 min)
        {
            let ctx = ts::ctx(&mut sc);
            accountability_pool::create_pool(100, 5000, 10000, 60000, &clk, ctx);
        };

        // join during the join window
        ts::next_tx(&mut sc, ALICE);
        {
            let mut pool = ts::take_shared<Pool>(&sc);
            let ctx = ts::ctx(&mut sc);
            let mut payment = coin::mint_for_testing<SUI>(100, ctx);
            accountability_pool::join_pool(&mut pool, &mut payment, &clk, ctx);
            assert!(accountability_pool::participant_count(&pool) == 1, 0);
            coin::burn_for_testing(payment);
            ts::return_shared(pool);
        };

        // execution phase: submit a 25-minute FocusBlock as proof
        clock::set_for_testing(&mut clk, 7000);
        ts::next_tx(&mut sc, ALICE);
        {
            let mut pool = ts::take_shared<Pool>(&sc);
            let ctx = ts::ctx(&mut sc);
            let block = focus_block::new(25, string::utf8(b"Coding"), vector[], 5, true, ctx);
            accountability_pool::submit_proof(&mut pool, &block, &clk, ctx);
            assert!(accountability_pool::winner_count(&pool) == 1, 1);
            focus_block::burn(block);
            ts::return_shared(pool);
        };

        // after end_time: claim reward (1 participant, 1 winner -> full stake back)
        clock::set_for_testing(&mut clk, 17000);
        ts::next_tx(&mut sc, ALICE);
        {
            let mut pool = ts::take_shared<Pool>(&sc);
            let ctx = ts::ctx(&mut sc);
            accountability_pool::claim_reward(&mut pool, &clk, ctx);
            ts::return_shared(pool);
        };
        ts::next_tx(&mut sc, ALICE);
        {
            let reward = ts::take_from_sender<Coin<SUI>>(&sc);
            assert!(coin::value(&reward) == 100, 2);
            coin::burn_for_testing(reward);
        };

        clock::destroy_for_testing(clk);
        ts::end(sc);
    }

    // --- pool: a FocusBlock shorter than the target is rejected ---

    #[test]
    #[expected_failure(abort_code = accountability_pool::EInsufficientFocus)]
    fun test_submit_proof_rejects_short_block() {
        let mut sc = ts::begin(ALICE);
        let mut clk = clock::create_for_testing(ts::ctx(&mut sc));
        clock::set_for_testing(&mut clk, 1000);

        // target 30 minutes = 1_800_000 ms
        {
            let ctx = ts::ctx(&mut sc);
            accountability_pool::create_pool(100, 5000, 10000, 1800000, &clk, ctx);
        };
        ts::next_tx(&mut sc, ALICE);
        {
            let mut pool = ts::take_shared<Pool>(&sc);
            let ctx = ts::ctx(&mut sc);
            let mut payment = coin::mint_for_testing<SUI>(100, ctx);
            accountability_pool::join_pool(&mut pool, &mut payment, &clk, ctx);
            coin::burn_for_testing(payment);
            ts::return_shared(pool);
        };
        clock::set_for_testing(&mut clk, 7000);
        ts::next_tx(&mut sc, ALICE);
        {
            let mut pool = ts::take_shared<Pool>(&sc);
            let ctx = ts::ctx(&mut sc);
            // only a 10-minute block: 10 * 60_000 = 600_000 < 1_800_000 -> abort
            let block = focus_block::new(10, string::utf8(b"Coding"), vector[], 5, true, ctx);
            accountability_pool::submit_proof(&mut pool, &block, &clk, ctx);
            focus_block::burn(block);
            ts::return_shared(pool);
        };
        clock::destroy_for_testing(clk);
        ts::end(sc);
    }

    // --- pool: stakes are refundable when nobody wins (no locked funds) ---

    #[test]
    fun test_reclaim_stake_when_no_winners() {
        let mut sc = ts::begin(ALICE);
        let mut clk = clock::create_for_testing(ts::ctx(&mut sc));
        clock::set_for_testing(&mut clk, 1000);

        {
            let ctx = ts::ctx(&mut sc);
            accountability_pool::create_pool(100, 5000, 10000, 60000, &clk, ctx);
        };
        ts::next_tx(&mut sc, ALICE);
        {
            let mut pool = ts::take_shared<Pool>(&sc);
            let ctx = ts::ctx(&mut sc);
            let mut payment = coin::mint_for_testing<SUI>(100, ctx);
            accountability_pool::join_pool(&mut pool, &mut payment, &clk, ctx);
            coin::burn_for_testing(payment);
            ts::return_shared(pool);
        };

        // never submit proof -> winner_count stays 0. Jump past end_time.
        clock::set_for_testing(&mut clk, 17000);
        ts::next_tx(&mut sc, ALICE);
        {
            let mut pool = ts::take_shared<Pool>(&sc);
            assert!(accountability_pool::winner_count(&pool) == 0, 0);
            let ctx = ts::ctx(&mut sc);
            accountability_pool::reclaim_stake(&mut pool, &clk, ctx);
            assert!(accountability_pool::pot_value(&pool) == 0, 1);
            ts::return_shared(pool);
        };
        ts::next_tx(&mut sc, ALICE);
        {
            let refund = ts::take_from_sender<Coin<SUI>>(&sc);
            assert!(coin::value(&refund) == 100, 2);
            coin::burn_for_testing(refund);
        };
        clock::destroy_for_testing(clk);
        ts::end(sc);
    }
}
