module my_game::type_clash {
    struct TypeClash has key {
        id: UID,
        // Add other fields as needed
    }

    public fun create_type_clash(ctx: &mut TxContext) {
        let type_clash = TypeClash {
            id: object::new(ctx),
            // Initialize other fields
        };
        transfer::share_object(type_clash);
    }
} 