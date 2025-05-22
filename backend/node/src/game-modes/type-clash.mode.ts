import { GameMode, GameState, GameStatus } from '../models/game.model';

export class TypeClashMode {
  private readonly ROUND_DURATION = 60000; // 60 seconds per round
  private readonly SCORE_PER_CHARACTER = 1;
  private readonly TEXTS = [
    'Never gonna give you up',
    'What are you doing step bro',
    'It\'s over 9000',
    'I\'m not a cat',
    'This is fine',
    'Hello there',
    'I am the senate',
    'Do you know da wae',
    'It\'s free real estate',
    'I\'m in this photo and I don\'t like it'
  ];

  public async initializeGame(gameState: GameState): Promise<GameState> {
    return {
      ...gameState,
      currentText: this.getRandomText(),
      lastActionTime: Date.now(),
      status: GameStatus.IN_PROGRESS
    };
  }

  public async handleAction(gameState: GameState, playerId: string, typedText: string): Promise<{
    isCorrect: boolean;
    score: number;
    accuracy: number;
    wpm: number;
  }> {
    if (!gameState.currentText) {
      throw new Error('Game not properly initialized');
    }

    const { isCorrect, accuracy, wpm } = this.evaluateTyping(typedText, gameState.currentText);
    let score = 0;

    if (isCorrect) {
      score = Math.floor(typedText.length * this.SCORE_PER_CHARACTER * accuracy);
      const currentScore = gameState.scores.get(playerId) || 0;
      gameState.scores.set(playerId, currentScore + score);
    }

    return {
      isCorrect,
      score,
      accuracy,
      wpm
    };
  }

  public async updateGameState(gameState: GameState): Promise<GameState> {
    const now = Date.now();
    const lastActionTime = gameState.lastActionTime || now;

    // Check if round duration has elapsed
    if (now - lastActionTime >= this.ROUND_DURATION) {
      return {
        ...gameState,
        currentText: this.getRandomText(),
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

  private getRandomText(): string {
    const randomIndex = Math.floor(Math.random() * this.TEXTS.length);
    return this.TEXTS[randomIndex];
  }

  private evaluateTyping(typed: string, target: string): {
    isCorrect: boolean;
    accuracy: number;
    wpm: number;
  } {
    const isCorrect = typed === target;
    let accuracy = 0;
    let wpm = 0;

    if (typed.length > 0) {
      // Calculate accuracy
      let correctChars = 0;
      const minLength = Math.min(typed.length, target.length);
      for (let i = 0; i < minLength; i++) {
        if (typed[i] === target[i]) correctChars++;
      }
      accuracy = correctChars / target.length;

      // Calculate WPM (words per minute)
      const words = typed.length / 5; // Standard word length is 5 characters
      const minutes = 1; // Assuming 1 minute for now
      wpm = Math.round(words / minutes);
    }

    return {
      isCorrect,
      accuracy,
      wpm
    };
  }
} 