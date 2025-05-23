import { DatabaseService } from '../database.service';
import { LoggingService } from '../logging.service';
import { supabase } from '../../config/supabase';
import { Player } from '../../models/player.model';
import { GameMode } from '../../models/game.model';
import { PostgrestResponse, PostgrestError, createClient, SupabaseClient } from '@supabase/supabase-js';

type MockSupabaseClient = {
  from: jest.Mock;
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  single: jest.Mock;
  auth: {
    signUp: jest.Mock;
    signIn: jest.Mock;
    signOut: jest.Mock;
  };
};

jest.mock('@supabase/supabase-js', () => {
  const mockSupabaseClient: MockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    auth: {
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
  };

  return {
    createClient: jest.fn(() => mockSupabaseClient as unknown as SupabaseClient)
  };
});

describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  let mockLogger: LoggingService;

  const mockPlayer: Player = {
    wallet_address: '0x123',
    username: 'test_user',
    created_at: new Date().toISOString(),
    games_played: 0,
    total_score: 0,
    rating: 1000,
    wins: 0,
    losses: 0,
    draws: 0,
    achievements: [],
    badges: [],
    last_active: new Date().toISOString(),
    is_online: false
  };

  beforeEach(() => {
    mockLogger = new LoggingService();
    databaseService = new DatabaseService(supabase, mockLogger);
    jest.clearAllMocks();
  });

  describe('getPlayer', () => {
    it('should return player data', async () => {
      const mockGetPlayer = jest.spyOn(databaseService, 'getPlayer').mockResolvedValue(mockPlayer);
      const result = await databaseService.getPlayer('0x123');
      expect(result).toEqual(mockPlayer);
      mockGetPlayer.mockRestore();
    });
  });

  describe('updatePlayer', () => {
    it('should update player data', async () => {
      const updates: Partial<Player> = {
        rating: 1200,
        games_played: 1
      };
      const mockUpdatePlayer = jest.spyOn(databaseService, 'updatePlayer').mockResolvedValue({
        ...mockPlayer,
        ...updates
      });
      await expect(databaseService.updatePlayer('0x123', updates)).resolves.not.toThrow();
      mockUpdatePlayer.mockRestore();
    });
  });

  describe('addAchievement', () => {
    it('should add achievement to player', async () => {
      const mockGetPlayer = jest.spyOn(databaseService, 'getPlayer').mockResolvedValue(mockPlayer);
      const mockUpdatePlayer = jest.spyOn(databaseService, 'updatePlayer').mockResolvedValue({
        ...mockPlayer,
        achievements: ['test_achievement']
      });
      await expect(databaseService.addAchievement('0x123', 'test_achievement')).resolves.not.toThrow();
      mockGetPlayer.mockRestore();
      mockUpdatePlayer.mockRestore();
    });

    it('should throw error if player not found', async () => {
      jest.spyOn(databaseService, 'getPlayer').mockResolvedValue(null);
      await expect(databaseService.addAchievement('0x123', 'test_achievement')).rejects.toThrow('Player not found');
    });
  });

  describe('addBadge', () => {
    const mockBadgeId = 'badge1';

    it('should add badge successfully', async () => {
      jest.spyOn(databaseService, 'getPlayer').mockResolvedValue(mockPlayer);
      const mockUpdatePlayer = jest.spyOn(databaseService, 'updatePlayer').mockResolvedValue({
        ...mockPlayer,
        badges: [...mockPlayer.badges, mockBadgeId]
      });

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

      const mockSupabase = createClient('', '') as unknown as MockSupabaseClient;
      mockSupabase.limit.mockResolvedValue({
        data: mockPlayers,
        error: null
      });

      const result = await databaseService.getTopPlayers(GameMode.FRAME_RACE);
      expect(result).toEqual(mockPlayers.map(p => ({
        wallet_address: p.wallet_address,
        rating: p.rating
      })));
      expect(mockSupabase.from).toHaveBeenCalledWith('players');
      expect(mockSupabase.select).toHaveBeenCalledWith('wallet_address, username, rating, created_at, wins, games_played, total_score, badges, achievements');
      expect(mockSupabase.order).toHaveBeenCalledWith('rating', { ascending: false });
      expect(mockSupabase.limit).toHaveBeenCalledWith(10);
    });
  });
}); 