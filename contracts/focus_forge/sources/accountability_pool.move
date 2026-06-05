module focus_forge::accountability_pool {
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::table::{Self, Table};
    use sui::event;
    use sui::clock::{Self, Clock};
    use focus_forge::focus_block::{Self, FocusBlock};

    // Errors
    const EPoolAlreadyStarted: u64 = 1;
    const EAlreadyJoined: u64 = 2;
    const ENotParticipant: u64 = 3;
    const EPoolNotEnded: u64 = 4;
    const EAlreadyClaimed: u64 = 5;
    const EInvalidStake: u64 = 6;
    const ESubmissionWindowClosed: u64 = 7;
    const EInsufficientFocus: u64 = 8;  // FocusBlock shorter than the pool target
    const EWinnersExist: u64 = 10;      // refund only allowed when nobody won

    // Pool States
    const STATE_OPEN: u8 = 0;


    /// Shared object representing an Accountability Pool
    public struct Pool has key {
        id: UID,
        /// The pot of SUI staked by all participants
        pot: Balance<SUI>,
        /// Stake amount per participant (uniform for now)
        stake_amount: u64,
        /// Track participants and their status
        participants: Table<address, bool>, // address -> has_submitted_proof
        /// Who has claimed their rewards
        has_claimed: Table<address, bool>,
        /// Current state of the pool
        state: u8,
        /// When the subscription period ends (Joining allowed until here)
        join_window_end: u64,
        /// When the execution period ends (Work must be done by here)
        end_time: u64,
        /// The target focus duration in milliseconds (e.g., 25 mins)
        target_duration: u64,
        /// Total number of participants
        participant_count: u64,
        /// Number of winners (people who submitted proof)
        winner_count: u64,
    }

    // Events
    public struct PoolCreated has copy, drop {
        pool_id: ID,
        stake_amount: u64,
        join_window_end: u64,
        end_time: u64,
        target_duration: u64
    }

    public struct JoinedPool has copy, drop {
        pool_id: ID,
        participant: address,
        amount: u64
    }

    public struct ProofSubmitted has copy, drop {
        pool_id: ID,
        participant: address
    }

    public struct RewardClaimed has copy, drop {
        pool_id: ID,
        winner: address,
        amount: u64
    }

    /// Create a new pool
    public entry fun create_pool(
        stake_amount: u64,
        join_duration_ms: u64,
        execution_duration_ms: u64,
        target_duration: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let id = object::new(ctx);
        let pool_id = object::uid_to_inner(&id);
        
        let now = clock::timestamp_ms(clock);
        let join_window_end = now + join_duration_ms;
        let end_time = join_window_end + execution_duration_ms;

        let pool = Pool {
            id,
            pot: balance::zero(),
            stake_amount,
            participants: table::new(ctx),
            has_claimed: table::new(ctx),
            state: STATE_OPEN,
            join_window_end,
            end_time,
            target_duration,
            participant_count: 0,
            winner_count: 0,
        };

        event::emit(PoolCreated {
            pool_id,
            stake_amount,
            join_window_end,
            end_time,
            target_duration
        });

        // Share the object so anyone can join
        transfer::share_object(pool);
    }

    /// Join the pool by staking SUI
    public entry fun join_pool(
        pool: &mut Pool,
        payment: &mut Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        let now = clock::timestamp_ms(clock);

        // Validation
        assert!(now < pool.join_window_end, EPoolAlreadyStarted);
        assert!(!table::contains(&pool.participants, sender), EAlreadyJoined);
        assert!(coin::value(payment) >= pool.stake_amount, EInvalidStake);

        // Take stake
        let stake = coin::split(payment, pool.stake_amount, ctx);
        balance::join(&mut pool.pot, coin::into_balance(stake));

        // Register participant
        table::add(&mut pool.participants, sender, false); // false = proof not submitted yet
        pool.participant_count = pool.participant_count + 1;

        event::emit(JoinedPool {
            pool_id: object::id(pool),
            participant: sender,
            amount: pool.stake_amount
        });
    }

    /// Submit a real proof of focus: a FocusBlock the caller owns whose duration
    /// meets the pool's target, submitted during the execution window.
    ///
    /// Ownership is enforced implicitly — a PTB can only pass a FocusBlock the
    /// sender owns. The duration check makes "winning" require an actual
    /// completed focus session rather than a bare function call.
    ///
    /// LIMITATION: a single FocusBlock could satisfy multiple overlapping pools
    /// (the block is referenced, not consumed). Acceptable for now; a stricter
    /// design would burn the block or track per-pool usage.
    public entry fun submit_proof(
        pool: &mut Pool,
        proof: &FocusBlock,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        let now = clock::timestamp_ms(clock);

        assert!(table::contains(&pool.participants, sender), ENotParticipant);
        assert!(now >= pool.join_window_end && now <= pool.end_time, ESubmissionWindowClosed);

        // FocusBlock.duration is in minutes; pool.target_duration is in ms.
        let proof_ms = focus_block::duration(proof) * 60_000;
        assert!(proof_ms >= pool.target_duration, EInsufficientFocus);

        // Mark as winner
        let has_submitted = table::borrow_mut(&mut pool.participants, sender);
        if (*has_submitted == false) {
            *has_submitted = true;
            pool.winner_count = pool.winner_count + 1;

            event::emit(ProofSubmitted {
                pool_id: object::id(pool),
                participant: sender
            });
        };
    }

    /// Claim rewards + returned stake
    /// Winners get their stake back + share of the "Lazy Tax" (losers' stakes)
    public entry fun claim_reward(
        pool: &mut Pool,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        let now = clock::timestamp_ms(clock);

        // Check if pool is ended
        assert!(now > pool.end_time, EPoolNotEnded);
        assert!(table::contains(&pool.participants, sender), ENotParticipant);
        assert!(!table::contains(&pool.has_claimed, sender), EAlreadyClaimed);

        let is_winner = *table::borrow(&pool.participants, sender);
        
        // Only winners can claim
        // If you lost, you get nothing. Lazy Tax.
        if (is_winner) {
            // Calculate share
            // Total Pot = Initial Stakes of All Participants
            // Share = Total Pot / Winner Count
            // Disclaimer: Integer division might leave dust. Valid for hackathon.
            
            // let total_pot_value = balance::value(&pool.pot);
            // We need to be careful not to drain the pot prematurely if we calculate dynamically
            // Better: Calculate share once? No, pot is constant after join period.
            // But we need to ensure everyone gets equal share.
            
            // NOTE: This simple logic assumes all winners claim. 
            // If we just divide current pot by remaining winners, early claimers get less/more?
            // No, total_pot / total_winners is constant.
            
            // Wait, we can't inspect the balance of the shared object purely for calculation if we are modifying it.
            // We need to track the "distributable amount" or calculate it based on (participant_count * stake_amount).
            
            let total_pool_value = pool.participant_count * pool.stake_amount;
            let reward_per_winner = total_pool_value / pool.winner_count;

            let reward = balance::split(&mut pool.pot, reward_per_winner);
            let reward_coin = coin::from_balance(reward, ctx);
            
            transfer::public_transfer(reward_coin, sender);

             event::emit(RewardClaimed {
                pool_id: object::id(pool),
                winner: sender,
                amount: reward_per_winner
            });
        };

        table::add(&mut pool.has_claimed, sender, true);
    }

    /// Reclaim your stake when a pool ended with NO winners.
    ///
    /// Without this, if nobody submitted a valid proof the entire pot would be
    /// locked forever (claim_reward only pays winners). Each participant can pull
    /// back exactly their own stake; pot = participant_count * stake_amount, so
    /// the accounting balances out.
    public entry fun reclaim_stake(
        pool: &mut Pool,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        let now = clock::timestamp_ms(clock);

        assert!(now > pool.end_time, EPoolNotEnded);
        assert!(pool.winner_count == 0, EWinnersExist);
        assert!(table::contains(&pool.participants, sender), ENotParticipant);
        assert!(!table::contains(&pool.has_claimed, sender), EAlreadyClaimed);

        let refund = balance::split(&mut pool.pot, pool.stake_amount);
        transfer::public_transfer(coin::from_balance(refund, ctx), sender);

        table::add(&mut pool.has_claimed, sender, true);

        event::emit(RewardClaimed {
            pool_id: object::id(pool),
            winner: sender,
            amount: pool.stake_amount
        });
    }

    // ======== Getters ========

    public fun winner_count(pool: &Pool): u64 { pool.winner_count }
    public fun participant_count(pool: &Pool): u64 { pool.participant_count }
    public fun pot_value(pool: &Pool): u64 { balance::value(&pool.pot) }
}
