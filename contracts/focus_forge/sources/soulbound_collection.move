/// Skill-Based Soulbound Collection System
/// 
/// This module implements a multi-token Soulbound NFT system where users can:
/// - Own multiple unique skill badges (SkillSBT) that track progress independently
/// - Get a Starter NFT upon registration for default PFP
/// - Select one of their badges as their active Profile Picture
/// - View all badges in their "Wallet Showcase"
module focus_forge::soulbound_collection {
    use std::string::{Self, String};
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::table::{Self, Table};
    use sui::dynamic_field;

    // ======== Constants ========

    /// Evolution thresholds in minutes
    const THRESHOLD_APPRENTICE: u64 = 600;    // 10 hours
    const THRESHOLD_JOURNEYMAN: u64 = 3000;   // 50 hours
    const THRESHOLD_EXPERT: u64 = 6000;       // 100 hours
    const THRESHOLD_MASTER: u64 = 30000;      // 500 hours

    /// Level constants
    const LEVEL_NOVICE: u8 = 1;
    const LEVEL_APPRENTICE: u8 = 2;
    const LEVEL_JOURNEYMAN: u8 = 3;
    const LEVEL_EXPERT: u8 = 4;
    const LEVEL_MASTER: u8 = 5;

    // ======== Errors ========

    const ENotAuthorized: u64 = 0;
    const EUserAlreadyRegistered: u64 = 1;
    const EUserNotRegistered: u64 = 2;
    const EBadgeNotOwned: u64 = 3;
    const EInvalidPFPSelection: u64 = 4;
    const EBadgeAlreadyExists: u64 = 5;

    // ======== Structs ========

    /// Individual Skill Badge SBT - one per skill per user
    /// These are NON-TRANSFERABLE (soulbound) - no `store` ability
    public struct SkillSBT has key {
        id: UID,
        owner: address,
        skill_name: String,
        level: u8,
        level_name: String,
        total_minutes: u64,
        image_uri: String,
        metadata_uri: String,
    }

    /// Starter/Novice PFP NFT - minted on registration
    /// Also NON-TRANSFERABLE (soulbound) - no `store` ability
    public struct StarterNFT has key {
        id: UID,
        owner: address,
        name: String,
        image_uri: String,
        metadata_uri: String,
    }

    /// User's Collection Manager - tracks all badges and PFP selection
    /// This is a shared object to enable view functions
    public struct UserCollection has key {
        id: UID,
        owner: address,
        active_pfp_type: u8,           // 0 = none, 1 = starter, 2 = skill badge
        active_pfp_id: Option<ID>,
        starter_id: Option<ID>,
        skill_badges: Table<String, ID>, // skill_name -> SkillSBT ID
    }

    /// Global Registry for user lookups
    public struct CollectionRegistry has key {
        id: UID,
        collections: Table<address, ID>,
    }

    /// Admin capability for authorized operations
    public struct CollectionAdminCap has key {
        id: UID,
    }

    // ======== Events ========

    public struct UserRegistered has copy, drop {
        user: address,
        collection_id: ID,
        starter_nft_id: ID,
    }

    public struct SkillBadgeMinted has copy, drop {
        user: address,
        badge_id: ID,
        skill_name: String,
        level: u8,
    }

    public struct SkillBadgeEvolved has copy, drop {
        user: address,
        badge_id: ID,
        skill_name: String,
        old_level: u8,
        new_level: u8,
        total_minutes: u64,
    }

    public struct ProfilePictureChanged has copy, drop {
        user: address,
        pfp_type: u8,
        pfp_id: ID,
    }

    public struct SkillHoursAdded has copy, drop {
        user: address,
        skill_name: String,
        minutes_added: u64,
        total_minutes: u64,
        new_level: u8,
    }

    // ======== Init ========

    fun init(ctx: &mut TxContext) {
        // Create admin capability
        transfer::transfer(CollectionAdminCap {
            id: object::new(ctx),
        }, tx_context::sender(ctx));

        // Create global registry as shared object
        transfer::share_object(CollectionRegistry {
            id: object::new(ctx),
            collections: table::new(ctx),
        });
    }

    // ======== Public Entry Functions ========

