import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap, Users, Trophy } from 'lucide-react';
import GameRoomUI from '../components/GameRoomUI';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setGameMode, startGame, updateScore, updateTime, endGame, GameStatus } from '../store/slices/gameSlice';
import { useWalletState } from '../hooks/useWalletState';
import { addEntry } from '../store/slices/leaderboardSlice';
import NFTMinter from '../components/NFTMinter';

const FrameRacePage: React.FC = () => {
  const dispatch = useDispatch();
  const { currentMode, status, score, timeRemaining } = useSelector((state: RootState) => state.game);
  const { isConnected, walletAddress } = useWalletState(); // Using the custom hook for wallet state
  const { username } = useSelector((state: RootState) => state.user); // Get username from user slice

  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [targetFrameTime, setTargetFrameTime] = useState<number>(0); // Time of the target frame
  const [userPausedTime, setUserPausedTime] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const totalRounds = 3; // Define total number of rounds
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [isRoundComplete, setIsRoundComplete] = useState<boolean>(false);
  const [roundCountdown, setRoundCountdown] = useState<number>(3); // Countdown for round transition
  const [preGameCountdown, setPreGameCountdown] = useState<number>(5); // Countdown before game starts
  const [showNFTMinter, setShowNFTMinter] = useState(false);

  // Set game mode when component mounts
  useEffect(() => {
    if (currentMode !== 'frame-race') {
      dispatch(setGameMode('frame-race'));
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

    // Game ends if status is finished or time runs out
    if (status === 'finished' || timeRemaining <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // If game ends due to time running out while still 'playing'
      if (status === 'playing' && timeRemaining <= 0) {
          dispatch(endGame());
           // Dispatch leaderboard entry on game end (time out)
          if (username && currentMode) { // Ensure username and mode are available
             dispatch(addEntry({
               rank: 0, // Placeholder rank, can be determined on display or backend
               username: username,
               score: score, // Score at the time of timeout
               gameMode: currentMode,
               timestamp: Date.now(),
             }));
          }
          // Show NFT minter after game ends
          setShowNFTMinter(true);
      }
       // If game ends because user paused (status becomes 'finished' in handlePauseVideo)
       if (status === 'finished' && userPausedTime != null) {
         // Show NFT minter after game ends
         setShowNFTMinter(true);
       }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Also pause video when timer is cleared (e.g., component unmounts or game ends)
       if (videoRef.current) {
         videoRef.current.pause();
       }
    };
  }, [status, timeRemaining, dispatch, username, score, currentMode, userPausedTime, isRoundComplete]); // Added isRoundComplete to dependencies

  // Placeholder: Load video and set a random target frame
  useEffect(() => {
    // In a real app, you would fetch video info and target frame from a backend/contract
    const mockVideoDuration = 30; // seconds
    setVideoDuration(mockVideoDuration);
    // Set a random target time within the video duration (excluding first/last few seconds)
    setTargetFrameTime(Math.random() * (mockVideoDuration - 5) + 2.5);
  }, []);

  const handleStartGame = useCallback(() => {
    if (isConnected && walletAddress && username) { // Ensure wallet is connected and username exists
      // Set status to waiting and start pre-game countdown
      // Dispatch startGame() which should transition status to 'waiting' in Redux
      dispatch(startGame());
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

  const handlePauseVideo = useCallback(() => {
    if (status === 'playing' && videoRef.current) {
      videoRef.current.pause();
      const currentTime = videoRef.current.currentTime;
      setUserPausedTime(currentTime);

      // Calculate score based on currentTime vs targetFrameTime
      // Let's make the scoring a bit more rewarding for closer pauses
      const difference = Math.abs(currentTime - targetFrameTime);
      let scoreEarned = 0;
      if (difference <= 0.05) { // Extremely close (e.g., within 50ms)
        scoreEarned = 1000;
      } else if (difference <= 0.1) { // Very close (e.g., within 100ms)
        scoreEarned = 500;
      } else if (difference <= 0.25) { // Close (e.g., within 250ms)
        scoreEarned = 250;
      } else if (difference <= 0.5) { // Within half a second
        scoreEarned = 100;
      } else if (difference <= 1.0) { // Within 1 second
        scoreEarned = 50;
      } else {
        scoreEarned = 0; // More than 1 second off
      }

      // Update total score in Redux
      dispatch(updateScore(scoreEarned));

      // Store score for the current round
      setRoundScores(prevScores => [...prevScores, scoreEarned]);

      setIsRoundComplete(true); // Mark round as complete

      // Game no longer ends immediately after one pause
      // The logic for transitioning to the next round or ending the game
      // will be handled elsewhere (e.g., in a useEffect or a dedicated function)
      // dispatch(endGame());
    }
  }, [status, targetFrameTime, dispatch]);

  const handleVideoMetadataLoaded = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      // Optionally set targetFrameTime based on actual video duration here
    }
  };

  // Logic to transition between rounds or end game after a round is complete
  useEffect(() => {
    if (isRoundComplete) {
      // Clear the main timer when a round is complete to pause the countdown display
      if (timerRef.current) {
         clearInterval(timerRef.current);
         timerRef.current = null;
      }

      if (currentRound < totalRounds) {
        // Prepare for the next round after a short delay
        setRoundCountdown(3); // Reset countdown
        const nextRoundTimer = setTimeout(() => {
          setCurrentRound(prevRound => prevRound + 1);
          setUserPausedTime(null); // Reset for next round
          setIsRoundComplete(false); // Reset round complete status

          // TODO: Load new video/set new target frame for the next round
           // For now, generate a new random target frame and reset video to start
          const mockVideoDuration = videoRef.current?.duration || 30; // Use actual duration if available, otherwise mock
          setTargetFrameTime(Math.random() * (mockVideoDuration - 5) + 2.5);

          if (videoRef.current) {
             videoRef.current.currentTime = 0;
             videoRef.current.play().catch(error => console.error('Error playing video:', error));
          }

          // Restart the main timer for the next round? Or does timeRemaining carry over?
          // Assuming timeRemaining is total game time, timer will restart via status === 'playing' && !isRoundComplete

        }, 3000); // 3 second delay before next round
        return () => clearTimeout(nextRoundTimer);
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

      // Initialize round state and load first video/target
      setUserPausedTime(null); // Reset user pause time
      setCurrentRound(1); // Start at round 1
      setRoundScores([]); // Clear previous round scores
      setIsRoundComplete(false); // Reset round complete status

      // Load video and set target frame for the first round
      const mockVideoDuration = videoRef.current?.duration || 30; // Use actual duration if available, otherwise mock
      setTargetFrameTime(Math.random() * (mockVideoDuration - 5) + 2.5);

      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(error => console.error('Error playing video:', error));
      }
    }
     // Reset pre-game countdown if status changes from waiting to something else (e.g., idle, finished)
    if (status !== 'waiting' && preGameCountdown !== 5) {
        setPreGameCountdown(5);
    }
  }, [status, preGameCountdown, dispatch, videoRef]); // Added videoRef to dependencies

  // Game end handling
  useEffect(() => {
    if (status === 'finished' || timeRemaining <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Calculate final score
      const finalScore = roundScores.reduce((total, score) => total + score, 0);
      dispatch(updateScore(finalScore));

      // Add to leaderboard
      if (username && currentMode) {
        dispatch(addEntry({
          rank: 0,
          username,
          score: finalScore,
          gameMode: currentMode,
          timestamp: Date.now(),
        }));
      }

      // Show NFT minter
      setShowNFTMinter(true);
    }
  }, [status, timeRemaining, dispatch, username, currentMode, roundScores]);

  // Handle NFT minting success
  const handleMintSuccess = useCallback((nftId: string) => {
    // You can add additional success handling here
    console.log('NFT minted successfully:', nftId);
  }, []);

  // Handle NFT minting error
  const handleMintError = useCallback((error: Error) => {
    console.error('Failed to mint NFT:', error);
    // You can add additional error handling here
  }, []);

  return (
    <div className="min-h-screen bg-dark-900 text-white p-4">
      <GameRoomUI
        videoRef={videoRef}
        onVideoMetadataLoaded={handleVideoMetadataLoaded}
        onPause={handlePauseVideo}
        onStart={handleStartGame}
        status={status}
        score={score}
        timeRemaining={timeRemaining}
        currentRound={currentRound}
        totalRounds={totalRounds}
        roundScores={roundScores}
        isRoundComplete={isRoundComplete}
        roundCountdown={roundCountdown}
        preGameCountdown={preGameCountdown}
      />

      {showNFTMinter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <NFTMinter
            gameMode={currentMode || 'frame-race'}
            score={score}
            onMintSuccess={handleMintSuccess}
            onMintError={handleMintError}
          />
        </div>
      )}
    </div>
  );
};

export default FrameRacePage;