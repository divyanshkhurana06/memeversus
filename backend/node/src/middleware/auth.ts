import { Request, Response, NextFunction } from 'express';
import { SuiService } from '../services/sui.service';
import { LoggingService } from '../services/logging.service';

const logger = new LoggingService();
const suiService = new SuiService(logger);

export const authenticateWallet = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const walletAddress = req.body.walletAddress || req.query.walletAddress;
        const signature = req.headers['x-wallet-signature'] as string;

        if (!walletAddress) {
            return res.status(401).json({
                error: 'Wallet address is required'
            });
        }

        if (!signature) {
            return res.status(401).json({
                error: 'Wallet signature is required'
            });
        }

        // Verify wallet ownership
        const isValid = await suiService.verifyWalletOwnership(walletAddress, signature);
        
        if (!isValid) {
            return res.status(401).json({
                error: 'Invalid wallet signature'
            });
        }

        // Add wallet address to request for use in routes
        req.walletAddress = walletAddress;
        next();
    } catch (error: unknown) {
        logger.error('Error in wallet authentication:', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            error: 'Authentication failed'
        });
    }
}; 