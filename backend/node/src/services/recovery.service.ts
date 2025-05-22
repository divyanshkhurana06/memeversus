import { GameService } from './game.service';
import { DatabaseService } from './database.service';
import { SuiService } from './sui.service';
import { GameMode, GameStatus } from '../models/game.model';

interface RecoveryState {
  roomId: string;
  playerId: string;
  lastAction: string;
  timestamp: number;
  attempts: number;
  error?: string;
  lastError?: Error;
}

interface RecoveryMetrics {
  totalRecoveries: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  averageRecoveryTime: number;
}

export class RecoveryService {
  private gameService: GameService;
  private dbService: DatabaseService;
  private suiService: SuiService;
  private recoveryStates: Map<string, RecoveryState>;
  private metrics: RecoveryMetrics;
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 5000; // 5 seconds
  private readonly RECOVERY_TIMEOUT = 300000; // 5 minutes
  private readonly CLEANUP_INTERVAL = 3600000; // 1 hour

  constructor(gameService: GameService, dbService: DatabaseService, suiService: SuiService) {
    this.gameService = gameService;
    this.dbService = dbService;
    this.suiService = suiService;
    this.recoveryStates = new Map();
    this.metrics = {
      totalRecoveries: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      averageRecoveryTime: 0
    };

    // Start cleanup interval
    setInterval(() => this.cleanupOldRecoveryStates(), this.CLEANUP_INTERVAL);
  }

  // Handle player reconnection
  async handleReconnection(roomId: string, playerId: string): Promise<void> {
    const startTime = Date.now();
    try {
      console.log(`[Recovery] Attempting reconnection for player ${playerId} in room ${roomId}`);
      
      const gameState = await this.gameService.getGameState(roomId);
      if (!gameState) {
        throw new Error(`Game room ${roomId} not found`);
      }

      // If game is still active, allow reconnection
      if (gameState.status === GameStatus.IN_PROGRESS) {
        if (!gameState.players.includes(playerId)) {
          await this.gameService.joinGameRoom(roomId, playerId);
          console.log(`[Recovery] Successfully reconnected player ${playerId} to room ${roomId}`);
        }
      } else {
        console.log(`[Recovery] Game ${roomId} is not in progress, skipping reconnection`);
      }

      this.updateMetrics(true, startTime);
    } catch (error) {
      console.error(`[Recovery] Error handling reconnection:`, error);
      this.updateMetrics(false, startTime);
      throw error;
    }
  }

  // Recover game state
  async recoverGameState(roomId: string): Promise<void> {
    const startTime = Date.now();
    try {
      console.log(`[Recovery] Attempting to recover game state for room ${roomId}`);
      
      const gameState = await this.gameService.getGameState(roomId);
      if (!gameState) {
        throw new Error(`Game room ${roomId} not found`);
      }

      // Check if game was in progress
      if (gameState.status === GameStatus.IN_PROGRESS) {
        const now = Date.now();
        const lastActionTime = gameState.lastActionTime || 0;
        
        // If last action was more than timeout period ago, cancel the game
        if (now - lastActionTime > this.RECOVERY_TIMEOUT) {
          console.log(`[Recovery] Game ${roomId} timed out, cancelling`);
          await this.gameService.cancelGame(roomId);
        } else {
          // Otherwise, resume the game
          console.log(`[Recovery] Resuming game ${roomId}`);
          gameState.status = GameStatus.IN_PROGRESS;
          await this.gameService.updateGameRoom(roomId, gameState);
        }
      }

      this.updateMetrics(true, startTime);
    } catch (error) {
      console.error(`[Recovery] Error recovering game state:`, error);
      this.updateMetrics(false, startTime);
      throw error;
    }
  }

