import { SuiService } from './sui.service';
import { DatabaseService } from './database.service';
import { GameMode, GameStatus, GameState, GameAction, GameResult } from '../models/game.model';

export class GameService {
  private suiService: SuiService;
  private dbService: DatabaseService;
  private gameStates: Map<string, GameState>;
  private gameTimeouts: Map<string, NodeJS.Timeout>;

  constructor(dbService: DatabaseService, suiService: SuiService) {
    this.dbService = dbService;
    this.suiService = suiService;
    this.gameStates = new Map();
    this.gameTimeouts = new Map();
  }

  // Create a new game room
  async createGameRoom(mode: GameMode): Promise<string> {
    const roomId = Math.random().toString(36).substring(7);
    const gameState: GameState = {
      id: roomId,
      mode,
      status: GameStatus.WAITING,
      players: [],
      scores: new Map(),
      roundNumber: 0,
      maxRounds: 10,
      roundTimeout: 30000,
      isActive: false
    };
    this.gameStates.set(roomId, gameState);
    await this.dbService.createGameRoom(roomId, mode);
    return roomId;
  }

  // Start game
  async startGame(roomId: string): Promise<GameState> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      throw new Error('Game room not found');
    }

    if (gameState.status !== GameStatus.WAITING) {
      throw new Error('Game cannot be started in current state');
    }

    if (gameState.players.length < 2) {
      throw new Error('Not enough players to start game');
    }

    gameState.status = GameStatus.STARTING;
    gameState.startTime = Date.now();
    gameState.lastActionTime = Date.now();
    gameState.isActive = true;
    gameState.roundNumber = 1;

    // Start round timeout
    this.startRoundTimeout(roomId);

    await this.updateGameRoom(roomId, gameState);
    return gameState;
  }

  // Cancel game
  async cancelGame(roomId: string): Promise<void> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      throw new Error('Game room not found');
    }

    gameState.status = GameStatus.CANCELLED;
    gameState.isActive = false;
    this.clearGameTimeout(roomId);

    await this.updateGameRoom(roomId, gameState);
  }

  // Handle round timeout
  private async handleRoundTimeout(roomId: string): Promise<void> {
    const gameState = await this.getGameState(roomId);
    if (!gameState || gameState.status !== GameStatus.IN_PROGRESS) return;

    // Move to next round or end game
    if (gameState.roundNumber >= gameState.maxRounds) {
      await this.endGame(roomId);
    } else {
      gameState.roundNumber++;
      gameState.lastActionTime = Date.now();
      await this.updateGameState(roomId);
      this.startRoundTimeout(roomId);
    }
  }

  // Start round timeout
  private startRoundTimeout(roomId: string): void {
    this.clearGameTimeout(roomId);
    const timeout = setTimeout(() => this.handleRoundTimeout(roomId), 30000);
    this.gameTimeouts.set(roomId, timeout);
  }

  // Clear game timeout
  private clearGameTimeout(roomId: string): void {
    const timeout = this.gameTimeouts.get(roomId);
    if (timeout) {
      clearTimeout(timeout);
      this.gameTimeouts.delete(roomId);
    }
  }

  // End game
  private async endGame(roomId: string): Promise<void> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) return;

    gameState.status = GameStatus.COMPLETED;
    gameState.isActive = false;
    this.clearGameTimeout(roomId);

    // Determine winner
    let maxScore = 0;
    let winner: string | undefined;

    gameState.scores.forEach((score, playerId) => {
      if (score > maxScore) {
        maxScore = score;
        winner = playerId;
      }
    });

    if (winner) {
      gameState.winner = winner;
      try {
        const txDigest = await this.suiService.mintNFT(winner, gameState.mode);
        await this.dbService.recordGameResult(roomId, winner, {
          gameMode: gameState.mode,
          score: maxScore,
          txDigest
        });
      } catch (error) {
        console.error('Error minting winner badge:', error);
      }
    }

    await this.updateGameRoom(roomId, gameState);
  }

  // Handle player disconnection
  async handlePlayerDisconnect(roomId: string, playerId: string): Promise<void> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) return;

    const playerIndex = gameState.players.indexOf(playerId);
    if (playerIndex !== -1) {
      gameState.players.splice(playerIndex, 1);
      
      // If game is in progress and not enough players, cancel it
      if (gameState.status === GameStatus.IN_PROGRESS && gameState.players.length < 2) {
        await this.cancelGame(roomId);
      } else {
        await this.updateGameRoom(roomId, { players: gameState.players });
      }
    }
  }

  // Register a new player
  async registerPlayer(walletAddress: string, username?: string): Promise<any> {
    return this.dbService.registerPlayer(walletAddress, username);
  }

  // Join a game room
  async joinGameRoom(roomId: string, walletAddress: string): Promise<void> {
    const gameState = this.gameStates.get(roomId);
    if (!gameState) throw new Error('Game room not found');
    if (gameState.status !== GameStatus.WAITING) throw new Error('Game already in progress');
    if (gameState.players.includes(walletAddress)) throw new Error('Player already in room');

    gameState.players.push(walletAddress);
    gameState.scores.set(walletAddress, 0);
    await this.dbService.addPlayerToRoom(roomId, walletAddress);
  }

  // Handle player action in FrameRace mode
  async handleFrameRaceAction(roomId: string, playerId: string, frame: number): Promise<any> {
    const gameState = this.gameStates.get(roomId);
    if (!gameState || gameState.mode !== GameMode.FrameRace) return { isCorrect: false, frame: 0 };

    const isCorrect = frame === gameState.currentFrame;
    return { isCorrect, frame };
  }

  // Handle player action in SoundSnatch mode
  async handleSoundSnatchAction(roomId: string, playerId: string, guess: string): Promise<any> {
    const gameState = this.gameStates.get(roomId);
    if (!gameState || gameState.mode !== GameMode.SoundSnatch) return { isCorrect: false, guess: '' };

    const isCorrect = guess.toLowerCase() === gameState.currentSound?.toLowerCase();
    return { isCorrect, guess };
  }

  // Handle player action in TypeClash mode
  async handleTypeClashAction(roomId: string, playerId: string, typedText: string): Promise<any> {
    const gameState = this.gameStates.get(roomId);
    if (!gameState || gameState.mode !== GameMode.TypeClash) return { isCorrect: false, typedText: '' };

    const isCorrect = typedText === gameState.currentText;
    return { isCorrect, typedText };
  }

  // Update game state for next round
  async updateGameState(roomId: string): Promise<void> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      throw new Error('Game room not found');
    }

    switch (gameState.mode) {
      case GameMode.FrameRace:
        gameState.currentFrame = (gameState.currentFrame || 0) + 1;
        break;
      case GameMode.SoundSnatch:
        gameState.currentSound = this.generateDistortedSound();
        break;
      case GameMode.TypeClash:
        gameState.currentText = this.generateTypingText();
        break;
    }

    await this.updateGameRoom(roomId, gameState);
  }

  // Helper methods for game state initialization
  private generateDistortedSound(): string {
    const sounds = [
      'distorted_sound_1',
      'distorted_sound_2',
      'distorted_sound_3',
      'distorted_sound_4',
      'distorted_sound_5'
    ];
    return sounds[Math.floor(Math.random() * sounds.length)];
  }

  private generateTypingText(): string {
    const texts = [
      'The quick brown fox jumps over the lazy dog',
      'Pack my box with five dozen liquor jugs',
      'How vexingly quick daft zebras jump',
      'Sphinx of black quartz, judge my vow',
      'Crazy Fredrick bought many very exquisite opal jewels'
    ];
    return texts[Math.floor(Math.random() * texts.length)];
  }

  // Get game state
  async getGameState(roomId: string): Promise<GameState | undefined> {
    return this.gameStates.get(roomId);
  }

  // Get player stats
  async getPlayerStats(walletAddress: string): Promise<any> {
    const player = await this.dbService.getPlayer(walletAddress);
    const rank = await this.dbService.getPlayerRank(walletAddress);
    
    return {
      ...player,
      rank
    };
  }

  // Get player rank
  async getPlayerRank(walletAddress: string): Promise<number> {
    return this.dbService.getPlayerRank(walletAddress);
  }

  // Get leaderboard
  async getLeaderboard(limit: number = 10, offset: number = 0): Promise<any[]> {
    return this.dbService.getLeaderboard(limit, offset);
  }

  // Get leaderboard by game mode
  async getLeaderboardByGameMode(gameMode: GameMode, limit: number = 10, offset: number = 0): Promise<any[]> {
    return this.dbService.getLeaderboardByGameMode(gameMode, limit, offset);
  }

  // Update game room
  async updateGameRoom(roomId: string, updates: Partial<GameState>): Promise<void> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      throw new Error('Game room not found');
    }

    // Update game state
    Object.assign(gameState, updates);
    this.gameStates.set(roomId, gameState);

    // Update in database
    await this.dbService.updateGameRoom(roomId, updates);
  }

  // Get all game rooms
  async getAllGameRooms(): Promise<Array<{ id: string; playerCount: number; gameState: GameState }>> {
    const rooms: Array<{ id: string; playerCount: number; gameState: GameState }> = [];
    
    // Get rooms from memory
    for (const [id, state] of this.gameStates.entries()) {
      rooms.push({
        id,
        playerCount: state.players.length,
        gameState: state
      });
    }

    return rooms;
  }

  async handleGameAction(roomId: string, action: string, payload: any): Promise<any> {
    const gameState = this.gameStates.get(roomId);
    if (!gameState) throw new Error('Game room not found');
    if (gameState.status !== GameStatus.IN_PROGRESS) throw new Error('Game not in progress');

    let result;
    switch (gameState.mode) {
      case GameMode.FrameRace:
        result = await this.handleFrameRaceAction(roomId, payload.playerId, payload.frame);
        break;
      case GameMode.SoundSnatch:
        result = await this.handleSoundSnatchAction(roomId, payload.playerId, payload.guess);
        break;
      case GameMode.TypeClash:
        result = await this.handleTypeClashAction(roomId, payload.playerId, payload.typedText);
        break;
      default:
        throw new Error('Invalid game mode');
    }

    if (result.isCorrect) {
      const currentScore = gameState.scores.get(payload.playerId) || 0;
      gameState.scores.set(payload.playerId, currentScore + 1);
      await this.updateGameRoom(roomId, { scores: gameState.scores });
    }

    return result;
  }
} 