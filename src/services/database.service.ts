import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GameMode, GameStatus } from '../models/game.model';

interface Player {
  wallet_address: string;
  username?: string;
  created_at: string;
  wins: number;
  games_played: number;
  total_score: number;
  badges: string[];
  achievements: Achievement[];
  rank?: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked_at: string;
  game_mode: GameMode;
}

interface GameRoom {
  id: string;
  mode: GameMode;
  status: GameStatus;
  created_at: string;
  is_active: boolean;
  players: string[];
  current_state: any;
  winner?: string;
  round_number: number;
  max_rounds: number;
  round_timeout: number;
}

interface GameResult {
  gameMode: GameMode;
  score: number;
  txDigest: string;
}

interface PlayerStats {
  wallet_address: string;
  username: string;
  wins: number;
  games_played: number;
  total_score: number;
  badges: string[];
  created_at: string;
  updated_at: string;
}

interface GameHistoryEntry {
  gameId: string;
  gameMode: GameMode;
  score: number;
  timestamp: string;
  opponent: string;
}

interface LeaderboardEntry {
  wallet_address: string;
  username: string;
  wins: number;
  games_played: number;
  total_score: number;
  badges: string[];
  rank: number;
}

interface DatabaseLeaderboardEntry {
  players: {
    wallet_address: string;
    username: string;
    wins: number;
    games_played: number;
    total_score: number;
    badges: string[];
  };
}

export class DatabaseService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found in environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // Player management
  async registerPlayer(walletAddress: string, username?: string): Promise<Player> {
    const { data, error } = await this.supabase
      .from('players')
      .upsert({
        wallet_address: walletAddress,
        username,
        created_at: new Date().toISOString(),
        wins: 0,
        games_played: 0,
        total_score: 0,
        badges: [],
        achievements: []
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getPlayer(walletAddress: string): Promise<Player | null> {
    const { data, error } = await this.supabase
      .from('players')
      .select()
      .eq('wallet_address', walletAddress)
      .single();

    if (error) throw error;
    return data;
  }

  async updatePlayerStats(walletAddress: string, stats: Partial<Player>): Promise<Player> {
    const { data, error } = await this.supabase
      .from('players')
      .update(stats)
      .eq('wallet_address', walletAddress)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addPlayerAchievement(walletAddress: string, achievement: Achievement): Promise<void> {
    const player = await this.getPlayer(walletAddress);
    if (!player) throw new Error('Player not found');

    const achievements = [...(player.achievements || []), achievement];
    await this.updatePlayerStats(walletAddress, { achievements });
  }

  async addPlayerBadge(walletAddress: string, badgeId: string): Promise<void> {
    const player = await this.getPlayer(walletAddress);
    if (!player) throw new Error('Player not found');

    const badges = [...(player.badges || []), badgeId];
    await this.updatePlayerStats(walletAddress, { badges });
  }

  // Leaderboard
  async getLeaderboard(limit: number = 10, offset: number = 0): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('players')
        .select('wallet_address, username, wins, games_played, total_score, badges')
        .order('total_score', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return (data as any[]).map((entry, index) => ({
        wallet_address: entry.wallet_address,
        username: entry.username,
        wins: entry.wins,
        games_played: entry.games_played,
        total_score: entry.total_score,
        badges: entry.badges,
        rank: offset + index + 1
      }));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  async getPlayerRank(walletAddress: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('players')
      .select('wallet_address, total_score')
      .gt('total_score', 0)
      .order('total_score', { ascending: false });

    if (error) throw error;

    const playerIndex = data.findIndex(p => p.wallet_address === walletAddress);
    return playerIndex + 1;
  }

  // Game room management
  async createGameRoom(roomId: string, mode: GameMode): Promise<GameRoom> {
    const { data, error } = await this.supabase
      .from('game_rooms')
      .insert({
        id: roomId,
        mode,
        created_at: new Date().toISOString(),
        is_active: true,
        players: [],
        current_state: {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateGameRoom(roomId: string, updates: Partial<GameRoom>): Promise<GameRoom> {
    const { data, error } = await this.supabase
      .from('game_rooms')
      .update(updates)
      .eq('id', roomId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getGameRoom(roomId: string): Promise<GameRoom | null> {
    const { data, error } = await this.supabase
      .from('game_rooms')
      .select()
      .eq('id', roomId)
      .single();

    if (error) throw error;
    return data;
  }

  async addPlayerToRoom(roomId: string, walletAddress: string): Promise<void> {
    // First get the current players array
    const { data: gameRoom, error: fetchError } = await this.supabase
      .from('game_rooms')
      .select('players')
      .eq('id', roomId)
      .single();

    if (fetchError) throw fetchError;

    // Add the new player to the array
    const updatedPlayers = [...(gameRoom.players || []), walletAddress];

    // Update the game room with the new players array
    const { error: updateError } = await this.supabase
      .from('game_rooms')
      .update({ players: updatedPlayers })
      .eq('id', roomId);

    if (updateError) throw updateError;
  }

  // Game results
  async recordGameResult(roomId: string, playerId: string, result: GameResult): Promise<void> {
    try {
      // Record game result
      await this.supabase
        .from('game_results')
        .insert({
          room_id: roomId,
          player_id: playerId,
          game_mode: result.gameMode,
          score: result.score,
          tx_digest: result.txDigest,
          created_at: new Date().toISOString()
        });

      // Update player stats
      const player = await this.getPlayer(playerId);
      if (player) {
        const newStats = {
          games_played: player.games_played + 1,
          total_score: player.total_score + result.score,
          wins: player.wins + (result.score >= 3 ? 1 : 0)
        };
        await this.updatePlayerStats(playerId, newStats);
      }
    } catch (error) {
      console.error('Error recording game result:', error);
      throw error;
    }
  }

  // Get leaderboard by game mode
  async getLeaderboardByGameMode(gameMode: GameMode, limit: number = 10, offset: number = 0): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('players')
        .select('wallet_address, username, wins, games_played, total_score, badges')
        .eq('game_mode', gameMode)
        .order('total_score', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return (data as any[]).map((entry, index) => ({
        wallet_address: entry.wallet_address,
        username: entry.username,
        wins: entry.wins,
        games_played: entry.games_played,
        total_score: entry.total_score,
        badges: entry.badges,
        rank: offset + index + 1
      }));
    } catch (error) {
      console.error('Error fetching game mode leaderboard:', error);
      throw error;
    }
  }

  async getTotalPlayers(): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('players')
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting total players:', error);
      throw error;
    }
  }

  async getPlayerStats(walletAddress: string): Promise<PlayerStats | null> {
    try {
      const { data, error } = await this.supabase
        .from('players')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return null;
    }
  }

  async getPlayerGameHistory(walletAddress: string, limit: number = 10, offset: number = 0): Promise<GameHistoryEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('game_results')
        .select(`
          id,
          game_mode,
          score,
          created_at,
          players (
            wallet_address,
            username
          )
        `)
        .eq('player_id', walletAddress)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return (data as any[]).map((p) => ({
        gameId: p.id,
        gameMode: p.game_mode,
        score: p.score,
        timestamp: p.created_at,
        opponent: p.players?.username || 'Unknown'
      }));
    } catch (error) {
      console.error('Error fetching player game history:', error);
      return [];
    }
  }
} 