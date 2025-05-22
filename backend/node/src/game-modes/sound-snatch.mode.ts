import { GameMode, GameState, GameStatus } from '../models/game.model';

export class SoundSnatchMode {
  private readonly ROUND_DURATION = 30000; // 30 seconds per round
  private readonly SCORE_PER_CORRECT = 20;
  private readonly SOUNDS = [
    'meme1.mp3',
    'meme2.mp3',
    'meme3.mp3',
    'meme4.mp3',
    'meme5.mp3'
  ];

  public async initializeGame(gameState: GameState): Promise<GameState> {
    return {
      ...gameState,
      currentSound: this.getRandomSound(),
      lastActionTime: Date.now(),
      status: GameStatus.IN_PROGRESS
    };
  }

  public async handleAction(gameState: GameState, playerId: string, guess: string): Promise<{
    isCorrect: boolean;
    score: number;
    nextSound?: string;
  }> {
    if (!gameState.currentSound) {
      throw new Error('Game not properly initialized');
    }

    const isCorrect = this.checkGuess(guess, gameState.currentSound);
    let score = 0;

    if (isCorrect) {
      score = this.SCORE_PER_CORRECT;
      const currentScore = gameState.scores.get(playerId) || 0;
      gameState.scores.set(playerId, currentScore + score);
    }

    // Generate next sound if correct
    const nextSound = isCorrect ? this.getRandomSound() : gameState.currentSound;

    return {
      isCorrect,
      score,
      nextSound
    };
  }

  public async updateGameState(gameState: GameState): Promise<GameState> {
    const now = Date.now();
    const lastActionTime = gameState.lastActionTime || now;

    // Check if round duration has elapsed
    if (now - lastActionTime >= this.ROUND_DURATION) {
      return {
        ...gameState,
        currentSound: this.getRandomSound(),
        lastActionTime: now
      };
    }

    return gameState;
  }

  public isRoundComplete(gameState: GameState): boolean {
    const now = Date.now();
    const lastActionTime = gameState.lastActionTime || now;
    return now - lastActionTime >= this.ROUND_DURATION;
  }

  public getRoundProgress(gameState: GameState): number {
    const now = Date.now();
    const lastActionTime = gameState.lastActionTime || now;
    return ((now - lastActionTime) / this.ROUND_DURATION) * 100;
  }

  private getRandomSound(): string {
    const randomIndex = Math.floor(Math.random() * this.SOUNDS.length);
    return this.SOUNDS[randomIndex];
  }

  private checkGuess(guess: string, sound: string): boolean {
    // Remove file extension and compare
    const cleanGuess = guess.toLowerCase().replace('.mp3', '');
    const cleanSound = sound.toLowerCase().replace('.mp3', '');
    return cleanGuess === cleanSound;
  }
} 