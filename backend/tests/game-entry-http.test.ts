import { describe, expect, it } from 'bun:test';
import { signToken } from '../src/lib/jwt';

// Read-only checks against a running, seeded local backend.
// RUN_GAME_ENTRY_INTEGRATION=true bun test tests/game-entry-http.test.ts
describe.skipIf(process.env.RUN_GAME_ENTRY_INTEGRATION !== 'true')('game entry HTTP regressions', () => {
  const base = process.env.API_BASE_URL || 'http://127.0.0.1:3001/api';
  it('resolves Main legacy links to the same missions as Peta UUID links', async () => {
    const token = await signToken({ userId: '00000000-0000-0000-0000-000000000000', username: 'game-entry-test', role: 'PARTICIPANT' });
    const headers = { Authorization: `Bearer ${token}` };
    const listing = await fetch(base + '/me/missions/available', { headers });
    expect(listing.status).toBe(200);
    const { data: missions } = await listing.json() as any;
    const mapped = missions.filter((mission: any) => /^POS-L\d+-[AB]$/.test(mission.locationCode));
    expect(mapped.length).toBeGreaterThan(0);
    for (const mission of mapped) {
      const [, floor, spot] = /^POS-L(\d+)-([AB])$/.exec(mission.locationCode)!;
      for (const id of [mission.id, `booth-${floor}${spot.toLowerCase()}`]) {
        const response = await fetch(`${base}/missions/${id}/play`, { headers });
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(body.data.id).toBe(mission.id);
      }
    }
    const missing = await fetch(base + '/missions/not-a-mission/play', { headers });
    expect(missing.status).toBe(404);
    expect((await missing.json() as any).error.code).toBe('MISSION_NOT_FOUND');
  });
  it('rejects invalid sessions as JSON 401 instead of crashing during creation', async () => {
    for (const endpoint of ['/me/missions/available', '/game-sessions/create']) {
      const response = await fetch(base + endpoint, {
        method: endpoint.endsWith('/create') ? 'POST' : 'GET',
        headers: { Authorization: 'Bearer expired-or-invalid', 'Content-Type': 'application/json' },
        ...(endpoint.endsWith('/create') ? { body: JSON.stringify({ missionId: crypto.randomUUID(), teamId: crypto.randomUUID() }) } : {}),
      });
      expect(response.status).toBe(401);
      expect((await response.json() as any).error.code).toBe('UNAUTHORIZED');
    }
  });
});
