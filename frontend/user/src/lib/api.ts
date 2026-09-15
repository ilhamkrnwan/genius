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

function parseApiResponse<T>(raw: string): T {
  const text = raw.replace(/^\uFEFF/, '').trim();
  if (!text) throw new Error('Empty API response');

  try {
    return JSON.parse(text) as T;
  } catch (firstError) {
    // A dev proxy can append diagnostics after a valid JSON object. Recover the
    // first complete object so a playable session is not discarded by a suffix.
    const start = text.search(/[\[{]/);
    if (start >= 0) {
      let depth = 0;
      let quoted = false;
      let escaped = false;
      for (let index = start; index < text.length; index += 1) {
        const char = text[index];
        if (quoted) {
          if (escaped) escaped = false;
          else if (char === '\\') escaped = true;
          else if (char === '"') quoted = false;
          continue;
        }
        if (char === '"') {
          quoted = true;
          continue;
        }
        if (char === '{' || char === '[') depth += 1;
        if (char === '}' || char === ']') depth -= 1;
        if (depth === 0) {
          try {
            return JSON.parse(text.slice(start, index + 1)) as T;
          } catch {
            break;
          }
        }
      }
    }
    throw firstError;
  }
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

      if (response.status === 401 && !endpoint.startsWith('/auth/')) {
        window.dispatchEvent(new Event('genius:auth-required'));
        return { success: false, error: { code: 'UNAUTHORIZED', message: 'Sesi login telah berakhir. Silakan masuk kembali.' } };
      }

      const raw = await response.text();
      let data: ApiResponse<T>;
      try {
        data = parseApiResponse<ApiResponse<T>>(raw);
      } catch {
        console.warn(`[API] Invalid response to ${endpoint}: HTTP ${response.status}`);
        return {
          success: false,
          error: {
            code: response.ok ? 'INVALID_RESPONSE' : `HTTP_${response.status}`,
            message: response.ok
              ? 'Respons server tidak valid. Silakan coba lagi.'
              : `Server gagal memproses permintaan (HTTP ${response.status}). Silakan coba lagi.`,
          },
        };
      }
      if (!response.ok && !data.error) {
        return { success: false, error: { code: `HTTP_${response.status}`, message: `Permintaan gagal (HTTP ${response.status}).` } };
      }
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

  async registerMaba(payload: {
    nim: string;
    name: string;
    gender?: string;
    faculty?: string;
    prodi?: string;
    characterClass?: string;
    avatar?: string;
    password?: string;
  }) {
    const res = await this.request('/auth/register-maba', {
      method: 'POST',
      body: JSON.stringify(payload),
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

  async getStages() {
    return this.request('/stages');
  },

  async getLocations(floorId?: string) {
    const query = floorId ? '?floorId=' + floorId : '';
    return this.request('/locations' + query);
  },

  async getAvailableMissions() {
    return this.request<PlayableMission[]>('/me/missions/available');
  },

  async getMissionForPlay(missionId: string) {
    return this.request<PlayableMission>('/missions/' + encodeURIComponent(missionId) + '/play');
  },

  // Attendance Gate & Daily Reflections
  async getActiveAttendanceSession() {
    return this.request('/attendance/active-session');
  },

  async scanAttendance(qrToken: string, participantId?: string) {
    return this.request('/attendance/scan', {
      method: 'POST',
      body: JSON.stringify({ qrToken, participantId }),
    });
  },

  async checkIn(day: number, qrToken: string, participantId?: string) {
    return this.request('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({ day, qrToken, participantId }),
    });
  },

  async submitReflection(payload: {
    day: number;
    ratingFasilitas: number;
    ratingMateri: number;
    ratingBuddy: number;
    essayInsight: string;
    participantId?: string;
  }) {
    return this.request('/reflections', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async checkOut(day: number, qrToken: string, participantId?: string) {
    return this.request('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify({ day, qrToken, participantId }),
    });
  },

  async getAttendanceStatus(participantId: string, day?: number) {
    const q = day ? `?day=${day}` : '';
    return this.request<{
      days?: Record<number, any>;
      records?: any[];
      hasCheckedIn?: boolean;
      hasCheckedOut?: boolean;
      checkInAt?: string;
      checkOutAt?: string;
      checkInStatus?: string;
      xpAwarded?: number;
    }>(`/attendance/status/${encodeURIComponent(participantId)}${q}`);
  },

  async getOrmawaBooths(category?: string) {
    const query = category ? '?category=' + encodeURIComponent(category) : '';
    return this.request('/ormawa/booths' + query);
  },

  async scanOrmawa(qrToken: string, participantId?: string) {
    // Backend accepts both qrToken and qrCode — sending qrToken per spec
    return this.request('/ormawa/scan', {
      method: 'POST',
      body: JSON.stringify({ qrToken, participantId }),
    });
  },

  async getMyOrmawaBadges(participantId: string) {
    return this.request('/ormawa/my-badges/' + encodeURIComponent(participantId));
  },

  async submitOrmawaInterest(payload: { boothId: string; phoneNumber: string; motivation?: string; experience?: string }) {
    return this.request('/ormawa/interest', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getMyOrmawaInterests(participantId: string) {
    return this.request('/ormawa/my-interests/' + encodeURIComponent(participantId));
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

  async getMyTeamSessions() {
    return this.request<GameSession[]>('/game-sessions/my-team');
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

  // User Profile & Score Sync
  async getUserProfile(idOrNim: string) {
    return this.request<{
      id: string;
      username: string;
      fullName: string;
      role: string;
      totalScore: number;
      teamId?: string;
      teamName?: string;
      teamCode?: string;
      buddyName?: string;
      buddy?: any;
      scoreHistory?: any[];
      attendances?: any[];
    }>(`/users/${encodeURIComponent(idOrNim)}`);
  },

  // Submit Game Score
  async submitScore(payload: {
    participantId: string;
    teamId: string;
    amount: number;
    sourceType: string;
    reason?: string;
  }) {
    return this.request<{
      transactionId?: string;
      totalXp?: number;
      amount?: number;
    }>('/scores/award', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // AI Drawing & Vision Art Curator
  async getAiDrawingPrompt() {
    return this.request<{ sentence: string }>('/game-sessions/ai-drawing/prompt');
  },

  async evaluateAiDrawing(payload: {
    promptSentence: string;
    imageBase64: string;
    teamId?: string;
    gameSessionId?: string;
  }) {
    return this.request<{
      evaluation: {
        score: number;
        feedback: string;
        titles: string[];
      };
      newTitles: string[];
      unlockedTitles: string[];
    }>('/game-sessions/ai-drawing/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Health check
  async checkHealth() {
    try {
      const res = await fetch(API_BASE + '/health');
      return await res.json();
    } catch {
      return null;
    }
  },
};
