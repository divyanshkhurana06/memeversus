import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, MessageSquare, Trophy, Clock } from 'lucide-react';
import { GameStatus } from '../store/slices/gameSlice';

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

interface GameRoomUIProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onVideoMetadataLoaded: () => void;
  onPause: () => void;
  onStart: () => void;
  status: GameStatus;
  score: number;
  timeRemaining: number;
  currentRound: number;
  totalRounds: number;
  roundScores: number[];
  isRoundComplete: boolean;
  roundCountdown: number;
  preGameCountdown: number;
}

const GameRoomUI: React.FC<GameRoomUIProps> = ({ 
  videoRef,
  onVideoMetadataLoaded,
  onPause,
  onStart,
  status, 
  score, 
  timeRemaining,
  currentRound,
  totalRounds,
  roundScores,
  isRoundComplete,
  roundCountdown,
  preGameCountdown
}) => {
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
          <p className="text-primary-400 font-medium mb-2">Frame Race</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
            Pause at the Perfect Moment
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
                  {/* Timer display */}
                  {(status === 'waiting' || status === 'playing') && (
                    <div className="absolute top-4 right-4 flex items-center bg-dark/60 rounded-full px-3 py-1">
                      <Clock size={14} className="text-primary-400 mr-1" />
                      <span className="text-white text-sm font-medium">{timeRemaining.toString().padStart(2, '0')}s</span>
                    </div>
                  )}

                  {/* Game State Display */}
                  {status === 'idle' && (
                     <div className="mb-8 flex flex-col items-center justify-center">
                        <h3 className="text-2xl font-heading font-bold text-white mb-4">
                          Get Ready to Play!
                        </h3>
                        <p className="text-gray-400 max-w-2xl">
                          Connect your wallet and click start to begin.
                        </p>
                        <button
                          onClick={onStart}
                          className="mt-4 bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
                        >
                          Start Game
                        </button>
                     </div>
                  )}

                   {status === 'waiting' && (
                     <div className="mb-8 flex flex-col items-center justify-center">
                        <h3 className="text-2xl font-heading font-bold text-white mb-4">
                          Waiting for Game to Start...
                        </h3>
                        <p className="text-gray-400 max-w-2xl">
                          Game starts in <span className="text-primary-400">{preGameCountdown}</span> seconds.
                        </p>
                     </div>
                   )}

                   {status === 'playing' && (
                     <div className="mb-8">
                        <video
                          ref={videoRef}
                          onLoadedMetadata={onVideoMetadataLoaded}
                          onClick={onPause}
                          className="w-full rounded-lg cursor-pointer"
                          src="/path/to/your/meme-video.mp4"
                        />
                        <div className="mt-4 text-center">
                          <p className="text-gray-400">
                            Round {currentRound} of {totalRounds}
                          </p>
                          <p className="text-primary-400 font-semibold">
                            Score: {score}
                          </p>
                        </div>
                     </div>
                   )}

                   {isRoundComplete && (
                     <div className="mb-8 flex flex-col items-center justify-center">
                        <h3 className="text-2xl font-heading font-bold text-white mb-4">
                          Round {currentRound} Complete!
                        </h3>
                        <p className="text-gray-400">
                          Score for this round: {roundScores[currentRound - 1] || 0}
                        </p>
                        {currentRound < totalRounds ? (
                          <p className="text-primary-400 mt-2">
                            Next round in {roundCountdown} seconds
                          </p>
                        ) : (
                          <p className="text-primary-400 mt-2">
                            Game Over!
                          </p>
                        )}
                     </div>
                   )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GameRoomUI;