import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { AnswerSubmission, GameSession, PlayableMission } from '@genius-unu/shared';
import { api } from '@/lib/api';

type SessionStatus = 'idle' | 'loading' | 'ready' | 'starting' | 'active' | 'paused' | 'completed' | 'expired' | 'error';

export const useGameSessionStore = defineStore('gameSession', () => {
  const availableMissions = ref<PlayableMission[]>([]);
  const selectedMission = ref<PlayableMission | null>(null);
  const session = ref<GameSession | null>(null);
  const mySessions = ref<GameSession[]>([]);
  const status = ref<SessionStatus>('idle');
  const error = ref<{ code?: string; message: string } | null>(null);
  const lastAnswer = ref<{ isCorrect?: boolean; scoreEarned?: number } | null>(null);
  const lastResult = ref<{ session: GameSession; evaluation: Record<string, unknown> } | null>(null);

  const isLoading = computed(() => status.value === 'loading' || status.value === 'starting');
  const isPlayable = computed(() => selectedMission.value?.status === 'ACTIVE');
  const serverStartAt = computed(() => session.value?.serverStartAt || null);
  const sessionStorageKey = 'genius_active_game_session';

  function persistSession(nextSession: GameSession | null) {
    if (typeof window === 'undefined') return;
    if (nextSession) localStorage.setItem(sessionStorageKey, nextSession.id);
    else localStorage.removeItem(sessionStorageKey);
  }

  function fail(response: { error?: { code: string; message: string } }, fallback: string) {
    error.value = response.error || { message: fallback };
    status.value = 'error';
  }

  async function loadAvailableMissions() {
    status.value = 'loading';
    error.value = null;
    const response = await api.getAvailableMissions();
    if (!response.success || !response.data) {
      fail(response, 'Misi aktif gagal dimuat.');
      return [];
    }
    availableMissions.value = response.data;
    status.value = 'ready';
    return response.data;
  }

  async function loadMissionForPlay(missionId: string) {
    status.value = 'loading';
    error.value = null;
    const response = await api.getMissionForPlay(missionId);
    if (!response.success || !response.data) {
      fail(response, 'Misi tidak dapat dimainkan.');
      return null;
    }
    selectedMission.value = response.data;
    status.value = response.data.status === 'ACTIVE' ? 'ready' : 'error';
    if (response.data.status !== 'ACTIVE') {
      error.value = { code: 'MISSION_LOCKED', message: response.data.lockedReason || 'Misi sedang terkunci.' };
    }
    return response.data;
  }

  async function createSession(missionId: string, teamId: string, allowReplay = false) {
    status.value = 'loading';
    error.value = null;
    const response = await api.createGameSession({ missionId, teamId, allowReplay });
    if (!response.success || !response.data) {
      const duplicateSessionId = (response as any).data?.sessionId;
      if (response.error?.code === 'SESSION_ALREADY_ACTIVE' && duplicateSessionId) {
        const existing = await api.getGameSession(duplicateSessionId);
        if (existing.success && existing.data && existing.data.missionId === missionId) {
          session.value = existing.data;
          persistSession(existing.data);
          status.value = existing.data.status === 'PAUSED' ? 'paused' : existing.data.status === 'ACTIVE' ? 'active' : 'ready';
          return existing.data;
        }
      }
      fail(response, 'Sesi permainan gagal dibuat.');
      return null;
    }
    session.value = response.data;
    persistSession(response.data);
    status.value = response.data.status === 'ACTIVE' ? 'active' : 'ready';
    return response.data;
  }

  async function startSession() {
    if (!session.value) {
      error.value = { code: 'NO_SESSION', message: 'Belum ada sesi permainan.' };
      status.value = 'error';
      return null;
    }
    status.value = 'starting';
    error.value = null;
    const response = await api.startGameSession(session.value.id);
    if (!response.success || !response.data) {
      fail(response, 'Sesi permainan gagal dimulai.');
      return null;
    }
    session.value = response.data;
    persistSession(response.data);
    status.value = 'active';
    return response.data;
  }

  async function refreshSession() {
    if (!session.value) return null;
    const response = await api.getGameSession(session.value.id);
    if (!response.success || !response.data) {
      fail(response, 'Status sesi gagal dimuat.');
      return null;
    }
    session.value = response.data;
    persistSession(response.data);
    status.value = response.data.status === 'COMPLETED' ? 'completed' : response.data.status === 'EXPIRED' ? 'expired' : response.data.status === 'CANCELLED' ? 'error' : response.data.status === 'PAUSED' ? 'paused' : response.data.status === 'ACTIVE' ? 'active' : 'ready';
    return response.data;
  }

  async function fetchMyTeamSessions() {
    status.value = 'loading';
    error.value = null;
    const response = await api.getMyTeamSessions();
    if (response.success && response.data) {
      mySessions.value = response.data;
      status.value = 'ready';
    } else {
      mySessions.value = [];
      error.value = { code: response.error?.code || 'FETCH_ERROR', message: response.error?.message || 'Gagal memuat sesi tim' };
      status.value = 'error';
    }
    return response.data || [];
  }

  async function submitAnswer(submission: AnswerSubmission) {
    if (!session.value) {
      error.value = { code: 'NO_SESSION', message: 'Belum ada sesi permainan.' };
      status.value = 'error';
      return null;
    }
    const response = await api.submitGameAnswer(session.value.id, submission);
    if (!response.success || !response.data) {
      fail(response, 'Jawaban gagal dikirim.');
      if (response.error?.code === 'SESSION_EXPIRED') {
        status.value = 'expired';
        persistSession(null);
      }
      return null;
    }
    lastAnswer.value = response.data;
    return response.data;
  }

  async function completeSession(submissions: Array<Record<string, unknown>> = []) {
    if (!session.value) {
      error.value = { code: 'NO_SESSION', message: 'Belum ada sesi permainan.' };
      status.value = 'error';
      return null;
    }
    const response = await api.completeGameSession(session.value.id, submissions);
    if (!response.success || !response.data) {
      fail(response, 'Sesi permainan gagal diselesaikan.');
      if (response.error?.code === 'SESSION_EXPIRED') {
        status.value = 'expired';
        persistSession(null);
      }
      return null;
    }
    session.value = response.data.session;
    persistSession(response.data.session.status === 'COMPLETED' ? null : response.data.session);
    lastResult.value = response.data;
    status.value = 'completed';
    return response.data;
  }

  async function restoreSession(missionId?: string) {
    if (typeof window === 'undefined') return null;
    const sessionId = localStorage.getItem(sessionStorageKey);
    if (!sessionId) return null;
    const response = await api.getGameSession(sessionId);
    if (!response.success || !response.data || (missionId && response.data.missionId !== missionId)) {
      localStorage.removeItem(sessionStorageKey);
      return null;
    }
    session.value = response.data;
    status.value = response.data.status === 'COMPLETED' ? 'completed' : response.data.status === 'EXPIRED' ? 'expired' : response.data.status === 'CANCELLED' ? 'error' : response.data.status === 'PAUSED' ? 'paused' : response.data.status === 'ACTIVE' ? 'active' : 'ready';
    if (response.data.status === 'COMPLETED' || response.data.status === 'EXPIRED' || response.data.status === 'CANCELLED') {
      persistSession(null);
    }
    return response.data;
  }

  async function restoreActiveSessionForMission(missionId: string) {
    const response = await api.getActiveGameSession();
    if (!response.success || !response.data || response.data.missionId !== missionId) return null;
    session.value = response.data;
    persistSession(response.data);
    status.value = response.data.status === 'PAUSED' ? 'paused' : response.data.status === 'ACTIVE' ? 'active' : 'ready';
    return response.data;
  }

  function clearSession() {
    selectedMission.value = null;
    session.value = null;
    persistSession(null);
    lastAnswer.value = null;
    lastResult.value = null;
    error.value = null;
    status.value = 'idle';
  }

  return {
    availableMissions,
    selectedMission,
    session,
    mySessions,
    status,
    error,
    lastAnswer,
    lastResult,
    isLoading,
    isPlayable,
    serverStartAt,
    loadAvailableMissions,
    loadMissionForPlay,
    createSession,
    startSession,
    refreshSession,
    fetchMyTeamSessions,
    submitAnswer,
    completeSession,
    restoreSession,
    restoreActiveSessionForMission,
    clearSession,
  };
});
