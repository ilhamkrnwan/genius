import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createPinia, setActivePinia } from 'pinia';

const createGameSession = mock();
const getGameSession = mock();
const getMissionForPlay = mock();
mock.module('../src/lib/api', () => ({ api: { createGameSession, getGameSession, getMissionForPlay } }));
const { useGameSessionStore } = await import('../src/store/gameSessionStore');
const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
} });

beforeEach(() => {
  setActivePinia(createPinia());
  storage.clear();
  createGameSession.mockReset();
  getGameSession.mockReset();
  getMissionForPlay.mockReset();
});

describe('game entry recovery', () => {
  it('opens a server-confirmed completed mission as practice', async () => {
    const practice = { id: 'practice', missionId: 'mission', status: 'ACTIVE', metadata: { isPractice: true } };
    createGameSession.mockResolvedValueOnce({ success: false, error: { code: 'NO_REPLAY_VIOLATION' } });
    createGameSession.mockResolvedValueOnce({ success: true, data: practice });
    const store = useGameSessionStore();
    expect(await store.createSession('mission', 'team')).toEqual(practice);
    expect(createGameSession.mock.calls).toEqual([
      [{ missionId: 'mission', teamId: 'team', allowReplay: false }],
      [{ missionId: 'mission', teamId: 'team', allowReplay: true }],
    ]);
    expect(store.status).toBe('active');
    expect(store.error).toBeNull();
  });

  it('keeps first-time sessions waiting for Buddy and does not retry other failures', async () => {
    createGameSession.mockResolvedValueOnce({ success: true, data: { id: 'new', status: 'READY' } });
    const store = useGameSessionStore();
    await store.createSession('mission', 'team');
    expect(store.status).toBe('ready');
    createGameSession.mockResolvedValueOnce({ success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } });
    expect(await store.createSession('other', 'team')).toBeNull();
    expect(createGameSession).toHaveBeenCalledTimes(2);
  });

  for (const status of ['COMPLETED', 'EXPIRED', 'CANCELLED']) {
    it(`does not restore a ${status} session as playable`, async () => {
      storage.set('genius_active_game_session', 'old');
      getGameSession.mockResolvedValue({ success: true, data: { id: 'old', missionId: 'mission', status } });
      const store = useGameSessionStore();
      expect(await store.restoreSession('mission')).toBeNull();
      expect(store.session).toBeNull();
      expect(storage.has('genius_active_game_session')).toBe(false);
    });
  }

  it('clears the previous booth session while loading another mission', async () => {
    const store = useGameSessionStore();
    store.session = { id: 'previous', status: 'ACTIVE' } as any;
    getMissionForPlay.mockResolvedValue({ success: true, data: { id: 'next', status: 'ACTIVE' } });
    await store.loadMissionForPlay('next');
    expect(store.session).toBeNull();
    expect(store.selectedMission?.id).toBe('next');
  });
});
