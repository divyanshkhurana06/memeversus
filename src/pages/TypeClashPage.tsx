import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Keyboard, Users, Trophy } from 'lucide-react';
import GameRoomUI from '../components/GameRoomUI';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setGameMode, startGame, updateScore, updateTime, endGame, GameStatus } from '../store/slices/gameSlice';
import { useWalletState } from '../hooks/useWalletState';
import { addEntry } from '../store/slices/leaderboardSlice';

// Placeholder list of typing phrases
const typingPhrases = [
  "gm wagmi fren",
  "lfg to the moon",
  "degen mode activated",
  "probably nothing",
  "wen lambo ser",
  "this is financial advice", // jk, not really
  "IYKYK OG meme",
  "alpha leak soon",
];

const TypeClashPage: React.FC = () => {
  const dispatch = useDispatch();
  const { currentMode, status, score, timeRemaining } = useSelector((state: RootState) => state.game);
  const { isConnected, walletAddress } = useWalletState();
  const { username } = useSelector((state: RootState) => state.user);

  const [currentPhrase, setCurrentPhrase] = useState<string>('');
  const [userText, setUserText] = useState<string>('');
  const [accuracy, setAccuracy] = useState<number>(0);
  const [wpm, setWpm] = useState<number>(0);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const totalRounds = 3; // Define total number of rounds for Type Clash
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [isRoundComplete, setIsRoundComplete] = useState<boolean>(false);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [roundCountdown, setRoundCountdown] = useState<number>(3); // Countdown for round transition
  const [preGameCountdown, setPreGameCountdown] = useState<number>(5); // Countdown before game starts

  // Set game mode when component mounts
  useEffect(() => {
    if (currentMode !== 'type-clash') {
      dispatch(setGameMode('type-clash'));
    }
  }, [dispatch, currentMode]);

  // Timer logic for typing game (can be different from Frame Race)
  useEffect(() => {
    if (status === 'playing') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        const timeElapsed = (Date.now() - startTimeRef.current) / 1000;
        // Calculate WPM and accuracy periodically or on text change
        // For simplicity, updating time remaining for now
         dispatch(updateTime(timeRemaining - 1));
      }, 1000);
    }

    if (status === 'finished' || timeRemaining <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (roundTimerRef.current) {
        clearTimeout(roundTimerRef.current);
        roundTimerRef.current = null;
      }

      if (status === 'playing') {
        dispatch(endGame());
        // Calculate final score, WPM, accuracy here
        calculateFinalResults();
        // Dispatch leaderboard entry on game end
        if (username && currentMode) {
           dispatch(addEntry({
             rank: 0,
             username: username,
             score: score,
             gameMode: currentMode,
             timestamp: Date.now(),
           }));
        }
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (roundTimerRef.current) {
        clearTimeout(roundTimerRef.current);
      }
    };
  }, [status, timeRemaining, dispatch, username, score, currentMode]);

  const selectRandomPhrase = () => {
    const randomIndex = Math.floor(Math.random() * typingPhrases.length);
    return typingPhrases[randomIndex];
  };

  const handleStartGame = useCallback(() => {
     if (isConnected && walletAddress && username) {
      // Set status to waiting and start pre-game countdown
      dispatch(startGame()); // This should transition status to 'waiting' in Redux
      setPreGameCountdown(5); // Start countdown from 5
      // Actual game start and round initialization will happen after pre-game countdown
      // No specific video logic for Type Clash, game starts with timer
    } else if (!isConnected || !walletAddress) {
      alert('Please connect your wallet to start the game.');
      // Maybe trigger wallet connection UI here
    } else if (!username) {
       alert('Please set a username to start the game.');
       // Maybe trigger username setting UI
    }
  }, [isConnected, walletAddress, username, dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setUserText(value);

    // Basic accuracy calculation (number of correct characters typed so far)
    let correctChars = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === currentPhrase[i]) {
        correctChars++;
      } else {
        // Stop counting correct characters if there's a mismatch
        break;
      }
    }
    const currentAccuracy = value.length > 0 ? (correctChars / currentPhrase.length) * 100 : 100;
    setAccuracy(currentAccuracy);

    // Check for game completion
    if (value === currentPhrase) {
      const timeElapsed = (Date.now() - startTimeRef.current) / 1000;
      // Calculate final WPM and accuracy
      const wordsTyped = currentPhrase.split(' ').length;
      const finalWpm = (wordsTyped / timeElapsed) * 60;
      const finalAccuracy = (correctChars / currentPhrase.length) * 100; // Final accuracy based on full phrase

      setWpm(finalWpm);
      setAccuracy(finalAccuracy);
      // Score could be based on WPM and accuracy
      const scoreEarned = Math.max(0, Math.floor(finalWpm * (finalAccuracy / 100)));
      dispatch(updateScore(scoreEarned));
      // Mark round as complete instead of ending the game immediately
      setRoundScores(prevScores => [...prevScores, scoreEarned]);
      setIsRoundComplete(true);
    }

     // Simple WPM calculation based on current progress (can be refined)
     const timeElapsed = (Date.now() - startTimeRef.current) / 1000;
     if (timeElapsed > 0 && value.length > 0) {
       const wordsTyped = value.split(' ').length;
       const currentWpm = (wordsTyped / timeElapsed) * 60;
       setWpm(currentWpm);
     }
  };

   const calculateFinalResults = () => {
      // This function is called when the game ends by timer or completion
      // Recalculate final WPM and accuracy based on the final state
      const timeElapsed = (Date.now() - startTimeRef.current) / 1000;
       if (timeElapsed > 0) {
         const wordsTyped = userText.split(' ').length;
         const finalWpm = (wordsTyped / timeElapsed) * 60;
         setWpm(finalWpm);
         // Recalculate accuracy based on how much of the phrase was correctly typed before time ran out or completion
         let correctChars = 0;
         for (let i = 0; i < userText.length; i++) {
            if (userText[i] === currentPhrase[i]) {
              correctChars++;
            } else {
              break;
            }
          }
         const finalAccuracy = userText.length > 0 ? (correctChars / currentPhrase.length) * 100 : 0;
         setAccuracy(finalAccuracy);
         // Update score based on final WPM and accuracy if not already updated by completion
          // Score update is now handled by dispatch(updateScore(scoreEarned)) when typing completes
          // If game ends by timer, the score will be whatever was last calculated.
       }
   };

  // Logic to transition between rounds or end game after a round is complete
  useEffect(() => {
    if (isRoundComplete) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (currentRound < totalRounds) {
        // Prepare for the next round after a short delay
        setRoundCountdown(3); // Reset countdown
        roundTimerRef.current = setTimeout(() => {
          setCurrentRound(prevRound => prevRound + 1);
          const nextPhrase = selectRandomPhrase(); // Get a new phrase for the next round
          setCurrentPhrase(nextPhrase);
          setUserText(''); // Reset user input
          setAccuracy(100); // Reset accuracy
          setWpm(0); // Reset WPM
          startTimeRef.current = Date.now(); // Reset start time for new round
          setIsRoundComplete(false); // Reset round complete status
          // Main game timer will restart via status === 'playing' in the timer useEffect
        }, 3000); // 3 second delay before next round
        return () => {
           if (roundTimerRef.current) {
              clearTimeout(roundTimerRef.current);
           }
         };
      } else {
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
  }, [isRoundComplete, currentRound, totalRounds, dispatch, username, currentMode, score]);

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
    let countdownTimer: NodeJS.Timeout | null = null;

    if (status === 'waiting' && preGameCountdown > 0) {
      countdownTimer = setTimeout(() => {
        setPreGameCountdown(prevCount => prevCount - 1);
      }, 1000);
    } else if (status === 'waiting' && preGameCountdown === 0) {
      // Pre-game countdown finished, start the actual game round 1
      // Note: The Redux status is still 'waiting'. We need to trigger the transition to 'playing'.
      // Assuming dispatching startGame() again or a dedicated action like startRound() does this.
      // Let's assume dispatch(startGame()) handles the transition if status is 'waiting'.
      dispatch(startGame()); // Transition from waiting to playing

      // Initialize round state and load first phrase
      const phrase = selectRandomPhrase();
      setCurrentPhrase(phrase);
      setUserText(''); // Reset user input
      setAccuracy(100); // Reset accuracy
      setWpm(0); // Reset WPM
      startTimeRef.current = Date.now(); // Reset start time for new round
      setCurrentRound(1); // Start at round 1
      setRoundScores([]); // Clear previous round scores
      setIsRoundComplete(false); // Reset round complete status
    }

    return () => {
      if (countdownTimer) {
        clearTimeout(countdownTimer);
      }
       // Reset pre-game countdown if status changes from waiting to something else (e.g., idle, finished)
       // This reset should happen when the status is no longer 'waiting', regardless of preGameCountdown value
       if (status !== 'waiting' && preGameCountdown !== 5) {
          setPreGameCountdown(5);
       }
    };
  }, [status, preGameCountdown, dispatch, selectRandomPhrase]);

  return (
    <div className="pt-20">
      <section className="py-12 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center mb-12"
          >
            <div className="inline-flex items-center justify-center gap-2 bg-secondary-500/20 rounded-full px-4 py-2 mb-4">
              <Keyboard size={20} className="text-secondary-400" />
              <span className="text-secondary-400 font-medium">TypeClash Mode</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              Speed Type Meme Captions
            </h1>
            <p className="text-gray-300 text-lg mb-8">
              Race against others to type out viral meme captions with perfect accuracy. The fastest memer wins!
            </p>
            <div className="flex flex-wrap gap-6 justify-center items-center">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-secondary-400" />
                <span className="text-gray-300">Online players counter (placeholder)</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-secondary-400" />
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
            {/* Type Clash Specific UI */}
             {(status === 'playing' || status === 'finished' || (status === 'waiting' && preGameCountdown > 0)) && (
                <div className="bg-dark-lighter rounded-lg p-6 mb-6">
                  {status === 'playing' && (
                    <h3 className="text-xl font-heading font-bold text-white mb-4">Type the phrase:</h3>
                  )}
                  {status === 'waiting' && preGameCountdown > 0 && (
                     <h3 className="text-xl font-heading font-bold text-white mb-4">Get Ready!</h3>
                  )}
                  <p className="text-gray-300 text-lg mb-4">{currentPhrase}</p>
                  <input
                    type="text"
                    className="w-full bg-dark text-white text-lg rounded-md px-4 py-3 outline-none focus:ring-2 focus:ring-secondary-500"
                    value={userText}
                    onChange={handleInputChange}
                    disabled={status !== 'playing' || isRoundComplete}
                    placeholder={status === 'finished' ? 'Game Over!' : status === 'waiting' ? 'Get Ready to Type!' : 'Start typing...'}
                  />
                  {status === 'playing' && (
                    <div className="mt-4 flex justify-between text-gray-400">
                      <span>Accuracy: {accuracy.toFixed(2)}%</span>
                      <span>WPM: {wpm.toFixed(2)}</span>
                    </div>
                  )}
                  {status === 'playing' && isRoundComplete && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 text-center text-white"
                    >
                      <h3 className="text-xl font-bold">Round {currentRound} Complete!</h3>
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
              gameMode="type-clash"
              status={status}
              score={score}
              timeRemaining={timeRemaining}
              onStartGame={handleStartGame}
              isConnected={isConnected}
              walletAddress={walletAddress}
               // Passing typing game specific props as undefined/not used in GameRoomUI for other modes
               onPauseVideo={undefined}
               targetFrameTime={undefined}
               userPausedTime={undefined}
              currentRound={currentRound}
              totalRounds={totalRounds}
              preGameCountdown={preGameCountdown}
            />

            {/* Game Feedback / Results - Can be consolidated in GameRoomUI later if needed */}
             {status === 'finished' && (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="mt-8 text-center text-white"                 >
                 <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
                 <p className="text-xl mb-2">Final Score: {score.toFixed(2)}</p>
                  <p className="text-lg mb-2">WPM: {wpm.toFixed(2)}</p>
                  <p className="text-lg">Accuracy: {accuracy.toFixed(2)}%</p>
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
                 {/* Add more results details or buttons (e.g., Play Again, View Leaderboard) */}
               </motion.div>
             )}

          </div>
        </div>
      </section>
    </div>
  );
};

export default TypeClashPage;