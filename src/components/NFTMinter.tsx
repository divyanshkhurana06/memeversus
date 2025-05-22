import React, { useState, useCallback } from 'react';
import { useWalletState } from '../hooks/useWalletState';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface NFTMinterProps {
    gameMode: string;
    score: number;
    onMintSuccess?: (nftId: string) => void;
    onMintError?: (error: Error) => void;
}

const NFTMinter: React.FC<NFTMinterProps> = ({
    gameMode,
    score,
    onMintSuccess,
    onMintError
}) => {
    const { isConnected, walletAddress } = useWalletState();
    const [isMinting, setIsMinting] = useState(false);
    const [mintStatus, setMintStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 3;

    const calculateRarity = (score: number): string => {
        if (score >= 5000) return 'Legendary';
        if (score >= 2000) return 'Epic';
        if (score >= 1000) return 'Rare';
        if (score >= 500) return 'Uncommon';
        return 'Common';
    };

    const handleMint = useCallback(async () => {
        if (!isConnected || !walletAddress) {
            setErrorMessage('Please connect your wallet first');
            setMintStatus('error');
            return;
        }

        setIsMinting(true);
        setMintStatus('idle');
        setErrorMessage('');

        try {
            // Prepare NFT metadata
            const metadata = {
                name: `${gameMode} Achievement`,
                description: `Achievement NFT for ${gameMode} with score ${score}`,
                imageUrl: `/nft-images/${gameMode.toLowerCase()}.png`,
                gameMode,
                score,
                rarity: calculateRarity(score),
                attributes: {
                    gameMode,
                    score: score.toString(),
                    rarity: calculateRarity(score),
                    mintedAt: new Date().toISOString()
                }
            };

            // Call the minting function from your NFT service
            const response = await fetch('/api/nft/mint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    walletAddress,
                    metadata
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to mint NFT');
            }

            const { nftId } = await response.json();
            setMintStatus('success');
            onMintSuccess?.(nftId);
        } catch (error) {
            console.error('Error minting NFT:', error);
            const errorMsg = error instanceof Error ? error.message : 'Failed to mint NFT';
            setErrorMessage(errorMsg);
            setMintStatus('error');
            onMintError?.(error instanceof Error ? error : new Error(errorMsg));

            // Implement retry logic
            if (retryCount < maxRetries) {
                setRetryCount(prev => prev + 1);
                setTimeout(() => {
                    handleMint();
                }, 2000 * (retryCount + 1)); // Exponential backoff
            }
        } finally {
            setIsMinting(false);
        }
    }, [isConnected, walletAddress, gameMode, score, onMintSuccess, onMintError, retryCount]);

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-dark-800 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Mint Your Achievement NFT</h2>
            
            <div className="space-y-4">
                <div className="bg-dark-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">NFT Details</h3>
                    <div className="space-y-2 text-gray-300">
                        <p>Game Mode: <span className="text-primary-400">{gameMode}</span></p>
                        <p>Score: <span className="text-primary-400">{score}</span></p>
                        <p>Rarity: <span className="text-primary-400">{calculateRarity(score)}</span></p>
                    </div>
                </div>

                <button
                    onClick={handleMint}
                    disabled={isMinting || !isConnected}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                        isMinting || !isConnected
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-primary-600 hover:bg-primary-700'
                    }`}
                >
                    {isMinting ? (
                        <div className="flex items-center justify-center space-x-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Minting... {retryCount > 0 && `(Attempt ${retryCount + 1}/${maxRetries + 1})`}</span>
                        </div>
                    ) : !isConnected ? (
                        'Connect Wallet to Mint'
                    ) : (
                        'Mint NFT'
                    )}
                </button>

                <AnimatePresence>
                    {mintStatus === 'success' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center space-x-2 text-green-400 bg-green-900/20 p-3 rounded-lg"
                        >
                            <CheckCircle className="w-5 h-5" />
                            <span>NFT minted successfully!</span>
                        </motion.div>
                    )}

                    {mintStatus === 'error' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center space-x-2 text-red-400 bg-red-900/20 p-3 rounded-lg"
                        >
                            <AlertCircle className="w-5 h-5" />
                            <div className="flex-1">
                                <p>{errorMessage}</p>
                                {retryCount < maxRetries && (
                                    <p className="text-sm mt-1">
                                        Retrying in {2 * (retryCount + 1)} seconds...
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default NFTMinter; 