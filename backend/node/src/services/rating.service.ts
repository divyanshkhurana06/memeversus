import { DatabaseService } from './database.service';
import { LoggingService } from './logging.service';
import { GameMode } from '../models/game.model';

export class RatingService {
  private readonly K_FACTOR = 32; // Maximum rating change per game
  private readonly INITIAL_RATING = 1000;
  private readonly MIN_RATING = 100;
  private readonly MAX_RATING = 3000;

  constructor(
    private dbService: DatabaseService,
    private logger: LoggingService
  ) {}

  public async initializePlayerRating(walletAddress: string): Promise<void> {
    try {
      await this.dbService.updatePlayer(walletAddress, {
        rating: this.INITIAL_RATING
      });
    } catch (error) {
      this.logger.error('Error initializing player rating', error as Error, {
        walletAddress
      });
      throw error;
    }
  }

  public async updateRatings(
    winnerId: string,
    loserId: string,
    gameMode: GameMode
  ): Promise<{ winnerNewRating: number; loserNewRating: number }> {
    try {
      const winner = await this.dbService.getPlayer(winnerId);
      const loser = await this.dbService.getPlayer(loserId);

      if (!winner || !loser) {
        throw new Error('Player not found');
      }

      const winnerRating = winner.rating || this.INITIAL_RATING;
      const loserRating = loser.rating || this.INITIAL_RATING;

      // Calculate expected scores
      const winnerExpected = this.calculateExpectedScore(winnerRating, loserRating);
      const loserExpected = 1 - winnerExpected;

      // Calculate new ratings
      const winnerNewRating = this.calculateNewRating(
        winnerRating,
        winnerExpected,
        1
      );
      const loserNewRating = this.calculateNewRating(
        loserRating,
        loserExpected,
        0
      );

      // Update ratings in database
      await Promise.all([
        this.dbService.updatePlayer(winnerId, { rating: winnerNewRating }),
        this.dbService.updatePlayer(loserId, { rating: loserNewRating })
      ]);

      this.logger.info('Ratings updated', {
        winnerId,
        loserId,
        gameMode,
        winnerOldRating: winnerRating,
        winnerNewRating,
        loserOldRating: loserRating,
        loserNewRating
      });

      return { winnerNewRating, loserNewRating };
    } catch (error) {
      this.logger.error('Error updating ratings', error as Error, {
        winnerId,
        loserId,
        gameMode
      });
      throw error;
    }
  }

  private calculateExpectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  private calculateNewRating(
    currentRating: number,
    expectedScore: number,
    actualScore: number
  ): number {
    const ratingChange = Math.round(
      this.K_FACTOR * (actualScore - expectedScore)
    );
    const newRating = currentRating + ratingChange;

    // Ensure rating stays within bounds
    return Math.min(Math.max(newRating, this.MIN_RATING), this.MAX_RATING);
  }

  public async getPlayerRating(walletAddress: string): Promise<number> {
    try {
      const player = await this.dbService.getPlayer(walletAddress);
      return player?.rating || this.INITIAL_RATING;
    } catch (error) {
      this.logger.error('Error getting player rating', error as Error, {
        walletAddress
      });
      throw error;
    }
  }

  public async getTopPlayers(
    gameMode: GameMode,
    limit: number = 10
  ): Promise<Array<{ walletAddress: string; rating: number }>> {
    try {
      return this.dbService.getTopPlayers(gameMode, limit);
    } catch (error) {
      this.logger.error('Error getting top players', error as Error, {
        gameMode,
        limit
      });
      throw error;
    }
  }
} 