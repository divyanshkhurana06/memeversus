import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, MessageSquare, Trophy, Clock } from 'lucide-react';

interface Message {
  id: number;
  user: string;
  text: string;
  avatar: string;
}

interface Player {
  id: number;
  name: string;
  avatar: string;
  score: number;
}

const GameRoomUI: React.FC = () => {
  const [countdown, setCountdown] = useState(10);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { id: 1, user: 'MemeKing', text: 'Good luck everyone!', avatar: 'https://i.pravatar.cc/100?img=1' },
    { id: 2, user: 'DankLord', text: 'This is gonna be fun', avatar: 'https://i.pravatar.cc/100?img=2' },
    { id: 3, user: 'GigaChad', text: 'I\'m going to win this time', avatar: 'https://i.pravatar.cc/100?img=3' },
    { id: 4, user: 'MemeLord', text: 'I\'ve been practicing all week!', avatar: 'https://i.pravatar.cc/100?img=4' },
  ]);
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: 'MemeKing', avatar: 'https://i.pravatar.cc/100?img=1', score: 3200 },
    { id: 2, name: 'DankLord', avatar: 'https://i.pravatar.cc/100?img=2', score: 2800 },
    { id: 3, name: 'GigaChad', avatar: 'https://i.pravatar.cc/100?img=3', score: 2600 },
    { id: 4, name: 'MemeLord', avatar: 'https://i.pravatar.cc/100?img=4', score: 2200 },
    { id: 5, name: 'You', avatar: 'https://i.pravatar.cc/100?img=5', score: 1800 },
  ]);

  // Animate countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Animate score changes periodically
  useEffect(() => {
    const scoreInterval = setInterval(() => {
      setPlayers(prevPlayers => 
        prevPlayers.map(player => ({
          ...player,
          score: player.score + Math.floor(Math.random() * 50)
        })).sort((a, b) => b.score - a.score)
      );
    }, 3000);
    
    return () => clearInterval(scoreInterval);
  }, []);

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-40 left-20 w-72 h-72 bg-secondary-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-60 h-60 bg-primary-500/10 rounded-full filter blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-primary-400 font-medium mb-2">Live Experience</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
            Game Room Preview
          </h2>
        </motion.div>
        
        <div className="bg-dark-card rounded-xl border border-dark-border overflow-hidden shadow-2xl">
          <div className="flex flex-col lg:flex-row">
            {/* Chat sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-full lg:w-64 bg-dark-lighter border-r border-dark-border flex flex-col"
            >
              <div className="p-4 border-b border-dark-border flex items-center justify-between">
                <div className="flex items-center">
                  <MessageSquare size={18} className="text-primary-400 mr-2" />
                  <h3 className="font-medium text-white">Game Chat</h3>
                </div>
                <div className="flex items-center">
                  <Users size={16} className="text-gray-400 mr-1" />
                  <span className="text-gray-400 text-sm">{players.length}</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map(message => (
                  <div key={message.id} className="flex items-start gap-2">
                    <img src={message.avatar} alt={message.user} className="w-8 h-8 rounded-full" />
                    <div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-primary-400">{message.user}</span>
                      </div>
                      <p className="text-sm text-gray-300">{message.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 border-t border-dark-border">
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    className="flex-1 bg-dark text-white text-sm rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <button className="bg-primary-500 text-white p-2 rounded-md hover:bg-primary-600 transition-colors">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
            
            {/* Main game area */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="flex-1 p-6"
            >
              <div className="text-center">
                <div className="bg-dark-lighter rounded-lg p-6 relative">
                  <div className="absolute top-4 right-4 flex items-center bg-dark/60 rounded-full px-3 py-1">
                    <Clock size={14} className="text-primary-400 mr-1" />
                    <span className="text-white text-sm font-medium">00:{countdown.toString().padStart(2, '0')}</span>
                  </div>
                  
                  <div className="mb-8 flex flex-col items-center justify-center">
                    <h3 className="text-2xl font-heading font-bold text-white mb-4">
                      Get Ready for <span className="text-primary-400">FrameRace</span>!
                    </h3>
                    <p className="text-gray-400 max-w-2xl">
                      You'll be shown a meme video. Be the first to pause at the most iconic frame!
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-xl border border-dark-border aspect-video flex items-center justify-center mb-8">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold"
                    >
                      {countdown}
                    </motion.div>
                  </div>
                  
                  <div className="text-center">
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(139, 92, 246, 0.5)' }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-md font-medium inline-flex items-center"
                    >
                      <span>Get Ready!</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Leaderboard sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="w-full lg:w-72 bg-dark-lighter border-l border-dark-border"
            >
              <div className="p-4 border-b border-dark-border flex items-center">
                <Trophy size={18} className="text-primary-400 mr-2" />
                <h3 className="font-medium text-white">Live Leaderboard</h3>
              </div>
              
              <div className="p-3 space-y-2">
                {players.map((player, index) => (
                  <motion.div 
                    key={player.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                    className={`flex items-center justify-between p-2 rounded-md ${player.name === 'You' ? 'bg-primary-500/20 border border-primary-500/30' : 'hover:bg-dark/40'}`}
                  >
                    <div className="flex items-center">
                      <span className="w-5 text-center text-gray-500 mr-2">{index + 1}</span>
                      <img src={player.avatar} alt={player.name} className="w-8 h-8 rounded-full mr-2" />
                      <span className={`font-medium ${player.name === 'You' ? 'text-primary-400' : 'text-white'}`}>
                        {player.name}
                      </span>
                    </div>
                    <motion.span 
                      key={player.score}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-gray-300 font-mono"
                    >
                      {player.score.toLocaleString()}
                    </motion.span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GameRoomUI;