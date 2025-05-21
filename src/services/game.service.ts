import { SuiService } from './sui.service';
import { DatabaseService } from './database.service';

export enum GameMode {
  FrameRace = 0,
  SoundSnatch = 1,
  TypeClash = 2
}

interface GameState {
  mode: GameMode;
  currentFrame?: number;
  currentSound?: string;
  currentText?: string;
  isActive: boolean;
  players: string[];
  scores: Map<string, number>;
}

export class GameService {
  private suiService: SuiService;
  private dbService: DatabaseService;
  private gameStates: Map<string, GameState>;

  constructor() {
    this.suiService = new SuiService();
    this.dbService = new DatabaseService();
    this.gameStates = new Map();
  }

  // Create a new game room
  async createGameRoom(roomId: string, mode: GameMode): Promise<GameState> {
    const gameState: GameState = {
      mode,
      isActive: false,
      players: [],
      scores: new Map(),
    };

    // Initialize game state based on mode
    switch (mode) {
      case GameMode.FrameRace:
        gameState.currentFrame = 0;
        break;
      case GameMode.SoundSnatch:
        gameState.currentSound = this.generateDistortedSound();
        break;
      case GameMode.TypeClash:
        gameState.currentText = this.generateTypingText();
        break;
    }

    // Save to database
    await this.dbService.createGameRoom(roomId, mode);
    
    this.gameStates.set(roomId, gameState);
    return gameState;
  }

  // Register a new player
  async registerPlayer(walletAddress: string, username?: string): Promise<void> {
    await this.dbService.registerPlayer(walletAddress, username);
  }

  // Join a game room
  async joinGameRoom(roomId: string, walletAddress: string): Promise<void> {
    const gameState = this.gameStates.get(roomId);
    if (!gameState) {
      throw new Error('Game room not found');
    }

    if (gameState.players.includes(walletAddress)) {
      throw new Error('Player already in game room');
    }

    gameState.players.push(walletAddress);
    await this.dbService.addPlayerToRoom(roomId, walletAddress);
  }

  // Handle player action in FrameRace mode
  async handleFrameRaceAction(roomId: string, playerId: string, frame: number): Promise<boolean> {
    const gameState = this.gameStates.get(roomId);
    if (!gameState || gameState.mode !== GameMode.FrameRace) return false;

    const isCorrect = frame === gameState.currentFrame;
    if (isCorrect) {
      const currentScore = gameState.scores.get(playerId) || 0;
      gameState.scores.set(playerId, currentScore + 1);
      
      // If player wins, mint NFT badge and record result
      if (currentScore + 1 >= 3) {
        await this.suiService.mintWinnerBadge(playerId, GameMode.FrameRace);
        await this.dbService.recordGameResult(roomId, playerId);
      }
    }

    return isCorrect;
  }

  // Handle player action in SoundSnatch mode
  async handleSoundSnatchAction(roomId: string, playerId: string, guess: string): Promise<boolean> {
    const gameState = this.gameStates.get(roomId);
    if (!gameState || gameState.mode !== GameMode.SoundSnatch) return false;

    const isCorrect = guess === gameState.currentSound;
    if (isCorrect) {
      const currentScore = gameState.scores.get(playerId) || 0;
      gameState.scores.set(playerId, currentScore + 1);
      
      if (currentScore + 1 >= 3) {
        await this.suiService.mintWinnerBadge(playerId, GameMode.SoundSnatch);
        await this.dbService.recordGameResult(roomId, playerId);
      }
    }

    return isCorrect;
  }

  // Handle player action in TypeClash mode
  async handleTypeClashAction(roomId: string, playerId: string, typedText: string): Promise<boolean> {
    const gameState = this.gameStates.get(roomId);
    if (!gameState || gameState.mode !== GameMode.TypeClash) return false;

    const isCorrect = typedText === gameState.currentText;
    if (isCorrect) {
      const currentScore = gameState.scores.get(playerId) || 0;
      gameState.scores.set(playerId, currentScore + 1);
      
      if (currentScore + 1 >= 3) {
        await this.suiService.mintWinnerBadge(playerId, GameMode.TypeClash);
        await this.dbService.recordGameResult(roomId, playerId);
      }
    }

    return isCorrect;
  }

  // Helper methods
  private generateDistortedSound(): string {
    // TODO: Implement sound distortion logic
    return 'distorted_sound_1';
  }

  private generateTypingText(): string {
    // TODO: Implement typing text generation
    return 'Sample typing text';
  }

  // Get game state
  async getGameState(roomId: string): Promise<GameState | undefined> {
    // Try to get from memory first
    let gameState = this.gameStates.get(roomId);
    
    // If not in memory, try to get from database
    if (!gameState) {
      const dbGameRoom = await this.dbService.getGameRoom(roomId);
      if (dbGameRoom) {
        const newGameState: GameState = {
          mode: dbGameRoom.mode,
          isActive: dbGameRoom.is_active,
          players: dbGameRoom.players || [],
          scores: new Map(),
          ...dbGameRoom.current_state
        };
        this.gameStates.set(roomId, newGameState);
        gameState = newGameState;
      }
    }
    
    return gameState;
  }

  // Get player stats
  async getPlayerStats(walletAddress: string): Promise<any> {
    const player = await this.dbService.getPlayer(walletAddress);
    const onChainStats = await this.suiService.fetchPlayerStats(walletAddress);
    
    return {
      ...player,
      onChainStats
    };
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
    await this.dbService.updateGameRoom(roomId, {
      is_active: gameState.isActive,
      players: gameState.players,
      current_state: {
        currentFrame: gameState.currentFrame,
        currentSound: gameState.currentSound,
        currentText: gameState.currentText
      }
    });
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
} 