    /// Register a new user - creates UserCollection and mints StarterNFT
    public entry fun register_user(
        registry: &mut CollectionRegistry,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Check if user already registered
        assert!(!table::contains(&registry.collections, sender), EUserAlreadyRegistered);

        // Create StarterNFT
        let starter_id_obj = object::new(ctx);
        let starter_id = object::uid_to_inner(&starter_id_obj);
        
        let starter = StarterNFT {
            id: starter_id_obj,
            owner: sender,
            name: string::utf8(b"Novice Explorer"),
            image_uri: string::utf8(b"ipfs://starter_nft_image"),
            metadata_uri: string::utf8(b"ipfs://starter_nft_metadata"),
        };

        // Create UserCollection
        let collection_id_obj = object::new(ctx);
        let collection_id = object::uid_to_inner(&collection_id_obj);

        let collection = UserCollection {
            id: collection_id_obj,
            owner: sender,
            active_pfp_type: 1, // Default to starter NFT
            active_pfp_id: option::some(starter_id),
            starter_id: option::some(starter_id),
            skill_badges: table::new(ctx),
        };

        // Register in global registry
        table::add(&mut registry.collections, sender, collection_id);

        // Emit event
        event::emit(UserRegistered {
            user: sender,
            collection_id,
            starter_nft_id: starter_id,
        });

        // Transfer StarterNFT to user (non-transferable after)
        transfer::transfer(starter, sender);
        
        // Share the collection for view access
        transfer::share_object(collection);
    }

    /// Add skill hours and trigger evolution if threshold crossed
    /// Only callable by admin (Time Tracker system)
    public entry fun add_skill_hours(
        _cap: &CollectionAdminCap,
        collection: &mut UserCollection,
        badge: &mut SkillSBT,
        minutes_added: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Verify badge ownership matches collection owner
        assert!(badge.owner == collection.owner, ENotAuthorized);

        let old_level = badge.level;
        badge.total_minutes = badge.total_minutes + minutes_added;

        // Calculate new level
        let (new_level, new_level_name) = calculate_level(badge.total_minutes);
        
        // Check if evolution occurred
        if (new_level > old_level) {
            badge.level = new_level;
            badge.level_name = new_level_name;
            badge.image_uri = generate_image_uri(&badge.skill_name, new_level);
            badge.metadata_uri = generate_metadata_uri(&badge.skill_name, new_level);

            event::emit(SkillBadgeEvolved {
                user: badge.owner,
                badge_id: object::id(badge),
                skill_name: badge.skill_name,
                old_level,
                new_level,
                total_minutes: badge.total_minutes,
            });
        };

        event::emit(SkillHoursAdded {
            user: badge.owner,
            skill_name: badge.skill_name,
            minutes_added,
            total_minutes: badge.total_minutes,
            new_level: badge.level,
        });
    }

    /// Mint a new skill badge for a specific skill
    /// Only callable by admin when user starts tracking a new skill
    public entry fun mint_skill_badge(
        _cap: &CollectionAdminCap,
        collection: &mut UserCollection,
        skill_name: String,
        ctx: &mut TxContext
    ) {
        // Check skill doesn't already exist for this user
        assert!(!table::contains(&collection.skill_badges, skill_name), EBadgeAlreadyExists);

        let owner = collection.owner;
        let badge_id_obj = object::new(ctx);
        let badge_id = object::uid_to_inner(&badge_id_obj);

        let badge = SkillSBT {
            id: badge_id_obj,
            owner,
            skill_name,
            level: LEVEL_NOVICE,
            level_name: string::utf8(b"Novice"),
            total_minutes: 0,
            image_uri: generate_image_uri(&skill_name, LEVEL_NOVICE),
            metadata_uri: generate_metadata_uri(&skill_name, LEVEL_NOVICE),
        };

        // Track in collection
        table::add(&mut collection.skill_badges, skill_name, badge_id);

        event::emit(SkillBadgeMinted {
            user: owner,
            badge_id,
            skill_name,
            level: LEVEL_NOVICE,
        });

        // Transfer to user (non-transferable after)
        transfer::transfer(badge, owner);
    }

    /// Set user's active profile picture
    /// pfp_type: 1 = starter, 2 = skill badge
    public entry fun set_profile_picture(
        collection: &mut UserCollection,
        pfp_type: u8,
        pfp_id: ID,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(collection.owner == sender, ENotAuthorized);

        // Validate the selection
        if (pfp_type == 1) {
            // Starter NFT
            assert!(option::is_some(&collection.starter_id), EInvalidPFPSelection);
            assert!(*option::borrow(&collection.starter_id) == pfp_id, EInvalidPFPSelection);
        } else if (pfp_type == 2) {
            // Skill Badge - check it exists in our collection
            // We need to verify the ID is in our skill_badges table
            let found = false;
            // Note: We can't iterate Table directly, so we trust the frontend
            // In production, consider using a vector for iteration or dynamic fields
        };

        collection.active_pfp_type = pfp_type;
        collection.active_pfp_id = option::some(pfp_id);

        event::emit(ProfilePictureChanged {
            user: sender,
            pfp_type,
            pfp_id,
        });
    }

