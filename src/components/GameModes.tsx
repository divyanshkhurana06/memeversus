import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap, Headphones, Keyboard, ChevronRight, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GameModeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  players: number;
  color: string;
  delay: number;
  link: string;
}

const GameModeCard: React.FC<GameModeCardProps> = ({ icon, title, description, players, color, delay, link }) => {
  return (
    <Link to={link}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ delay: delay * 0.1, duration: 0.5 }}
        whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}
        className={`flex-shrink-0 w-full sm:w-[300px] md:w-[350px] bg-dark-card rounded-xl border border-dark-border overflow-hidden group`}
      >
        <div className={`h-2 ${color}`}></div>
        <div className="p-6">
          <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4`}>
            {icon}
          </div>
          <h3 className="text-xl font-heading font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">{title}</h3>
          <p className="text-gray-400 mb-4">{description}</p>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{players} active players</span>
            <button className={`flex items-center justify-center w-8 h-8 rounded-full ${color}/20 text-primary-400 group-hover:${color}/40 transition-colors`}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

const GameModes: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const { current } = containerRef;
      const scrollAmount = 400;
      if (direction === 'left') {
        current.scrollLeft -= scrollAmount;
      } else {
        current.scrollLeft += scrollAmount;
      }
    }
  };

  const gameModes = [
    {
      icon: <Zap size={24} className="text-white" />,
      title: "FrameRace",
      description: "Pause a meme video on the perfect frame before anyone else.",
      players: 2458,
      color: "bg-primary-500",
      link: "/games/frame-race"
    },
    {
      icon: <Headphones size={24} className="text-white" />,
      title: "SoundSnatch",
      description: "Guess the distorted meme sound or song before time runs out.",
      players: 1875,
      color: "bg-accent-500",
      link: "/games/sound-snatch"
    },
    {
      icon: <Keyboard size={24} className="text-white" />,
      title: "TypeClash",
      description: "Type the meme caption faster than your opponents.",
      players: 3201,
      color: "bg-secondary-500",
      link: "/games/type-clash"
    }
  ];

  return (
    <section id="games" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-40 right-20 w-72 h-72 bg-accent-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-60 h-60 bg-primary-500/10 rounded-full filter blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-primary-400 font-medium mb-2"
            >
              Choose Your Battle
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-3xl md:text-4xl font-heading font-bold text-white"
            >
              Game Modes
            </motion.h2>
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full bg-dark-lighter border border-dark-border flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </motion.button>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full bg-dark-lighter border border-dark-border flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight size={20} />
            </motion.button>
          </div>
        </div>
        
        <div 
          ref={containerRef}
          className="flex space-x-4 overflow-x-auto pb-6 snap-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {gameModes.map((game, index) => (
            <GameModeCard 
              key={index}
              icon={game.icon}
              title={game.title}
              description={game.description}
              players={game.players}
              color={game.color}
              delay={index}
              link={game.link}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default GameModes;