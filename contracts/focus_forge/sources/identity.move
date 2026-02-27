module focus_forge::identity {
    use std::string::String;
    use sui::event;
    use focus_forge::focus_block::{FocusBlock};
    use focus_forge::skill_badge::{Self, SkillBadge, AdminCap};

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

    /// Update stats after completing a Focus Block
    /// This function should be called in the same PTB as minting, or separately.
    /// It requires the FocusBlock to be passed in (reference) to prove work done.
    /// We assume the FocusBlock was just minted or exists.
    public entry fun update_stats(
        profile: &mut UserProfile,
        block: &FocusBlock,
        badge: &mut SkillBadge,
        progress: &mut focus_forge::skill_badge::SubjectProgress,
        admin_cap: &focus_forge::skill_badge::AdminCap,
        ctx: &mut TxContext
    ) {
        // Rudimentary check: Ensure the block owner matches profile owner?
        // Actually, anyone can update their profile with a block they own.

        // Logic:
        // 1. Add XP (1 min = 1 XP)
        // 2. Add Time
        // 3. Increment Session Count
        
        let duration = focus_forge::focus_block::duration(block);
        
        profile.total_minutes = profile.total_minutes + duration;
        profile.total_sessions = profile.total_sessions + 1;
        profile.xp = profile.xp + duration;

        // Update SkillBadge progress
        focus_forge::skill_badge::update_progress(admin_cap, badge, progress, duration, ctx);

        // Level Up Logic
        // Simple curve: Level = 1 + (XP / 100)
        // e.g. 0-99 XP = Lvl 1. 100-199 XP = Lvl 2.
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

    /// Mint a FocusBlock and update stats in one go
    public entry fun mint_and_update(
        profile: &mut UserProfile,
        badge: &mut SkillBadge,
        progress: &mut focus_forge::skill_badge::SubjectProgress,
        admin_cap: &focus_forge::skill_badge::AdminCap,
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
        update_stats(profile, &block, badge, progress, admin_cap, ctx);
        transfer::public_transfer(block, ctx.sender());
    }
    
    /// Mint a FocusBlock using settings and update stats
    public entry fun mint_with_settings_and_update(
        profile: &mut UserProfile,
        badge: &mut SkillBadge,
        progress: &mut focus_forge::skill_badge::SubjectProgress,
        admin_cap: &focus_forge::skill_badge::AdminCap,
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
            5, // idle_threshold from settings (not exposed yet)
            true, // idle_detection_enabled (not exposed yet)
            ctx
        );
        update_stats(profile, &block, badge, progress, admin_cap, ctx);
        transfer::public_transfer(block, ctx.sender());
    }
}
