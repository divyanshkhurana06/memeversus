import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromB64 } from '@mysten/bcs';
import { LoggingService } from './logging.service';
import { GameMode } from '../models/game.model';
import { NFTMetadata, NFT } from '../types/nft';

interface SuiObject {
    objectId: string;
    type: string;
    content?: {
        fields: {
            name: string;
            description: string;
            image_url: string;
            game_mode: string;
            score: string;
            rarity: string;
            minted_at: string;
        };
    };
}

interface OwnedObjectResponse {
    data: SuiObject[];
}

const PRIVATE_KEY = process.env.SUI_PRIVATE_KEY || '';
const keypair = PRIVATE_KEY ? Ed25519Keypair.fromSecretKey(fromB64(PRIVATE_KEY)) : Ed25519Keypair.generate();

export class NFTService {
    private provider: SuiClient;
    private logger: LoggingService;
    private packageId: string;
    private collectionId: string;
    private readonly maxRetries = 3;
    private readonly retryDelay = 2000; // 2 seconds

    constructor(logger: LoggingService) {
        this.logger = logger;
        this.provider = new SuiClient({ url: process.env.SUI_NODE_URL || 'https://fullnode.mainnet.sui.io' });
        this.packageId = process.env.NFT_PACKAGE_ID || '';
        this.collectionId = process.env.NFT_COLLECTION_ID || '';
    }

