module my_game::frame_race {
    struct FrameRace has key {
        id: UID,
        // Add other fields as needed
    }

    public fun create_frame_race(ctx: &mut TxContext) {
        let frame_race = FrameRace {
            id: object::new(ctx),
            // Initialize other fields
        };
        transfer::share_object(frame_race);
    }
} 