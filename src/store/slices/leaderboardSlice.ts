import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GameMode } from './gameSlice';

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  gameMode: GameMode;
  timestamp: number;
}

interface LeaderboardState {
  global: LeaderboardEntry[];
  frameRace: LeaderboardEntry[];
  typeClash: LeaderboardEntry[];
  soundSnatch: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
}

const initialState: LeaderboardState = {
  global: [],
  frameRace: [],
  typeClash: [],
  soundSnatch: [],
  isLoading: false,
  error: null,
};

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updateGlobalLeaderboard: (state, action: PayloadAction<LeaderboardEntry[]>) => {
      state.global = action.payload;
    },
    updateGameLeaderboard: (state, action: PayloadAction<{ mode: GameMode; entries: LeaderboardEntry[] }>) => {
      switch (action.payload.mode) {
        case 'frame-race':
          state.frameRace = action.payload.entries;
          break;
        case 'type-clash':
          state.typeClash = action.payload.entries;
          break;
        case 'sound-snatch':
          state.soundSnatch = action.payload.entries;
          break;
      }
    },
    addEntry: (state, action: PayloadAction<LeaderboardEntry>) => {
      // Add to global leaderboard
      state.global.push(action.payload);
      state.global.sort((a, b) => b.score - a.score);
      state.global = state.global.slice(0, 100); // Keep top 100

      // Add to game-specific leaderboard
      switch (action.payload.gameMode) {
        case 'frame-race':
          state.frameRace.push(action.payload);
          state.frameRace.sort((a, b) => b.score - a.score);
          state.frameRace = state.frameRace.slice(0, 100);
          break;
        case 'type-clash':
          state.typeClash.push(action.payload);
          state.typeClash.sort((a, b) => b.score - a.score);
          state.typeClash = state.typeClash.slice(0, 100);
          break;
        case 'sound-snatch':
          state.soundSnatch.push(action.payload);
          state.soundSnatch.sort((a, b) => b.score - a.score);
          state.soundSnatch = state.soundSnatch.slice(0, 100);
          break;
      }
    },
  },
});

export const {
  setLoading,
  setError,
  updateGlobalLeaderboard,
  updateGameLeaderboard,
  addEntry,
} = leaderboardSlice.actions;

export default leaderboardSlice.reducer; 