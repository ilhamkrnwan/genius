import { Elysia } from "elysia";
import { verifyToken, type TokenPayload } from "../lib/jwt";
import { db } from "../db";
import { teamMembers } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Parses JWT token from either 'Authorization: Bearer <token>' header or 'auth_token' cookie.
 */
export const authMiddleware = new Elysia({ name: "auth-middleware" })
  .derive({ as: "global" }, async ({ request, cookie }) => {
    let token: string | null = null;

    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    } else if (cookie && typeof cookie.auth_token?.value === "string") {
      token = cookie.auth_token.value;
    } else {
      // Fallback parse cookie from header string if cookie object is not present
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader.match(/auth_token=([^;]+)/);
        if (match) token = match[1];
      }
    }

    if (!token) {
      return { user: null as TokenPayload | null };
    }

    try {
      const payload = await verifyToken(token);
      let user = payload as TokenPayload | null;
      if (user && !user.teamId && user.role === "PARTICIPANT" && user.userId) {
        const [membership] = await db
          .select({ teamId: teamMembers.teamId })
          .from(teamMembers)
          .where(eq(teamMembers.userId, user.userId))
          .limit(1);
        if (membership?.teamId) {
          user = { ...user, teamId: membership.teamId };
        }
      }
      return { user };
    } catch {
      return { user: null as TokenPayload | null };
    }
  });

/**
 * Restricts access to authenticated users only.
 */
export const requireUser = new Elysia({ name: "require-user" })
  .use(authMiddleware)
  .onBeforeHandle({ as: "scoped" }, ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } };
    }
  });

/**
 * Restricts access to ADMIN role only.
 */
export const requireAdmin = new Elysia({ name: "require-admin" })
  .use(authMiddleware)
  .onBeforeHandle({ as: "scoped" }, ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } };
    }
    if (user.role !== "ADMIN") {
      set.status = 403;
      return { success: false, error: { code: "FORBIDDEN", message: "Admin permission required" } };
    }
  });

/**
 * Restricts access to BUDDY or ADMIN roles.
 */
export const requireBuddyOrAdmin = new Elysia({ name: "require-buddy-or-admin" })
  .use(authMiddleware)
  .onBeforeHandle({ as: "scoped" }, ({ user, set, request }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } };
    }
    // Participants may initialize and start their own game session. Ownership
    // is enforced by the individual route handlers as well.
    const isParticipantCreate =
      user.role === "PARTICIPANT" &&
      request.method === "POST" &&
      new URL(request.url).pathname.endsWith("/game-sessions/create");

    const isParticipantComplete =
      user.role === "PARTICIPANT" &&
      request.method === "POST" &&
      new URL(request.url).pathname.includes("/game-sessions/") && new URL(request.url).pathname.endsWith("/complete");

    if (user.role !== "ADMIN" && user.role !== "BUDDY" && !isParticipantCreate && !isParticipantComplete) {
      set.status = 403;
      return { success: false, error: { code: "FORBIDDEN", message: "Sesi permainan hanya dapat diaktifkan oleh Kakak Pendamping (Buddy) atau Admin." } };
    }
  });

/**
 * Validates that a Buddy can only perform actions on their assigned team (Admins bypass this restriction).
 */
export async function validateBuddyTeamScope(user: TokenPayload | null, targetTeamId: string): Promise<boolean> {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.role !== "BUDDY") return false;

  const [membership] = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.userId))
    .limit(1);

  return Boolean(membership && membership.teamId === targetTeamId);
}

/**
 * Validates that a Participant belongs to the given teamId.
 * Checks user.teamId first, and falls back to teamMembers table query for freshness.
 */
export async function validateParticipantTeamScope(user: TokenPayload | null, targetTeamId: string): Promise<boolean> {
  if (!user) return false;
  if (user.role === "ADMIN" || user.role === "BUDDY") return true;
  if (user.role !== "PARTICIPANT") return false;
  if (user.teamId && user.teamId === targetTeamId) return true;
  if (!user.userId) return false;

  const [membership] = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.userId))
    .limit(1);

  return Boolean(membership && membership.teamId === targetTeamId);
}

/**
 * Restricts access to ORMAWA_PIC or ADMIN roles.
 * Used for endpoints like POST /api/ormawa/scan-maba where PIC scans maba QR.
 */
export const requireOrmawaOrAdmin = new Elysia({ name: "require-ormawa-or-admin" })
  .use(authMiddleware)
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } };
    }
    if (user.role !== "ADMIN" && user.role !== "ORMAWA_PIC") {
      set.status = 403;
      return { success: false, error: { code: "FORBIDDEN", message: "Ormawa PIC or Admin permission required" } };
    }
  });
