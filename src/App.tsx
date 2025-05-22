import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTopButton from './components/ScrollToTopButton';
import HomePage from './pages/HomePage';
import FrameRacePage from './pages/FrameRacePage';
import SoundSnatchPage from './pages/SoundSnatchPage';
import TypeClashPage from './pages/TypeClashPage';
import LeaderboardPage from './pages/LeaderboardPage';
import NFTGalleryPage from './pages/NFTGalleryPage';
import AboutPage from './pages/AboutPage';

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.title = 'MemeVersus - Compete in the Meme Olympics';
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-dark text-white overflow-hidden">
        <div className="fixed inset-0 z-[-1]">
          <div className="absolute top-0 left-0 w-full h-full bg-dark bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-900/20 via-dark to-dark"></div>
        </div>
        
        <Navbar />
        
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/games/frame-race" element={<FrameRacePage />} />
            <Route path="/games/sound-snatch" element={<SoundSnatchPage />} />
            <Route path="/games/type-clash" element={<TypeClashPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/nft" element={<NFTGalleryPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
        
        <Footer />
        <ScrollToTopButton />
      </div>
    </Router>
  );
}

export default App;