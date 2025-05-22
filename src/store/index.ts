import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './slices/gameSlice';
import userReducer from './slices/userSlice';
import leaderboardReducer from './slices/leaderboardSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    user: userReducer,
    leaderboard: leaderboardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 