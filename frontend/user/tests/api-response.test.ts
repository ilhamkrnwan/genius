import { afterEach, describe, expect, it } from 'bun:test';
import { api } from '../src/lib/api';

const originalFetch = globalThis.fetch;
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [name, descriptor] of [['window', originalWindow], ['localStorage', originalStorage]] as const) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete (globalThis as any)[name];
  }
});

function setup(response: Response | Error) {
  const events: string[] = [];
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'test-token' } });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { dispatchEvent: (event: Event) => { events.push(event.type); } } });
  globalThis.fetch = (async () => {
    if (response instanceof Error) throw response;
    return response;
  }) as typeof fetch;
  return events;
}

describe('participant API failures', () => {
  it('requests reauthentication for rejected tokens', async () => {
    const events = setup(new Response('Unauthorized', { status: 401 }));
    expect((await api.getAvailableMissions()).error?.code).toBe('UNAUTHORIZED');
    expect(events).toEqual(['genius:auth-required']);
  });
  it('does not reopen the login dialog for wrong login credentials', async () => {
    const events = setup(Response.json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Password salah' } }, { status: 401 }));
    expect((await api.loginMaba('test', 'wrong')).error?.code).toBe('INVALID_CREDENTIALS');
    expect(events).toEqual([]);
  });
  it('distinguishes a plain-text server crash from a connection failure', async () => {
    setup(new Response('null is not an object', { status: 500 }));
    expect((await api.getAvailableMissions()).error?.code).toBe('HTTP_500');
    setup(new TypeError('Failed to fetch'));
    expect((await api.getAvailableMissions()).error?.code).toBe('NETWORK_ERROR');
  });
  it('rejects invalid successful responses and preserves structured session errors', async () => {
    setup(new Response('<html>Proxy error</html>'));
    expect((await api.getAvailableMissions()).error?.code).toBe('INVALID_RESPONSE');
    setup(Response.json({ success: false, error: { code: 'SESSION_ALREADY_ACTIVE', message: 'Existing session' }, data: { sessionId: 'existing' } }, { status: 409 }));
    const response = await api.createGameSession({ missionId: 'mission', teamId: 'team' });
    expect(response.error?.code).toBe('SESSION_ALREADY_ACTIVE');
    expect(response.data).toEqual({ sessionId: 'existing' } as any);
  });
});
