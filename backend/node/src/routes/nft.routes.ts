import { Router } from 'express';
import { NFTService } from '../services/nft.service';
import { LoggingService } from '../services/logging.service';
import { authenticateWallet } from '../types/middleware';

const router = Router();
const logger = new LoggingService();
const nftService = new NFTService(logger);

// Mint a new NFT
router.post('/mint', authenticateWallet, async (req, res) => {
    try {
        const { walletAddress, metadata } = req.body;

        if (!walletAddress || !metadata) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        const nftId = await nftService.mintNFT(walletAddress, metadata);
        
        res.json({
            success: true,
            nftId
        });
    } catch (error: unknown) {
        logger.error('Error in mint NFT route:', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            error: 'Failed to mint NFT'
        });
    }
});

// Get user's NFTs
router.get('/gallery', authenticateWallet, async (req, res) => {
    try {
        const { walletAddress } = req.query;

        if (!walletAddress) {
            return res.status(400).json({
                error: 'Missing wallet address'
            });
        }

        // Get NFTs owned by the wallet
        const nfts = await nftService.getNFTsByOwner(walletAddress as string);
        
        res.json({
            success: true,
            nfts
        });
    } catch (error: unknown) {
        logger.error('Error in get NFTs route:', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            error: 'Failed to fetch NFTs'
        });
    }
});

// Get NFT details
router.get('/:nftId', async (req, res) => {
    try {
        const { nftId } = req.params;

        if (!nftId) {
            return res.status(400).json({
                error: 'Missing NFT ID'
            });
        }

        const nft = await nftService.getNFT(nftId);
        
        res.json({
            success: true,
            nft
        });
    } catch (error: unknown) {
        logger.error('Error in get NFT details route:', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            error: 'Failed to fetch NFT details'
        });
    }
});

// Update NFT rarity
router.put('/:nftId/rarity', authenticateWallet, async (req, res) => {
    try {
        const { nftId } = req.params;
        const { newScore } = req.body;

        if (!nftId || !newScore) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        await nftService.updateNFTRarity(nftId, newScore);
        
        res.json({
            success: true
        });
    } catch (error: unknown) {
        logger.error('Error in update NFT rarity route:', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            error: 'Failed to update NFT rarity'
        });
    }
});

// Add NFT attribute
router.post('/:nftId/attributes', authenticateWallet, async (req, res) => {
    try {
        const { nftId } = req.params;
        const { key, value } = req.body;

        if (!nftId || !key || !value) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        await nftService.addNFTAttribute(nftId, key, value);
        
        res.json({
            success: true
        });
    } catch (error: unknown) {
        logger.error('Error in add NFT attribute route:', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            error: 'Failed to add NFT attribute'
        });
    }
});

export default router; 