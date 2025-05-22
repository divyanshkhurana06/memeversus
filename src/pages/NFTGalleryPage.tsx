import React from 'react';
import NFTGallery from '../components/NFTGallery';

const NFTGalleryPage: React.FC = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-white mb-8 text-center">Your NFT Collection</h1>
            <NFTGallery />
        </div>
    );
};

export default NFTGalleryPage;