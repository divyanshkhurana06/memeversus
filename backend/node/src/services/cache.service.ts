import Redis from 'ioredis';
import { LoggingService } from './logging.service';

export class CacheService {
  private redis: Redis;
  private loggingService: LoggingService;
  private readonly DEFAULT_TTL = 3600; // 1 hour in seconds

  constructor(loggingService: LoggingService) {
    this.loggingService = loggingService;
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.redis.on('error', (error: Error) => {
      this.loggingService.error('Redis connection error', error);
    });

    this.redis.on('connect', () => {
      this.loggingService.info('Redis connected successfully');
    });
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.loggingService.error('Error getting cache', error as Error, { key });
      return null;
    }
  }

  public async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.set(key, serialized, 'EX', ttl);
    } catch (error) {
      this.loggingService.error('Error setting cache', error as Error, { key });
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.loggingService.error('Error deleting cache', error as Error, { key });
    }
  }

  public async getGameState(roomId: string): Promise<any> {
    return this.get(`game:${roomId}`);
  }

  public async setGameState(roomId: string, state: any): Promise<void> {
    await this.set(`game:${roomId}`, state, 3600); // 1 hour TTL for game states
  }

  public async getLeaderboard(gameMode?: string): Promise<any> {
    const key = gameMode ? `leaderboard:${gameMode}` : 'leaderboard:global';
    return this.get(key);
  }

  public async setLeaderboard(leaderboard: any, gameMode?: string): Promise<void> {
    const key = gameMode ? `leaderboard:${gameMode}` : 'leaderboard:global';
    await this.set(key, leaderboard, 300); // 5 minutes TTL for leaderboards
  }

  public async getPlayerStats(walletAddress: string): Promise<any> {
    return this.get(`player:${walletAddress}`);
  }

  public async setPlayerStats(walletAddress: string, stats: any): Promise<void> {
    await this.set(`player:${walletAddress}`, stats, 1800); // 30 minutes TTL for player stats
  }

  public async invalidateGameCache(roomId: string): Promise<void> {
    await this.delete(`game:${roomId}`);
  }

  public async invalidatePlayerCache(walletAddress: string): Promise<void> {
    await this.delete(`player:${walletAddress}`);
  }

  public async invalidateLeaderboardCache(gameMode?: string): Promise<void> {
    const key = gameMode ? `leaderboard:${gameMode}` : 'leaderboard:global';
    await this.delete(key);
  }

  public async clearAll(): Promise<void> {
    try {
      await this.redis.flushall();
      this.loggingService.info('Cache cleared successfully');
    } catch (error) {
      this.loggingService.error('Error clearing cache', error as Error);
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      this.loggingService.error('Cache health check failed', error as Error);
      return false;
    }
  }
} 