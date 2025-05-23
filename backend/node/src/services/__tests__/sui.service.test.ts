import { SuiService } from '../sui.service';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { GameMode } from '../../types/game';
import { LoggingService } from '../logging.service';

jest.mock('@mysten/sui/client');
jest.mock('@mysten/sui/keypairs/ed25519');
jest.mock('../logging.service');

describe('SuiService', () => {
  let service: SuiService;
  let mockClient: jest.Mocked<SuiClient>;
  let mockKeypair: jest.Mocked<Ed25519Keypair>;
  let mockLogger: LoggingService;

  const validSuiAddress = '0x1234567890123456789012345678901234567890123456789012345678901234';
  const mockTransactionResult = {
    digest: 'mock-digest',
    effects: { status: { status: 'success' } },
    events: [],
    objectChanges: [],
    balanceChanges: []
  };

  beforeEach(() => {
    mockClient = {
      signAndExecuteTransaction: jest.fn().mockResolvedValue(mockTransactionResult)
    } as any;

    mockKeypair = {
      getPublicKey: jest.fn().mockReturnValue({ toBase64: () => 'mock-public-key' })
    } as any;

    mockLogger = new LoggingService();

    (SuiClient as jest.Mock).mockImplementation(() => mockClient);
    (Ed25519Keypair as unknown as jest.Mock).mockImplementation(() => mockKeypair);

    service = new SuiService(mockLogger);
  });

  it('should create a game for FRAME_RACE mode', async () => {
    const result = await service.createGame(GameMode.FRAME_RACE, validSuiAddress);
    expect(result).toBeDefined();
    expect(result).toBe('mock-digest');
    expect(mockClient.signAndExecuteTransaction).toHaveBeenCalled();
  });

  it('should create a game for SOUND_SNATCH mode', async () => {
    const result = await service.createGame(GameMode.SOUND_SNATCH, validSuiAddress);
    expect(result).toBeDefined();
    expect(result).toBe('mock-digest');
    expect(mockClient.signAndExecuteTransaction).toHaveBeenCalled();
  });

  it('should create a game for TYPE_CLASH mode', async () => {
    const result = await service.createGame(GameMode.TYPE_CLASH, validSuiAddress);
    expect(result).toBeDefined();
    expect(result).toBe('mock-digest');
    expect(mockClient.signAndExecuteTransaction).toHaveBeenCalled();
  });

  it('should allow a player to join a game', async () => {
    await expect(service.joinGame('game-id', validSuiAddress)).resolves.not.toThrow();
    expect(mockClient.signAndExecuteTransaction).toHaveBeenCalled();
  });

  it('should allow a player to make a move', async () => {
    await expect(service.makeMove('game-id', validSuiAddress, { move: 'test' })).resolves.not.toThrow();
    expect(mockClient.signAndExecuteTransaction).toHaveBeenCalled();
  });
}); 