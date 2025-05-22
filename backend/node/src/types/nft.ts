export interface NFTMetadata {
    name: string;
    description: string;
    imageUrl: string;
    gameMode: string;
    score: number;
    rarity: string;
    attributes: {
        gameMode: string;
        score: string;
        rarity: string;
        mintedAt: string;
    };
}

export interface NFT {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    gameMode: string;
    score: number;
    rarity: string;
    mintedAt: string;
    attributes: {
        gameMode: string;
        score: string;
        rarity: string;
        mintedAt: string;
    };
} 