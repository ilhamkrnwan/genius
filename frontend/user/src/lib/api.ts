// Use the explicit IPv4 loopback in local development. On some Windows setups
// localhost resolves to an unrelated IPv6 listener on port 3001.
const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:3001/api';

import type { AnswerSubmission, GameSession, PlayableMission } from '@genius-unu/shared';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export const api = {
  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('genius_user_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.warn(`[API] Request failed to ${endpoint}:`, err.message);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: err.message || 'Gagal terhubung ke backend server',
        },
      };
    }
  },

  // Auth
  async login(username: string, password: string) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (res.success && res.data?.token) {
      localStorage.setItem('genius_user_token', res.data.token);
      localStorage.setItem('genius_user_profile', JSON.stringify(res.data.user));
    }

    return res;
  },

  async loginMaba(nim: string, password = 'genius2026') {
    const res = await this.request('/auth/login-maba', {
      method: 'POST',
      body: JSON.stringify({ nim, password }),
    });

    if (res.success && res.data?.token) {
      localStorage.setItem('genius_user_token', res.data.token);
      localStorage.setItem('genius_user_profile', JSON.stringify(res.data.user));
    }

    return res;
  },

  logout() {
    localStorage.removeItem('genius_user_token');
    localStorage.removeItem('genius_user_profile');
  },

  // Floors & Locations
  async getFloors() {
    return this.request('/floors');
  },

  async getAvailableMissions() {
    return this.request<PlayableMission[]>('/me/missions/available');
  },

  async getMissionForPlay(missionId: string) {
    return this.request<PlayableMission>('/missions/' + encodeURIComponent(missionId) + '/play');
  },

  async createGameSession(payload: { missionId: string; teamId: string; allowReplay?: boolean }) {
    return this.request<GameSession>('/game-sessions/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getGameSession(sessionId: string) {
    return this.request<GameSession>('/game-sessions/' + encodeURIComponent(sessionId));
  },

  async getActiveGameSession() {
    return this.request<GameSession | null>('/game-sessions/active');
  },

  async startGameSession(sessionId: string) {
    return this.request<GameSession>('/game-sessions/' + encodeURIComponent(sessionId) + '/start', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async submitGameAnswer(sessionId: string, submission: AnswerSubmission) {
    return this.request<{ accepted: boolean; isCorrect?: boolean; scoreEarned?: number; progress?: { answered: number; total: number }; duplicate?: boolean }>(
      '/game-sessions/' + encodeURIComponent(sessionId) + '/answer',
      { method: 'POST', body: JSON.stringify(submission) }
    );
  },

  async completeGameSession(sessionId: string, submissions: Array<Record<string, unknown>> = []) {
    return this.request<{ session: GameSession; evaluation: Record<string, unknown> }>(
      '/game-sessions/' + encodeURIComponent(sessionId) + '/complete',
      { method: 'POST', body: JSON.stringify({ submissions }) }
    );
  },

  // Leaderboard
  async getLeaderboard(limit = 20) {
    return this.request(`/leaderboard?limit=${limit}`);
  },

  // Submit Game Score
  async submitScore(payload: {
    participantId: string;
    teamId: string;
    amount: number;
    sourceType: string;
    reason?: string;
  }) {
    return this.request('/scores', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Health check
  async checkHealth() {
    try {
      const res = await fetch('http://localhost:3001/api/health');
      return await res.json();
    } catch {
      return null;
    }
  },
};
