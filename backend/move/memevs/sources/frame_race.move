#[allow(duplicate_alias)]
module memevs::frame_race {
    use sui::object;
    use sui::transfer;
    use sui::tx_context;

    public struct FrameRace has key {
        id: object::UID,
        // Add other fields as needed
    }

    public fun create_frame_race(ctx: &mut tx_context::TxContext) {
        let frame_race = FrameRace {
            id: object::new(ctx),
            // Initialize other fields
        };
        transfer::share_object(frame_race);
    }
} 