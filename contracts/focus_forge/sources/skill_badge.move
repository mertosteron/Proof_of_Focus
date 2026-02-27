
// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/// The `skill_badge` module implements a Soulbound, dynamic NFT that evolves based on a user's logged time in various skills.
/// This NFT serves as an on-chain representation of a user's learning journey, starting as a "Seed" and evolving
/// as they accumulate hours in different subjects.
module focus_forge::skill_badge {
    use std::string::{Self, String};
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;

    // ======== Constants ========

    /// Placeholder for the "Seed" or "Novice" level.
    const SEED_LEVEL: u8 = 0;
    /// The NFT is not for sale.
    const NFT_NOT_FOR_SALE: u64 = 0;

    // ======== Structs ========

    /// Represents the Soulbound "Skill Evolution" NFT.
    /// It is non-transferable and its metadata changes based on the holder's progress.
    public struct SkillBadge has key, store {
        id: UID,
        /// A textual representation of the dominant skill (e.g., "Python", "Design").
        dominant_subject: String,
        /// The current evolution level of the badge.
        level: u8,
        /// The URI for the NFT's metadata, which can point to an off-chain JSON file.
        /// This URI will be updated to reflect the NFT's visual evolution.
        metadata_uri: String,
    }

    /// A record of hours spent on a specific subject.
    public struct SubjectProgress has key, store {
        id: UID,
        subject: String,
        minutes: u64,
    }

    /// Capability that grants administrative privileges over the SkillBadge logic.
    /// This is used to restrict functions like `update_progress` to the dApp's core logic.
    public struct AdminCap has key {
        id: UID,
    }

    // ======== Events ========

    /// Emitted when a new SkillBadge is minted.
    public struct BadgeMinted has copy, drop {
        badge_id: ID,
        recipient: address,
    }

    /// Emitted when a user's progress is updated.
    public struct ProgressUpdated has copy, drop {
        recipient: address,
        subject: String,
        total_minutes: u64,
    }

    // ======== Init ========

    /// Initializes the module and creates the administrative capability object.
    /// This function is called only once when the module is published.
    fun init(ctx: &mut TxContext) {
        transfer::transfer(AdminCap {
            id: object::new(ctx),
        }, tx_context::sender(ctx))
    }

    // ======== Public Functions ========

    /// Mints a new "Seed" level SkillBadge for a user.
    /// This is the entry point for a new user into the Skill Evolution ecosystem.
    public fun mint_seed_badge(recipient: address, ctx: &mut TxContext) {
        let badge_id = object::new(ctx);

        event::emit(BadgeMinted {
            badge_id: object::uid_to_inner(&badge_id),
            recipient,
        });

        transfer::transfer(SkillBadge {
            id: badge_id,
            dominant_subject: string::utf8(b"Seed"),
            level: SEED_LEVEL,
            metadata_uri: string::utf8(b"ipfs://seed_metadata_uri"), // Placeholder URI
        }, recipient)
    }

    /// Updates a user's progress in a specific subject.
    /// This function is restricted to the holder of the `AdminCap`.
    public entry fun update_progress(
        _cap: &AdminCap,
        badge: &mut SkillBadge,
        progress: &mut SubjectProgress,
        minutes_added: u64,
        ctx: &mut TxContext
    ) {
        progress.minutes = progress.minutes + minutes_added;

        // The evolution logic determines the new level and dominant subject.
        let (new_level, new_dominant_subject) = evolve(progress.minutes, progress.subject);
        badge.level = new_level;
        badge.dominant_subject = new_dominant_subject;

        // Update the metadata URI to reflect the new state.
        badge.metadata_uri = generate_metadata_uri(new_level, &badge.dominant_subject);

        event::emit(ProgressUpdated {
            recipient: tx_context::sender(ctx),
            subject: progress.subject,
            total_minutes: progress.minutes,
        });
    }

    /// Contains the logic for the NFT's evolution based on accumulated minutes.
    /// This is where the thresholds for different levels are defined.
    /// EVOLUTION TIERS:
    ///   Level 1: 0 - 10 hours (0 - 600 minutes)
    ///   Level 2: 10+ hours (600+ minutes)
    ///   Level 3: 50+ hours (3000+ minutes)
    ///   Level 4: 100+ hours (6000+ minutes)
    ///   Level 5: 200+ hours (12000+ minutes)
    ///   Level 6: 500+ hours (30000+ minutes) - MAX
    fun evolve(total_minutes: u64, subject: String): (u8, String) {
        if (total_minutes >= 30000) { // 500 hours
            (6, subject) // Level 6: Grandmaster (MAX)
        } else if (total_minutes >= 12000) { // 200 hours
            (5, subject) // Level 5: Legend
        } else if (total_minutes >= 6000) { // 100 hours
            (4, subject) // Level 4: Expert
        } else if (total_minutes >= 3000) { // 50 hours
            (3, subject) // Level 3: Master
        } else if (total_minutes >= 600) { // 10 hours
            (2, subject) // Level 2: Apprentice
        } else {
            (1, string::utf8(b"Novice")) // Level 1: Novice
        }
    }

