import { GameMode, GameState, GameStatus } from '../models/game.model';

export class FrameRaceMode {
  private readonly FRAME_INTERVAL = 1000; // 1 second between frames
  private readonly MAX_FRAMES = 30; // 30 frames per round
  private readonly SCORE_PER_FRAME = 10;

  public async initializeGame(gameState: GameState): Promise<GameState> {
    return {
      ...gameState,
      currentFrame: 1,
      lastActionTime: Date.now(),
      status: GameStatus.IN_PROGRESS
    };
  }

  public async handleAction(gameState: GameState, playerId: string, frame: number): Promise<{
    isCorrect: boolean;
    score: number;
    nextFrame?: number;
  }> {
    if (!gameState.currentFrame) {
      throw new Error('Game not properly initialized');
    }

    const isCorrect = frame === gameState.currentFrame;
    let score = 0;

    if (isCorrect) {
      score = this.SCORE_PER_FRAME;
      const currentScore = gameState.scores.get(playerId) || 0;
      gameState.scores.set(playerId, currentScore + score);
    }

    // Move to next frame if correct or if max frames reached
    let nextFrame = gameState.currentFrame;
    if (isCorrect || gameState.currentFrame >= this.MAX_FRAMES) {
      nextFrame = gameState.currentFrame + 1;
    }

    return {
      isCorrect,
      score,
      nextFrame
    };
  }

  public async updateGameState(gameState: GameState): Promise<GameState> {
    const now = Date.now();
    const lastActionTime = gameState.lastActionTime || now;

    // Check if it's time to advance to next frame
    if (now - lastActionTime >= this.FRAME_INTERVAL) {
      return {
        ...gameState,
        currentFrame: (gameState.currentFrame || 0) + 1,
        lastActionTime: now
      };
    }

    return gameState;
  }

  public isRoundComplete(gameState: GameState): boolean {
    return (gameState.currentFrame || 0) > this.MAX_FRAMES;
  }

  public getRoundProgress(gameState: GameState): number {
    return ((gameState.currentFrame || 0) / this.MAX_FRAMES) * 100;
  }
} 