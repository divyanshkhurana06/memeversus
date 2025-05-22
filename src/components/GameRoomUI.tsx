import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, MessageSquare, Trophy, Clock } from 'lucide-react';
import { websocketService } from '../utils/websocket';
import { GameState, Player, ChatMessage } from '../types/game';

const GameRoomUI: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [countdown, setCountdown] = useState(10);
  const [messageInput, setMessageInput] = useState('');

  // Connect to WebSocket
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    websocketService.connect(token);

    // Set up event listeners
    websocketService.onGameStateUpdate((state: GameState) => {
      setGameState(state);
      setPlayers(state.players);
    });

    websocketService.onChatMessage((message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
    });

    websocketService.onPlayerJoined((player: Player) => {
      setPlayers(prev => [...prev, player]);
    });

    websocketService.onPlayerLeft((playerId: string) => {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    });

    websocketService.onGameStart((data: { countdown?: number }) => {
      setCountdown(data.countdown || 10);
    });

    websocketService.onGameEnd((data: { winner?: string }) => {
      // Handle game end
      console.log('Game ended:', data);
    });

    return () => {
      websocketService.removeAllListeners();
      websocketService.disconnect();
    };
  }, []);

  // Handle countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Send chat message
  const sendMessage = useCallback(() => {
    if (!messageInput.trim()) return;

    websocketService.sendGameAction(gameState?.roomId || '', 'chat', {
      text: messageInput.trim()
    });

    setMessageInput('');
  }, [messageInput, gameState?.roomId]);

  // Handle game action
  const handleGameAction = useCallback((action: string, payload: unknown) => {
    if (!gameState?.roomId) return;
    websocketService.sendGameAction(gameState.roomId, action, payload);
  }, [gameState?.roomId]);

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
            {gameState?.mode || 'Game Room'}
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
                        <span className="text-xs text-gray-500 ml-2">{new Date(message.timestamp).toLocaleTimeString()}</span>
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
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..." 
                    className="flex-1 bg-dark text-white text-sm rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <button 
                    onClick={sendMessage}
                    className="bg-primary-500 text-white p-2 rounded-md hover:bg-primary-600 transition-colors"
                  >
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
                      {gameState?.status === 'WAITING' ? 'Waiting for players...' : 
                       gameState?.status === 'IN_PROGRESS' ? 'Game in Progress!' :
                       'Game Over!'}
                    </h3>
                    <p className="text-gray-400 max-w-2xl">
                      {gameState?.status === 'WAITING' ? 'Waiting for more players to join...' :
                       gameState?.status === 'IN_PROGRESS' ? 'Be the first to pause at the perfect moment!' :
                       `Winner: ${gameState?.winner || 'No winner'}`}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-xl border border-dark-border aspect-video flex items-center justify-center mb-8">
                    {gameState?.status === 'WAITING' ? (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold"
                      >
                        {countdown}
                      </motion.div>
                    ) : gameState?.status === 'IN_PROGRESS' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        {/* Game-specific UI will go here */}
                      </div>
                    ) : (
                      <div className="text-center">
                        <h4 className="text-2xl font-bold mb-4">Game Over!</h4>
                        <p className="text-gray-400">Thanks for playing!</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    {gameState?.status === 'WAITING' && (
                      <motion.button
                        whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(139, 92, 246, 0.5)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleGameAction('ready', {})}
                        className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-md font-medium inline-flex items-center"
                      >
                        <span>Get Ready!</span>
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Leaderboard sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
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
                    className={`flex items-center justify-between p-2 rounded-md ${player.isReady ? 'bg-primary-500/20 border border-primary-500/30' : 'hover:bg-dark/40'}`}
                  >
                    <div className="flex items-center">
                      <span className="w-5 text-center text-gray-500 mr-2">{index + 1}</span>
                      <img src={player.avatar} alt={player.username} className="w-8 h-8 rounded-full mr-2" />
                      <span className={`font-medium ${player.isReady ? 'text-primary-400' : 'text-white'}`}>
                        {player.username}
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