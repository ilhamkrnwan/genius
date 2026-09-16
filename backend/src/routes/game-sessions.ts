import { Elysia, t } from "elysia";
import { db } from "../db";
import { gameSessions, games, users, locations, missions, teams, teamMembers, scoreTransactions, floors, questions } from "../db/schema";
import { eq, and, sql, desc, inArray, asc, or, ilike } from "drizzle-orm";
import { authMiddleware, requireUser, requireBuddyOrAdmin, validateBuddyTeamScope, validateParticipantTeamScope } from "../middleware/auth";
import { GameEngine } from "../engine";
import { canCancelOrExpireSession, canCompleteSession, canPauseSession, canStartSession, hasSessionTimedOut } from "../lib/session-lifecycle";
import { AchievementEngine } from "../engine/achievements";
import { logAudit } from "../lib/audit";
import {
  broadcastGameSessionEvent,
  broadcastAdminEvent,
  broadcastLeaderboardUpdate,
} from "../realtime";
import {
  getRandomDrawingSentence,
  evaluateDrawingWithAI,
  saveAIDrawingResult,
} from "../engine/aiDrawing";

const isValidUUID = (val?: string): boolean =>
  typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export const gameSessionRoutes = new Elysia({
  prefix: "/api/game-sessions",
  detail: {
    tags: ["Game Sessions & Play Engine"],
  },
})
  .use(authMiddleware)
  .use(requireUser)

  // GET /api/game-sessions — List all game sessions for Admin & Monitoring
  .get("/", async ({ query }) => {
    const { status, limit = "50" } = query;
    let queryBuilder = db
      .select({
        id: gameSessions.id,
        gameId: gameSessions.gameId,
        gameName: games.name,
        gameType: games.type,
        missionId: gameSessions.missionId,
        missionName: missions.name,
        teamId: gameSessions.teamId,
        teamName: teams.name,
        locationId: gameSessions.locationId,
        locationName: locations.name,
        locationCode: locations.code,
        buddyId: gameSessions.buddyId,
        buddyName: users.fullName,
        status: gameSessions.status,
        serverStartAt: gameSessions.serverStartAt,
        serverEndAt: gameSessions.serverEndAt,
        timeLimit: gameSessions.timeLimit,
        totalScore: gameSessions.totalScore,
        createdAt: gameSessions.createdAt,
      })
      .from(gameSessions)
      .innerJoin(games, eq(gameSessions.gameId, games.id))
      .leftJoin(missions, eq(gameSessions.missionId, missions.id))
      .leftJoin(teams, eq(gameSessions.teamId, teams.id))
      .leftJoin(locations, eq(gameSessions.locationId, locations.id))
      .leftJoin(users, eq(gameSessions.buddyId, users.id))
      .orderBy(desc(gameSessions.createdAt))
      .limit(Number(limit));

    if (status) {
      const data = await queryBuilder.where(eq(gameSessions.status, status as any));
      return { success: true, data };
    }

    const data = await queryBuilder;
    return { success: true, data };
  })

  // GET /api/game-sessions/active — Get currently active session for current user's team
  .get("/active", async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } };
    }

    let teamId = user.teamId;
    if (!teamId) {
      const [membership] = await db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.userId, user.userId))
        .limit(1);
      teamId = membership?.teamId;
    }

    if (!teamId) {
      return { success: true, data: null, message: "User is not in any team" };
    }

    const [activeSession] = await db
      .select({
        id: gameSessions.id,
        gameId: gameSessions.gameId,
        gameName: games.name,
        gameType: games.type,
        gameConfig: games.config,
        missionId: gameSessions.missionId,
        missionName: missions.name,
        teamId: gameSessions.teamId,
        locationId: gameSessions.locationId,
        locationName: locations.name,
        locationCode: locations.code,
        status: gameSessions.status,
        serverStartAt: gameSessions.serverStartAt,
        timeLimit: gameSessions.timeLimit,
        metadata: gameSessions.metadata,
      })
      .from(gameSessions)
      .innerJoin(games, eq(gameSessions.gameId, games.id))
      .leftJoin(missions, eq(gameSessions.missionId, missions.id))
      .leftJoin(locations, eq(gameSessions.locationId, locations.id))
      .where(and(eq(gameSessions.teamId, teamId), inArray(gameSessions.status, ["READY", "ACTIVE", "PAUSED"])))
      .orderBy(desc(gameSessions.createdAt))
      .limit(1);

    return { success: true, data: activeSession || null };
  })

  // GET /api/game-sessions/my-team — Get all sessions assigned to the current user's team
  .get("/my-team", async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } };
    }

    let teamId = user.teamId;
    if (!teamId) {
      const [membership] = await db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.userId, user.userId))
        .limit(1);
      teamId = membership?.teamId;
    }

    if (!teamId) {
      return { success: true, data: [], message: "User is not in any team" };
    }

    const sessions = await db
      .select({
        id: gameSessions.id,
        gameId: gameSessions.gameId,
        gameName: games.name,
        gameType: games.type,
        gameConfig: games.config,
        missionId: gameSessions.missionId,
        missionName: missions.name,
        teamId: gameSessions.teamId,
        locationId: gameSessions.locationId,
        locationName: locations.name,
        locationCode: locations.code,
        floorNumber: floors.number,
        status: gameSessions.status,
        serverStartAt: gameSessions.serverStartAt,
        timeLimit: gameSessions.timeLimit,
        metadata: gameSessions.metadata,
        createdAt: gameSessions.createdAt,
      })
      .from(gameSessions)
      .innerJoin(games, eq(gameSessions.gameId, games.id))
      .leftJoin(missions, eq(gameSessions.missionId, missions.id))
      .leftJoin(locations, eq(gameSessions.locationId, locations.id))
      .leftJoin(floors, eq(locations.floorId, floors.id))
      .where(eq(gameSessions.teamId, teamId))
      .orderBy(asc(gameSessions.createdAt));

    return { success: true, data: sessions };
  })

  // GET /api/game-sessions/team/:teamId/active — Get currently active session by specific teamId
  .get("/team/:teamId/active", async ({ params, set }) => {
    const { teamId } = params;
    if (!isValidUUID(teamId)) {
      return { success: true, data: null };
    }
    const [activeSession] = await db
      .select({
        id: gameSessions.id,
        gameId: gameSessions.gameId,
        gameName: games.name,
        gameType: games.type,
        gameConfig: games.config,
        missionId: gameSessions.missionId,
        missionName: missions.name,
        teamId: gameSessions.teamId,
        locationId: gameSessions.locationId,
        locationName: locations.name,
        locationCode: locations.code,
        status: gameSessions.status,
        serverStartAt: gameSessions.serverStartAt,
        timeLimit: gameSessions.timeLimit,
        metadata: gameSessions.metadata,
      })
      .from(gameSessions)
      .innerJoin(games, eq(gameSessions.gameId, games.id))
      .leftJoin(missions, eq(gameSessions.missionId, missions.id))
      .leftJoin(locations, eq(gameSessions.locationId, locations.id))
      .where(and(eq(gameSessions.teamId, teamId), inArray(gameSessions.status, ["READY", "ACTIVE", "PAUSED"])))
      .orderBy(desc(gameSessions.createdAt))
      .limit(1);

    return { success: true, data: activeSession || null };
  })

  // GET /api/game-sessions/:id — Get session status and details
  .get("/:id", async ({ params, user, set }) => {
    if (!isValidUUID(params.id)) {
      set.status = 404;
      return { success: false, error: { code: "NOT_FOUND", message: "Game session not found" } };
    }

    const [session] = await db
      .select({
        id: gameSessions.id,
        gameId: gameSessions.gameId,
        gameName: games.name,
        gameType: games.type,
        gameConfig: games.config,
        instructions: games.instructions,
        missionId: gameSessions.missionId,
        missionName: missions.name,
        teamId: gameSessions.teamId,
        teamName: teams.name,
        locationId: gameSessions.locationId,
        locationName: locations.name,
        locationCode: locations.code,
        buddyId: gameSessions.buddyId,
        buddyName: users.fullName,
        status: gameSessions.status,
        serverStartAt: gameSessions.serverStartAt,
        serverEndAt: gameSessions.serverEndAt,
        timeLimit: gameSessions.timeLimit,
        participants: gameSessions.participants,
        result: gameSessions.result,
        totalScore: gameSessions.totalScore,
        metadata: gameSessions.metadata,
        createdAt: gameSessions.createdAt,
      })
      .from(gameSessions)
      .innerJoin(games, eq(gameSessions.gameId, games.id))
      .leftJoin(missions, eq(gameSessions.missionId, missions.id))
      .leftJoin(teams, eq(gameSessions.teamId, teams.id))
      .leftJoin(locations, eq(gameSessions.locationId, locations.id))
      .leftJoin(users, eq(gameSessions.buddyId, users.id))
      .where(eq(gameSessions.id, params.id))
      .limit(1);

    if (!session) {
      set.status = 404;
      return { success: false, error: { code: "NOT_FOUND", message: "Game session not found" } };
    }

    if (user?.role === "PARTICIPANT" && !(await validateParticipantTeamScope(user, session.teamId))) {
      set.status = 403;
      return { success: false, error: { code: "FORBIDDEN", message: "Session does not belong to your team" } };
    }
    if (user?.role === "BUDDY" && !(await validateBuddyTeamScope(user, session.teamId))) {
      set.status = 403;
      return { success: false, error: { code: "FORBIDDEN", message: "Buddy is not assigned to this team" } };
    }

    return { success: true, data: session };
  })

  // POST /api/game-sessions/:id/answer — Store one participant answer.
  .post(
    "/:id/answer",
    async ({ params, body, user, set }) => {
      if (!isValidUUID(params.id)) {
        set.status = 404;
        return { success: false, error: { code: "NOT_FOUND", message: "Session not found" } };
      }

      const [session] = await db
        .select()
        .from(gameSessions)
        .where(eq(gameSessions.id, params.id))
        .limit(1);

      if (!session) {
        set.status = 404;
        return { success: false, error: { code: "NOT_FOUND", message: "Session not found" } };
      }

      if (session.status !== "ACTIVE") {
        set.status = 409;
        return { success: false, error: { code: "SESSION_NOT_ACTIVE", message: "Session is not accepting answers" } };
      }

      const answerMetadata = (session.metadata && typeof session.metadata === "object" ? session.metadata : {}) as Record<string, any>;
      const pausedDurationMs = Number(answerMetadata.pausedDurationMs || 0);
      if (hasSessionTimedOut(session.serverStartAt, session.timeLimit, answerMetadata)) {
        const now = new Date();
        const [expired] = await db
          .update(gameSessions)
          .set({ status: "EXPIRED", serverEndAt: now, updatedAt: now })
          .where(and(eq(gameSessions.id, params.id), eq(gameSessions.status, "ACTIVE")))
          .returning();
        if (expired) {
          if (answerMetadata.isPractice !== true) await db.update(locations).set({ status: "AVAILABLE", updatedAt: now }).where(eq(locations.id, session.locationId));
          await logAudit({ actorId: user?.userId, actorRole: user?.role as any, action: "GAME_SESSION_EXPIRED", targetType: "GAME_SESSION", targetId: session.id, details: { reason: "SERVER_TIMER" } });
          broadcastGameSessionEvent(session.id, "SESSION_EXPIRED", expired);
        }
        set.status = 409;
        return { success: false, error: { code: "SESSION_EXPIRED", message: "Waktu permainan telah habis." } };
      }

      if (user?.role === "PARTICIPANT" && !(await validateParticipantTeamScope(user, session.teamId))) {
        set.status = 403;
        return { success: false, error: { code: "FORBIDDEN", message: "Session does not belong to your team" } };
      }

      const metadata = (session.metadata && typeof session.metadata === "object" ? session.metadata : {}) as Record<string, any>;
      const answerSubmissions = Array.isArray(metadata.answerSubmissions) ? [...metadata.answerSubmissions] : [];
      const payloadQuestions = Array.isArray(metadata.gamePayload?.questions) ? metadata.gamePayload.questions : [];
      const progressTotal = payloadQuestions.length;
      const participantId = user?.userId || "";
      const b = body as any;
      const submissionId = b.submissionId || participantId + ":" + b.questionId;

      const duplicate = answerSubmissions.find((item: any) => item.submissionId === submissionId);
      if (duplicate) {
        return {
          success: true,
          data: {
            accepted: true,
            isCorrect: duplicate.isCorrect,
            scoreEarned: duplicate.scoreEarned || 0,
            progress: { answered: answerSubmissions.length, total: progressTotal },
            duplicate: true,
          },
        };
      }

      const [question] = await db
        .select({ correctAnswer: questions.correctAnswer, options: questions.options, baseScore: questions.baseScore })
        .from(questions)
        .where(eq(questions.id, b.questionId))
        .limit(1);
      if (!question) {
        set.status = 422;
        return { success: false, error: { code: "INVALID_QUESTION", message: "Question is not available" } };
      }

      const selected = String(b.answer).trim().toLowerCase();
      const options = Array.isArray(question.options) ? question.options : [];
      const selectedOption = Number.isInteger(Number(b.answer)) ? options[Number(b.answer)] : undefined;
      const isCorrect = selected === String(question.correctAnswer).trim().toLowerCase()
        || String(selectedOption ?? "").trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
      const scoreEarned = isCorrect ? (question.baseScore || 10) : 0;

      answerSubmissions.push({
        submissionId,
        participantId,
        questionId: b.questionId,
        selected: b.answer,
        elapsedMs: b.elapsedMs || 0,
        isCorrect,
        scoreEarned,
        submittedAt: new Date().toISOString(),
      });

      await db
        .update(gameSessions)
        .set({
          metadata: { ...metadata, answerSubmissions },
          updatedAt: new Date(),
        })
        .where(eq(gameSessions.id, params.id));

      return {
        success: true,
        data: { accepted: true, isCorrect, scoreEarned, progress: { answered: answerSubmissions.length, total: progressTotal } },
      };
    },
    {
      body: t.Object({
        questionId: t.String({ minLength: 1 }),
        answer: t.Any(),
        elapsedMs: t.Optional(t.Number()),
        submissionId: t.Optional(t.String()),
      }),
    }
  )

  // Buddy / Admin actions
  .use(requireBuddyOrAdmin)

  // POST /api/game-sessions/create — Initialize game session with No Replay enforcement
  .post(
    "/create",
    async ({ body, user, set }) => {
      const { missionId, teamId, allowReplay } = body as any;

      if (user?.role === "PARTICIPANT" && user.teamId !== teamId) {
        set.status = 403;
        return { success: false, error: { code: "FORBIDDEN", message: "You can only create a session for your own team" } };
      }

      if (user?.role === "BUDDY" && !(await validateBuddyTeamScope(user, teamId))) {
        set.status = 403;
        return { success: false, error: { code: "FORBIDDEN", message: "Buddy is not assigned to this team" } };
      }

      let mission: any = null;
      if (isValidUUID(missionId)) {
        const [found] = await db
          .select({
            id: missions.id,
            name: missions.name,
            gameId: missions.gameId,
            locationId: missions.locationId,
            stageId: missions.stageId,
            timeLimit: missions.timeLimit,
          })
          .from(missions)
          .where(eq(missions.id, missionId))
          .limit(1);
        mission = found;
      } else {
        const [found] = await db
          .select({
            id: missions.id,
            name: missions.name,
            gameId: missions.gameId,
            locationId: missions.locationId,
            stageId: missions.stageId,
            timeLimit: missions.timeLimit,
          })
          .from(missions)
          .innerJoin(locations, eq(missions.locationId, locations.id))
          .where(or(
            ilike(locations.code, missionId),
            ilike(missions.name, `%${missionId}%`)
          ))
          .limit(1);
        mission = found;
      }

      if (!mission || !mission.gameId) {
        set.status = 400;
        return { success: false, error: { code: "INVALID_MISSION", message: "Mission has no associated game template" } };
      }

      const [game] = await db.select().from(games).where(eq(games.id, mission.gameId)).limit(1);
      if (!game) {
        set.status = 404;
        return { success: false, error: { code: "GAME_NOT_FOUND", message: "Game template not found" } };
      }

      const [existingActiveSession] = await db
        .select({ id: gameSessions.id, status: gameSessions.status })
        .from(gameSessions)
        .where(and(
          eq(gameSessions.missionId, mission.id),
          eq(gameSessions.teamId, teamId),
          inArray(gameSessions.status, ["READY", "ACTIVE", "PAUSED"]),
        ))
        .limit(1);
      if (existingActiveSession) {
        // If user is participant or buddy, return the existing active/ready/paused session
        if (["READY", "ACTIVE", "PAUSED"].includes(existingActiveSession.status)) {
          const [foundSession] = await db.select().from(gameSessions).where(eq(gameSessions.id, existingActiveSession.id)).limit(1);
          return {
            success: true,
            data: foundSession || existingActiveSession,
          };
        }
        set.status = 409;
        return {
          success: false,
          error: { code: "SESSION_ALREADY_ACTIVE", message: "Tim ini sudah memiliki sesi aktif untuk misi tersebut." },
          data: { sessionId: existingActiveSession.id },
        };
      }

      // Enforce No Replay Rule: Check if team has already completed this mission
      const [alreadyCompleted] = await db
        .select({ id: gameSessions.id })
        .from(gameSessions)
        .where(and(eq(gameSessions.missionId, missionId), eq(gameSessions.teamId, teamId), eq(gameSessions.status, "COMPLETED")))
        .limit(1);

      if (alreadyCompleted && !allowReplay && user?.role !== "ADMIN") {
        set.status = 409;
        return {
          success: false,
          error: {
            code: "NO_REPLAY_VIOLATION",
            message: "Tim Anda telah menyelesaikan misi di pos ini sebelumnya (Aturan No Replay).",
          },
        };
      }

      // Replays are practice only, even for admins: never issue a second reward.
      const isPractice = Boolean(alreadyCompleted);

      // Check Location Occupancy
      const [location] = await db.select().from(locations).where(eq(locations.id, mission.locationId)).limit(1);
      if (!isPractice && location && location.status === "LOCKED") {
        set.status = 423;
        return { success: false, error: { code: "LOCATION_LOCKED", message: "Location is currently locked by Game Master" } };
      }

      // Initialize game payload via Game Engine
      const gamePayload = await GameEngine.initializeGamePayload(
        game.type,
        (game.config as Record<string, any>) || {},
        game.questionBankCategory
      );

      // Fetch team participants
      const members = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          characterClass: users.characterClass,
          characterTier: users.characterTier,
        })
        .from(teamMembers)
        .innerJoin(users, eq(teamMembers.userId, users.id))
        .where(and(eq(teamMembers.teamId, teamId), eq(users.role, "PARTICIPANT")));

      // game_sessions.buddy_id is required for operational ownership. When a
      // participant starts a session, attribute it to the team's assigned
      // buddy instead of writing the participant ID into the buddy column.
      let sessionBuddyId = user!.userId;
      if (user?.role === "PARTICIPANT") {
        const [assignedBuddy] = await db
          .select({ id: users.id })
          .from(teamMembers)
          .innerJoin(users, eq(teamMembers.userId, users.id))
          .where(and(eq(teamMembers.teamId, teamId), eq(users.role, "BUDDY")))
          .limit(1);
        if (!assignedBuddy) {
          set.status = 409;
          return { success: false, error: { code: "BUDDY_NOT_ASSIGNED", message: "Team has no assigned buddy" } };
        }
        sessionBuddyId = assignedBuddy.id;
      }

      let session;
      try {
        [session] = await db
          .insert(gameSessions)
          .values({
            gameId: game.id,
            missionId: mission.id,
            teamId,
            locationId: mission.locationId,
            stageId: mission.stageId,
            buddyId: sessionBuddyId,
            status: isPractice ? "ACTIVE" : "READY",
            serverStartAt: isPractice ? new Date() : null,
            timeLimit: mission.timeLimit || 600,
            participants: members,
            metadata: { gamePayload, initialStep: 1, isPractice },
          })
          .returning();
      } catch (error: any) {
        if (error?.code === "23505" && (error?.constraint_name === "game_sessions_active_team_mission_unique" || error?.constraint === "game_sessions_active_team_mission_unique")) {
          set.status = 409;
          return {
            success: false,
            error: { code: "SESSION_ALREADY_ACTIVE", message: "Tim ini sudah memiliki sesi aktif untuk misi tersebut." },
          };
        }
        throw error;
      }

      // Update location status to OCCUPIED
      if (!isPractice) await db
        .update(locations)
        .set({ status: "OCCUPIED", updatedAt: new Date() })
        .where(eq(locations.id, mission.locationId));

      await logAudit({
        actorId: user!.userId,
        actorRole: user!.role as any,
        action: "GAME_SESSION_CREATED",
        targetType: "GAME_SESSION",
        targetId: session.id,
        details: { missionId, teamId, gameName: game.name },
      });

      broadcastGameSessionEvent(session.id, "SESSION_CREATED", session);
      broadcastAdminEvent("GAME_SESSION_CREATED", { sessionId: session.id, teamId, gameName: game.name });

      return { success: true, data: session };
    },
    {
      body: t.Object({
        missionId: t.String(),
        teamId: t.String(),
        allowReplay: t.Optional(t.Boolean()),
      }),
    }
  )

  // POST /api/game-sessions/:id/start — Start timer on server (Status: ACTIVE)
  .post(
    "/:id/start",
    async ({ params, body, user, set }) => {
      if (user?.role === "PARTICIPANT") {
        set.status = 403;
        return {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Sesi pos permainan hanya dapat diaktifkan oleh Kakak Pendamping (Buddy) atau Admin.",
          },
        };
      }

      if (!isValidUUID(params.id)) {
        set.status = 404;
        return { success: false, error: { code: "NOT_FOUND", message: "Session not found" } };
      }

      const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, params.id)).limit(1);
      if (!session) {
        set.status = 404;
        return { success: false, error: { code: "NOT_FOUND", message: "Session not found" } };
      }

      if (user?.role === "BUDDY" && !(await validateBuddyTeamScope(user, session.teamId))) {
        set.status = 403;
        return { success: false, error: { code: "FORBIDDEN", message: "Buddy is not assigned to this team" } };
      }
      const now = new Date();
      const sessionMetadata = (session.metadata && typeof session.metadata === "object" ? session.metadata : {}) as Record<string, any>;
      const pausedAt = sessionMetadata.pausedAt ? new Date(sessionMetadata.pausedAt).getTime() : null;
      const pausedDurationMs = Number(sessionMetadata.pausedDurationMs || 0) + (pausedAt ? Math.max(0, now.getTime() - pausedAt) : 0);

      // Configurable duration (e.g. 600s, 720s, 900s)
      const requestedDuration = (body as any)?.timeLimitSeconds ? Number((body as any).timeLimitSeconds) : undefined;
      const effectiveTimeLimit = requestedDuration && requestedDuration >= 60 && requestedDuration <= 3600
        ? requestedDuration
        : (session.timeLimit || 900);

      if (session.status === "ACTIVE") {
        if (requestedDuration && (session.timeLimit !== effectiveTimeLimit || !session.serverStartAt)) {
          const [updated] = await db
            .update(gameSessions)
            .set({
              timeLimit: effectiveTimeLimit,
              serverStartAt: now,
              metadata: { ...sessionMetadata, pausedAt: null, pausedDurationMs: 0 },
              updatedAt: now,
            })
            .where(eq(gameSessions.id, params.id))
            .returning();
          broadcastGameSessionEvent(updated.id, "SESSION_STARTED", updated);
          broadcastAdminEvent("GAME_SESSION_STARTED", {
            sessionId: updated.id,
            teamId: updated.teamId,
            timeLimit: effectiveTimeLimit,
          });
          return { success: true, message: `Durasi sesi pos diperbarui menjadi ${effectiveTimeLimit / 60} menit.`, data: updated };
        }
        return { success: true, message: "Sesi pos sudah aktif.", data: session };
      }

      if (!canStartSession(session.status)) {
        set.status = 409;
        return { success: false, error: { code: "INVALID_STATUS", message: "Only ready or paused sessions can start" } };
      }

      const [updated] = await db
        .update(gameSessions)
        .set({
          status: "ACTIVE",
          timeLimit: effectiveTimeLimit,
          serverStartAt: session.status === "PAUSED" ? (session.serverStartAt || now) : now,
          metadata: { ...sessionMetadata, pausedAt: null, pausedDurationMs },
          updatedAt: now,
        })
        .where(eq(gameSessions.id, params.id))
        .returning();

      broadcastGameSessionEvent(updated.id, "SESSION_STARTED", updated);
      broadcastAdminEvent("GAME_SESSION_STARTED", {
        sessionId: updated.id,
        teamId: updated.teamId,
        timeLimit: effectiveTimeLimit,
      });

      return { success: true, data: updated };
    },
    {
      body: t.Optional(
        t.Object({
          timeLimitSeconds: t.Optional(t.Number({ minimum: 60, maximum: 3600 })),
        })
      ),
    }
  )

  // POST /api/game-sessions/:id/pause — Pause session
  .post("/:id/pause", async ({ params, user, set }) => {
    if (user?.role === "PARTICIPANT") {
      set.status = 403;
      return { success: false, error: { code: "FORBIDDEN", message: "Participant cannot pause sessions" } };
    }
    if (!isValidUUID(params.id)) {
      set.status = 404;
      return { success: false, error: { code: "NOT_FOUND", message: "Session not found" } };
    }
    const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, params.id)).limit(1);
    if (!session) {
      set.status = 404;
      return { success: false, error: { code: "NOT_FOUND", message: "Session not found" } };
    }
    if (user?.role === "BUDDY" && !(await validateBuddyTeamScope(user, session.teamId))) {
      set.status = 403;
      return { success: false, error: { code: "FORBIDDEN", message: "Buddy is not assigned to this team" } };
    }
    if (!canPauseSession(session.status)) {
      set.status = 409;
      return { success: false, error: { code: "INVALID_STATUS", message: "Only active sessions can be paused" } };
    }
    const now = new Date();
    const sessionMetadata = (session.metadata && typeof session.metadata === "object" ? session.metadata : {}) as Record<string, any>;
    const [updated] = await db
      .update(gameSessions)
      .set({ status: "PAUSED", metadata: { ...sessionMetadata, pausedAt: now.toISOString() }, updatedAt: now })
      .where(and(eq(gameSessions.id, params.id), eq(gameSessions.status, "ACTIVE")))
      .returning();

    if (!updated) {
      set.status = 404;
      return { success: false, error: { code: "NOT_FOUND", message: "Session not found" } };
    }
    broadcastGameSessionEvent(updated.id, "SESSION_PAUSED", updated);
    return { success: true, data: updated };
  })

  // POST /api/game-sessions/:id/next-question — Advance question index
  .post("/:id/next-question", async ({ params, user, set }) => {
    if (user?.role === "PARTICIPANT") {
      set.status = 403;
      return { success: false, error: { code: "FORBIDDEN", message: "Participant cannot advance questions" } };
    }
    const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, params.id)).limit(1);
    if (!session) {
      set.status = 404;
      return { success: false, error: { code: "NOT_FOUND", message: "Session not found" } };
    }
    if (user?.role === "BUDDY" && !(await validateBuddyTeamScope(user, session.teamId))) {
      set.status = 403;
      return { success: false, error: { code: "FORBIDDEN", message: "Buddy is not assigned to this team" } };
    }
    if (session.status !== "ACTIVE") {
      set.status = 409;
      return { success: false, error: { code: "INVALID_STATUS", message: "Session must be ACTIVE to advance" } };
    }

    const metadata = (session.metadata && typeof session.metadata === "object" ? session.metadata : {}) as Record<string, any>;
    const currentIdx = typeof metadata.currentQuestionIndex === 'number' ? metadata.currentQuestionIndex : 0;
    
    const [updated] = await db
      .update(gameSessions)
      .set({
        metadata: { ...metadata, currentQuestionIndex: currentIdx + 1 },
        updatedAt: new Date(),
      })
      .where(eq(gameSessions.id, params.id))
      .returning();

    broadcastGameSessionEvent(updated.id, "NEXT_QUESTION", updated);
    return { success: true, data: updated };
  })

  // POST /api/game-sessions/:id/complete — Server-Authoritative Evaluation, Point Ledger, and Achievement Trigger
  .post(
    "/:id/complete",
    async ({ params, body, user, set }) => {
      if (!isValidUUID(params.id)) {
        set.status = 404;
        return { success: false, error: { code: "NOT_FOUND", message: "Session not found" } };
      }
      const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, params.id)).limit(1);
      if (!session) {
        set.status = 404;
        return { success: false, error: { code: "NOT_FOUND", message: "Session not found" } };
      }

      if (user?.role === "PARTICIPANT" && !(await validateParticipantTeamScope(user, session.teamId))) {
        set.status = 403;
        return { success: false, error: { code: "FORBIDDEN", message: "Session does not belong to your team" } };
      }
      if (user?.role === "BUDDY" && !(await validateBuddyTeamScope(user, session.teamId))) {
        set.status = 403;
        return { success: false, error: { code: "FORBIDDEN", message: "Buddy is not assigned to this team" } };
      }

      if (session.status === "COMPLETED") {
        return {
          success: true,
          data: { session, evaluation: session.result || {} },
          message: "Session was already completed.",
        };
      }
      if (!canCompleteSession(session.status)) {
        set.status = 409;
        return { success: false, error: { code: "INVALID_STATUS", message: "Session cannot be completed in its current state" } };
      }

      const [game] = await db.select().from(games).where(eq(games.id, session.gameId)).limit(1);
      if (!game) {
        set.status = 404;
        return { success: false, error: { code: "GAME_NOT_FOUND", message: "Game template not found" } };
      }

      const endAt = new Date();
      const startAt = session.serverStartAt || new Date(endAt.getTime() - 60000);
      const completionMetadata = (session.metadata && typeof session.metadata === "object" ? session.metadata : {}) as Record<string, any>;
      const pausedDurationMs = Number(completionMetadata.pausedDurationMs || 0);
      if (session.status === "ACTIVE" && hasSessionTimedOut(session.serverStartAt, session.timeLimit, completionMetadata, endAt.getTime())) {
        const [expired] = await db.update(gameSessions)
          .set({ status: "EXPIRED", serverEndAt: endAt, updatedAt: endAt })
          .where(and(eq(gameSessions.id, params.id), eq(gameSessions.status, "ACTIVE")))
          .returning();
        if (expired) {
          if (completionMetadata.isPractice !== true) await db.update(locations).set({ status: "AVAILABLE", updatedAt: endAt }).where(eq(locations.id, session.locationId));
          await logAudit({ actorId: user?.userId, actorRole: user?.role as any, action: "GAME_SESSION_EXPIRED", targetType: "GAME_SESSION", targetId: session.id, details: { reason: "SERVER_TIMER_ON_COMPLETE" } });
          broadcastGameSessionEvent(session.id, "SESSION_EXPIRED", expired);
          broadcastAdminEvent("GAME_SESSION_EXPIRED", { sessionId: session.id, teamId: session.teamId });
        }
        set.status = 409;
        return { success: false, error: { code: "SESSION_EXPIRED", message: "Waktu permainan telah habis." } };
      }

      const metadata = (session.metadata && typeof session.metadata === "object" ? session.metadata : {}) as Record<string, any>;
      const storedAnswers = Array.isArray(metadata.answerSubmissions) ? metadata.answerSubmissions : [];
      const b = body as any;
      const bodySubmissions = Array.isArray(b.submissions) && b.submissions.length > 0 ? b.submissions : [];
      const submittedAnswers = String(game.type) === "QUIZ" || String(game.type) === "TEAM_QUIZ"
        ? (user?.role === "PARTICIPANT"
          ? (storedAnswers.length > 0 ? storedAnswers : bodySubmissions)
          : (bodySubmissions.length > 0 ? bodySubmissions : storedAnswers))
        : (bodySubmissions.length > 0 ? bodySubmissions : storedAnswers);

      let participantIds = Array.from(new Set(submittedAnswers.map((item: any) => item.participantId).filter(Boolean)));
      if (participantIds.length === 0 && session.teamId) {
        const teamParticipants = await db
          .select({ userId: teamMembers.userId })
          .from(teamMembers)
          .innerJoin(users, eq(teamMembers.userId, users.id))
          .where(and(eq(teamMembers.teamId, session.teamId), eq(users.role, "PARTICIPANT")));
        if (teamParticipants.length > 0) {
          participantIds = teamParticipants.map((tp) => tp.userId);
        }
      }
      const effectiveParticipantIds = participantIds.length > 0 ? participantIds : (user?.userId ? [user.userId] : ["team-player"]);

      const engineSubmissions = String(game.type) === "QUIZ" || String(game.type) === "TEAM_QUIZ"
        ? effectiveParticipantIds.map((participantId) => ({
            participantId,
            action: "QUIZ_ANSWERS",
            score: typeof bodySubmissions[0]?.score === "number" ? bodySubmissions[0].score : undefined,
            answer: submittedAnswers
              .filter((item: any) => (item.participantId || user?.userId) === participantId)
              .map((item: any) => ({ questionId: item.questionId, selected: item.selected })),
          }))
        : (submittedAnswers.length > 0
            ? submittedAnswers.map((item: any) => ({
                ...item,
                participantId: item.participantId || (effectiveParticipantIds[0] || user?.userId || "team-player"),
              }))
            : effectiveParticipantIds.map((pid) => ({ participantId: pid, action: "COMPLETE", answer: b, score: b.score }))
          );

      // Evaluate via Game Engine
      const evalResult = await GameEngine.evaluateGameSession({
        gameType: game.type,
        gameConfig: (game.config as Record<string, any>) || {},
        submissions: engineSubmissions,
        serverStartAt: startAt,
        serverEndAt: endAt,
        timeLimitSec: session.timeLimit || 300,
      });

      // Update Game Session
      const [updatedSession] = await db
        .update(gameSessions)
        .set({
          status: "COMPLETED",
          serverEndAt: endAt,
          result: evalResult,
          totalScore: metadata.isPractice === true ? 0 : evalResult.totalTeamScore,
          updatedAt: endAt,
        })
        .where(eq(gameSessions.id, params.id))
        .returning();

      // Write Score Transactions to Point Ledger for each participant
      let scoresToAward = evalResult.participantScores || [];
      if (scoresToAward.length === 0 && evalResult.totalTeamScore > 0) {
        scoresToAward = effectiveParticipantIds.map((pid) => ({
          participantId: pid,
          finalScore: evalResult.totalTeamScore,
          baseScore: evalResult.totalTeamScore,
          speedBonus: 0,
          statBoostBonus: 0,
          penalty: 0,
          details: {},
        }));
      }

      if (metadata.isPractice !== true && scoresToAward.length > 0) {
        // Resolve valid user UUID for each participant to guarantee foreign key integrity
        const resolvedParticipantScores = await Promise.all(
          scoresToAward.map(async (ps) => {
            const rawPid = ps.participantId;
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawPid);
            if (isUuid) return { ...ps, participantId: rawPid };

            // Look up by username/NIM
            const [found] = await db
              .select({ id: users.id })
              .from(users)
              .where(eq(users.username, rawPid))
              .limit(1);
            if (found) return { ...ps, participantId: found.id };

            // Fall back to authenticated user ID
            if (user?.userId) return { ...ps, participantId: user.userId };

            // Fall back to first member of session's team
            if (session.teamId) {
              const [member] = await db
                .select({ userId: teamMembers.userId })
                .from(teamMembers)
                .where(eq(teamMembers.teamId, session.teamId))
                .limit(1);
              if (member) return { ...ps, participantId: member.userId };
            }

            // Fall back to any active participant
            const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
            return { ...ps, participantId: firstUser?.id || rawPid };
          })
        );

        const txInserts = resolvedParticipantScores.map((ps) => ({
          participantId: ps.participantId,
          teamId: session.teamId,
          amount: ps.finalScore,
          sourceType: "GAME" as any,
          sourceId: session.id,
          reason: `Penyelesaian Misi Game ${game.name}`,
          stageId: session.stageId,
          gameSessionId: session.id,
          createdBy: user?.userId || ps.participantId,
        }));
        try {
          await db.insert(scoreTransactions).values(txInserts);
        } catch (error: any) {
          if (error?.code === "23505" && (error?.constraint_name === "score_tx_game_session_participant_unique" || error?.constraint === "score_tx_game_session_participant_unique")) {
            const [completedSession] = await db
              .select()
              .from(gameSessions)
              .where(eq(gameSessions.id, session.id))
              .limit(1);
            return {
              success: true,
              data: { session: completedSession, evaluation: completedSession?.result || evalResult },
              message: "Session was already completed.",
            };
          }
          throw error;
        }

        // Trigger Achievement Engine for each participant
        for (const ps of evalResult.participantScores) {
          try {
            await AchievementEngine.evaluateAchievements({
              participantId: ps.participantId,
              gameSessionId: session.id,
              isPerfect: evalResult.isPerfect,
            });
          } catch (achErr) {
            console.error("[Achievement Error]:", achErr);
          }
        }
      }

      // Reset location status back to AVAILABLE
      if (metadata.isPractice !== true) await db
        .update(locations)
        .set({ status: "AVAILABLE", updatedAt: new Date() })
        .where(eq(locations.id, session.locationId));

      await logAudit({
        actorId: user?.userId,
        actorRole: user?.role as any,
        action: "GAME_SESSION_COMPLETED",
        targetType: "GAME_SESSION",
        targetId: session.id,
        details: { totalScore: evalResult.totalTeamScore, isPerfect: evalResult.isPerfect },
      });

      broadcastGameSessionEvent(updatedSession.id, "SESSION_COMPLETED", {
        session: updatedSession,
        evaluation: evalResult,
      });
      if (metadata.isPractice !== true) broadcastLeaderboardUpdate({ type: "SCORE_CHANGE", stageId: session.stageId });
      broadcastAdminEvent("GAME_SESSION_COMPLETED", {
        sessionId: session.id,
        teamId: session.teamId,
        totalScore: evalResult.totalTeamScore,
      });

      return {
        success: true,
        data: {
          session: updatedSession,
          evaluation: evalResult,
        },
      };
    },
    {
      body: t.Object({
        submissions: t.Array(
          t.Object({
            participantId: t.String(),
            action: t.String(),
            answer: t.Optional(t.Any()),
            timestampMs: t.Optional(t.Number()),
            statMultiplier: t.Optional(t.Number()),
          })
        ),
      }),
    }
  )

  // POST /api/game-sessions/:id/cancel — Cancel session and free location
  .post("/:id/cancel", async ({ params, user, set }) => {
    if (user?.role === "PARTICIPANT") {
      set.status = 403;
      return { success: false, error: { code: "FORBIDDEN", message: "Participant cannot cancel sessions" } };
    }
    const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, params.id)).limit(1);
    if (!session) {
      set.status = 404;
      return { success: false, error: { code: "NOT_FOUND", message: "Session not found" } };
    }

    if (user?.role === "BUDDY" && !(await validateBuddyTeamScope(user, session.teamId))) {
      set.status = 403;
      return { success: false, error: { code: "FORBIDDEN", message: "Buddy is not assigned to this team" } };
    }
    if (!canCancelOrExpireSession(session.status)) {
      set.status = 409;
      return { success: false, error: { code: "INVALID_STATUS", message: "Only pending sessions can be cancelled" } };
    }

    const [updated] = await db
      .update(gameSessions)
      .set({ status: "CANCELLED", updatedAt: new Date() })
      .where(and(eq(gameSessions.id, params.id), inArray(gameSessions.status, ["READY", "ACTIVE", "PAUSED"])))
      .returning();

    // Practice never occupies a location.
    if ((session.metadata as Record<string, unknown> | null)?.isPractice !== true) await db
      .update(locations)
      .set({ status: "AVAILABLE", updatedAt: new Date() })
      .where(eq(locations.id, session.locationId));

    await logAudit({
      actorId: user?.userId,
      actorRole: user?.role as any,
      action: "GAME_SESSION_CANCELLED",
      targetType: "GAME_SESSION",
      targetId: session.id,
    });

    broadcastGameSessionEvent(updated.id, "SESSION_CANCELLED", updated);
    broadcastAdminEvent("GAME_SESSION_CANCELLED", { sessionId: session.id, teamId: session.teamId });

    return { success: true, data: updated };
  })

  // POST /api/game-sessions/:id/expire — Admin operation for a timed-out session
  .post("/:id/expire", async ({ params, user, set }) => {
    if (user?.role === "PARTICIPANT") {
      set.status = 403;
      return { success: false, error: { code: "FORBIDDEN", message: "Participant cannot expire sessions" } };
    }
    const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, params.id)).limit(1);
    if (!session) {
      set.status = 404;
      return { success: false, error: { code: "NOT_FOUND", message: "Session not found" } };
    }

    if (user?.role === "BUDDY" && !(await validateBuddyTeamScope(user, session.teamId))) {
      set.status = 403;
      return { success: false, error: { code: "FORBIDDEN", message: "Buddy is not assigned to this team" } };
    }
    if (!canCancelOrExpireSession(session.status)) {
      set.status = 409;
      return { success: false, error: { code: "INVALID_STATUS", message: "Only pending sessions can expire" } };
    }

    const now = new Date();
    const [updated] = await db
      .update(gameSessions)
      .set({ status: "EXPIRED", serverEndAt: now, updatedAt: now })
      .where(eq(gameSessions.id, params.id))
      .returning();

    if ((session.metadata as Record<string, unknown> | null)?.isPractice !== true) await db
      .update(locations)
      .set({ status: "AVAILABLE", updatedAt: now })
      .where(eq(locations.id, session.locationId));

    await logAudit({
      actorId: user?.userId,
      actorRole: user?.role as any,
      action: "GAME_SESSION_EXPIRED",
      targetType: "GAME_SESSION",
      targetId: session.id,
      details: { previousStatus: session.status },
    });

    broadcastGameSessionEvent(updated.id, "SESSION_EXPIRED", updated);
    broadcastAdminEvent("GAME_SESSION_EXPIRED", { sessionId: updated.id, teamId: session.teamId });
    return { success: true, data: updated };
  })

  // GET /api/game-sessions/ai-drawing/prompt — Get a random drawing prompt sentence
  .get("/ai-drawing/prompt", async ({ user }) => {
    const participantIndex = Math.floor(Math.random() * 40);
    const sentence = getRandomDrawingSentence(participantIndex);
    return {
      success: true,
      data: { sentence }
    };
  })

  // POST /api/game-sessions/ai-drawing/evaluate — Evaluate canvas WebP drawing with AI Senior Curator
  .post("/ai-drawing/evaluate", async ({ body, user, set }) => {
    const { promptSentence, imageBase64, teamId, gameSessionId } = body as any;

    if (!promptSentence || !imageBase64) {
      set.status = 400;
      return { success: false, error: { code: "BAD_REQUEST", message: "promptSentence and imageBase64 are required" } };
    }

    const evaluation = await evaluateDrawingWithAI(promptSentence, imageBase64);
    
    // Save accumulation & award titles
    const saved = await saveAIDrawingResult({
      userId: user?.userId || "",
      teamId: teamId || user?.teamId || "00000000-0000-0000-0000-000000000000",
      gameSessionId,
      result: evaluation
    });

    broadcastLeaderboardUpdate({
      type: "GAME_SCORE",
      teamId: teamId || user?.teamId,
      amount: evaluation.score,
      reason: `AI Drawing: ${evaluation.feedback.slice(0, 50)}`
    });

    return {
      success: true,
      data: {
        evaluation,
        newTitles: saved.newTitles,
        unlockedTitles: saved.currentUnlockedTitles
      }
    };
  });
