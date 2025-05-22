export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: string;
}

export interface Player {
  walletAddress: string;
  username?: string;
  rating: number;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  badges: string[];
  achievements: Achievement[];
  createdAt: string;
  updatedAt: string;
} 