    private async retryOperation<T>(
        operation: () => Promise<T>,
        retryCount: number = 0
    ): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            if (retryCount < this.maxRetries) {
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
                return this.retryOperation(operation, retryCount + 1);
            }
            throw error;
        }
    }

    async mintNFT(walletAddress: string, metadata: NFTMetadata): Promise<string> {
        try {
            const tx = new Transaction();
            tx.moveCall({
                target: `${this.packageId}::game_nft::mint`,
                arguments: [
                    tx.pure.string(metadata.name),
                    tx.pure.string(metadata.description),
                    tx.pure.string(metadata.imageUrl),
                    tx.pure.string(JSON.stringify(metadata.attributes))
                ]
            });

            const result = await this.retryOperation(async () => {
                const response = await this.provider.signAndExecuteTransaction({
                    signer: keypair,
                    transaction: tx,
                    options: {
                        showEffects: true,
                        showEvents: true
                    }
                });
                if (!response.effects?.status.status || response.effects.status.status !== 'success') {
                    throw new Error('Transaction failed: ' + response.effects?.status.error);
                }
                return response;
            });

            const nftCreatedEvent = (result as any).effects?.events?.find(
                (event: any) => event.type.includes('::game_nft::NFTMinted')
            );
            if (!nftCreatedEvent) {
                throw new Error('NFT minting event not found');
            }
            return nftCreatedEvent.id.txDigest || '';
        } catch (error) {
            console.error('Error minting NFT:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to mint NFT');
        }
    }

    async getNFT(nftId: string): Promise<NFT> {
        try {
            const nft = await this.provider.getObject({
                id: nftId,
                options: {
                    showContent: true,
                    showOwner: true
                }
            });

            if (!nft.data?.content) {
                throw new Error('NFT not found');
            }

            const content = nft.data.content as any;
            return {
                id: nftId,
                name: content.fields.name,
                description: content.fields.description,
                imageUrl: content.fields.image_url,
                gameMode: content.fields.game_mode,
                score: Number(content.fields.score),
                rarity: this.getRarityString(Number(content.fields.rarity)),
                mintedAt: new Date(Number(content.fields.minted_at)).toISOString(),
                attributes: content.fields.attributes || {}
            };
        } catch (error) {
            this.logger.error('Error getting NFT:', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    async getNFTsByOwner(walletAddress: string): Promise<NFT[]> {
        try {
            // Get all objects owned by the wallet with retry logic
            const objects = await this.retryOperation(async () => {
                const response = await this.provider.getObject({
                    id: walletAddress,
                    options: {
                        showContent: true,
                        showOwner: true
                    }
                });
                return response;
            });

            if (!objects.data?.content) {
                return [];
            }

            // Filter for NFT objects and fetch their details
            const nftPromises = (objects.data as any).content.fields.owned_objects
                .filter((obj: SuiObject) => obj.type.includes('::game_nft::GameNFT'))
                .map(async (obj: SuiObject) => {
                    try {
                        const details = await this.retryOperation(async () => {
                            const response = await this.provider.getObject({
                                id: obj.objectId,
                                options: {
                                    showContent: true,
                                    showDisplay: true
                                }
                            });
                            return response;
                        });

                        if (!details.data?.content) {
                            throw new Error(`Failed to fetch NFT details for ${obj.objectId}`);
                        }

                        const content = details.data.content as any;
                        return {
                            id: obj.objectId,
                            name: content.fields.name,
                            description: content.fields.description,
                            imageUrl: content.fields.image_url,
                            gameMode: content.fields.game_mode,
                            score: parseInt(content.fields.score),
                            rarity: content.fields.rarity,
                            mintedAt: content.fields.minted_at,
                            attributes: {
                                gameMode: content.fields.game_mode,
                                score: content.fields.score,
                                rarity: content.fields.rarity,
                                mintedAt: content.fields.minted_at
                            }
                        };
                    } catch (error) {
                        console.error(`Failed to fetch NFT ${obj.objectId}:`, error);
                        return null;
                    }
                });

            const nfts = (await Promise.all(nftPromises)).filter((nft): nft is NFT => nft !== null);
            return nfts;
        } catch (error) {
            console.error('Error fetching NFTs:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch NFTs');
        }
    }

    async getNFTById(nftId: string): Promise<NFT> {
        try {
            const details = await this.retryOperation(async () => {
                const response = await this.provider.getObject({
                    id: nftId,
                    options: {
                        showContent: true,
                        showDisplay: true
                    }
                });
                return response;
            });

            if (!details.data?.content) {
                throw new Error(`NFT not found: ${nftId}`);
            }

            const content = details.data.content as any;
            return {
                id: nftId,
                name: content.fields.name,
                description: content.fields.description,
                imageUrl: content.fields.image_url,
                gameMode: content.fields.game_mode,
                score: parseInt(content.fields.score),
                rarity: content.fields.rarity,
                mintedAt: content.fields.minted_at,
                attributes: {
                    gameMode: content.fields.game_mode,
                    score: content.fields.score,
                    rarity: content.fields.rarity,
                    mintedAt: content.fields.minted_at
                }
            };
        } catch (error) {
            console.error('Error fetching NFT:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch NFT');
        }
    }

    async updateNFTRarity(nftId: string, newScore: number): Promise<void> {
        try {
            const tx = new Transaction();
            
            tx.moveCall({
                target: `${this.packageId}::game_nft::update_rarity`,
                arguments: [
                    tx.pure.address(this.collectionId),
                    tx.pure.address(nftId),
                    tx.pure.u8(newScore)
                ]
            });

            await this.provider.signAndExecuteTransaction({
                signer: keypair,
                transaction: tx,
                options: {
                    showEffects: true
                }
            });
        } catch (error) {
            this.logger.error('Error updating NFT rarity:', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    async addNFTAttribute(nftId: string, key: string, value: string): Promise<void> {
        try {
            const tx = new Transaction();
            
            tx.moveCall({
                target: `${this.packageId}::game_nft::add_attribute`,
                arguments: [
                    tx.pure.address(this.collectionId),
                    tx.pure.address(nftId),
                    tx.pure.string(key),
                    tx.pure.string(value)
                ]
            });

            await this.provider.signAndExecuteTransaction({
                signer: keypair,
                transaction: tx,
                options: {
                    showEffects: true
                }
            });
        } catch (error) {
            this.logger.error('Error adding NFT attribute:', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    async getMintPrice(gameMode: GameMode): Promise<number> {
        try {
            const tx = new Transaction();
            
            tx.moveCall({
                target: `${this.packageId}::game_nft::get_mint_price`,
                arguments: [
                    tx.pure.address(this.collectionId),
                    tx.pure.string(gameMode)
                ]
            });

            const result = await this.provider.signAndExecuteTransaction({
                signer: keypair,
                transaction: tx,
                options: {
                    showEffects: true,
                    showEvents: true
                }
            });

            // Extract price from transaction effects
            const price = (result as any).effects?.events?.[0]?.parsedJson?.price;
            return price || 0;
        } catch (error) {
            this.logger.error('Error getting mint price:', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    async getTotalMinted(): Promise<number> {
        try {
            const tx = new Transaction();
            
            tx.moveCall({
                target: `${this.packageId}::game_nft::get_total_minted`,
                arguments: [
                    tx.pure.address(this.collectionId)
                ]
            });

            const result = await this.provider.signAndExecuteTransaction({
                signer: keypair,
                transaction: tx,
                options: {
                    showEffects: true,
                    showEvents: true
                }
            });

            // Extract total minted from transaction effects
            const totalMinted = (result as any).effects?.events?.[0]?.parsedJson?.total_minted;
            return totalMinted || 0;
        } catch (error) {
            this.logger.error('Error getting total minted:', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    private getRarityString(rarity: number): string {
        switch (rarity) {
            case 4:
                return 'Legendary';
            case 3:
                return 'Epic';
            case 2:
                return 'Rare';
            case 1:
                return 'Uncommon';
            default:
                return 'Common';
        }
    }
} 