import React from 'react';
import { motion } from 'framer-motion';
import { Headphones, Users, Trophy } from 'lucide-react';
import GameRoomUI from '../components/GameRoomUI';

const SoundSnatchPage: React.FC = () => {
  return (
    <div className="pt-20">
      <section className="py-12 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center mb-12"
          >
            <div className="inline-flex items-center justify-center gap-2 bg-accent-500/20 rounded-full px-4 py-2 mb-4">
              <Headphones size={20} className="text-accent-400" />
              <span className="text-accent-400 font-medium">SoundSnatch Mode</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              Name That Meme Sound
            </h1>
            <p className="text-gray-300 text-lg mb-8">
              Put your audio recognition skills to the test! Identify distorted meme sounds and viral clips before time runs out.
            </p>
            <div className="flex flex-wrap gap-6 justify-center items-center">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-accent-400" />
                <span className="text-gray-300">1,875 players online</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-accent-400" />
                <span className="text-gray-300">Top prize: 750 MEME tokens</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      <GameRoomUI />
    </div>
  );
};

export default SoundSnatchPage;