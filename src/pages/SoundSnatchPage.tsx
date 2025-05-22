import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Headphones, Users, Trophy, Volume2 } from 'lucide-react';
import GameRoomUI from '../components/GameRoomUI';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setGameMode, startGame, updateScore, updateTime, endGame, GameStatus } from '../store/slices/gameSlice';
import { useWalletState } from '../hooks/useWalletState';
import { addEntry } from '../store/slices/leaderboardSlice';

// Placeholder list of meme sounds
const memeSounds = [
  { src: '/sounds/airhorn.mp3', name: 'Air Horn' },
  { src: '/sounds/crickets.mp3', name: 'Crickets' },
  { src: '/sounds/sad-violin.mp3', name: 'Sad Violin' },
  { src: '/sounds/oof.mp3', name: 'Oof' },
  { src: '/sounds/yeet.mp3', name: 'Yeet' },
];

const SoundSnatchPage: React.FC = () => {
  const dispatch = useDispatch();
  const { currentMode, status, score, timeRemaining } = useSelector((state: RootState) => state.game);
  const { isConnected, walletAddress } = useWalletState();
  const { username } = useSelector((state: RootState) => state.user);

  const [currentSound, setCurrentSound] = useState<{ src: string; name: string } | null>(null);
  const [userGuess, setUserGuess] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isCorrectGuess, setIsCorrectGuess] = useState<boolean>(false);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const totalRounds = 3; // Define total number of rounds for Sound Snatch
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [isRoundComplete, setIsRoundComplete] = useState<boolean>(false);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [roundCountdown, setRoundCountdown] = useState<number>(3); // Countdown for round transition
  const [preGameCountdown, setPreGameCountdown] = useState<number>(5); // Countdown before game starts
  const videoRef = useRef<HTMLVideoElement>(null);

  // Set game mode when component mounts
  useEffect(() => {
    if (currentMode !== 'sound-snatch') {
      dispatch(setGameMode('sound-snatch'));
    }
  }, [dispatch, currentMode]);

  // Timer logic
  useEffect(() => {
    // Start or continue timer only if status is 'playing' and round is not complete
    if (status === 'playing' && !isRoundComplete) {
      timerRef.current = setInterval(() => {
        dispatch(updateTime(timeRemaining - 1));
      }, 1000);
    } else if (timerRef.current) {
       // Clear timer if game is not playing or round is complete
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (status === 'finished' || timeRemaining <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Clear round timer as well if it exists
      if (roundTimerRef.current) {
         clearTimeout(roundTimerRef.current);
         roundTimerRef.current = null;
      }

      if (status === 'playing' && timeRemaining <= 0) {
        dispatch(endGame());
        // Handle game end logic (e.g., calculate score, show results)
         // Dispatch leaderboard entry on game end
        if (username && currentMode) { // Ensure username and mode are available
           dispatch(addEntry({
             rank: 0, // Placeholder rank
             username: username,
             score: score, // Use score from Redux state
             gameMode: currentMode,
             timestamp: Date.now(),
           }));
        }
      }
       if (audioRef.current) {
        audioRef.current.pause();
       }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (roundTimerRef.current) {
         clearTimeout(roundTimerRef.current);
      }
       if (audioRef.current) {
        audioRef.current.pause();
       }
    };
  }, [status, timeRemaining, dispatch, username, score, currentMode, isRoundComplete]); // Added isRoundComplete to dependencies

  const selectRandomSound = () => {
    const randomIndex = Math.floor(Math.random() * memeSounds.length);
    return memeSounds[randomIndex];
  };

  const handleStartGame = useCallback(() => {
    if (isConnected && walletAddress && username) { // Ensure wallet is connected and username exists
      // Set status to waiting and start pre-game countdown
      dispatch(startGame()); // This should transition status to 'waiting' in Redux
      setPreGameCountdown(5); // Start countdown from 5
      // Actual game start and round initialization will happen after pre-game countdown
    } else if (!isConnected || !walletAddress) {
      alert('Please connect your wallet to start the game.');
      // Maybe trigger wallet connection UI here
    } else if (!username) {
       alert('Please set a username to start the game.');
       // Maybe trigger username setting UI
    }
  }, [isConnected, walletAddress, username, dispatch]);

  // Play audio when currentSound changes and game is playing
  useEffect(() => {
    if (status === 'playing' && currentSound && audioRef.current) {
      audioRef.current.src = currentSound.src;
      audioRef.current.play().catch(error => console.error('Error playing audio:', error));
    }
  }, [status, currentSound]);

  const handleGuessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const guess = e.target.value;
    setUserGuess(guess);

    // Basic correctness check (case-insensitive and trim whitespace)
    if (currentSound && guess.trim().toLowerCase() === currentSound.name.toLowerCase()) {
      setIsCorrectGuess(true);
      // Calculate score (e.g., based on time remaining)
      const scoreEarned = timeRemaining > 0 ? timeRemaining * 10 : 0; // Earn points only if time is left
      dispatch(updateScore(scoreEarned));
      // The game will end here and the useEffect will handle dispatching the leaderboard entry
      setRoundScores(prevScores => [...prevScores, scoreEarned]);
      setIsRoundComplete(true);
    }
  };

  // Logic to transition between rounds or end game after a round is complete
  useEffect(() => {
    if (isRoundComplete) {
       // Pause the main game timer during the transition
       if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
       }

      // Pause the audio after a round is complete
      if (audioRef.current) {
        audioRef.current.pause();
      }

      if (currentRound < totalRounds) {
        // Prepare for the next round after a short delay
        setRoundCountdown(3); // Reset countdown
        roundTimerRef.current = setTimeout(() => {
          setCurrentRound(prevRound => prevRound + 1);
          const nextSound = selectRandomSound(); // Get a new sound for the next round
          setCurrentSound(nextSound);
          setUserGuess(''); // Reset user input
          setIsCorrectGuess(false); // Reset guess status
          setIsRoundComplete(false); // Reset round complete status
          // Main game timer will restart via status === 'playing' && !isRoundComplete
        }, 3000); // 3 second delay before next round
         return () => {
            if (roundTimerRef.current) {
               clearTimeout(roundTimerRef.current);
            }
         };
      } else {
        // All rounds are complete, end the game
        dispatch(endGame());
         // Dispatch leaderboard entry for the final score
          if (username && currentMode) { // Ensure username and mode are available
             // The total accumulated score is already in the Redux state (state.game.score)
             dispatch(addEntry({
               rank: 0, // Placeholder rank
               username: username,
               score: score, // Use the final accumulated score
               gameMode: currentMode,
               timestamp: Date.now(),
             }));
          }
      }
    }
  }, [isRoundComplete, currentRound, totalRounds, dispatch, username, currentMode, score]); // Added score to dependencies

  // Play audio when currentSound changes and game is playing and round is not complete
  useEffect(() => {
    if (status === 'playing' && !isRoundComplete && currentSound && audioRef.current) {
      audioRef.current.src = currentSound.src;
      audioRef.current.play().catch(error => console.error('Error playing audio:', error));
    }
  }, [status, isRoundComplete, currentSound]); // Added isRoundComplete to dependencies

  // Countdown timer for round transition
  useEffect(() => {
    if (isRoundComplete && currentRound < totalRounds) {
      const countdownInterval = setInterval(() => {
        setRoundCountdown(prevCount => {
          if (prevCount <= 1) {
            clearInterval(countdownInterval);
            return 0;
          } else {
            return prevCount - 1;
          }
        });
      }, 1000);
      return () => clearInterval(countdownInterval);
    } else if (!isRoundComplete) {
       setRoundCountdown(3); // Reset countdown when round is not complete
    }
  }, [isRoundComplete, currentRound, totalRounds]);

  // Pre-game countdown logic
  useEffect(() => {
    if (status === 'waiting' && preGameCountdown > 0) {
      const countdownTimer = setTimeout(() => {
        setPreGameCountdown(prevCount => prevCount - 1);
      }, 1000);
      return () => clearTimeout(countdownTimer);
    } else if (status === 'waiting' && preGameCountdown === 0) {
      // Pre-game countdown finished, start the actual game round 1
      // Note: The Redux status is still 'waiting'. We need to trigger the transition to 'playing'.
      // Assuming dispatching startGame() again or a dedicated action like startRound() does this.
      // Let's assume dispatch(startGame()) handles the transition if status is 'waiting'.
      dispatch(startGame()); // Transition from waiting to playing

      // Initialize round state and load first sound
      const sound = selectRandomSound();
      setCurrentSound(sound);
      setUserGuess(''); // Reset user input
      setIsCorrectGuess(false); // Reset guess status
      setCurrentRound(1); // Start at round 1
      setRoundScores([]); // Clear previous round scores
      setIsRoundComplete(false); // Reset round complete status
    }
     // Reset pre-game countdown if status changes from waiting to something else (e.g., idle, finished)
    if (status !== 'waiting' && preGameCountdown !== 5) {
        setPreGameCountdown(5);
    }
  }, [status, preGameCountdown, dispatch]);

  return (
    <div className="pt-20">
      <section className="py-12 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center mb-12"
          >
            <div className="inline-flex items-center justify-center gap-2 bg-accent-500/20 rounded-full px-4 py-2 mb-4">
              <Headphones size={20} className="text-accent-400" />
              <span className="text-accent-400 font-medium">SoundSnatch Mode</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              Name That Meme Sound
            </h1>
            <p className="text-gray-300 text-lg mb-8">
              Put your audio recognition skills to the test! Identify distorted meme sounds and viral clips before time runs out.
            </p>
            <div className="flex flex-wrap gap-6 justify-center items-center">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-accent-400" />
                <span className="text-gray-300">Online players counter (placeholder)</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-accent-400" />
                <span className="text-gray-300">Prize pool / Leaderboard info (placeholder)</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Game UI Section */}
      <section className="py-12 bg-dark-base">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Sound Snatch Specific UI */}
             {status !== 'idle' && (
                <div className="bg-dark-lighter rounded-lg p-6 mb-6 text-center">
                  <h3 className="text-xl font-heading font-bold text-white mb-4">Listen carefully:</h3>
                  {/* Placeholder Audio Element */}
                  <audio ref={audioRef} src={currentSound?.src} className="w-full mb-4" onEnded={() => { /* Handle audio end if needed */}}></audio>

                   {status === 'playing' && (
                     <motion.button
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       onClick={() => audioRef.current?.play().catch(error => console.error('Error playing audio:', error))}
                       className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-md font-medium inline-flex items-center mb-4"
                     >
                       <Volume2 size={20} className="mr-2" /> Play Sound
                     </motion.button>
                   )}

                  <input
                    type="text"
                    className="w-full bg-dark text-white text-lg rounded-md px-4 py-3 outline-none focus:ring-2 focus:ring-accent-500 text-center"
                    value={userGuess}
                    onChange={handleGuessChange}
                    disabled={status !== 'playing' || isCorrectGuess}
                    placeholder={status === 'finished' ? 'Game Over!' : status === 'waiting' ? 'Get Ready to Guess!' : 'Your Guess...'}
                  />
                   {status === 'finished' && isCorrectGuess && currentSound && (
                      <p className="mt-4 text-lg font-bold text-green-500">Correct! It was: {currentSound.name}</p>
                   )}
                     {status === 'finished' && !isCorrectGuess && currentSound && userGuess.length > 0 && (
                      <p className="mt-4 text-lg font-bold text-red-500">Incorrect. The sound was: {currentSound.name}</p>
                   )}
                   {status === 'playing' && isRoundComplete && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 text-center text-white"
                      >
                        <h3 className="text-xl font-bold">Round {currentRound} Complete!</h3>
                        {isCorrectGuess ? (
                           <p>You got it right!</p>
                        ) : (
                           <p>Incorrect guess.</p>
                        )}
                        <p>Score for this round: {roundScores[currentRound - 1]?.toFixed(2) || 0}</p>
                        {currentRound < totalRounds ? (
                          <p className="text-lg mt-2">Next round in: {roundCountdown}s</p>
                        ) : (
                          <p className="text-lg mt-2">Finishing game...</p>
                        )}
                      </motion.div>
                   )}
                </div>
             )}

            <GameRoomUI
              status={status}
              score={score}
              timeRemaining={timeRemaining}
              currentRound={currentRound}
              totalRounds={totalRounds}
              roundScores={roundScores}
              isRoundComplete={isRoundComplete}
              roundCountdown={roundCountdown}
              preGameCountdown={preGameCountdown}
              videoRef={videoRef}
              onVideoMetadataLoaded={() => {}}
              onPause={() => {}}
              onStart={() => {}}
            />

            {/* Game Feedback / Results - Can be consolidated in GameRoomUI later if needed */}
             {status === 'finished' && (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="mt-8 text-center text-white"
               >
                 <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
                 <p className="text-xl mb-2">Final Score: {score.toFixed(2)}</p>
                  {/* Add more results details or buttons (e.g., Play Again, View Leaderboard) */}
                  {/* Display scores for each round */}
                  {roundScores.length > 0 && (
                    <div className="mt-4 text-left inline-block">
                      <h3 className="text-xl font-bold mb-2">Round Scores:</h3>
                      <ul className="list-disc list-inside">
                        {roundScores.map((roundScore, index) => (
                          <li key={index}>Round {index + 1}: {roundScore.toFixed(2)} points</li>
                        ))}
                      </ul>
                    </div>
                  )}
               </motion.div>
             )}

          </div>
        </div>
      </section>
    </div>
  );
};

export default SoundSnatchPage;