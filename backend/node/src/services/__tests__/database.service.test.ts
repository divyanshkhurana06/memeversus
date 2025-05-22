import { DatabaseService } from '../database.service';
import { GameMode } from '../../models/game.model';
import { Player, Achievement } from '../../models/player.model';
import { PostgrestResponse, PostgrestError, createClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
};

// Mock createClient
jest.mock('@supabase/supabase-js', () => {
  const actual = jest.requireActual('@supabase/supabase-js');
  return {
    ...actual,
    createClient: jest.fn(() => mockSupabase)
  };
});

describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  const mockPlayer: Player = {
    walletAddress: '0x123',
    username: 'testUser',
    rating: 1000,
    wins: 0,
    losses: 0,
    draws: 0,
    totalGames: 0,
    badges: [],
    achievements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    databaseService = new DatabaseService();
    (databaseService as any).supabase = mockSupabase;
  });

  describe('getPlayer', () => {
    it('should return a player when found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockPlayer,
        error: null
      });

      const result = await databaseService.getPlayer('0x123');
      expect(result).toEqual(mockPlayer);
      expect(mockSupabase.from).toHaveBeenCalledWith('players');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('wallet_address', '0x123');
    });

    it('should return null when player not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await databaseService.getPlayer('0x123');
      expect(result).toBeNull();
    });
  });

  describe('updatePlayer', () => {
    it('should update player successfully', async () => {
      const updates = { rating: 1100 };
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: null
      });

      await expect(databaseService.updatePlayer('0x123', updates)).resolves.not.toThrow();
      expect(mockSupabase.from).toHaveBeenCalledWith('players');
      expect(mockSupabase.update).toHaveBeenCalledWith(updates);
      expect(mockSupabase.eq).toHaveBeenCalledWith('wallet_address', '0x123');
    });

    it('should throw error when update fails', async () => {
      const updates = { rating: 1100 };
      const error: PostgrestError = {
        message: 'Update failed',
        details: '',
        hint: '',
        code: '500',
        name: 'PostgrestError'
      };

      mockSupabase.eq.mockResolvedValue({
        data: null,
        error
      });

      await expect(databaseService.updatePlayer('0x123', updates)).rejects.toThrow();
    });
  });

  describe('addAchievement', () => {
    const mockAchievement: Achievement = {
      id: 'achievement1',
      name: 'First Win',
      description: 'Win your first game',
      unlockedAt: new Date().toISOString(),
    };

    it('should add achievement successfully', async () => {
      const mockGetPlayer = jest.spyOn(databaseService, 'getPlayer').mockResolvedValue(mockPlayer);
      const mockUpdatePlayer = jest.spyOn(databaseService, 'updatePlayer').mockResolvedValue();

      await expect(databaseService.addAchievement('0x123', mockAchievement)).resolves.not.toThrow();
      expect(mockUpdatePlayer).toHaveBeenCalledWith('0x123', {
        achievements: [...mockPlayer.achievements, mockAchievement],
      });
    });

    it('should throw error when player not found', async () => {
      jest.spyOn(databaseService, 'getPlayer').mockResolvedValue(null);

      await expect(databaseService.addAchievement('0x123', mockAchievement)).rejects.toThrow('Player not found');
    });
  });

  describe('addBadge', () => {
    const mockBadgeId = 'badge1';

    it('should add badge successfully', async () => {
      jest.spyOn(databaseService, 'getPlayer').mockResolvedValue(mockPlayer);
      const mockUpdatePlayer = jest.spyOn(databaseService, 'updatePlayer').mockResolvedValue();

      await expect(databaseService.addBadge('0x123', mockBadgeId)).resolves.not.toThrow();
      expect(mockUpdatePlayer).toHaveBeenCalledWith('0x123', {
        badges: [...mockPlayer.badges, mockBadgeId],
      });
    });

    it('should throw error when player not found', async () => {
      jest.spyOn(databaseService, 'getPlayer').mockResolvedValue(null);

      await expect(databaseService.addBadge('0x123', mockBadgeId)).rejects.toThrow('Player not found');
    });
  });

  describe('getTopPlayers', () => {
    it('should return top players sorted by rating', async () => {
      const mockPlayers = [
        { wallet_address: '0x123', rating: 1200 },
        { wallet_address: '0x456', rating: 1100 }
      ];

      mockSupabase.limit.mockResolvedValue({
        data: mockPlayers,
        error: null
      });

      const result = await databaseService.getTopPlayers(GameMode.FRAME_RACE);
      expect(result).toEqual(mockPlayers.map(p => ({
        walletAddress: p.wallet_address,
        rating: p.rating
      })));
      expect(mockSupabase.from).toHaveBeenCalledWith('players');
      expect(mockSupabase.select).toHaveBeenCalledWith('wallet_address, rating');
      expect(mockSupabase.order).toHaveBeenCalledWith('rating', { ascending: false });
      expect(mockSupabase.limit).toHaveBeenCalledWith(10);
    });
  });
}); 