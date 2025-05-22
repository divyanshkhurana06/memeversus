import { GameMode } from '../models/game.model';
import { FrameRaceMode } from './frame-race.mode';
import { SoundSnatchMode } from './sound-snatch.mode';
import { TypeClashMode } from './type-clash.mode';

export interface IGameMode {
  initializeGame(gameState: any): Promise<any>;
  handleAction(gameState: any, playerId: string, payload: any): Promise<any>;
  updateGameState(gameState: any): Promise<any>;
  isRoundComplete(gameState: any): boolean;
  getRoundProgress(gameState: any): number;
}

export class GameModeFactory {
  private static instance: GameModeFactory;
  private gameModes: Map<GameMode, IGameMode>;

  private constructor() {
    this.gameModes = new Map();
    this.gameModes.set(GameMode.FRAME_RACE, new FrameRaceMode());
    this.gameModes.set(GameMode.SOUND_SNATCH, new SoundSnatchMode());
    this.gameModes.set(GameMode.TYPE_CLASH, new TypeClashMode());
  }

  public static getInstance(): GameModeFactory {
    if (!GameModeFactory.instance) {
      GameModeFactory.instance = new GameModeFactory();
    }
    return GameModeFactory.instance;
  }

  public getGameMode(mode: GameMode): IGameMode {
    const gameMode = this.gameModes.get(mode);
    if (!gameMode) {
      throw new Error(`Game mode ${mode} not implemented`);
    }
    return gameMode;
  }
} 