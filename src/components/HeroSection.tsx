import React from 'react';
import { motion } from 'framer-motion';
import { Play, Wallet, ArrowRight } from 'lucide-react';

const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-20 pb-20 md:pt-32 md:pb-24 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-secondary-500/20 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-500/10 rounded-full filter blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-1.5 bg-primary-500/20 rounded-full text-primary-400 font-medium text-sm mb-6"
          >
            🎮 The Ultimate Meme Gaming Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 leading-tight"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">MemeVersus:</span> Compete in the Meme Olympics
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="text-gray-300 text-lg md:text-xl max-w-3xl mb-8"
          >
            Play chaotic meme mini-games. Win NFT badges. Beat your friends.
            Join thousands of players in the internet's most hilarious competition.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(139, 92, 246, 0.7)' }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 border border-primary-500/30 shadow-lg shadow-primary-500/20"
            >
              <Play size={20} />
              <span>Play Now</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(16, 185, 129, 0.7)' }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 bg-dark-lighter text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 border border-dark-border hover:border-secondary-500/50 transition-all duration-300 shadow-lg shadow-black/20"
            >
              <Wallet size={20} />
              <span>Connect Wallet</span>
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-16 relative"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl blur opacity-30"></div>
            <div className="relative flex items-center justify-center bg-dark-card p-3 rounded-lg border border-dark-border overflow-hidden">
              <div className="bg-dark-lighter rounded-md px-4 py-2 flex items-center gap-2 text-sm text-gray-300">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-secondary-400 opacity-75"></span>
                  <span className="relative rounded-full h-3 w-3 bg-secondary-500"></span>
                </span>
                <span>3,240 players online</span> •
                <span>Next tournament in 2h 15m</span>
                <ArrowRight size={14} className="ml-1" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;