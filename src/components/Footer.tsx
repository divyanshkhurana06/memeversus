import React from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Twitter, Github, Globe } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-lighter border-t border-dark-border py-12 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-primary-500/5 rounded-full filter blur-3xl"></div>
        <div className="absolute top-0 right-1/4 w-60 h-60 bg-secondary-500/5 rounded-full filter blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-6 md:mb-0"
          >
            <Gamepad2 size={28} className="text-primary-500" />
            <div>
              <h3 className="text-xl font-heading font-bold text-white">MemeVersus</h3>
              <p className="text-gray-400 text-sm">Built for Sui Overflow 2025</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col items-center md:items-end"
          >
            <div className="flex space-x-4 mb-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Globe size={20} />
              </a>
            </div>
            <p className="text-gray-500 text-sm">© 2025 Team MemeDAO 🔥. All rights reserved.</p>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-8 pt-6 border-t border-dark-border flex flex-col md:flex-row justify-between items-center"
        >
          <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 mb-4 md:mb-0">
            <a href="#" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">Contact Us</a>
            <a href="#" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">Support</a>
          </div>
          
          <div className="inline-flex items-center rounded-full bg-dark px-4 py-1.5 text-xs text-gray-400">
            <span className="mr-2 h-2 w-2 rounded-full bg-green-400"></span>
            All systems operational
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;