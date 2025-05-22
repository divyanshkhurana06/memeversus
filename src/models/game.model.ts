export enum GameMode {
  FrameRace = 'FrameRace',
  SoundSnatch = 'SoundSnatch',
  TypeClash = 'TypeClash'
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