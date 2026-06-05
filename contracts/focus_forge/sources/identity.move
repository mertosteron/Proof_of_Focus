module focus_forge::identity {
    use std::string::String;
    use sui::event;
    use focus_forge::focus_block::{FocusBlock};

    // Errors
    const EProfileAlreadyExists: u64 = 1;

    /// UserProfile object to track stats and reputation
    public struct UserProfile has key, store {
        id: UID,
        owner: address,
        username: String,
        total_minutes: u64,
        total_sessions: u64,
        level: u64,
        xp: u64,
    }

    // Events
    public struct ProfileCreated has copy, drop {
        profile_id: ID,
        owner: address,
        username: String
    }

    public struct LevelUp has copy, drop {
        profile_id: ID,
        owner: address,
        new_level: u64
    }

    /// Create a new profile for the sender
    public entry fun create_profile(
        username: String,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        // Ideally we would enforce one profile per address, but that requires a registry or table.
        // For this hackathon version, we'll just let them create one and they can choose which to use.
        // Or we could use a shared object registry, but let's keep it simple: Owned Object.

        let id = object::new(ctx);
        let profile_id = object::uid_to_inner(&id);

        let profile = UserProfile {
            id,
            owner: sender,
            username,
            total_minutes: 0,
            total_sessions: 0,
            level: 1,
            xp: 0,
        };

        event::emit(ProfileCreated {
            profile_id,
            owner: sender,
            username
        });

        // Mint a new SkillBadge for the user
        focus_forge::skill_badge::mint_seed_badge(sender, ctx);

        transfer::transfer(profile, sender);
    }

    /// Update profile stats from a completed Focus Block.
    ///
    /// NOTE: This is intentionally a private helper that operates ONLY on the
    /// caller's own UserProfile + a FocusBlock. The previous version required a
    /// SkillBadge, a SubjectProgress and an `AdminCap` — but the AdminCap is
    /// init-transferred to the deployer, so no end user could ever update their
    /// own stats. SkillBadge evolution is now decoupled from the core stat loop;
    /// the seed badge minted in `create_profile` remains as a cosmetic token.
    fun update_stats(profile: &mut UserProfile, block: &FocusBlock) {
        // 1 minute of focus = 1 XP, 1 minute of tracked time, 1 session.
        let duration = focus_forge::focus_block::duration(block);

        profile.total_minutes = profile.total_minutes + duration;
        profile.total_sessions = profile.total_sessions + 1;
        profile.xp = profile.xp + duration;

        // Level curve: Level = 1 + (XP / 100). 0-99 XP = Lvl 1, 100-199 = Lvl 2, ...
        let new_level = 1 + (profile.xp / 100);

        if (new_level > profile.level) {
            profile.level = new_level;
            event::emit(LevelUp {
                profile_id: object::id(profile),
                owner: profile.owner,
                new_level
            });
        };
    }

    /// Mint a FocusBlock and update the caller's profile stats in one PTB.
    /// Callable by any user on their own profile — no capability required.
    public entry fun mint_and_update(
        profile: &mut UserProfile,
        duration: u64,
        category: String,
        verification_hash: vector<u8>,
        idle_threshold: u64,
        idle_detection_enabled: bool,
        ctx: &mut TxContext
    ) {
        let block = focus_forge::focus_block::new(
            duration,
            category,
            verification_hash,
            idle_threshold,
            idle_detection_enabled,
            ctx
        );
        update_stats(profile, &block);
        transfer::public_transfer(block, ctx.sender());
    }

    /// Mint a FocusBlock using on-chain UserSettings and update stats.
    public entry fun mint_with_settings_and_update(
        profile: &mut UserProfile,
        settings: &focus_forge::focus_block::UserSettings,
        category: String,
        verification_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        let duration = focus_forge::focus_block::settings_focus_duration(settings);
        let block = focus_forge::focus_block::new(
            duration,
            category,
            verification_hash,
            5, // idle_threshold (settings getter not exposed yet)
            true, // idle_detection_enabled (settings getter not exposed yet)
            ctx
        );
        update_stats(profile, &block);
        transfer::public_transfer(block, ctx.sender());
    }

    // ======== Getters ========

    public fun profile_level(p: &UserProfile): u64 { p.level }
    public fun profile_xp(p: &UserProfile): u64 { p.xp }
    public fun profile_total_minutes(p: &UserProfile): u64 { p.total_minutes }
    public fun profile_total_sessions(p: &UserProfile): u64 { p.total_sessions }
}
