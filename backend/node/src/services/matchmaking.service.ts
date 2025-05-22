import { GameMode, GameStatus } from '../models/game.model';
import { GameService } from './game.service';
import { LoggingService } from './logging.service';
import { DatabaseService } from './database.service';
import { Player } from '../models/player.model';

interface QueueEntry {
  playerId: string;
  rating: number;
  timestamp: number;
  gameMode: GameMode;
}

interface MatchResult {
  roomId: string;
  players: string[];
  gameMode: GameMode;
}

export class MatchmakingService {
  private queues: Map<GameMode, QueueEntry[]>;
  private readonly MATCHMAKING_INTERVAL = 5000; // 5 seconds
  private readonly MAX_QUEUE_TIME = 300000; // 5 minutes
  private readonly RATING_RANGE = 200; // Initial rating range for matching
  private readonly RATING_EXPANSION = 50; // How much to expand the range per interval
  private matchmakingInterval: NodeJS.Timeout | null = null;
  private logger: LoggingService;

  constructor(
    private gameService: GameService,
    private dbService: DatabaseService
  ) {
    this.queues = new Map();
    this.logger = new LoggingService();
    this.initializeQueues();
    this.startMatchmaking();
  }

  private initializeQueues(): void {
    Object.values(GameMode).forEach(mode => {
      this.queues.set(mode, []);
    });
  }

  private startMatchmaking(): void {
    this.matchmakingInterval = setInterval(
      () => this.processQueues(),
      this.MATCHMAKING_INTERVAL
    );
  }

  public async addToQueue(playerId: string, gameMode: GameMode): Promise<void> {
    try {
      // Get player's rating
      const player = await this.dbService.getPlayer(playerId);
      const rating = player?.rating || 1000; // Default rating if not set

      const queue = this.queues.get(gameMode);
      if (!queue) {
        throw new Error(`Queue for game mode ${gameMode} not found`);
      }

      // Check if player is already in queue
      if (queue.some(entry => entry.playerId === playerId)) {
        throw new Error('Player already in queue');
      }

      queue.push({
        playerId,
        rating,
        timestamp: Date.now(),
        gameMode
      });

      this.logger.info('Player added to queue', {
        playerId,
        gameMode,
        rating,
        queueSize: queue.length
      });
    } catch (error) {
      this.logger.error('Error adding player to queue', error as Error, {
        playerId,
        gameMode
      });
      throw error;
    }
  }

  public removeFromQueue(playerId: string, gameMode: GameMode): void {
    const queue = this.queues.get(gameMode);
    if (!queue) return;

    const index = queue.findIndex(entry => entry.playerId === playerId);
    if (index !== -1) {
      queue.splice(index, 1);
      this.logger.info('Player removed from queue', {
        playerId,
        gameMode,
        queueSize: queue.length
      });
    }
  }

  private async processQueues(): Promise<void> {
    for (const [gameMode, queue] of this.queues.entries()) {
      if (queue.length < 2) continue;

      // Sort queue by timestamp
      queue.sort((a, b) => a.timestamp - b.timestamp);

      // Process matches
      while (queue.length >= 2) {
        const match = await this.findMatch(queue, gameMode);
        if (match) {
          await this.createGame(match);
        } else {
          break; // No more matches possible
        }
      }

      // Clean up expired queue entries
      this.cleanupQueue(queue);
    }
  }

  private async findMatch(queue: QueueEntry[], gameMode: GameMode): Promise<MatchResult | null> {
    const now = Date.now();
    const firstPlayer = queue[0];
    const timeInQueue = now - firstPlayer.timestamp;

    // Calculate rating range based on time in queue
    const ratingRange = this.RATING_RANGE + 
      Math.floor(timeInQueue / this.MATCHMAKING_INTERVAL) * this.RATING_EXPANSION;

    // Find potential match
    for (let i = 1; i < queue.length; i++) {
      const secondPlayer = queue[i];
      const ratingDiff = Math.abs(firstPlayer.rating - secondPlayer.rating);

      if (ratingDiff <= ratingRange) {
        // Remove matched players from queue
        queue.splice(i, 1);
        queue.splice(0, 1);

        return {
          roomId: Math.random().toString(36).substring(7),
          players: [firstPlayer.playerId, secondPlayer.playerId],
          gameMode
        };
      }
    }

    // If first player has been in queue too long, force a match
    if (timeInQueue >= this.MAX_QUEUE_TIME && queue.length >= 2) {
      const secondPlayer = queue[1];
      queue.splice(1, 1);
      queue.splice(0, 1);

      return {
        roomId: Math.random().toString(36).substring(7),
        players: [firstPlayer.playerId, secondPlayer.playerId],
        gameMode
      };
    }

    return null;
  }

  private async createGame(match: MatchResult): Promise<void> {
    try {
      // Create game room
      const roomId = await this.gameService.createGameRoom(match.gameMode);

      // Add players to room
      for (const playerId of match.players) {
        await this.gameService.joinGameRoom(roomId, playerId);
      }

      // Start the game
      await this.gameService.startGame(roomId);

      this.logger.info('Game created from matchmaking', {
        roomId,
        players: match.players,
        gameMode: match.gameMode
      });
    } catch (error) {
      this.logger.error('Error creating game from matchmaking', error as Error, {
        match
      });
      throw error;
    }
  }

  private cleanupQueue(queue: QueueEntry[]): void {
    const now = Date.now();
    const expiredEntries = queue.filter(
      entry => now - entry.timestamp >= this.MAX_QUEUE_TIME
    );

    for (const entry of expiredEntries) {
      this.removeFromQueue(entry.playerId, entry.gameMode);
      this.logger.info('Removed expired queue entry', {
        playerId: entry.playerId,
        gameMode: entry.gameMode,
        timeInQueue: now - entry.timestamp
      });
    }
  }

  public getQueueStatus(gameMode: GameMode): { size: number; averageWaitTime: number } {
    const queue = this.queues.get(gameMode);
    if (!queue) return { size: 0, averageWaitTime: 0 };

    const now = Date.now();
    const totalWaitTime = queue.reduce(
      (sum, entry) => sum + (now - entry.timestamp),
      0
    );

    return {
      size: queue.length,
      averageWaitTime: queue.length > 0 ? totalWaitTime / queue.length : 0
    };
  }

  public stop(): void {
    if (this.matchmakingInterval) {
      clearInterval(this.matchmakingInterval);
    }
  }
} 