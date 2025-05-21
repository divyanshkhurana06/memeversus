import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { LoggingService } from './logging.service';
import { MetricsService } from './metrics.service';
import { GameMode, GameStatus } from '../models/game.model';

export class WebSocketService {
  private io: Server;
  private gameService: GameService;
  private loggingService: LoggingService;
  private metricsService: MetricsService;
  private playerSockets: Map<string, string> = new Map(); // walletAddress -> socketId
  private socketPlayers: Map<string, string> = new Map(); // socketId -> walletAddress

  constructor(
    io: Server,
    gameService: GameService,
    loggingService: LoggingService,
    metricsService: MetricsService
  ) {
    this.io = io;
    this.gameService = gameService;
    this.loggingService = loggingService;
    this.metricsService = metricsService;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.loggingService.info('Client connected', { socketId: socket.id });

      // Handle player registration
      socket.on('registerPlayer', async (data: { walletAddress: string, signature: string, username?: string }) => {
        const start = Date.now();
        try {
          const player = await this.gameService.registerPlayer(data.walletAddress, data.username);
          this.playerSockets.set(data.walletAddress, socket.id);
          this.socketPlayers.set(socket.id, data.walletAddress);
          this.metricsService.incrementActiveGames();
          this.loggingService.info('Player registered', { player, socketId: socket.id });
          socket.emit('playerRegistered', player);
        } catch (error) {
          this.loggingService.error('Error registering player', error as Error, { data });
          socket.emit('error', { message: 'Failed to register player' });
        } finally {
          this.metricsService.trackResponseTime(Date.now() - start);
        }
      });

      // Handle game room creation
      socket.on('createRoom', async (data: { mode: GameMode }) => {
        try {
          const roomId = await this.gameService.createGameRoom(data.mode);
          socket.join(roomId);
          this.loggingService.info('Game room created', { roomId, mode: data.mode });
          socket.emit('roomCreated', { roomId });
        } catch (error) {
          this.loggingService.error('Error creating room', error as Error);
          socket.emit('error', { message: 'Failed to create game room' });
        }
      });

      // Handle joining game room
      socket.on('joinRoom', async (data: { roomId: string, walletAddress: string }) => {
        try {
          await this.gameService.joinGameRoom(data.roomId, data.walletAddress);
          socket.join(data.roomId);
          this.loggingService.info('Player joined room', { roomId: data.roomId, walletAddress: data.walletAddress });
          socket.emit('roomJoined', { roomId: data.roomId });
          this.io.to(data.roomId).emit('playerJoined', { walletAddress: data.walletAddress });
        } catch (error) {
          this.loggingService.error('Error joining room', error as Error);
          socket.emit('error', { message: 'Failed to join game room' });
        }
      });

      // Handle game actions
      socket.on('gameAction', async (data: { roomId: string, action: string, payload: any }) => {
        try {
          const result = await this.gameService.handleGameAction(data.roomId, data.action, data.payload);
          this.io.to(data.roomId).emit('gameUpdate', result);
        } catch (error) {
          this.loggingService.error('Error handling game action', error as Error);
          socket.emit('error', { message: 'Failed to process game action' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        const walletAddress = this.socketPlayers.get(socket.id);
        if (walletAddress) {
          this.playerSockets.delete(walletAddress);
          this.socketPlayers.delete(socket.id);
          this.metricsService.decrementActiveGames();
          this.loggingService.info('Player disconnected', { walletAddress, socketId: socket.id });

          // Notify all rooms the player was in
          const rooms = Array.from(socket.rooms);
          for (const roomId of rooms) {
            if (roomId !== socket.id) {
              this.io.to(roomId).emit('playerLeft', { walletAddress });
            }
          }
        }
      });

      // Handle heartbeat
      socket.on('heartbeat', () => {
        socket.emit('heartbeat', { timestamp: Date.now() });
      });
    });
  }

  public broadcastGameState(roomId: string, gameState: any): void {
    this.io.to(roomId).emit('gameState', gameState);
  }

  public notifyPlayer(walletAddress: string, event: string, data: any): void {
    const socketId = this.playerSockets.get(walletAddress);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  public getConnectedPlayers(): string[] {
    return Array.from(this.playerSockets.keys());
  }

  public isPlayerConnected(walletAddress: string): boolean {
    return this.playerSockets.has(walletAddress);
  }
} 