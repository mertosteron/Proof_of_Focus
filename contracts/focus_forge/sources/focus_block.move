module focus_forge::focus_block {
    use std::string::String;
    use sui::event;

    /// The FocusBlock object, representing a completed focus session.
    public struct FocusBlock has key, store {
        id: UID,
        owner: address,
        /// Timestamp when the block was completed (ms)
        timestamp: u64,
        /// Duration of the focus block in minutes (5-90)
        duration: u64,
        /// Category of the task (e.g., "Coding", "Writing")
        category: String,
        /// Signed hash from the desktop app proving integrity
        verification_hash: vector<u8>,
        /// Settings snapshot when this block was created
        idle_threshold: u64, // in minutes
        idle_detection_enabled: bool,
    }
    
    /// User Settings stored on-chain
    public struct UserSettings has key, store {
        id: UID,
        owner: address,
        focus_duration: u64, // default session duration in minutes
        short_break: u64,
        long_break: u64,
        idle_threshold: u64,
        idle_detection_enabled: bool,
        last_updated: u64,
    }

    /// Event emitted when a FocusBlock is minted
    public struct FocusBlockMinted has copy, drop {
        id: ID,
        owner: address,
        duration: u64,
        timestamp: u64,
        category: String,
        idle_detection_enabled: bool,
    }
    
    /// Event emitted when a FocusBlock is burned
    public struct FocusBlockBurned has copy, drop {
        id: ID,
        owner: address,
        duration: u64,
    }
    
    /// Event emitted when settings are created/updated
    public struct SettingsUpdated has copy, drop {
        owner: address,
        focus_duration: u64,
        idle_threshold: u64,
        idle_detection_enabled: bool,
    }

    /// Create user settings
    public entry fun create_settings(
        focus_duration: u64,
        short_break: u64,
        long_break: u64,
        idle_threshold: u64,
        idle_detection_enabled: bool,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        let settings = UserSettings {
            id: object::new(ctx),
            owner: sender,
            focus_duration,
            short_break,
            long_break,
            idle_threshold,
            idle_detection_enabled,
            last_updated: ctx.epoch_timestamp_ms(),
        };
        
        event::emit(SettingsUpdated {
            owner: sender,
            focus_duration,
            idle_threshold,
            idle_detection_enabled,
        });
        
        transfer::transfer(settings, sender);
    }
    
    /// Update user settings
    public entry fun update_settings(
        settings: &mut UserSettings,
        focus_duration: u64,
        short_break: u64,
        long_break: u64,
        idle_threshold: u64,
        idle_detection_enabled: bool,
        ctx: &mut TxContext
    ) {
        settings.focus_duration = focus_duration;
        settings.short_break = short_break;
        settings.long_break = long_break;
        settings.idle_threshold = idle_threshold;
        settings.idle_detection_enabled = idle_detection_enabled;
        settings.last_updated = ctx.epoch_timestamp_ms();
        
        event::emit(SettingsUpdated {
            owner: settings.owner,
            focus_duration,
            idle_threshold,
            idle_detection_enabled,
        });
    }
    
    /// Create a new FocusBlock with settings (returns it, doesn't transfer)
    public fun new(
        duration: u64,
        category: String,
        verification_hash: vector<u8>,
        idle_threshold: u64,
        idle_detection_enabled: bool,
        ctx: &mut TxContext
    ): FocusBlock {
        let sender = ctx.sender();
        let id = object::new(ctx);
        let block_id = object::uid_to_inner(&id);
        
        let block = FocusBlock {
            id,
            owner: sender,
            timestamp: ctx.epoch_timestamp_ms(),
            duration,
            category,
            verification_hash,
            idle_threshold,
            idle_detection_enabled,
        };

        event::emit(FocusBlockMinted {
            id: block_id,
            owner: sender,
            duration,
            timestamp: ctx.epoch_timestamp_ms(),
            category: block.category,
            idle_detection_enabled,
        });

        block
    }

    /// Mint a new FocusBlock with current settings
    public entry fun mint(
        duration: u64,
        category: String,
        verification_hash: vector<u8>,
        idle_threshold: u64,
        idle_detection_enabled: bool,
        ctx: &mut TxContext
    ) {
        let block = new(duration, category, verification_hash, idle_threshold, idle_detection_enabled, ctx);
        transfer::public_transfer(block, ctx.sender());
    }
    
    /// Mint a new FocusBlock using UserSettings
    public entry fun mint_with_settings(
        settings: &UserSettings,
        category: String,
        verification_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        let block = new(
            settings.focus_duration,
            category,
            verification_hash,
            settings.idle_threshold,
            settings.idle_detection_enabled,
            ctx
        );
        transfer::public_transfer(block, ctx.sender());
    }

    /// Burn a FocusBlock (if needed, e.g., for upgrading)
    public entry fun burn(block: FocusBlock) {
        let FocusBlock { 
            id, 
            owner, 
            timestamp: _, 
            duration, 
            category: _, 
            verification_hash: _,
            idle_threshold: _,
            idle_detection_enabled: _
        } = block;
        
        event::emit(FocusBlockBurned {
            id: object::uid_to_inner(&id),
            owner,
            duration,
        });
        
        object::delete(id);
    }
    
    /// Burn old block and mint new one with updated settings (upgrade pattern)
    public entry fun burn_and_remint(
        old_block: FocusBlock,
        settings: &UserSettings,
        category: String,
        verification_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Burn the old block
        burn(old_block);
        
        // Mint new block with current settings
        mint_with_settings(settings, category, verification_hash, ctx);
    }

    /// Accessor for duration
    public fun duration(block: &FocusBlock): u64 {
        block.duration
    }

    /// Accessor for completion timestamp (ms)
    public fun block_timestamp(block: &FocusBlock): u64 {
        block.timestamp
    }
    
    /// Accessor for idle detection status
    public fun idle_detection_enabled(block: &FocusBlock): bool {
        block.idle_detection_enabled
    }
    
    /// Accessor for settings focus duration
    public fun settings_focus_duration(settings: &UserSettings): u64 {
        settings.focus_duration
    }
}
