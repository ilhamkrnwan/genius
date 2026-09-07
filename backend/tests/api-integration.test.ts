import { describe, expect, it } from "bun:test";
import { db } from "../src/db";
import { eq } from "drizzle-orm";
import { gameSessions, locations } from "../src/db/schema";

const enabled = process.env.RUN_API_INTEGRATION === "true";
const baseUrl = process.env.API_BASE_URL || "http://localhost:3001/api";
const participantUsername = process.env.INTEGRATION_PARTICIPANT_USERNAME;
const participantPassword = process.env.INTEGRATION_PARTICIPANT_PASSWORD;
const adminUsername = process.env.INTEGRATION_ADMIN_USERNAME;
const adminPassword = process.env.INTEGRATION_ADMIN_PASSWORD;

type ApiResponse<T = any> = { success: boolean; data?: T; error?: { code: string; message: string }; message?: string };

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<{ status: number; body: ApiResponse<T> }> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", "Bearer " + token);
  const response = await fetch(baseUrl + path, { ...options, headers });
  return { status: response.status, body: await response.json() as ApiResponse<T> };
}

describe("Live game API integration", () => {
  if (!enabled) return;

  it("runs the participant session lifecycle and preserves idempotency", async () => {
    if (!participantUsername || !participantPassword || !adminUsername || !adminPassword) {
      throw new Error("Set integration participant and admin credentials");
    }

    const login = await request<{ token: string; user: { teamId?: string } }>("/auth/login", {
      method: "POST", body: JSON.stringify({ username: participantUsername, password: participantPassword }),
    });
    expect(login.status).toBe(200);
    expect(login.body.success).toBe(true);
    const token = login.body.data!.token;
    const teamId = login.body.data!.user.teamId;
    expect(teamId).toBeTruthy();

    const adminLogin = await request<{ token: string }>("/auth/login", {
      method: "POST", body: JSON.stringify({ username: adminUsername, password: adminPassword }),
    });
    expect(adminLogin.status).toBe(200);
    const adminToken = adminLogin.body.data!.token;

    const wrongTeamCreate = await request<any>("/game-sessions/create", {
      method: "POST",
      body: JSON.stringify({ missionId: "00000000-0000-0000-0000-000000000000", teamId: "00000000-0000-0000-0000-000000000001" }),
    }, token);
    expect(wrongTeamCreate.status).toBe(403);
    expect(wrongTeamCreate.body.error?.code).toBe("FORBIDDEN");

    const missions = await request<Array<{ id: string; status: string; game?: { type: string } }>>("/me/missions/available", {}, token);
    expect(missions.status).toBe(200);
    const candidates = (missions.body.data || []).filter((mission) => mission.status === "ACTIVE" && mission.game);
    expect(candidates.length).toBeGreaterThan(0);

    let created: ApiResponse<any> | null = null;
    for (const mission of candidates) {
      const attempt = await request<any>("/game-sessions/create", {
        method: "POST", body: JSON.stringify({ missionId: mission.id, teamId, allowReplay: true }),
      }, adminToken);
      if (attempt.status === 200) { created = attempt.body; break; }
      expect([409, 423]).toContain(attempt.status);
    }
    expect(created?.success).toBe(true);
    const session = created!.data;
    const sessionId = session.id;
    const questions = session.metadata?.gamePayload?.questions || [];
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0].correctAnswer).toBeUndefined();

    const start = await request<any>("/game-sessions/" + sessionId + "/start", { method: "POST", body: "{}" }, token);
    expect(start.status).toBe(200);
    expect(start.body.data.status).toBe("ACTIVE");

    const answerPayload = { questionId: questions[0].id, answer: 0, elapsedMs: 1000, submissionId: "integration-" + sessionId };
    const answer = await request<any>("/game-sessions/" + sessionId + "/answer", { method: "POST", body: JSON.stringify(answerPayload) }, token);
    expect(answer.status).toBe(200);
    expect(answer.body.data.accepted).toBe(true);

    const duplicate = await request<any>("/game-sessions/" + sessionId + "/answer", { method: "POST", body: JSON.stringify(answerPayload) }, token);
    expect(duplicate.status).toBe(200);
    expect(duplicate.body.data.duplicate).toBe(true);

    const complete = await request<any>("/game-sessions/" + sessionId + "/complete", { method: "POST", body: JSON.stringify({ submissions: [] }) }, token);
    expect(complete.status).toBe(200);
    expect(complete.body.data.session.status).toBe("COMPLETED");

    const repeat = await request<any>("/game-sessions/" + sessionId + "/complete", { method: "POST", body: JSON.stringify({ submissions: [] }) }, token);
    expect(repeat.status).toBe(200);
    expect(repeat.body.message).toBe("Session was already completed.");

    let secondCreate: { status: number; body: ApiResponse<any> } | null = null;
    let secondMissionId: string | null = null;
    for (const mission of candidates.filter((candidate) => candidate.id !== session.missionId)) {
      const attempt = await request<any>("/game-sessions/create", {
        method: "POST", body: JSON.stringify({ missionId: mission.id, teamId, allowReplay: true }),
      }, adminToken);
      if (attempt.status === 200) {
        secondCreate = attempt;
        secondMissionId = mission.id;
        break;
      }
      expect([409, 423]).toContain(attempt.status);
    }
    if (secondCreate) {
      const secondSessionId = secondCreate.body.data.id;

      const duplicateSession = await request<any>("/game-sessions/create", {
        method: "POST", body: JSON.stringify({ missionId: secondMissionId, teamId }),
      }, token);
      expect(duplicateSession.status).toBe(409);
      expect(duplicateSession.body.error?.code).toBe("SESSION_ALREADY_ACTIVE");

      const secondStart = await request<any>("/game-sessions/" + secondSessionId + "/start", { method: "POST", body: "{}" }, token);
      expect(secondStart.status).toBe(200);
      const secondComplete = await request<any>("/game-sessions/" + secondSessionId + "/complete", { method: "POST", body: JSON.stringify({ submissions: [] }) }, token);
      expect(secondComplete.status).toBe(200);
      expect(secondComplete.body.data.session.status).toBe("COMPLETED");
    }

    let lifecycleCreate: { status: number; body: ApiResponse<any> } | null = null;
    for (const mission of candidates) {
      const attempt = await request<any>("/game-sessions/create", {
        method: "POST", body: JSON.stringify({ missionId: mission.id, teamId, allowReplay: true }),
      }, adminToken);
      if (attempt.status === 200) {
        lifecycleCreate = attempt;
        break;
      }
      expect([409, 423]).toContain(attempt.status);
    }
    if (lifecycleCreate) {
      const lifecycleSessionId = lifecycleCreate.body.data.id;
      const participantPause = await request<any>("/game-sessions/" + lifecycleSessionId + "/pause", { method: "POST", body: "{}" }, token);
      expect(participantPause.status).toBe(403);
      expect(participantPause.body.error?.code).toBe("FORBIDDEN");

      const lifecycleStart = await request<any>("/game-sessions/" + lifecycleSessionId + "/start", { method: "POST", body: "{}" }, token);
      expect(lifecycleStart.status).toBe(200);
      const originalStartAt = lifecycleStart.body.data.serverStartAt;

      const paused = await request<any>("/game-sessions/" + lifecycleSessionId + "/pause", { method: "POST", body: "{}" }, adminToken);
      expect(paused.status).toBe(200);
      expect(paused.body.data.status).toBe("PAUSED");
      expect(paused.body.data.metadata.pausedAt).toBeTruthy();

      const resumed = await request<any>("/game-sessions/" + lifecycleSessionId + "/start", { method: "POST", body: "{}" }, adminToken);
      expect(resumed.status).toBe(200);
      expect(resumed.body.data.status).toBe("ACTIVE");
      expect(resumed.body.data.serverStartAt).toBe(originalStartAt);
      expect(resumed.body.data.metadata.pausedDurationMs).toBeGreaterThanOrEqual(0);

      const cancelled = await request<any>("/game-sessions/" + lifecycleSessionId + "/cancel", { method: "POST", body: "{}" }, adminToken);
      expect(cancelled.status).toBe(200);
      expect(cancelled.body.data.status).toBe("CANCELLED");

      const cancelledDetail = await request<any>("/game-sessions/" + lifecycleSessionId, {}, token);
      expect(cancelledDetail.status).toBe(200);
      expect(cancelledDetail.body.data.status).toBe("CANCELLED");
    }

    let expiryCreate: { status: number; body: ApiResponse<any> } | null = null;
    for (const mission of candidates) {
      const attempt = await request<any>("/game-sessions/create", {
        method: "POST", body: JSON.stringify({ missionId: mission.id, teamId, allowReplay: true }),
      }, adminToken);
      if (attempt.status === 200) {
        expiryCreate = attempt;
        break;
      }
      expect([409, 423]).toContain(attempt.status);
    }
    if (expiryCreate) {
      const expirySessionId = expiryCreate.body.data.id;
      const expiryLocationId = expiryCreate.body.data.locationId;
      const expiryStart = await request<any>("/game-sessions/" + expirySessionId + "/start", { method: "POST", body: "{}" }, token);
      expect(expiryStart.status).toBe(200);

      await db.update(gameSessions)
        .set({ serverStartAt: new Date(Date.now() - 120_000), timeLimit: 1 })
        .where(eq(gameSessions.id, expirySessionId));

      const expiryQuestion = expiryCreate.body.data.metadata?.gamePayload?.questions?.[0];
      const expiredAnswer = await request<any>("/game-sessions/" + expirySessionId + "/answer", {
        method: "POST",
        body: JSON.stringify({ questionId: expiryQuestion?.id || "00000000-0000-0000-0000-000000000000", answer: 0, submissionId: "expiry-answer-" + expirySessionId }),
      }, token);
      expect(expiredAnswer.status).toBe(409);
      expect(expiredAnswer.body.error?.code).toBe("SESSION_EXPIRED");

      const expiredDetail = await request<any>("/game-sessions/" + expirySessionId, {}, token);
      expect(expiredDetail.status).toBe(200);
      expect(expiredDetail.body.data.status).toBe("EXPIRED");

      const [releasedLocation] = await db.select({ status: locations.status }).from(locations).where(eq(locations.id, expiryLocationId)).limit(1);
      expect(releasedLocation?.status).toBe("AVAILABLE");
    }
  }, 30_000);
});
