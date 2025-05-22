/*
/// Module: memevs
module memevs::memevs;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions

module memevs::memevs {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    // GameRoom struct to represent a game room
    public struct GameRoom has key {
        id: UID,
        room_id: u64,
        players: vector<address>,
        game_state: GameState,
    }

    // Player struct to represent a player
    public struct Player has key {
        id: UID,
        address: address,
        score: u64,
    }

    // GameState struct for FrameRace mode
    public struct GameState has store {
        mode: u8, // 0: FrameRace, 1: SoundSnatch, 2: TypeClash
        current_frame: u64,
        is_active: bool,
    }

    // Function to create a new game room
    public fun create_game_room(ctx: &mut TxContext) {
        let game_room = GameRoom {
            id: object::new(ctx),
            room_id: tx_context::epoch(ctx),
            players: vector::empty(),
            game_state: GameState {
                mode: 0, // FrameRace mode
                current_frame: 0,
                is_active: false,
            },
        };
        transfer::share_object(game_room);
    }

    // Function to join a game room
    public fun join_game_room(game_room: &mut GameRoom, player_address: address) {
        vector::push_back(&mut game_room.players, player_address);
    }

    // Function to start a game in a game room
    public fun start_game(game_room: &mut GameRoom) {
        game_room.game_state.is_active = true;
    }

    // Function to update the current frame in the game state
    public fun update_current_frame(game_room: &mut GameRoom) {
        game_room.game_state.current_frame = game_room.game_state.current_frame + 1;
    }

    // Function to mint an NFT badge for a winner
    public fun mint_winner_badge(_game_room: &mut GameRoom, winner_address: address, ctx: &mut TxContext) {
        let winner_badge = Player {
            id: object::new(ctx),
            address: winner_address,
            score: 0,
        };
        transfer::transfer(winner_badge, winner_address);
    }

    // Function to authenticate a player using their wallet address
    public fun authenticate_player(_game_room: &mut GameRoom, player_address: address, ctx: &mut TxContext) {
        let player = Player {
            id: object::new(ctx),
            address: player_address,
            score: 0,
        };
        transfer::transfer(player, player_address);
    }

    // Function to record a win for a player
    public fun record_win(game_room: &mut GameRoom, winner_address: address, ctx: &mut TxContext) {
        // Increment the winner's score
        let player = Player {
            id: object::new(ctx),
            address: winner_address,
            score: 1,
        };
        transfer::transfer(player, winner_address);

        // Mint an NFT badge for the winner
        mint_winner_badge(game_room, winner_address, ctx);
    }

    // Function to fetch player stats
    public fun fetch_player_stats(_game_room: &mut GameRoom, _player_address: address, _ctx: &mut TxContext): u64 {
        0
    }

    // Function to list all game rooms
    public fun list_game_rooms(_game_room: &mut GameRoom): vector<u64> {
        vector::empty()
    }

    // Function to list all wins for a player
    public fun list_player_wins(_game_room: &mut GameRoom, _player_address: address): vector<u64> {
        vector::empty()
    }
}


