export enum GameMode {
  FRAME_RACE = 'FRAME_RACE',
  SOUND_SNATCH = 'SOUND_SNATCH',
  TYPE_CLASH = 'TYPE_CLASH'
}

export enum GameStatus {
  WAITING = 'WAITING',
  STARTING = 'STARTING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface GameState {
  id: string;
  mode: GameMode;
  status: GameStatus;
  players: string[];
  scores: Map<string, number>;
  currentFrame?: number;
  currentSound?: string;
  currentText?: string;
  lastActionTime?: number;
  roundNumber: number;
  maxRounds: number;
  roundTimeout: number;
  isActive: boolean;
  startTime?: number;
  winner?: string;
}

export interface GameAction {
  type: string;
  payload: any;
}

export interface GameResult {
  gameMode: GameMode;
  score: number;
  txDigest: string;
}

export interface Player {
  wallet_address: string;
  username: string;
  rating: number;
  created_at: Date;
  games_played: number;
  total_score: number;
  achievements: string[];
  badges: string[];
}

export interface Game {
  id: string;
  mode: GameMode;
  players: string[];
  status: 'waiting' | 'in_progress' | 'completed';
  winner?: string;
  created_at: Date;
  updated_at: Date;
} 