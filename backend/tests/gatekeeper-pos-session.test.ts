import { describe, it, expect } from "bun:test";
import { app } from "../src/index";
import { signToken } from "../src/lib/jwt";
import { hasSessionTimedOut, pausedDurationMs } from "../src/lib/session-lifecycle";

describe("Gatekeeper Pos Game & Server-Authoritative Timer Verification", () => {
  it("strictly forbids PARTICIPANT from starting a game session (403 Forbidden)", async () => {
    // 1. Generate JWT token for a Participant (Maba)
    const participantToken = await signToken({
      userId: "maba-user-001",
      username: "maba_ahmad",
      role: "PARTICIPANT",
      teamId: "team-genius-01",
    });

    // 2. Participant attempts to start a game session
    const response = await app.handle(
      new Request("http://localhost:3001/api/game-sessions/dummy-session-id/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${participantToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timeLimitSeconds: 600 }),
      })
    );

    expect(response.status).toBe(403);
    const body: any = await response.json();
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe("FORBIDDEN");
    expect(body.error?.message).toContain("hanya dapat diaktifkan oleh Kakak Pendamping (Buddy) atau Admin");
  });

  it("allows BUDDY or ADMIN to pass the role guard on start session", async () => {
    // 1. Generate JWT token for a Buddy
    const buddyToken = await signToken({
      userId: "buddy-user-001",
      username: "kak_agnes",
      role: "BUDDY",
      teamId: "team-genius-01",
    });

    // 2. Buddy attempts to start a non-existent session (passes role check, fails at 404 NOT_FOUND instead of 403 FORBIDDEN)
    const response = await app.handle(
      new Request("http://localhost:3001/api/game-sessions/00000000-0000-0000-0000-000000000000/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${buddyToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timeLimitSeconds: 900 }),
      })
    );

    // Should NOT be 403 Forbidden
    expect(response.status).not.toBe(403);
    expect(response.status).toBe(404);
  });

  it("calculates server-authoritative timer accurately for 10, 12, and 15 minute presets", () => {
    const baseStartTime = new Date("2026-09-23T10:00:00.000Z");

    // Case A: 10 minutes (600s) preset
    const tenMinLimit = 600;
    // 9 minutes elapsed -> Not timed out
    const nineMinLater = new Date("2026-09-23T10:09:00.000Z").getTime();
    expect(hasSessionTimedOut(baseStartTime, tenMinLimit, {}, nineMinLater)).toBe(false);

    // 10m 1s elapsed -> Timed out on server!
    const tenMinOneSecLater = new Date("2026-09-23T10:10:01.000Z").getTime();
    expect(hasSessionTimedOut(baseStartTime, tenMinLimit, {}, tenMinOneSecLater)).toBe(true);

    // Case B: 12 minutes (720s) standard preset
    const twelveMinLimit = 720;
    const elevenMinLater = new Date("2026-09-23T10:11:00.000Z").getTime();
    expect(hasSessionTimedOut(baseStartTime, twelveMinLimit, {}, elevenMinLater)).toBe(false);

    const twelveMinFiveSecLater = new Date("2026-09-23T10:12:05.000Z").getTime();
    expect(hasSessionTimedOut(baseStartTime, twelveMinLimit, {}, twelveMinFiveSecLater)).toBe(true);

    // Case C: 15 minutes (900s) maximum preset
    const fifteenMinLimit = 900;
    const fourteenMinLater = new Date("2026-09-23T10:14:00.000Z").getTime();
    expect(hasSessionTimedOut(baseStartTime, fifteenMinLimit, {}, fourteenMinLater)).toBe(false);

    const fifteenMinTwoSecLater = new Date("2026-09-23T10:15:02.000Z").getTime();
    expect(hasSessionTimedOut(baseStartTime, fifteenMinLimit, {}, fifteenMinTwoSecLater)).toBe(true);
  });

  it("handles paused duration fairly without penalizing server timer", () => {
    const baseStartTime = new Date("2026-09-23T10:00:00.000Z");
    const fifteenMinLimit = 900; // 15 mins = 900s

    // Game was paused for 5 minutes (300,000 ms)
    const metadata = {
      pausedDurationMs: 300_000,
    };

    // 18 minutes wall clock later, but with 5 minutes pause = only 13 minutes active game time
    const eighteenMinLater = new Date("2026-09-23T10:18:00.000Z").getTime();
    // 18m (1080s) - 5m (300s) = 13m (780s) <= 15m (900s) -> Valid, NOT timed out!
    expect(hasSessionTimedOut(baseStartTime, fifteenMinLimit, metadata, eighteenMinLater)).toBe(false);

    // 21 minutes wall clock later, with 5 minutes pause = 16 minutes active game time (> 15m) -> Timed out!
    const twentyOneMinLater = new Date("2026-09-23T10:21:00.000Z").getTime();
    expect(hasSessionTimedOut(baseStartTime, fifteenMinLimit, metadata, twentyOneMinLater)).toBe(true);
  });

  it("allows querying team active session via GET /api/game-sessions/team/:teamId/active", async () => {
    const buddyToken = await signToken({
      userId: "buddy-user-001",
      username: "kak_agnes",
      role: "BUDDY",
      teamId: "team-genius-01",
    });

    const response = await app.handle(
      new Request("http://localhost:3001/api/game-sessions/team/team-genius-01/active", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${buddyToken}`,
        },
      })
    );

    expect(response.status).toBe(200);
    const body: any = await response.json();
    expect(body.success).toBe(true);
  });
});
