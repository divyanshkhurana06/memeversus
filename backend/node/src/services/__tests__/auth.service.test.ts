import { AuthService } from '../auth.service';
import { DatabaseService } from '../database.service';
import { LoggingService } from '../logging.service';
import { PlayerStats } from '../database.service';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { supabase } from '../../config/supabase';

config({ path: '.env.test' });

jest.mock('../database.service');
jest.mock('../logging.service');

describe('AuthService', () => {
  let authService: AuthService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockLogger: LoggingService;

  beforeEach(() => {
    mockLogger = new LoggingService();
    mockDatabaseService = new DatabaseService(supabase, mockLogger) as jest.Mocked<DatabaseService>;
    authService = new AuthService(mockDatabaseService, mockLogger);
    
    // Mock JWT sign
    jest.spyOn(jwt, 'sign').mockImplementation((payload) => {
      return `mock.jwt.${JSON.stringify(payload)}`;
    });
    
    // Mock JWT verify
    jest.spyOn(jwt, 'verify').mockImplementation((token) => {
      const payload = token.split('.')[2];
      return JSON.parse(payload);
    });

    // Mock JWT decode
    jest.spyOn(jwt, 'decode').mockImplementation((token) => {
      const payload = token.split('.')[2];
      // Handle both normal and refreshed token
      const jsonPayload = payload.startsWith('refreshed.') ? payload.slice('refreshed.'.length) : payload;
      return JSON.parse(jsonPayload);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', async () => {
      const walletAddress = '0x123';
      const username = 'testUser';

      const token = await authService.generateToken(walletAddress, username);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token structure
      const decoded = jwt.decode(token) as any;
      expect(decoded).toHaveProperty('walletAddress', walletAddress);
      expect(decoded).toHaveProperty('username', username);
    });

    it('should handle errors during token generation', async () => {
      const walletAddress = '0x123';
      jest.spyOn(jwt, 'sign').mockImplementation(() => {
        throw new Error('Signing failed');
      });

      await expect(authService.generateToken(walletAddress)).rejects.toThrow('Failed to generate authentication token');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      const walletAddress = '0x123';
      const token = await authService.generateToken(walletAddress);
      const mockPlayerStats: PlayerStats = {
        walletAddress,
        username: 'testUser',
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        rating: 1000,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockDatabaseService.getPlayerStats.mockResolvedValue(mockPlayerStats);

      const payload = await authService.verifyToken(token);

      expect(payload).toHaveProperty('walletAddress', walletAddress);
    });

    it('should reject an invalid token', async () => {
      const invalidToken = 'invalid.token.here';

      await expect(authService.verifyToken(invalidToken)).rejects.toThrow('Invalid authentication token');
    });

    it('should reject token for non-existent user', async () => {
      const walletAddress = '0x123';
      const token = await authService.generateToken(walletAddress);
      mockDatabaseService.getPlayerStats.mockResolvedValue(null);

      await expect(authService.verifyToken(token)).rejects.toThrow('Invalid authentication token');
    });
  });

  describe('refreshToken', () => {
    it('should generate a new token with the same payload', async () => {
      const walletAddress = '0x123';
      const username = 'testUser';
      const originalToken = await authService.generateToken(walletAddress, username);
      const mockPlayerStats: PlayerStats = {
        walletAddress,
        username,
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        rating: 1000,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockDatabaseService.getPlayerStats.mockResolvedValue(mockPlayerStats);

      // Mock a different token for refresh
      jest.spyOn(jwt, 'sign').mockImplementationOnce(() => {
        return `mock.jwt.${JSON.stringify({ walletAddress, username })}.refreshed`;
      });

      const newToken = await authService.refreshToken(originalToken);

      expect(newToken).toBeDefined();
      expect(newToken).not.toBe(originalToken);

      const decoded = jwt.decode(newToken) as any;
      expect(decoded).toHaveProperty('walletAddress', walletAddress);
      expect(decoded).toHaveProperty('username', username);
    });
  });

  describe('validateSession', () => {
    it('should validate a correct session', async () => {
      const walletAddress = '0x123';
      const token = await authService.generateToken(walletAddress);
      const mockPlayerStats: PlayerStats = {
        walletAddress,
        username: 'testUser',
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        rating: 1000,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockDatabaseService.getPlayerStats.mockResolvedValue(mockPlayerStats);

      const isValid = await authService.validateSession(walletAddress, token);

      expect(isValid).toBe(true);
    });

    it('should reject an incorrect session', async () => {
      const walletAddress = '0x123';
      const wrongAddress = '0x456';
      const token = await authService.generateToken(walletAddress);

      const isValid = await authService.validateSession(wrongAddress, token);

      expect(isValid).toBe(false);
    });
  });
}); 