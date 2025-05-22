import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Gamepad2, Trophy } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { WalletConnect } from './WalletConnect';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const scrollToGames = () => {
    if (location.pathname === '/') {
      const gamesSection = document.getElementById('games');
      if (gamesSection) {
        gamesSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const menuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-lighter/80 backdrop-blur-lg border-b border-dark-border">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center h-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <Link to="/" className="flex items-center gap-2">
              <Gamepad2 className="w-7 h-7 text-primary-500" />
              <span className="text-white font-heading font-bold text-xl">MemeVersus</span>
            </Link>
          </motion.div>
          
          <div className="hidden md:flex items-center space-x-8">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex space-x-6 text-gray-300"
            >
              <Link to="/" className="hover:text-primary-400 transition-colors duration-300 font-medium">Home</Link>
              <Link to="/" onClick={scrollToGames} className="hover:text-primary-400 transition-colors duration-300 font-medium">Games</Link>
              <Link to="/leaderboard" className="hover:text-primary-400 transition-colors duration-300 font-medium">Leaderboard</Link>
              <Link to="/nft" className="hover:text-primary-400 transition-colors duration-300 font-medium">NFT Gallery</Link>
              <Link to="/about" className="hover:text-primary-400 transition-colors duration-300 font-medium">About Us</Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <WalletConnect />
            </motion.div>
          </div>
          
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {isOpen && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={menuVariants}
          className="md:hidden bg-dark-lighter border-b border-dark-border"
        >
          <div className="container mx-auto px-4 py-4 space-y-3">
            <motion.div variants={itemVariants}>
              <Link to="/" className="block text-gray-300 hover:text-primary-400 transition-colors duration-300 font-medium py-2">Home</Link>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Link to="/" onClick={scrollToGames} className="block text-gray-300 hover:text-primary-400 transition-colors duration-300 font-medium py-2">Games</Link>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Link to="/leaderboard" className="block text-gray-300 hover:text-primary-400 transition-colors duration-300 font-medium py-2">Leaderboard</Link>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Link to="/nft" className="block text-gray-300 hover:text-primary-400 transition-colors duration-300 font-medium py-2">NFT Gallery</Link>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Link to="/about" className="block text-gray-300 hover:text-primary-400 transition-colors duration-300 font-medium py-2">About Us</Link>
            </motion.div>
            <motion.div variants={itemVariants}>
              <WalletConnect />
            </motion.div>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;