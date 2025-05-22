export type GameMode = 'frameRace' | 'soundSnatch' | 'typeClash';

export interface Player {
  id: string;
  walletAddress: string;
  username: string;
  score: number;
  isReady: boolean;
  avatar?: string;
}

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  avatar?: string;
  timestamp: number;
  playerId?: string;
  username?: string;
  content?: string;
}

export interface GameState {
  id: string;
  roomId?: string;
  mode: GameMode;
  status: 'waiting' | 'starting' | 'playing' | 'ended';
  players: Player[];
  currentRound: number;
  maxRounds: number;
  timeLimit: number;
  scores: Record<string, number>;
  winner?: string;
  startTime?: number;
  endTime?: number;
}

export interface FrameRaceState extends GameState {
  mode: 'frameRace';
  currentFrame: string;
  correctAnswer: string;
  options: string[];
}

export interface SoundSnatchState extends GameState {
  mode: 'soundSnatch';
  currentSound: string;
  correctAnswer: string;
  options: string[];
}

export interface TypeClashState extends GameState {
  mode: 'typeClash';
  currentText: string;
  timeRemaining: number;
} 