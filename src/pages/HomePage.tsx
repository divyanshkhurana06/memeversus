import React from 'react';
import HeroSection from '../components/HeroSection';
import GameModes from '../components/GameModes';
import LeaderboardNFT from '../components/LeaderboardNFT';

const HomePage: React.FC = () => {
  return (
    <>
      <HeroSection />
      <GameModes />
      <LeaderboardNFT />
    </>
  );
};

export default HomePage;