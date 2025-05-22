export enum GameMode {
  FRAME_RACE = 'FRAME_RACE',
  SOUND_SNATCH = 'SOUND_SNATCH',
  TYPE_CLASH = 'TYPE_CLASH'
}

export enum GameStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED'
}

export interface Player {
  id: string;
  walletAddress: string;
  username: string;
  avatar: string;
  score: number;
  isReady: boolean;
}

export interface GameState {
  roomId: string;
  mode: GameMode;
  status: GameStatus;
  players: Player[];
  currentRound: number;
  maxRounds: number;
  roundTimeout: number;
  currentVideo?: string;
  winner?: string;
}

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  avatar: string;
  timestamp: string;
}

export interface GameAction {
  type: string;
  payload: any;
}

export interface GameResult {
  winner: string;
  score: number;
  txDigest?: string;
} 