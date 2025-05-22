import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface AuthResponse {
  token: string;
  user: {
    walletAddress: string;
    username: string;
  };
}

export interface PlayerStats {
  walletAddress: string;
  username: string;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  rating: number;
  badges: string[];
  achievements: any[];
}

export const apiService = {
  // Auth endpoints
  async login(walletAddress: string, signature: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', {
      walletAddress,
      signature,
    });
    return response.data;
  },

  async refreshToken(): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/refresh');
    return response.data;
  },

  // Player endpoints
  async getPlayerStats(walletAddress: string): Promise<PlayerStats> {
    const response = await api.get<PlayerStats>(`/players/${walletAddress}/stats`);
    return response.data;
  },

  async updatePlayerStats(walletAddress: string, stats: Partial<PlayerStats>): Promise<void> {
    await api.patch(`/players/${walletAddress}/stats`, stats);
  },

  // Leaderboard endpoints
  async getLeaderboard(gameMode?: string, limit: number = 10, offset: number = 0) {
    const response = await api.get('/leaderboard', {
      params: { gameMode, limit, offset },
    });
    return response.data;
  },

  // Game history endpoints
  async getGameHistory(walletAddress: string, limit: number = 10, offset: number = 0) {
    const response = await api.get(`/players/${walletAddress}/history`, {
      params: { limit, offset },
    });
    return response.data;
  },

  // NFT endpoints
  async getPlayerNFTs(walletAddress: string) {
    const response = await api.get(`/players/${walletAddress}/nfts`);
    return response.data;
  },
};

export default apiService; 