    /// Generates a new metadata URI based on the NFT's current level and dominant subject.
    /// This function would typically point to different IPFS URLs for each combination.
    fun generate_metadata_uri(level: u8, _subject: &String): String {
        // In a real implementation, this would be a more complex function,
        // potentially using a lookup table or string concatenation to build the URI.
        if (level == 6) {
            string::utf8(b"ipfs://grandmaster_uri")
        } else if (level == 5) {
            string::utf8(b"ipfs://legend_uri")
        } else if (level == 4) {
            string::utf8(b"ipfs://expert_uri")
        } else if (level == 3) {
            string::utf8(b"ipfs://master_uri")
        } else if (level == 2) {
            string::utf8(b"ipfs://apprentice_uri")
        } else {
            string::utf8(b"ipfs://novice_uri")
        }
    }

    // ======== DEBUG FUNCTIONS ========
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // !!! REMOVE THIS ENTIRE SECTION BEFORE MAINNET DEPLOYMENT !!!
    // !!! These functions are for TESTING ONLY and allow arbitrary state changes.
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    /// DEBUG ONLY: Sets a user's accumulated minutes for a topic directly.
    /// This bypasses normal progression and immediately triggers evolution check.
    /// 
    /// @param _cap - Admin capability (required for access control)
    /// @param badge - The user's SkillBadge NFT to update
    /// @param progress - The SubjectProgress object to modify
    /// @param new_minutes - The new total minutes to set (NOT add, but SET)
    public entry fun debug_set_user_hours(
        _cap: &AdminCap,
        badge: &mut SkillBadge,
        progress: &mut SubjectProgress,
        new_minutes: u64,
        ctx: &mut TxContext
    ) {
        // Directly set the minutes (not add)
        progress.minutes = new_minutes;

        // Trigger evolution check
        let (new_level, new_dominant_subject) = evolve(progress.minutes, progress.subject);
        badge.level = new_level;
        badge.dominant_subject = new_dominant_subject;
        badge.metadata_uri = generate_metadata_uri(new_level, &badge.dominant_subject);

        // Emit event so frontend can track
        event::emit(ProgressUpdated {
            recipient: tx_context::sender(ctx),
            subject: progress.subject,
            total_minutes: progress.minutes,
        });
    }

    /// DEBUG ONLY: Preset to jump to just before Level 3 threshold (49 hours = 2940 minutes)
    public entry fun debug_preset_49h(
        cap: &AdminCap,
        badge: &mut SkillBadge,
        progress: &mut SubjectProgress,
        ctx: &mut TxContext
    ) {
        debug_set_user_hours(cap, badge, progress, 2940, ctx); // 49 hours
    }

    /// DEBUG ONLY: Preset to jump to just before Level 4 threshold (99 hours = 5940 minutes)
    public entry fun debug_preset_99h(
        cap: &AdminCap,
        badge: &mut SkillBadge,
        progress: &mut SubjectProgress,
        ctx: &mut TxContext
    ) {
        debug_set_user_hours(cap, badge, progress, 5940, ctx); // 99 hours
    }

    /// DEBUG ONLY: Preset to jump to just before Level 5 threshold (199 hours = 11940 minutes)
    public entry fun debug_preset_199h(
        cap: &AdminCap,
        badge: &mut SkillBadge,
        progress: &mut SubjectProgress,
        ctx: &mut TxContext
    ) {
        debug_set_user_hours(cap, badge, progress, 11940, ctx); // 199 hours
    }

    // ======== END DEBUG FUNCTIONS ========

    // ======== Getters ========

    /// Returns the dominant subject of a SkillBadge.
    public fun dominant_subject(badge: &SkillBadge): &String {
        &badge.dominant_subject
    }

    /// Returns the level of a SkillBadge.
    public fun level(badge: &SkillBadge): u8 {
        badge.level
    }

    /// Returns the metadata URI of a SkillBadge.
    public fun metadata_uri(badge: &SkillBadge): &String {
        &badge.metadata_uri
    }
}
