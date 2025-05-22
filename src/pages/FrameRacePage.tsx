import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Users, Trophy } from 'lucide-react';
import GameRoomUI from '../components/GameRoomUI';

const FrameRacePage: React.FC = () => {
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
              <Zap size={20} className="text-primary-400" />
              <span className="text-primary-400 font-medium">FrameRace Mode</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              Pause at the Perfect Moment
            </h1>
            <p className="text-gray-300 text-lg mb-8">
              Test your reflexes and meme knowledge. Be the first to pause the video at the most iconic frame!
            </p>
            <div className="flex flex-wrap gap-6 justify-center items-center">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-primary-400" />
                <span className="text-gray-300">2,458 players online</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-primary-400" />
                <span className="text-gray-300">Top prize: 1000 MEME tokens</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      <GameRoomUI />
    </div>
  );
};

export default FrameRacePage;