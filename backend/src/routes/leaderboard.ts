import { Elysia, t } from "elysia";
import { db } from "../db";
import { scoreTransactions, users, teams, teamMembers } from "../db/schema";
import { eq, sql, desc, and, lte } from "drizzle-orm";
import { authMiddleware, requireUser } from "../middleware/auth";
import { broadcastLeaderboardUpdate } from "../realtime";
import { logAudit } from "../lib/audit";
import { getSystemSettings } from "./system";

export const leaderboardRoutes = new Elysia({
  prefix: "/api/leaderboard",
  detail: {
    tags: ["Leaderboard & Ranking"],
  },
})
  .use(authMiddleware)

  // GET /api/leaderboard — Combined team & participant leaderboard + recent ledger
  .get("/", async ({ query, user }) => {
    const stageId = query.stageId || "";
    const teamLimit = Number(query.teamLimit) || Number(query.limit) || 50;
    const participantLimit = Number(query.participantLimit) || (query.limit && Number(query.limit) > 50 ? Number(query.limit) : 500);

    const settings = getSystemSettings();
    const isFrozenForUser = settings.isLeaderboardFrozen && settings.frozenAt && user?.role !== "ADMIN";
    const freezeCutoff = isFrozenForUser && settings.frozenAt ? new Date(settings.frozenAt) : null;

    const teamConditions = [eq(teams.id, scoreTransactions.teamId)];
    if (stageId) teamConditions.push(eq(scoreTransactions.stageId, stageId));
    if (freezeCutoff) teamConditions.push(lte(scoreTransactions.createdAt, freezeCutoff));
    const teamJoinCondition = and(...teamConditions);

    // 1. Team Leaderboard
    const topTeams = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        teamCode: teams.code,
        totalScore: sql<number>`COALESCE(SUM(${scoreTransactions.amount}), 0)`.as("total_score"),
        transactionCount: sql<number>`COUNT(${scoreTransactions.id})`.as("transaction_count"),
        stampsCollected: sql<number>`LEAST(9, COALESCE((
          SELECT COUNT(DISTINCT COALESCE(gs.mission_id, gs.location_id))
          FROM game_sessions gs
          WHERE gs.team_id = ${teams.id} AND gs.status = 'COMPLETED'
        ), 0))`.as("stamps_collected"),
      })
      .from(teams)
      .leftJoin(scoreTransactions, teamJoinCondition)
      .groupBy(teams.id, teams.name, teams.code)
      .orderBy(desc(sql`total_score`))
      .limit(teamLimit);

    // 2. Participant Leaderboard (Real database participants)
    const scoreConditions = [eq(users.id, scoreTransactions.participantId)];
    if (stageId) scoreConditions.push(eq(scoreTransactions.stageId, stageId));
    if (freezeCutoff) scoreConditions.push(lte(scoreTransactions.createdAt, freezeCutoff));
    const scoreJoinCondition = and(...scoreConditions);

    let participantQuery = db
      .select({
        participantId: users.id,
        participantName: users.fullName,
        username: users.username,
        gender: users.gender,
        faculty: users.faculty,
        prodi: users.prodi,
        avatarUrl: users.avatarUrl,
        characterClass: users.characterClass,
        characterTitle: users.characterTitle,
        characterTier: users.characterTier,
        teamId: teams.id,
        teamName: teams.name,
        totalScore: sql<number>`COALESCE(SUM(${scoreTransactions.amount}), 0)`.as("total_score"),
        transactionCount: sql<number>`COUNT(${scoreTransactions.id})`.as("transaction_count"),
        stampsCount: sql<number>`LEAST(9, COALESCE((
          SELECT COUNT(DISTINCT COALESCE(gs.mission_id, gs.location_id))
          FROM game_sessions gs
          WHERE gs.team_id = ${teams.id} AND gs.status = 'COMPLETED'
        ), 0))`.as("stamps_count"),
      })
      .from(users)
      .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .leftJoin(scoreTransactions, scoreJoinCondition)
      .where(eq(users.role, "PARTICIPANT"))
      .$dynamic();

    const topParticipants = await participantQuery
      .groupBy(
        users.id,
        users.fullName,
        users.username,
        users.gender,
        users.faculty,
        users.prodi,
        users.avatarUrl,
        users.characterClass,
        users.characterTitle,
        users.characterTier,
        teams.id,
        teams.name
      )
      .orderBy(desc(sql`total_score`), users.username)
      .limit(participantLimit);

    // 3. Recent Transactions
    let recentTxQuery = db
      .select({
        id: scoreTransactions.id,
        teamId: scoreTransactions.teamId,
        teamName: teams.name,
        participantId: scoreTransactions.participantId,
        participantName: users.fullName,
        type: scoreTransactions.sourceType,
        amount: scoreTransactions.amount,
        description: scoreTransactions.reason,
        createdAt: scoreTransactions.createdAt,
      })
      .from(scoreTransactions)
      .leftJoin(teams, eq(scoreTransactions.teamId, teams.id))
      .leftJoin(users, eq(scoreTransactions.participantId, users.id))
      .$dynamic();

    if (freezeCutoff) {
      recentTxQuery = recentTxQuery.where(lte(scoreTransactions.createdAt, freezeCutoff));
    }

    const recentTransactions = await recentTxQuery
      .orderBy(desc(scoreTransactions.createdAt))
      .limit(15);

    return {
      success: true,
      data: {
        teamLeaderboard: topTeams.map((t, index) => ({
          rank: index + 1,
          teamId: t.teamId,
          teamName: t.teamName,
          teamCode: t.teamCode,
          totalScore: Number(t.totalScore),
          transactionCount: Number(t.transactionCount),
          stampsCollected: Math.min(Number((t as any).stampsCollected || 0), 9),
        })),
        participantLeaderboard: topParticipants.map((p, index) => ({
          rank: index + 1,
          participantId: p.participantId,
          participantName: p.participantName,
          username: p.username,
          gender: p.gender,
          faculty: p.faculty || "UNU Yogyakarta",
          prodi: p.prodi || p.characterClass || "Mahasiswa Baru",
          avatarUrl: p.avatarUrl || (p.gender === "FEMALE" ? "/character-cewek-avatar.png" : "/character-cowok-avatar.png"),
          characterClass: p.characterClass,
          characterTitle: p.characterTitle,
          characterTier: p.characterTier,
          teamId: p.teamId,
          teamName: p.teamName,
          totalScore: Number(p.totalScore),
          transactionCount: Number(p.transactionCount),
          stampsCount: Math.min(Number((p as any).stampsCount || 0), 9),
        })),
        recentTransactions: recentTransactions.map((tx) => ({
          ...tx,
          balanceAfter: tx.amount,
        })),
      },
      meta: {
        isFrozen: getSystemSettings().isLeaderboardFrozen,
        frozenAt: getSystemSettings().frozenAt,
        freezeMessage: getSystemSettings().freezeMessage,
      },
    };
  })

  // GET /api/leaderboard/individual — Top participants ranking
  .get("/individual", async ({ query, user }) => {
    const stageId = query.stageId || "";
    const limit = Number(query.limit) || 500;

    const settings = getSystemSettings();
    const isFrozenForUser = settings.isLeaderboardFrozen && settings.frozenAt && user?.role !== "ADMIN";
    const freezeCutoff = isFrozenForUser && settings.frozenAt ? new Date(settings.frozenAt) : null;

    const scoreConditions = [eq(users.id, scoreTransactions.participantId)];
    if (stageId) scoreConditions.push(eq(scoreTransactions.stageId, stageId));
    if (freezeCutoff) scoreConditions.push(lte(scoreTransactions.createdAt, freezeCutoff));
    const scoreJoinCondition = and(...scoreConditions);

    let participantQuery = db
      .select({
        participantId: users.id,
        participantName: users.fullName,
        username: users.username,
        gender: users.gender,
        faculty: users.faculty,
        prodi: users.prodi,
        avatarUrl: users.avatarUrl,
        characterClass: users.characterClass,
        characterTitle: users.characterTitle,
        characterTier: users.characterTier,
        teamId: teams.id,
        teamName: teams.name,
        totalScore: sql<number>`COALESCE(SUM(${scoreTransactions.amount}), 0)`.as("total_score"),
        transactionCount: sql<number>`COUNT(${scoreTransactions.id})`.as("transaction_count"),
        stampsCount: sql<number>`LEAST(9, COALESCE((
          SELECT COUNT(DISTINCT COALESCE(gs.mission_id, gs.location_id))
          FROM game_sessions gs
          WHERE gs.team_id = ${teams.id} AND gs.status = 'COMPLETED'
        ), 0))`.as("stamps_count"),
      })
      .from(users)
      .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .leftJoin(scoreTransactions, scoreJoinCondition)
      .where(eq(users.role, "PARTICIPANT"))
      .$dynamic();

    const topParticipants = await participantQuery
      .groupBy(
        users.id,
        users.fullName,
        users.username,
        users.gender,
        users.faculty,
        users.prodi,
        users.avatarUrl,
        users.characterClass,
        users.characterTitle,
        users.characterTier,
        teams.id,
        teams.name
      )
      .orderBy(desc(sql`total_score`), users.username)
      .limit(limit);

    // If current user is a participant, get their specific position
    let myPosition = null;
    if (user?.userId) {
      let myRankQuery = db
        .select({
          participantId: scoreTransactions.participantId,
          totalScore: sql<number>`COALESCE(SUM(${scoreTransactions.amount}), 0)`.as("total_score"),
        })
        .from(scoreTransactions)
        .$dynamic();

      if (stageId) {
        myRankQuery = myRankQuery.where(eq(scoreTransactions.stageId, stageId));
      }
      if (freezeCutoff) {
        myRankQuery = myRankQuery.where(lte(scoreTransactions.createdAt, freezeCutoff));
      }

      const allRanked = await myRankQuery
        .groupBy(scoreTransactions.participantId)
        .orderBy(desc(sql`total_score`));

      const rankIndex = allRanked.findIndex((p) => p.participantId === user.userId);
      if (rankIndex !== -1) {
        myPosition = {
          rank: rankIndex + 1,
          totalScore: Number(allRanked[rankIndex].totalScore),
        };
      }
    }

    return {
      success: true,
      data: {
        leaderboard: topParticipants.map((p, index) => ({
          rank: index + 1,
          participantId: p.participantId,
          participantName: p.participantName,
          username: p.username,
          gender: p.gender,
          faculty: p.faculty || "UNU Yogyakarta",
          prodi: p.prodi || p.characterClass || "Mahasiswa Baru",
          avatarUrl: p.avatarUrl || (p.gender === "FEMALE" ? "/character-cewek-avatar.png" : "/character-cowok-avatar.png"),
          characterClass: p.characterClass,
          characterTitle: p.characterTitle,
          characterTier: p.characterTier,
          teamId: p.teamId,
          teamName: p.teamName,
          totalScore: Number(p.totalScore),
          transactionCount: Number(p.transactionCount),
          stampsCount: Math.min(Number((p as any).stampsCount || 0), 9),
        })),
        myPosition,
      },
      meta: {
        isFrozen: settings.isLeaderboardFrozen,
        frozenAt: settings.frozenAt,
        freezeMessage: settings.freezeMessage,
      },
    };
  })

  // GET /api/leaderboard/team — Top teams ranking
  .get("/team", async ({ query, user }) => {
    const stageId = query.stageId || "";
    const limit = Number(query.limit) || 10;

    const settings = getSystemSettings();
    const isFrozenForUser = settings.isLeaderboardFrozen && settings.frozenAt && user?.role !== "ADMIN";
    const freezeCutoff = isFrozenForUser && settings.frozenAt ? new Date(settings.frozenAt) : null;

    const teamConditions = [eq(teams.id, scoreTransactions.teamId)];
    if (stageId) teamConditions.push(eq(scoreTransactions.stageId, stageId));
    if (freezeCutoff) teamConditions.push(lte(scoreTransactions.createdAt, freezeCutoff));
    const teamJoinCondition = and(...teamConditions);

    // Team rankings query
    const topTeams = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        teamCode: teams.code,
        totalScore: sql<number>`COALESCE(SUM(${scoreTransactions.amount}), 0)`.as("total_score"),
        transactionCount: sql<number>`COUNT(${scoreTransactions.id})`.as("transaction_count"),
        stampsCollected: sql<number>`LEAST(9, COALESCE((
          SELECT COUNT(DISTINCT COALESCE(gs.mission_id, gs.location_id))
          FROM game_sessions gs
          WHERE gs.team_id = ${teams.id} AND gs.status = 'COMPLETED'
        ), 0))`.as("stamps_collected"),
      })
      .from(teams)
      .leftJoin(scoreTransactions, teamJoinCondition)
      .groupBy(teams.id, teams.name, teams.code)
      .orderBy(desc(sql`total_score`))
      .limit(limit);

    // Get my team rank if user is in a team
    let myTeamPosition = null;
    if (user?.userId) {
      const [membership] = await db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.userId, user.userId))
        .limit(1);

      if (membership?.teamId) {
        const allTeamsRanked = await db
          .select({
            teamId: teams.id,
            totalScore: sql<number>`COALESCE(SUM(${scoreTransactions.amount}), 0)`.as("total_score"),
          })
          .from(teams)
          .leftJoin(scoreTransactions, teamJoinCondition)
          .groupBy(teams.id)
          .orderBy(desc(sql`total_score`));

        const teamIndex = allTeamsRanked.findIndex((t) => t.teamId === membership.teamId);
        if (teamIndex !== -1) {
          myTeamPosition = {
            teamId: membership.teamId,
            rank: teamIndex + 1,
            totalScore: Number(allTeamsRanked[teamIndex].totalScore),
          };
        }
      }
    }

    return {
      success: true,
      data: {
        leaderboard: topTeams.map((t, index) => ({
          rank: index + 1,
          teamId: t.teamId,
          teamName: t.teamName,
          teamCode: t.teamCode,
          totalScore: Number(t.totalScore),
          transactionCount: Number(t.transactionCount),
          stampsCollected: Math.min(Number((t as any).stampsCollected || 0), 9),
        })),
        myTeamPosition,
      },
      meta: {
        isFrozen: settings.isLeaderboardFrozen,
        frozenAt: settings.frozenAt,
        freezeMessage: settings.freezeMessage,
      },
    };
  })

  // POST /api/leaderboard/adjust — Admin score adjustment / correction
  .post(
    "/adjust",
    async ({ body, user, set }) => {
      if (user?.role !== "ADMIN") {
        set.status = 403;
        return { success: false, error: { message: "Hanya role ADMIN yang berhak melakukan penyesuaian skor" } };
      }

      const { teamId, amount, reason, participantId } = body as {
        teamId: string;
        amount: number;
        reason: string;
        participantId?: string;
      };

      // Find any participant in this team if participantId is not supplied
      let targetParticipantId = participantId;
      if (!targetParticipantId) {
        const [firstMember] = await db
          .select({ userId: teamMembers.userId })
          .from(teamMembers)
          .where(eq(teamMembers.teamId, teamId))
          .limit(1);
        targetParticipantId = firstMember?.userId || user.userId;
      }

      const [transaction] = await db
        .insert(scoreTransactions)
        .values({
          teamId,
          participantId: targetParticipantId,
          sourceType: "CORRECTION",
          amount: Number(amount),
          reason: `Koreksi Admin: ${reason}`,
          createdBy: user.userId,
        })
        .returning();

      await logAudit({
        actorId: user.userId,
        actorRole: "ADMIN",
        action: "SCORE_ADJUSTED",
        targetType: "TEAM",
        targetId: teamId,
        details: { amount, reason },
      });

      broadcastLeaderboardUpdate({ type: "SCORE_CORRECTION", teamId, amount });

      return {
        success: true,
        data: transaction,
        message: "Penyesuaian skor berhasil disimpan dan disiarkan ke realtime leaderboard.",
      };
    },
    {
      body: t.Object({
        teamId: t.String(),
        amount: t.Number(),
        reason: t.String({ minLength: 3 }),
        participantId: t.Optional(t.String()),
      }),
    }
  );