  // Retry failed transaction
  async retryTransaction(roomId: string, playerId: string, action: string): Promise<void> {
    const startTime = Date.now();
    const recoveryKey = `${roomId}:${playerId}:${action}`;
    let recoveryState = this.recoveryStates.get(recoveryKey);

    if (!recoveryState) {
      recoveryState = {
        roomId,
        playerId,
        lastAction: action,
        timestamp: Date.now(),
        attempts: 0
      };
      this.recoveryStates.set(recoveryKey, recoveryState);
    }

    if (recoveryState.attempts >= this.MAX_RETRY_ATTEMPTS) {
      console.error(`[Recovery] Max retry attempts reached for ${recoveryKey}`);
      throw new Error('Max retry attempts reached');
    }

    try {
      console.log(`[Recovery] Retrying transaction for ${recoveryKey}, attempt ${recoveryState.attempts + 1}`);
      
      switch (action) {
        case 'mintBadge':
          await this.retryMintBadge(roomId, playerId);
          break;
        case 'updateScore':
          await this.retryUpdateScore(roomId, playerId);
          break;
        default:
          throw new Error(`Unknown action type: ${action}`);
      }

      // Clear recovery state on success
      this.recoveryStates.delete(recoveryKey);
      this.updateMetrics(true, startTime);
    } catch (error: unknown) {
      recoveryState.attempts++;
      recoveryState.lastError = error instanceof Error ? error : new Error(String(error));
      recoveryState.error = error instanceof Error ? error.message : String(error);
      this.recoveryStates.set(recoveryKey, recoveryState);
      this.updateMetrics(false, startTime);
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      throw error;
    }
  }

  // Retry minting badge
  private async retryMintBadge(roomId: string, playerId: string): Promise<void> {
    const gameState = await this.gameService.getGameState(roomId);
    if (!gameState) {
      throw new Error(`Game room ${roomId} not found`);
    }

    try {
      console.log(`[Recovery] Retrying mint badge for player ${playerId} in room ${roomId}`);
      
      // Mint NFT for winner
      const txDigest = await this.suiService.mintNFT(playerId, gameState.mode);
      await this.dbService.recordGameResult(roomId, playerId, {
        gameMode: gameState.mode,
        score: gameState.scores.get(playerId) || 0,
        txDigest
      });
      
      console.log(`[Recovery] Successfully minted badge for player ${playerId}`);
    } catch (error) {
      console.error(`[Recovery] Error retrying mint badge:`, error);
      throw error;
    }
  }

  // Retry updating score
  private async retryUpdateScore(roomId: string, playerId: string): Promise<void> {
    const gameState = await this.gameService.getGameState(roomId);
    if (!gameState) {
      throw new Error(`Game room ${roomId} not found`);
    }

    try {
      console.log(`[Recovery] Retrying score update for player ${playerId} in room ${roomId}`);
      
      const score = gameState.scores.get(playerId) || 0;
      await this.dbService.updatePlayerStats(playerId, {
        rating: score
      });
      
      console.log(`[Recovery] Successfully updated score for player ${playerId}`);
    } catch (error) {
      console.error(`[Recovery] Error retrying update score:`, error);
      throw error;
    }
  }

  // Clean up old recovery states
  private cleanupOldRecoveryStates(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, state] of this.recoveryStates.entries()) {
      if (now - state.timestamp > this.CLEANUP_INTERVAL) {
        this.recoveryStates.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`[Recovery] Cleaned up ${cleanedCount} old recovery states`);
    }
  }

  // Update recovery metrics
  private updateMetrics(success: boolean, startTime: number): void {
    const recoveryTime = Date.now() - startTime;
    
    this.metrics.totalRecoveries++;
    if (success) {
      this.metrics.successfulRecoveries++;
    } else {
      this.metrics.failedRecoveries++;
    }
    
    // Update average recovery time
    this.metrics.averageRecoveryTime = 
      (this.metrics.averageRecoveryTime * (this.metrics.totalRecoveries - 1) + recoveryTime) / 
      this.metrics.totalRecoveries;
  }

  // Get recovery metrics
  getMetrics(): RecoveryMetrics {
    return { ...this.metrics };
  }

  // Get recovery state for a specific key
  getRecoveryState(key: string): RecoveryState | undefined {
    return this.recoveryStates.get(key);
  }
} 