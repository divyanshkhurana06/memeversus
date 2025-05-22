import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const NFTGalleryPage: React.FC = () => {
  return (
    <div className="pt-20">
      <section className="py-12 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center mb-12"
          >
            <div className="inline-flex items-center justify-center gap-2 bg-primary-500/20 rounded-full px-4 py-2 mb-4">
              <Shield size={20} className="text-primary-400" />
              <span className="text-primary-400 font-medium">NFT Collection</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              Your Digital Trophy Case
            </h1>
            <p className="text-gray-300 text-lg mb-8">
              Showcase your achievements and rare collectibles earned through epic meme battles.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default NFTGalleryPage;