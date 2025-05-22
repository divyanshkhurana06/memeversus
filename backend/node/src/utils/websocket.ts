import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { GameMode, GameState, Player, ChatMessage } from '../types/game';

const WS_URL = process.env.VITE_WS_URL || 'ws://localhost:3000';

class WebSocketService {
  private socket: ReturnType<typeof io> | null = null;
  private static instance: WebSocketService;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(token: string) {
    if (this.socket?.connected) return;

    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.socket = socket;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.reconnectDelay *= 2; // Exponential backoff
      setTimeout(() => {
        this.socket?.connect();
      }, this.reconnectDelay);
    }
  }

  // Game Room Methods
  createGameRoom(mode: GameMode) {
    return new Promise<string>((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('createRoom', { mode }, (response: { roomId: string } | { error: string }) => {
        if ('error' in response) {
          reject(new Error(response.error));
        } else {
          resolve(response.roomId);
        }
      });
    });
  }

  joinGameRoom(roomId: string, walletAddress: string) {
    return new Promise<void>((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('joinRoom', { roomId, walletAddress }, (response: { success: boolean } | { error: string }) => {
        if ('error' in response) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  // Game Action Methods
  sendGameAction(roomId: string, action: string, payload: unknown) {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('gameAction', { roomId, action, payload });
  }

  // Event Listeners
  onGameStateUpdate(callback: (state: GameState) => void) {
    this.socket?.on('gameStateUpdate', callback);
  }

  onPlayerJoined(callback: (player: Player) => void) {
    this.socket?.on('playerJoined', callback);
  }

  onPlayerLeft(callback: (playerId: string) => void) {
    this.socket?.on('playerLeft', callback);
  }

  onGameStart(callback: (data: { countdown?: number }) => void) {
    this.socket?.on('gameStart', callback);
  }

  onGameEnd(callback: (data: { winner?: string }) => void) {
    this.socket?.on('gameEnd', callback);
  }

  onChatMessage(callback: (message: ChatMessage) => void) {
    this.socket?.on('chatMessage', callback);
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

export const websocketService = WebSocketService.getInstance(); 