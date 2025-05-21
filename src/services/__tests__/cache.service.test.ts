import { CacheService } from '../cache.service';
import { LoggingService } from '../logging.service';
import Redis from 'ioredis';

jest.mock('ioredis');
jest.mock('../logging.service');

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockRedis: jest.Mocked<Redis>;
  let mockLoggingService: jest.Mocked<LoggingService>;

  beforeEach(() => {
    mockRedis = new Redis() as jest.Mocked<Redis>;
    mockLoggingService = new LoggingService() as jest.Mocked<LoggingService>;
    cacheService = new CacheService(mockLoggingService);
  });

  describe('get and set', () => {
    it('should set and get a value', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue(JSON.stringify(value));

      await cacheService.set(key, value);
      const result = await cacheService.get(key);

      expect(mockRedis.set).toHaveBeenCalledWith(key, expect.any(String), 'EX', expect.any(Number));
      expect(result).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const key = 'non-existent';
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheService.get(key);

      expect(result).toBeNull();
    });

    it('should handle JSON parse errors', async () => {
      const key = 'test-key';
      mockRedis.get.mockResolvedValue('invalid-json');

      const result = await cacheService.get(key);

      expect(result).toBeNull();
      expect(mockLoggingService.error).toHaveBeenCalled();
    });
  });

  describe('game state caching', () => {
    it('should cache and retrieve game state', async () => {
      const roomId = 'test-room';
      const gameState = { status: 'in_progress', players: ['player1'] };

      await cacheService.setGameState(roomId, gameState);
      const result = await cacheService.getGameState(roomId);

      expect(result).toEqual(gameState);
    });
  });

  describe('leaderboard caching', () => {
    it('should cache and retrieve global leaderboard', async () => {
      const leaderboard = [{ rank: 1, player: 'player1', score: 100 }];

      await cacheService.setLeaderboard(leaderboard);
      const result = await cacheService.getLeaderboard();

      expect(result).toEqual(leaderboard);
    });

    it('should cache and retrieve game mode specific leaderboard', async () => {
      const gameMode = 'FrameRace';
      const leaderboard = [{ rank: 1, player: 'player1', score: 100 }];

      await cacheService.setLeaderboard(leaderboard, gameMode);
      const result = await cacheService.getLeaderboard(gameMode);

      expect(result).toEqual(leaderboard);
    });
  });

  describe('player stats caching', () => {
    it('should cache and retrieve player stats', async () => {
      const walletAddress = '0x123';
      const stats = { wins: 5, losses: 2 };

      await cacheService.setPlayerStats(walletAddress, stats);
      const result = await cacheService.getPlayerStats(walletAddress);

      expect(result).toEqual(stats);
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate game cache', async () => {
      const roomId = 'test-room';
      mockRedis.del.mockResolvedValue(1);

      await cacheService.invalidateGameCache(roomId);

      expect(mockRedis.del).toHaveBeenCalledWith(`game:${roomId}`);
    });

    it('should invalidate player cache', async () => {
      const walletAddress = '0x123';
      mockRedis.del.mockResolvedValue(1);

      await cacheService.invalidatePlayerCache(walletAddress);

      expect(mockRedis.del).toHaveBeenCalledWith(`player:${walletAddress}`);
    });

    it('should invalidate leaderboard cache', async () => {
      const gameMode = 'FrameRace';
      mockRedis.del.mockResolvedValue(1);

      await cacheService.invalidateLeaderboardCache(gameMode);

      expect(mockRedis.del).toHaveBeenCalledWith(`leaderboard:${gameMode}`);
    });
  });

  describe('cache clearing', () => {
    it('should clear all cache entries', async () => {
      mockRedis.flushall.mockResolvedValue('OK');

      await cacheService.clearAll();

      expect(mockRedis.flushall).toHaveBeenCalled();
      expect(mockLoggingService.info).toHaveBeenCalledWith('Cache cleared successfully');
    });

    it('should handle errors during cache clearing', async () => {
      const error = new Error('Redis error');
      mockRedis.flushall.mockRejectedValue(error);

      await cacheService.clearAll();

      expect(mockLoggingService.error).toHaveBeenCalledWith('Error clearing cache', error);
    });
  });

  describe('health check', () => {
    it('should return true when Redis is healthy', async () => {
      mockRedis.ping.mockResolvedValue('PONG');

      const result = await cacheService.healthCheck();

      expect(result).toBe(true);
    });

    it('should return false when Redis is unhealthy', async () => {
      const error = new Error('Redis connection failed');
      mockRedis.ping.mockRejectedValue(error);

      const result = await cacheService.healthCheck();

      expect(result).toBe(false);
      expect(mockLoggingService.error).toHaveBeenCalledWith('Cache health check failed', error);
    });
  });
}); 