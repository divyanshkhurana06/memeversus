import { SuiService } from '../sui.service';
import { GameMode } from '../../models/game.model';

describe('SuiService', () => {
  let suiService: SuiService;
  const mockPlayerAddress = '0x123';

  beforeEach(() => {
    // Set up environment variables for testing
    process.env.FRAME_RACE_CONTRACT = '0x123';
    process.env.SOUND_SNATCH_CONTRACT = '0x456';
    process.env.TYPE_CLASH_CONTRACT = '0x789';
    suiService = new SuiService();
  });

  describe('getContractAddress', () => {
    it('should return correct contract address for FRAME_RACE mode', () => {
      const address = suiService.getContractAddress(GameMode.FRAME_RACE);
      expect(address).toBe(process.env.FRAME_RACE_CONTRACT);
    });

    it('should return correct contract address for SOUND_SNATCH mode', () => {
      const address = suiService.getContractAddress(GameMode.SOUND_SNATCH);
      expect(address).toBe(process.env.SOUND_SNATCH_CONTRACT);
    });

    it('should return correct contract address for TYPE_CLASH mode', () => {
      const address = suiService.getContractAddress(GameMode.TYPE_CLASH);
      expect(address).toBe(process.env.TYPE_CLASH_CONTRACT);
    });

    it('should throw error for unknown game mode', () => {
      expect(() => suiService.getContractAddress(GameMode.CLASSIC)).toThrow('Unknown game mode');
    });
  });

  describe('createGame', () => {
    it('should create a game for FRAME_RACE mode', async () => {
      const result = await suiService.createGame(GameMode.FRAME_RACE, mockPlayerAddress);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should create a game for SOUND_SNATCH mode', async () => {
      const result = await suiService.createGame(GameMode.SOUND_SNATCH, mockPlayerAddress);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should create a game for TYPE_CLASH mode', async () => {
      const result = await suiService.createGame(GameMode.TYPE_CLASH, mockPlayerAddress);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('joinGame', () => {
    it('should allow a player to join a game', async () => {
      const gameId = await suiService.createGame(GameMode.FRAME_RACE, mockPlayerAddress);
      await expect(suiService.joinGame(gameId, mockPlayerAddress)).resolves.not.toThrow();
    });
  });

  describe('makeMove', () => {
    it('should allow a player to make a move', async () => {
      const gameId = await suiService.createGame(GameMode.FRAME_RACE, mockPlayerAddress);
      const move = { type: 'test_move', data: {} };
      await expect(suiService.makeMove(gameId, mockPlayerAddress, move)).resolves.not.toThrow();
    });
  });
}); 