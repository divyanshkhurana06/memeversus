import { createClient, SupabaseClient, PostgrestSingleResponse } from '@supabase/supabase-js';
import { GameMode, GameStatus } from '../models/game.model';
import { Player, Achievement } from '../models/player.model';

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

export interface PlayerStats {
  walletAddress: string;
  username?: string;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
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
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || ''
    );
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
    const response = await this.supabase
      .from('players')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (response.error) throw response.error;
    return response.data;
  }

  async updatePlayer(walletAddress: string, updates: Partial<Player>): Promise<void> {
    const { data, error } = await this.supabase
      .from('players')
      .update(updates)
      .eq('wallet_address', walletAddress);

    if (error) {
      throw new Error(error.message);
    }
  }

  async addAchievement(walletAddress: string, achievement: Achievement): Promise<void> {
    const player = await this.getPlayer(walletAddress);
    if (!player) throw new Error('Player not found');

    const achievements = [...(player.achievements || []), achievement];
    await this.updatePlayer(walletAddress, { achievements });
  }

  async addBadge(walletAddress: string, badgeId: string): Promise<void> {
    const player = await this.getPlayer(walletAddress);
    if (!player) throw new Error('Player not found');

    const badges = [...(player.badges || []), badgeId];
    await this.updatePlayer(walletAddress, { badges });
  }

  async getTopPlayers(gameMode: GameMode, limit: number = 10): Promise<Array<{ walletAddress: string; rating: number }>> {
    const response = await this.supabase
      .from('players')
      .select('wallet_address, rating')
      .order('rating', { ascending: false })
      .limit(limit);

    if (response.error) throw response.error;
    return (response.data || []).map(player => ({
      walletAddress: player.wallet_address,
      rating: player.rating
    }));
  }

  // Leaderboard
  async getLeaderboard(limit: number = 10, offset: number = 0): Promise<any[]> {
    const response = await this.supabase
      .from('players')
      .select('wallet_address, username, rating, total_games, wins, losses, draws')
      .order('rating', { ascending: false })
      .range(offset, offset + limit - 1);

    if (response.error) throw response.error;
    return response.data || [];
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
  async createGameRoom(roomId: string, mode: GameMode): Promise<any> {
    const response = await this.supabase
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

    if (response.error) throw response.error;
    return response.data;
  }

  async updateGameRoom(roomId: string, updates: any): Promise<void> {
    const response = await this.supabase
      .from('game_rooms')
      .update(updates)
      .eq('id', roomId);

    if (response.error) throw response.error;
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
    const response = await this.supabase.rpc('add_player_to_room', {
      p_room_id: roomId,
      p_wallet_address: walletAddress
    });

    if (response.error) throw response.error;
  }

  // Game results
  async recordGameResult(
    roomId: string,
    winnerId: string,
    result: {
      gameMode: GameMode;
      score: number;
      txDigest: string;
    }
  ): Promise<void> {
    const response = await this.supabase
      .from('game_results')
      .insert({
        room_id: roomId,
        winner_id: winnerId,
        game_mode: result.gameMode,
        score: result.score,
        tx_digest: result.txDigest,
        created_at: new Date().toISOString()
      });

    if (response.error) throw response.error;
  }

  // Get leaderboard by game mode
  async getLeaderboardByGameMode(
    gameMode: GameMode,
    limit: number = 10,
    offset: number = 0
  ): Promise<any[]> {
    const response = await this.supabase
      .from('game_results')
      .select(`
        winner_id,
        players!inner (
          wallet_address,
          username,
          rating
        )
      `)
      .eq('game_mode', gameMode)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (response.error) throw response.error;
    return response.data || [];
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

  async updatePlayerStats(walletAddress: string, stats: Partial<Player>): Promise<void> {
    return this.updatePlayer(walletAddress, stats);
  }
} 