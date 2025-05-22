export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: string;
}

export interface Player {
  wallet_address: string;
  username: string;
  created_at: string;
  games_played: number;
  total_score: number;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  achievements: string[];
  badges: string[];
  last_active: string;
  is_online: boolean;
  current_game_id?: string;
} 