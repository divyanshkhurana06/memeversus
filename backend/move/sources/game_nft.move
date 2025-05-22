module 0x0::game_nft {
    use std::string::{String, utf8};
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::table::{Self, Table};
    use sui::vec_map;
    use sui::vec_map::VecMap;
    use sui::clock::{Self, Clock};

    // === Constants ===
    const ENotAuthorized: u64 = 0;
    const EInvalidGameMode: u64 = 1;
    const EInvalidScore: u64 = 2;
    const EInvalidRarity: u64 = 3;
    const EInvalidMintPrice: u64 = 4;

    // === Rarity Constants ===
    const RARITY_COMMON: u8 = 0;
    const RARITY_UNCOMMON: u8 = 1;
    const RARITY_RARE: u8 = 2;
    const RARITY_EPIC: u8 = 3;
    const RARITY_LEGENDARY: u8 = 4;

    // === Score Thresholds for Rarity ===
    const SCORE_COMMON: u64 = 100;
    const SCORE_UNCOMMON: u64 = 500;
    const SCORE_RARE: u64 = 1000;
    const SCORE_EPIC: u64 = 2000;
    const SCORE_LEGENDARY: u64 = 5000;

    // === Structs ===
    struct GameNFT has key, store {
        id: UID,
        name: String,
        description: String,
        image_url: String,
        game_mode: String,
        score: u64,
        rarity: u8,
        minted_at: u64,
        attributes: VecMap<String, String>,
    }

    struct GameNFTCollection has key {
        id: UID,
        nfts: Table<ID, GameNFT>,
        total_minted: u64,
        mint_prices: VecMap<String, u64>, // game_mode -> price
    }

    // === Events ===
    struct NFTMinted has copy, drop {
        nft_id: ID,
        owner: address,
        game_mode: String,
        score: u64,
        rarity: u8,
        minted_at: u64,
    }

    struct NFTTransferred has copy, drop {
        nft_id: ID,
        from: address,
        to: address,
    }

    struct RarityUpdated has copy, drop {
        nft_id: ID,
        old_rarity: u8,
        new_rarity: u8,
    }

    // === Functions ===
    fun init(ctx: &mut TxContext) {
        let collection = GameNFTCollection {
            id: object::new(ctx),
            nfts: table::new(ctx),
            total_minted: 0,
            mint_prices: vec_map::empty(),
        };

        // Initialize default mint prices for each game mode
        vec_map::insert(&mut collection.mint_prices, utf8(b"frame-race"), 1000000);
        vec_map::insert(&mut collection.mint_prices, utf8(b"sound-snatch"), 1000000);
        vec_map::insert(&mut collection.mint_prices, utf8(b"type-clash"), 1000000);

        transfer::share_object(collection);
    }

    public entry fun mint_nft(
        collection: &mut GameNFTCollection,
        game_mode: String,
        score: u64,
        name: String,
        description: String,
        image_url: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Verify game mode exists
        assert!(vec_map::contains(&collection.mint_prices, &game_mode), EInvalidGameMode);
        
        // Calculate rarity based on score
        let rarity = calculate_rarity(score);
        
        // Create NFT
        let nft = GameNFT {
            id: object::new(ctx),
            name,
            description,
            image_url,
            game_mode,
            score,
            rarity,
            minted_at: clock::timestamp_ms(clock),
            attributes: vec_map::empty(),
        };

        // Emit mint event
        let nft_id = object::id(&nft);
        event::emit(NFTMinted {
            nft_id,
            owner: tx_context::sender(ctx),
            game_mode,
            score,
            rarity,
            minted_at: clock::timestamp_ms(clock),
        });

        collection.total_minted = collection.total_minted + 1;
        // Transfer NFT to sender
        transfer::public_transfer(nft, tx_context::sender(ctx));
    }

    public entry fun transfer_nft(
        collection: &mut GameNFTCollection,
        nft_id: ID,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        // Remove NFT from table
        let nft = table::remove(&mut collection.nfts, nft_id);
        // Emit transfer event
        event::emit(NFTTransferred {
            nft_id,
            from: sender,
            to: recipient,
        });
        // Transfer NFT
        transfer::public_transfer(nft, recipient);
    }

    public entry fun update_rarity(
        collection: &mut GameNFTCollection,
        nft_id: ID,
        new_score: u64,
        ctx: &mut TxContext
    ) {
        let nft = table::borrow_mut(&mut collection.nfts, nft_id);
        let old_rarity = nft.rarity;
        let new_rarity = calculate_rarity(new_score);
        
        if (old_rarity != new_rarity) {
            nft.rarity = new_rarity;
            nft.score = new_score;
            
            event::emit(RarityUpdated {
                nft_id,
                old_rarity,
                new_rarity,
            });
        }
    }

    public entry fun add_attribute(
        collection: &mut GameNFTCollection,
        nft_id: ID,
        key: String,
        value: String,
        ctx: &mut TxContext
    ) {
        let nft = table::borrow_mut(&mut collection.nfts, nft_id);
        vec_map::insert(&mut nft.attributes, key, value);
    }

    // === View Functions ===
    public fun get_nft(collection: &GameNFTCollection, nft_id: ID): &GameNFT {
        table::borrow(&collection.nfts, nft_id)
    }

    public fun get_total_minted(collection: &GameNFTCollection): u64 {
        collection.total_minted
    }

    public fun get_mint_price(collection: &GameNFTCollection, game_mode: String): u64 {
        assert!(vec_map::contains(&collection.mint_prices, &game_mode), EInvalidGameMode);
        *vec_map::get(&collection.mint_prices, &game_mode)
    }

    // === Private Functions ===
    fun calculate_rarity(score: u64): u8 {
        if (score >= SCORE_LEGENDARY) {
            RARITY_LEGENDARY
        } else if (score >= SCORE_EPIC) {
            RARITY_EPIC
        } else if (score >= SCORE_RARE) {
            RARITY_RARE
        } else if (score >= SCORE_UNCOMMON) {
            RARITY_UNCOMMON
        } else {
            RARITY_COMMON
        }
    }
} 