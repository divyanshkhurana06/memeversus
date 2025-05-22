import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

const AboutPage: React.FC = () => {
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
              <Users size={20} className="text-primary-400" />
              <span className="text-primary-400 font-medium">About Us</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              The Team Behind MemeVersus
            </h1>
            <p className="text-gray-300 text-lg mb-8">
              We're a team of meme enthusiasts, developers, and crypto natives building the future of competitive meme gaming.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;