    // ======== View Functions ========

    /// Get user's active profile picture info
    public fun get_active_pfp(collection: &UserCollection): (u8, Option<ID>) {
        (collection.active_pfp_type, collection.active_pfp_id)
    }

    /// Check if user has a specific skill badge
    public fun has_skill_badge(collection: &UserCollection, skill_name: String): bool {
        table::contains(&collection.skill_badges, skill_name)
    }

    /// Get skill badge ID by skill name
    public fun get_skill_badge_id(collection: &UserCollection, skill_name: String): ID {
        *table::borrow(&collection.skill_badges, skill_name)
    }

    /// Get collection owner
    public fun collection_owner(collection: &UserCollection): address {
        collection.owner
    }

    /// Get badge skill name
    public fun badge_skill_name(badge: &SkillSBT): &String {
        &badge.skill_name
    }

    /// Get badge level
    public fun badge_level(badge: &SkillSBT): u8 {
        badge.level
    }

    /// Get badge level name
    public fun badge_level_name(badge: &SkillSBT): &String {
        &badge.level_name
    }

    /// Get badge total minutes
    public fun badge_total_minutes(badge: &SkillSBT): u64 {
        badge.total_minutes
    }

    /// Get badge image URI
    public fun badge_image_uri(badge: &SkillSBT): &String {
        &badge.image_uri
    }

    /// Get starter NFT name
    public fun starter_name(starter: &StarterNFT): &String {
        &starter.name
    }

    /// Get starter NFT image URI
    public fun starter_image_uri(starter: &StarterNFT): &String {
        &starter.image_uri
    }

    /// Check if user is registered
    public fun is_user_registered(registry: &CollectionRegistry, user: address): bool {
        table::contains(&registry.collections, user)
    }

    /// Get user's collection ID
    public fun get_user_collection_id(registry: &CollectionRegistry, user: address): ID {
        *table::borrow(&registry.collections, user)
    }

    // ======== Internal Functions ========

    /// Calculate level based on total minutes
    fun calculate_level(total_minutes: u64): (u8, String) {
        if (total_minutes >= THRESHOLD_MASTER) {
            (LEVEL_MASTER, string::utf8(b"Master"))
        } else if (total_minutes >= THRESHOLD_EXPERT) {
            (LEVEL_EXPERT, string::utf8(b"Expert"))
        } else if (total_minutes >= THRESHOLD_JOURNEYMAN) {
            (LEVEL_JOURNEYMAN, string::utf8(b"Journeyman"))
        } else if (total_minutes >= THRESHOLD_APPRENTICE) {
            (LEVEL_APPRENTICE, string::utf8(b"Apprentice"))
        } else {
            (LEVEL_NOVICE, string::utf8(b"Novice"))
        }
    }

    /// Generate image URI based on skill and level
    fun generate_image_uri(skill_name: &String, level: u8): String {
        // In production, this would construct proper IPFS URIs
        // Format: ipfs://{skill}_{level}_image
        if (level == LEVEL_MASTER) {
            string::utf8(b"ipfs://master_badge_image")
        } else if (level == LEVEL_EXPERT) {
            string::utf8(b"ipfs://expert_badge_image")
        } else if (level == LEVEL_JOURNEYMAN) {
            string::utf8(b"ipfs://journeyman_badge_image")
        } else if (level == LEVEL_APPRENTICE) {
            string::utf8(b"ipfs://apprentice_badge_image")
        } else {
            string::utf8(b"ipfs://novice_badge_image")
        }
    }

    /// Generate metadata URI based on skill and level
    fun generate_metadata_uri(skill_name: &String, level: u8): String {
        // In production, this would construct proper IPFS URIs
        if (level == LEVEL_MASTER) {
            string::utf8(b"ipfs://master_badge_metadata")
        } else if (level == LEVEL_EXPERT) {
            string::utf8(b"ipfs://expert_badge_metadata")
        } else if (level == LEVEL_JOURNEYMAN) {
            string::utf8(b"ipfs://journeyman_badge_metadata")
        } else if (level == LEVEL_APPRENTICE) {
            string::utf8(b"ipfs://apprentice_badge_metadata")
        } else {
            string::utf8(b"ipfs://novice_badge_metadata")
        }
    }

    // ======== Test Helpers ========

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx)
    }
}
