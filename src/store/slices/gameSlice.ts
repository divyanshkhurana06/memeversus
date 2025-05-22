import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type GameMode = 'frame-race' | 'type-clash' | 'sound-snatch';
export type GameStatus = 'idle' | 'waiting' | 'playing' | 'finished';

interface GameState {
  currentMode: GameMode | null;
  status: GameStatus;
  score: number;
  timeRemaining: number;
  isMultiplayer: boolean;
  players: {
    id: string;
    name: string;
    score: number;
    isReady: boolean;
  }[];
}

const initialState: GameState = {
  currentMode: null,
  status: 'idle',
  score: 0,
  timeRemaining: 0,
  isMultiplayer: false,
  players: [],
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setGameMode: (state, action: PayloadAction<GameMode>) => {
      state.currentMode = action.payload;
      state.status = 'waiting';
    },
    startGame: (state) => {
      state.status = 'playing';
      state.score = 0;
      state.timeRemaining = 60; // 60 seconds default
    },
    updateScore: (state, action: PayloadAction<number>) => {
      state.score += action.payload;
    },
    updateTime: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    endGame: (state) => {
      state.status = 'finished';
    },
    resetGame: (state) => {
      return initialState;
    },
    setMultiplayer: (state, action: PayloadAction<boolean>) => {
      state.isMultiplayer = action.payload;
    },
    addPlayer: (state, action: PayloadAction<{ id: string; name: string }>) => {
      state.players.push({
        ...action.payload,
        score: 0,
        isReady: false,
      });
    },
    updatePlayerScore: (state, action: PayloadAction<{ id: string; score: number }>) => {
      const player = state.players.find(p => p.id === action.payload.id);
      if (player) {
        player.score = action.payload.score;
      }
    },
    setPlayerReady: (state, action: PayloadAction<{ id: string; isReady: boolean }>) => {
      const player = state.players.find(p => p.id === action.payload.id);
      if (player) {
        player.isReady = action.payload.isReady;
      }
    },
  },
});

export const {
  setGameMode,
  startGame,
  updateScore,
  updateTime,
  endGame,
  resetGame,
  setMultiplayer,
  addPlayer,
  updatePlayerScore,
  setPlayerReady,
} = gameSlice.actions;

export default gameSlice.reducer; 