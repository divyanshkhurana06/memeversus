import React, { useState, useEffect } from 'react';
import { useWalletState } from '../hooks/useWalletState';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface NFT {
    id: string;
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

const NFTGallery: React.FC = () => {
    const { isConnected, walletAddress } = useWalletState();
    const [nfts, setNfts] = useState<NFT[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 3;

    const fetchNFTs = async () => {
        if (!isConnected || !walletAddress) {
            setError('Please connect your wallet to view your NFTs');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/nft/owned/${walletAddress}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch NFTs');
            }

            const data = await response.json();
            setNfts(data);
        } catch (error) {
            console.error('Error fetching NFTs:', error);
            const errorMsg = error instanceof Error ? error.message : 'Failed to fetch NFTs';
            setError(errorMsg);

            // Implement retry logic
            if (retryCount < maxRetries) {
                setRetryCount(prev => prev + 1);
                setTimeout(() => {
                    fetchNFTs();
                }, 2000 * (retryCount + 1)); // Exponential backoff
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNFTs();
    }, [isConnected, walletAddress]);

    const handleRetry = () => {
        setRetryCount(0);
        fetchNFTs();
    };

    if (!isConnected) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                <p className="text-gray-400">Please connect your wallet to view your NFT collection.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-400 mb-4" />
                <p className="text-gray-400">
                    Loading your NFTs... {retryCount > 0 && `(Attempt ${retryCount + 1}/${maxRetries + 1})`}
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="flex items-center justify-center space-x-2 text-red-400 mb-4">
                    <AlertCircle className="w-6 h-6" />
                    <span className="text-lg font-semibold">Error Loading NFTs</span>
                </div>
                <p className="text-gray-400 mb-4">{error}</p>
                {retryCount < maxRetries ? (
                    <p className="text-sm text-gray-500 mb-4">
                        Retrying in {2 * (retryCount + 1)} seconds...
                    </p>
                ) : (
                    <button
                        onClick={handleRetry}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Retry</span>
                    </button>
                )}
            </div>
        );
    }

    if (nfts.length === 0) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-white mb-4">No NFTs Found</h2>
                <p className="text-gray-400">You haven't minted any NFTs yet. Play games to earn NFTs!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
                {nfts.map((nft) => (
                    <motion.div
                        key={nft.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-dark-800 rounded-lg overflow-hidden shadow-lg"
                    >
                        <div className="relative aspect-square">
                            <img
                                src={nft.imageUrl}
                                alt={nft.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 px-2 py-1 bg-dark-900/80 rounded-full">
                                <span className={`text-sm font-semibold ${
                                    nft.rarity === 'Legendary' ? 'text-yellow-400' :
                                    nft.rarity === 'Epic' ? 'text-purple-400' :
                                    nft.rarity === 'Rare' ? 'text-blue-400' :
                                    nft.rarity === 'Uncommon' ? 'text-green-400' :
                                    'text-gray-400'
                                }`}>
                                    {nft.rarity}
                                </span>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="text-xl font-bold text-white mb-2">{nft.name}</h3>
                            <p className="text-gray-400 mb-4">{nft.description}</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-gray-500">Game Mode</p>
                                    <p className="text-white">{nft.attributes.gameMode}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Score</p>
                                    <p className="text-white">{nft.attributes.score}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Minted</p>
                                    <p className="text-white">
                                        {new Date(nft.attributes.mintedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default NFTGallery; 