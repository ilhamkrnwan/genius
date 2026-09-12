import { describe, expect, it } from 'bun:test';
import { Elysia } from 'elysia';
import { requireUser, requireBuddyOrAdmin } from '../src/middleware/auth';
import { signToken } from '../src/lib/jwt';

describe('mounted authentication guards', () => {
  const routes = new Elysia().use(requireUser)
    .get('/protected', ({ user }) => ({ userId: user?.userId }))
    .use(requireBuddyOrAdmin)
    .post('/admin-action', () => ({ success: true }));
  const app = new Elysia().use(routes).get('/public', () => 'public');

  it('rejects missing and invalid tokens before protected handlers run', async () => {
    for (const token of ['', 'invalid']) {
      const response = await app.handle(new Request('http://localhost/protected', { headers: { Authorization: `Bearer ${token}` } }));
      expect(response.status).toBe(401);
      expect((await response.json()).error.code).toBe('UNAUTHORIZED');
    }
  });
  it('lets participants read earlier routes but forbids later buddy operations', async () => {
    const token = await signToken({ userId: 'test', username: 'test', role: 'PARTICIPANT' });
    const headers = { Authorization: `Bearer ${token}` };
    expect((await app.handle(new Request('http://localhost/protected', { headers }))).status).toBe(200);
    expect((await app.handle(new Request('http://localhost/admin-action', { method: 'POST', headers }))).status).toBe(403);
  });
  it('does not require authentication on unrelated public routes', async () => {
    expect((await app.handle(new Request('http://localhost/public'))).status).toBe(200);
  });
});
