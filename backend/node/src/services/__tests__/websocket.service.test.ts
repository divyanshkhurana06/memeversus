import { Server } from 'socket.io';
import type { Socket as SocketType } from 'socket.io';
import { WebSocketService } from '../websocket.service';
import { GameService } from '../game.service';
import { LoggingService } from '../logging.service';
import { MetricsService } from '../metrics.service';
import { GameMode } from '../../models/game.model';
import { createServer } from 'http';
import { DatabaseService } from '../database.service';
import { SuiService } from '../sui.service';
import { supabase } from '../../config/supabase';

jest.mock('socket.io');
jest.mock('../game.service');
jest.mock('../logging.service');
jest.mock('../metrics.service');
jest.mock('../database.service');
jest.mock('../sui.service');

describe('WebSocketService', () => {
  let websocketService: WebSocketService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockSuiService: jest.Mocked<SuiService>;
  let mockLogger: LoggingService;
  let mockMetricsService: jest.Mocked<MetricsService>;
  let mockGameService: jest.Mocked<GameService>;
  let mockIo: jest.Mocked<Server>;
  let mockSocket: jest.Mocked<SocketType>;

  beforeEach(() => {
    const httpServer = createServer();
    mockLogger = new LoggingService();
    mockDatabaseService = new DatabaseService(supabase, mockLogger) as jest.Mocked<DatabaseService>;
    mockSuiService = new SuiService(mockLogger) as jest.Mocked<SuiService>;
    mockGameService = new GameService(mockDatabaseService, mockSuiService) as jest.Mocked<GameService>;
    mockMetricsService = new MetricsService(mockDatabaseService) as jest.Mocked<MetricsService>;
    mockIo = {
      on: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    } as unknown as jest.Mocked<Server>;
    mockSocket = {
      id: 'test-socket-id',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      on: jest.fn(),
      rooms: new Set(['test-room']),
    } as unknown as jest.Mocked<SocketType>;

    websocketService = new WebSocketService(mockIo, mockGameService, mockLogger, mockMetricsService);
  });

  describe('player registration', () => {
    it('should handle player registration successfully', async () => {
      const walletAddress = '0x123';
      const username = 'testUser';
      const mockPlayer = {
        walletAddress,
        username,
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        rating: 1000
      };

      mockGameService.registerPlayer.mockResolvedValue(mockPlayer);

      // Simulate socket connection
      const connectionHandler = mockIo.on.mock.calls.find(call => call[0] === 'connection')?.[1];
      if (connectionHandler) {
        await connectionHandler(mockSocket);

        // Simulate registerPlayer event
        const registerHandler = mockSocket.on.mock.calls.find(call => call[0] === 'registerPlayer')?.[1];
        if (registerHandler) {
          await registerHandler({ walletAddress, username });
        }
      }

      expect(mockGameService.registerPlayer).toHaveBeenCalledWith(walletAddress, username);
      expect(mockSocket.emit).toHaveBeenCalledWith('playerRegistered', mockPlayer);
      expect(mockMetricsService.incrementActiveGames).toHaveBeenCalled();
    });

    it('should handle registration errors', async () => {
      const walletAddress = '0x123';
      mockGameService.registerPlayer.mockRejectedValue(new Error('Registration failed'));

      // Simulate socket connection
      const connectionHandler = mockIo.on.mock.calls.find(call => call[0] === 'connection')?.[1];
      if (connectionHandler) {
        await connectionHandler(mockSocket);

        // Simulate registerPlayer event
        const registerHandler = mockSocket.on.mock.calls.find(call => call[0] === 'registerPlayer')?.[1];
        if (registerHandler) {
          await registerHandler({ walletAddress });
        }
      }

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Failed to register player' });
    });
  });

  describe('game room management', () => {
    it('should handle room creation', async () => {
      const roomId = 'test-room';
      const gameMode = GameMode.FRAME_RACE;
      mockGameService.createGameRoom.mockResolvedValue(roomId);

      // Simulate socket connection
      const connectionHandler = mockIo.on.mock.calls.find(call => call[0] === 'connection')?.[1];
      if (connectionHandler) {
        await connectionHandler(mockSocket);

        // Simulate createRoom event
        const createRoomHandler = mockSocket.on.mock.calls.find(call => call[0] === 'createRoom')?.[1];
        if (createRoomHandler) {
          await createRoomHandler({ mode: gameMode });
        }
      }

      expect(mockGameService.createGameRoom).toHaveBeenCalledWith(gameMode);
      expect(mockSocket.join).toHaveBeenCalledWith(roomId);
      expect(mockSocket.emit).toHaveBeenCalledWith('roomCreated', { roomId });
    });

    it('should handle room joining', async () => {
      const roomId = 'test-room';
      const walletAddress = '0x123';

      // Simulate socket connection
      const connectionHandler = mockIo.on.mock.calls.find(call => call[0] === 'connection')?.[1];
      if (connectionHandler) {
        await connectionHandler(mockSocket);

        // Simulate joinRoom event
        const joinRoomHandler = mockSocket.on.mock.calls.find(call => call[0] === 'joinRoom')?.[1];
        if (joinRoomHandler) {
          await joinRoomHandler({ roomId, walletAddress });
        }
      }

      expect(mockGameService.joinGameRoom).toHaveBeenCalledWith(roomId, walletAddress);
      expect(mockSocket.join).toHaveBeenCalledWith(roomId);
      expect(mockSocket.emit).toHaveBeenCalledWith('roomJoined', { roomId });
      expect(mockIo.to).toHaveBeenCalledWith(roomId);
    });
  });

  describe('game actions', () => {
    it('should handle game actions', async () => {
      const roomId = 'test-room';
      const action = 'move';
      const payload = { x: 1, y: 2 };
      const gameState = { status: 'in_progress' };

      mockGameService.handleGameAction.mockResolvedValue(gameState);

      // Simulate socket connection
      const connectionHandler = mockIo.on.mock.calls.find(call => call[0] === 'connection')?.[1];
      if (connectionHandler) {
        await connectionHandler(mockSocket);

        // Simulate gameAction event
        const gameActionHandler = mockSocket.on.mock.calls.find(call => call[0] === 'gameAction')?.[1];
        if (gameActionHandler) {
          await gameActionHandler({ roomId, action, payload });
        }
      }

      expect(mockGameService.handleGameAction).toHaveBeenCalledWith(roomId, action, payload);
      expect(mockIo.to).toHaveBeenCalledWith(roomId);
    });
  });

  describe('disconnection handling', () => {
    it('should handle player disconnection', async () => {
      const walletAddress = '0x123';
      websocketService['playerSockets'].set(walletAddress, mockSocket.id);
      websocketService['socketPlayers'].set(mockSocket.id, walletAddress);

      // Simulate socket connection
      const connectionHandler = mockIo.on.mock.calls.find(call => call[0] === 'connection')?.[1];
      if (connectionHandler) {
        await connectionHandler(mockSocket);

        // Simulate disconnect event
        const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')?.[1];
        if (disconnectHandler) {
          await disconnectHandler();
        }
      }

      expect(mockMetricsService.decrementActiveGames).toHaveBeenCalled();
      expect(websocketService['playerSockets'].has(walletAddress)).toBe(false);
      expect(websocketService['socketPlayers'].has(mockSocket.id)).toBe(false);
    });
  });

  describe('utility methods', () => {
    it('should broadcast game state', () => {
      const roomId = 'test-room';
      const gameState = { status: 'in_progress' };

      websocketService.broadcastGameState(roomId, gameState);

      expect(mockIo.to).toHaveBeenCalledWith(roomId);
    });

    it('should notify specific player', () => {
      const walletAddress = '0x123';
      const event = 'gameOver';
      const data = { result: 'win' };
      websocketService['playerSockets'].set(walletAddress, mockSocket.id);

      websocketService.notifyPlayer(walletAddress, event, data);

      expect(mockIo.to).toHaveBeenCalledWith(mockSocket.id);
    });

    it('should get connected players', () => {
      const walletAddress = '0x123';
      websocketService['playerSockets'].set(walletAddress, mockSocket.id);

      const players = websocketService.getConnectedPlayers();

      expect(players).toContain(walletAddress);
    });

    it('should check if player is connected', () => {
      const walletAddress = '0x123';
      websocketService['playerSockets'].set(walletAddress, mockSocket.id);

      const isConnected = websocketService.isPlayerConnected(walletAddress);

      expect(isConnected).toBe(true);
    });
  });

  it('should handle game mode correctly', () => {
    const gameMode = GameMode.FRAME_RACE;
    expect(gameMode).toBe(GameMode.FRAME_RACE);
  });
}); 