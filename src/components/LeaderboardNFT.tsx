import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Star, ChevronRight } from 'lucide-react';

interface NFTCardProps {
  image: string;
  name: string;
  rarity: string;
  owner: string;
  index: number;
}

const NFTCard: React.FC<NFTCardProps> = ({ image, name, rarity, owner, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 * index, duration: 0.5 }}
      whileHover={{ 
        y: -5, 
        boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
        transition: { duration: 0.2 }
      }}
      className="relative group"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
      <div className="relative bg-dark-card rounded-lg overflow-hidden">
        <div className="aspect-square relative overflow-hidden">
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover transform group-hover:scale-110 transition duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent opacity-70"></div>
          <div className="absolute bottom-3 left-3 right-3">
            <div className="bg-dark-lighter/80 backdrop-blur-sm rounded-md px-2 py-1 flex items-center">
              <Star size={14} className="text-primary-400 mr-1" />
              <span className="text-xs text-white">{rarity}</span>
            </div>
          </div>
        </div>
        <div className="p-4">
          <h4 className="font-medium text-white mb-1">{name}</h4>
          <p className="text-gray-400 text-sm">Owned by {owner}</p>
        </div>
      </div>
    </motion.div>
  );
};

const LeaderboardNFT: React.FC = () => {
  const topPlayers = [
    { rank: 1, name: 'MemeKing', score: 42650, avatar: 'https://i.pravatar.cc/100?img=1', badges: 8 },
    { rank: 2, name: 'DankLord', score: 38920, avatar: 'https://i.pravatar.cc/100?img=2', badges: 6 },
    { rank: 3, name: 'GigaChad', score: 36700, avatar: 'https://i.pravatar.cc/100?img=3', badges: 7 },
    { rank: 4, name: 'MemeLord', score: 32450, avatar: 'https://i.pravatar.cc/100?img=4', badges: 5 },
    { rank: 5, name: 'Doge2Moon', score: 29800, avatar: 'https://i.pravatar.cc/100?img=5', badges: 4 },
  ];
  
  const nfts = [
    { image: 'https://images.pexels.com/photos/5202174/pexels-photo-5202174.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', name: 'Gold Doge', rarity: 'Legendary', owner: 'MemeKing' },
    { image: 'https://images.pexels.com/photos/4339954/pexels-photo-4339954.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', name: 'Diamond Hands', rarity: 'Epic', owner: 'DankLord' },
    { image: 'https://images.pexels.com/photos/6476587/pexels-photo-6476587.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', name: 'Ultra Rare Pepe', rarity: 'Mythic', owner: 'GigaChad' },
    { image: 'https://images.pexels.com/photos/11081029/pexels-photo-11081029.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', name: 'Meme Lord Crown', rarity: 'Rare', owner: 'MemeLord' },
    { image: 'https://images.pexels.com/photos/8721342/pexels-photo-8721342.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', name: 'Stonks Trophy', rarity: 'Epic', owner: 'Doge2Moon' },
    { image: 'https://images.pexels.com/photos/5202168/pexels-photo-5202168.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', name: 'Moon Ticket', rarity: 'Rare', owner: 'MemeKing' },
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-primary-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-secondary-500/10 rounded-full filter blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Leaderboard Section */}
          <div id="leaderboard">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <p className="text-primary-400 font-medium mb-2">Hall of Fame</p>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
                Top Players
              </h2>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-dark-card rounded-xl border border-dark-border overflow-hidden shadow-lg"
            >
              <div className="p-5 border-b border-dark-border flex items-center justify-between">
                <div className="flex items-center">
                  <Trophy size={20} className="text-primary-400 mr-2" />
                  <h3 className="font-medium text-white">Global Leaderboard</h3>
                </div>
                <button className="text-gray-400 hover:text-white flex items-center text-sm">
                  <span>View All</span>
                  <ChevronRight size={16} />
                </button>
              </div>
              
              <div className="divide-y divide-dark-border">
                {topPlayers.map((player, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
                    className={`flex items-center justify-between p-2 rounded-md ${player.name === 'You' ? 'bg-primary-500/20 border border-primary-500/30' : 'hover:bg-dark/40'}`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center mr-3">
                      {player.rank <= 3 ? (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          player.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' : 
                          player.rank === 2 ? 'bg-gray-400/20 text-gray-300' : 
                          'bg-amber-700/20 text-amber-600'
                        }`}>
                          <Trophy size={16} />
                        </div>
                      ) : (
                        <span className="text-gray-500 font-medium">{player.rank}</span>
                      )}
                    </div>
                    
                    <img src={player.avatar} alt={player.name} className="w-10 h-10 rounded-full mr-3" />
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{player.name}</h4>
                      <div className="flex items-center">
                        <Award size={14} className="text-primary-400 mr-1" />
                        <span className="text-xs text-gray-400">{player.badges} Badges</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-white font-medium">{player.score.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">total points</div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="p-4 bg-dark-lighter flex justify-center">
                <button className="text-primary-400 hover:text-primary-300 flex items-center font-medium">
                  <span>See Full Rankings</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          </div>
          
          {/* NFT Gallery Section */}
          <div id="nft">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <p className="text-secondary-400 font-medium mb-2">Digital Collectibles</p>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
                NFT Badges
              </h2>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {nfts.map((nft, index) => (
                <NFTCard 
                  key={index}
                  image={nft.image}
                  name={nft.name}
                  rarity={nft.rarity}
                  owner={nft.owner}
                  index={index}
                />
              ))}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="mt-6 text-center"
            >
              <button className="inline-flex items-center gap-1 bg-dark-lighter text-secondary-400 hover:text-secondary-300 px-4 py-2 rounded-lg border border-dark-border hover:border-secondary-500/30 transition-colors">
                <span>View All Collectibles</span>
                <ChevronRight size={16} />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeaderboardNFT;