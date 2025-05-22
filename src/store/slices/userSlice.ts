import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  isConnected: boolean;
  walletAddress: string | null;
  username: string | null;
  nfts: {
    id: string;
    name: string;
    image: string;
    gameMode: string;
  }[];
  stats: {
    gamesPlayed: number;
    totalScore: number;
    highestScore: number;
    rank: number;
  };
}

const initialState: UserState = {
  isConnected: false,
  walletAddress: null,
  username: null,
  nfts: [],
  stats: {
    gamesPlayed: 0,
    totalScore: 0,
    highestScore: 0,
    rank: 0,
  },
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    connectWallet: (state, action: PayloadAction<{ address: string; username: string }>) => {
      state.isConnected = true;
      state.walletAddress = action.payload.address;
      state.username = action.payload.username;
    },
    disconnectWallet: (state) => {
      return initialState;
    },
    addNFT: (state, action: PayloadAction<{ id: string; name: string; image: string; gameMode: string }>) => {
      state.nfts.push(action.payload);
    },
    updateStats: (state, action: PayloadAction<{ score: number }>) => {
      state.stats.gamesPlayed += 1;
      state.stats.totalScore += action.payload.score;
      if (action.payload.score > state.stats.highestScore) {
        state.stats.highestScore = action.payload.score;
      }
    },
    updateRank: (state, action: PayloadAction<number>) => {
      state.stats.rank = action.payload;
    },
  },
});

export const {
  connectWallet,
  disconnectWallet,
  addNFT,
  updateStats,
  updateRank,
} = userSlice.actions;

export default userSlice.reducer; 