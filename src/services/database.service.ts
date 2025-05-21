import { createClient } from '@supabase/supabase-js';
import { GameMode } from './game.service';

interface Player {
  wallet_address: string;
  username?: string;
  created_at: string;
  wins: number;
  games_played: number;
}

interface GameRoom {
  id: string;
  mode: GameMode;
  created_at: string;
  is_active: boolean;
  players: string[];
  current_state: any;
  winner?: string;
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
        games_played: 0
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

  async recordGameResult(roomId: string, winner: string): Promise<void> {
    // Update game room
    await this.updateGameRoom(roomId, {
      is_active: false,
      winner
    });

    // Get current player stats
    const { data: player, error: fetchError } = await this.supabase
      .from('players')
      .select('wins, games_played')
      .eq('wallet_address', winner)
      .single();

    if (fetchError) throw fetchError;

    // Update player stats with incremented values
    const { error: updateError } = await this.supabase
      .from('players')
      .update({
        wins: (player?.wins || 0) + 1,
        games_played: (player?.games_played || 0) + 1
      })
      .eq('wallet_address', winner);

    if (updateError) throw updateError;
  }
} 