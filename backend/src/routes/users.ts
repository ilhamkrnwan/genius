import { Elysia, t } from "elysia";
import { db } from "../db";
import {
  users,
  teams,
  teamMembers,
  scoreTransactions,
  attendances,
  dailyReflections,
  fgdEvaluations,
  ormawaScans,
  participantAchievements,
  gameSessions,
  questions,
  auditLogs,
  missions,
  locations,
  floors,
} from "../db/schema";
import { eq, like, ilike, or, sql, desc, inArray, and } from "drizzle-orm";
import { hashPassword } from "../lib/password";
import { requireAdmin, requireBuddyOrAdmin } from "../middleware/auth";
import { RPG_CHARACTERS, TITLE_CATALOG, PRESET_AVATARS } from "@genius/types";

/**
 * Cascading deletion helper for users to prevent Foreign Key Constraint errors
 */
export async function deleteUsersCascade(userIds: string[]) {
  if (!userIds || userIds.length === 0) return 0;

  // 1. Unset team captain if user was captain
  await db
    .update(teams)
    .set({ captainId: null })
    .where(inArray(teams.captainId, userIds));

  // 2. Delete score transactions for participant or createdBy
  await db
    .delete(scoreTransactions)
    .where(
      or(
        inArray(scoreTransactions.participantId, userIds),
        inArray(scoreTransactions.createdBy, userIds)
      )
    );

  // 3. Delete attendance records
  await db
    .delete(attendances)
    .where(inArray(attendances.participantId, userIds));

  // 4. Delete daily reflections
  await db
    .delete(dailyReflections)
    .where(inArray(dailyReflections.participantId, userIds));

  // 5. Delete FGD evaluations
  await db
    .delete(fgdEvaluations)
    .where(
      or(
        inArray(fgdEvaluations.participantId, userIds),
        inArray(fgdEvaluations.buddyId, userIds)
      )
    );

  // 6. Delete ormawa booth scans
  await db
    .delete(ormawaScans)
    .where(inArray(ormawaScans.participantId, userIds));

  // 7. Delete participant achievements
  await db
    .delete(participantAchievements)
    .where(inArray(participantAchievements.participantId, userIds));

  // 8. Delete game sessions conducted by buddy
  await db
    .delete(gameSessions)
    .where(inArray(gameSessions.buddyId, userIds));

  // 9. Unset questions createdBy
  await db
    .update(questions)
    .set({ createdBy: null })
    .where(inArray(questions.createdBy, userIds));

  // 10. Unset audit logs actorId
  await db
    .update(auditLogs)
    .set({ actorId: null })
    .where(inArray(auditLogs.actorId, userIds));

  // 11. Delete team memberships
  await db
    .delete(teamMembers)
    .where(inArray(teamMembers.userId, userIds));

  // 12. Finally delete users
  const deleted = await db
    .delete(users)
    .where(inArray(users.id, userIds))
    .returning({ id: users.id });

  return deleted.length;
}

export const userRoutes = new Elysia({
  prefix: "/api/users",
  detail: {
    tags: ["Users & RPG Profiles"],
  },
})
  // GET /api/users/rpg-catalog — Public/Authenticated catalog of RPG Classes, Evolution & Titles
  .get("/rpg-catalog", () => {
    return {
      success: true,
      data: {
        characters: Object.values(RPG_CHARACTERS),
        titles: TITLE_CATALOG,
        avatars: PRESET_AVATARS,
      },
    };
  })
  // GET /api/users/:id — Get single user with full profile, ledger & completed sessions (public/self accessible)
  .get("/:id", async ({ params, set }) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        role: users.role,
        status: users.status,
        gender: users.gender,
        faculty: users.faculty,
        prodi: users.prodi,
        characterClass: users.characterClass,
        characterTitle: users.characterTitle,
        characterTier: users.characterTier,
        unlockedTitles: users.unlockedTitles,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        teamId: teams.id,
        teamName: teams.name,
        teamCode: teams.code,
        buddyRole: teamMembers.buddyRole,
      })
      .from(users)
      .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(isUuid ? eq(users.id, params.id) : eq(users.username, params.id))
      .orderBy(desc(teamMembers.joinedAt))
      .limit(1);

    if (!user) {
      set.status = 404;
      return { success: false, error: { code: "NOT_FOUND", message: "User not found" } };
    }

    // Fetch score history if participant
    const scoreHistory = await db
      .select()
      .from(scoreTransactions)
      .where(eq(scoreTransactions.participantId, user.id))
      .orderBy(desc(scoreTransactions.createdAt))
      .limit(50);

    const totalScore = scoreHistory.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Fetch completed game missions for this user's team
    const completedSessions = user.teamId
      ? await db
          .select({
            sessionId: gameSessions.id,
            missionId: gameSessions.missionId,
            score: gameSessions.totalScore,
            status: gameSessions.status,
            completedAt: gameSessions.serverEndAt,
            locationCode: locations.code,
            floorNumber: floors.number,
          })
          .from(gameSessions)
          .leftJoin(missions, eq(gameSessions.missionId, missions.id))
          .leftJoin(locations, eq(gameSessions.locationId, locations.id))
          .leftJoin(floors, eq(locations.floorId, floors.id))
          .where(and(eq(gameSessions.teamId, user.teamId), eq(gameSessions.status, "COMPLETED")))
      : [];

    // Fetch bonus transactions awarded by this buddy (if role is BUDDY)
    let bonusAwardsGiven: any[] = [];
    let assignedSquadMembers: any[] = [];

    if (user.role === "BUDDY") {
      bonusAwardsGiven = await db
        .select({
          id: scoreTransactions.id,
          amount: scoreTransactions.amount,
          reason: scoreTransactions.reason,
          stageId: scoreTransactions.stageId,
          participantId: scoreTransactions.participantId,
          recipientName: users.fullName,
          recipientUsername: users.username,
          createdAt: scoreTransactions.createdAt,
        })
        .from(scoreTransactions)
        .leftJoin(users, eq(scoreTransactions.participantId, users.id))
        .where(eq(scoreTransactions.createdBy, user.id))
        .orderBy(desc(scoreTransactions.createdAt))
        .limit(50);

      // If assigned to a team, fetch the team's participants
      if (user.teamId) {
        assignedSquadMembers = await db
          .select({
            id: users.id,
            username: users.username,
            fullName: users.fullName,
            role: users.role,
            gender: users.gender,
            characterClass: users.characterClass,
            characterTitle: users.characterTitle,
            characterTier: users.characterTier,
            avatarUrl: users.avatarUrl,
            joinedAt: teamMembers.joinedAt,
          })
          .from(teamMembers)
          .innerJoin(users, eq(teamMembers.userId, users.id))
          .where(eq(teamMembers.teamId, user.teamId));
      }
    }

    const bonusSpent = bonusAwardsGiven.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Fetch attendances for this participant
    const userAttendances = await db
      .select()
      .from(attendances)
      .where(eq(attendances.participantId, user.id));

    // Fetch assigned buddy for this participant's team
    let buddyInfo: { id: string; fullName: string; username: string } | null = null;
    if (user.teamId) {
      const [b] = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          username: users.username,
        })
        .from(teamMembers)
        .innerJoin(users, eq(teamMembers.userId, users.id))
        .where(and(eq(teamMembers.teamId, user.teamId), eq(users.role, "BUDDY")))
        .limit(1);
      if (b) {
        buddyInfo = b;
      }
    }

    return {
      success: true,
      data: {
        ...user,
        totalScore,
        bonusSpent,
        scoreHistory,
        completedSessions,
        bonusAwardsGiven,
        assignedSquadMembers,
        attendances: userAttendances,
        buddy: buddyInfo,
        buddyName: buddyInfo?.fullName || null,
      },
    };
  })

  .use(requireBuddyOrAdmin)

  // GET /api/users — List all users with team info, RPG fields, and score aggregation
  .get("/", async ({ query }) => {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 50;
    const offset = (page - 1) * pageSize;
    const search = (query.search || "").trim();
    const role = (query.role || "").trim();
    const teamId = (query.teamId || "").trim();
    const assignmentStatus = (query.assignmentStatus || "").trim(); // "assigned" | "unassigned"
    const gender = (query.gender || "").trim();
    const characterClass = (query.characterClass || "").trim();
    const tier = (query.tier || "").trim();
    const faculty = (query.faculty || "").trim();
    const prodi = (query.prodi || "").trim();

    // Subquery for total participant score
    const userScoreSubquery = db
      .select({
        participantId: scoreTransactions.participantId,
        totalScore: sql<number>`COALESCE(SUM(${scoreTransactions.amount}), 0)`.as("total_score"),
      })
      .from(scoreTransactions)
      .groupBy(scoreTransactions.participantId)
      .as("sq_score");

    // Subquery for total bonus points granted by a buddy
    const buddyBonusSubquery = db
      .select({
        buddyId: scoreTransactions.createdBy,
        totalBonusGiven: sql<number>`COALESCE(SUM(${scoreTransactions.amount}), 0)`.as("total_bonus_given"),
      })
      .from(scoreTransactions)
      .where(eq(scoreTransactions.sourceType, "BONUS"))
      .groupBy(scoreTransactions.createdBy)
      .as("sq_buddy_bonus");

    // Subquery for user's latest team membership (guarantees exactly 1 row per user)
    const latestTeamMemberSubquery = db
      .selectDistinctOn([teamMembers.userId], {
        id: teamMembers.id,
        userId: teamMembers.userId,
        teamId: teamMembers.teamId,
        buddyRole: teamMembers.buddyRole,
        joinedAt: teamMembers.joinedAt,
      })
      .from(teamMembers)
      .orderBy(teamMembers.userId, desc(teamMembers.joinedAt))
      .as("sq_team_member");

    let baseQuery = db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        role: users.role,
        status: users.status,
        gender: users.gender,
        faculty: users.faculty,
        prodi: users.prodi,
        characterClass: users.characterClass,
        characterTitle: users.characterTitle,
        characterTier: users.characterTier,
        unlockedTitles: users.unlockedTitles,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
        teamMemberId: latestTeamMemberSubquery.id,
        teamId: teams.id,
        teamName: teams.name,
        teamCode: teams.code,
        buddyRole: latestTeamMemberSubquery.buddyRole,
        joinedTeamAt: latestTeamMemberSubquery.joinedAt,
        totalScore: sql<number>`COALESCE(${userScoreSubquery.totalScore}, 0)`,
        bonusSpent: sql<number>`COALESCE(${buddyBonusSubquery.totalBonusGiven}, 0)`,
      })
      .from(users)
      .leftJoin(latestTeamMemberSubquery, eq(users.id, latestTeamMemberSubquery.userId))
      .leftJoin(teams, eq(latestTeamMemberSubquery.teamId, teams.id))
      .leftJoin(userScoreSubquery, eq(users.id, userScoreSubquery.participantId))
      .leftJoin(buddyBonusSubquery, eq(users.id, buddyBonusSubquery.buddyId))
      .$dynamic();

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(users.fullName, `%${search}%`),
          like(users.username, `%${search}%`),
          like(users.faculty, `%${search}%`),
          like(users.prodi, `%${search}%`),
          like(users.characterTitle, `%${search}%`)
        )
      );
    }
    if (role) {
      conditions.push(eq(users.role, role as any));
    }
    if (faculty) {
      conditions.push(like(users.faculty, `%${faculty}%`));
    }
    if (prodi) {
      conditions.push(like(users.prodi, `%${prodi}%`));
    }
    if (teamId) {
      conditions.push(eq(teams.id, teamId));
    }
    if (assignmentStatus === "assigned") {
      conditions.push(sql`${teams.id} IS NOT NULL`);
    } else if (assignmentStatus === "unassigned") {
      conditions.push(sql`${teams.id} IS NULL`);
    }
    if (gender) {
      conditions.push(eq(users.gender, gender));
    }
    if (characterClass) {
      conditions.push(eq(users.characterClass, characterClass));
    }
    if (tier) {
      conditions.push(eq(users.characterTier, Number(tier)));
    }

    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions));
    }

    const data = await baseQuery
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset(offset);

    // Count total with conditions
    let countQuery = db
      .select({ count: sql<number>`count(DISTINCT ${users.id})` })
      .from(users)
      .leftJoin(latestTeamMemberSubquery, eq(users.id, latestTeamMemberSubquery.userId))
      .leftJoin(teams, eq(latestTeamMemberSubquery.teamId, teams.id))
      .$dynamic();

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const [{ count }] = await countQuery;

    return {
      success: true,
      data,
      meta: {
        page,
        pageSize,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / pageSize),
      },
    };
  })

  .use(requireAdmin)

  // POST /api/users — Create single user
  .post(
    "/",
    async ({ body, set }: any) => {
      try {
        const username = (body.username || body.nim || "").trim();
        const fullName = (body.fullName || body.name || body.nama || "").trim();

        if (!username) {
          set.status = 400;
          return { success: false, error: { code: "VALIDATION_ERROR", message: "NIM / Username wajib diisi" } };
        }

        if (!fullName) {
          set.status = 400;
          return { success: false, error: { code: "VALIDATION_ERROR", message: "Nama lengkap wajib diisi" } };
        }

        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (existing) {
          set.status = 409;
          return { success: false, error: { code: "USERNAME_EXISTS", message: `Pengguna dengan NIM / Username '${username}' sudah terdaftar` } };
        }

        const rawPassword = body.password ? String(body.password).trim() : "";
        const password = rawPassword.length >= 4 ? rawPassword : "genius2026";
        const passwordHash = await hashPassword(password);

        const [user] = await db
          .insert(users)
          .values({
            username,
            passwordHash,
            fullName,
            role: (body.role as any) || "PARTICIPANT",
            status: (body.status as any) || "ACTIVE",
            gender: body.gender || "MALE",
            faculty: body.faculty ? String(body.faculty).trim() : (body.fakultas ? String(body.fakultas).trim() : null),
            prodi: body.prodi ? String(body.prodi).trim() : null,
            characterClass: body.characterClass || "CYBER_KNIGHT",
            characterTitle: body.characterTitle || "Novice Adventurer",
            characterTier: typeof body.characterTier === "number" ? body.characterTier : 1,
            unlockedTitles: body.unlockedTitles || ["Novice Adventurer"],
            avatarUrl: body.avatarUrl || null,
          })
          .returning();

        // If teamId / kelompok is supplied, assign to team safely
        const rawTeam = (body.teamId || body.kelompok || body.teamCode || body.team || "").toString().trim();
        if (rawTeam) {
          let targetTeamId: string | null = null;
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawTeam);
          if (isUuid) {
            const [teamExists] = await db
              .select({ id: teams.id })
              .from(teams)
              .where(eq(teams.id, rawTeam))
              .limit(1);
            if (teamExists) targetTeamId = teamExists.id;
          } else {
            const [teamExists] = await db
              .select({ id: teams.id })
              .from(teams)
              .where(or(ilike(teams.code, rawTeam), ilike(teams.name, rawTeam)))
              .limit(1);
            if (teamExists) targetTeamId = teamExists.id;
          }

          if (targetTeamId) {
            await db.insert(teamMembers).values({
              teamId: targetTeamId,
              userId: user.id,
              buddyRole: (body.buddyRole as any) || (body.role === "BUDDY" ? "PRIMARY" : null),
            });
          }
        }

        return { success: true, data: user };
      } catch (err: any) {
        console.error("[POST /api/users Error]:", err);
        set.status = 500;
        return {
          success: false,
          error: {
            code: "CREATE_USER_ERROR",
            message: err.message || "Gagal membuat pengguna",
          },
        };
      }
    },
    {
      body: t.Object({
        username: t.Optional(t.String()),
        nim: t.Optional(t.String()),
        fullName: t.Optional(t.String()),
        name: t.Optional(t.String()),
        nama: t.Optional(t.String()),
        password: t.Optional(t.String()),
        role: t.Optional(t.String()),
        status: t.Optional(t.String()),
        gender: t.Optional(t.String()),
        faculty: t.Optional(t.Nullable(t.String())),
        fakultas: t.Optional(t.Nullable(t.String())),
        prodi: t.Optional(t.Nullable(t.String())),
        characterClass: t.Optional(t.String()),
        characterTitle: t.Optional(t.String()),
        characterTier: t.Optional(t.Number()),
        unlockedTitles: t.Optional(t.Array(t.String())),
        avatarUrl: t.Optional(t.Nullable(t.String())),
        teamId: t.Optional(t.Nullable(t.String())),
        teamCode: t.Optional(t.Nullable(t.String())),
        kelompok: t.Optional(t.Nullable(t.String())),
        buddyRole: t.Optional(t.Nullable(t.String())),
      }),
    }
  )

  // POST /api/users/bulk-import — Bulk import participants / users from CSV/JSON
  .post(
    "/bulk-import",
    async ({ body }: { body: any }) => {
      const { items, defaultPassword = "genius2026", defaultRole = "PARTICIPANT" } = body;
      const defaultHash = await hashPassword(defaultPassword);

      const allTeams = await db.select().from(teams);
      const teamCodeMap = new Map(allTeams.map((t) => [t.code.toLowerCase(), t.id]));
      const teamNameMap = new Map(allTeams.map((t) => [t.name.toLowerCase(), t.id]));

      let successCount = 0;
      let skippedCount = 0;
      const errors: Array<{ row: number; username: string; message: string }> = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const username = (item.username || item.nim || "").trim();
        const fullName = (item.fullName || item.name || item.nama || username).trim();
        const faculty = item.faculty || item.fakultas || null;
        const prodi = item.prodi || null;

        if (!username) {
          errors.push({ row: i + 1, username: "", message: "Username / NIM cannot be empty" });
          continue;
        }

        try {
          const [existing] = await db
            .select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1);

          let userId = existing?.id;

          if (!existing) {
            const pwd = item.password && String(item.password).trim().length >= 4 ? String(item.password).trim() : defaultPassword;
            const pwdHash = item.password ? await hashPassword(pwd) : defaultHash;
            const [created] = await db
              .insert(users)
              .values({
                username,
                passwordHash: pwdHash,
                fullName,
                role: (item.role as any) || defaultRole,
                status: "ACTIVE",
                gender: item.gender || "MALE",
                faculty,
                prodi,
                characterClass: item.characterClass || "CYBER_KNIGHT",
                characterTitle: item.characterTitle || "Novice Adventurer",
                characterTier: item.characterTier || 1,
                unlockedTitles: item.unlockedTitles || ["Novice Adventurer"],
                avatarUrl: item.avatarUrl || null,
              })
              .returning();
            userId = created.id;
            successCount++;
          } else {
            // Update existing user's metadata if provided
            const updates: Record<string, any> = {};
            if (item.fullName && item.fullName !== existing.fullName) updates.fullName = item.fullName;
            if (faculty) updates.faculty = faculty;
            if (prodi) updates.prodi = prodi;
            if (item.gender) updates.gender = item.gender;
            if (item.characterClass) updates.characterClass = item.characterClass;
            if (item.characterTitle) updates.characterTitle = item.characterTitle;
            if (item.characterTier) updates.characterTier = item.characterTier;
            if (item.avatarUrl) updates.avatarUrl = item.avatarUrl;
            if (Object.keys(updates).length > 0) {
              await db.update(users).set(updates).where(eq(users.id, existing.id));
            }
            skippedCount++;
          }

          // Handle Team Assignment if teamCode, teamName, or kelompok is specified
          const rawTeam = (item.teamCode || item.teamName || item.kelompok || item.team || "").toString().trim();
          if (rawTeam) {
            const lowerKey = rawTeam.toLowerCase();
            const matchedTeamId = teamCodeMap.get(lowerKey) || teamNameMap.get(lowerKey);

            if (matchedTeamId && userId) {
              // Remove old team membership if any
              await db.delete(teamMembers).where(eq(teamMembers.userId, userId));
              await db.insert(teamMembers).values({
                teamId: matchedTeamId,
                userId,
                buddyRole: (item.buddyRole as any) || (item.role === "BUDDY" ? "PRIMARY" : null),
              });
            }
          }
        } catch (err: any) {
          errors.push({ row: i + 1, username, message: err.message || "Insert failed" });
        }
      }

      return {
        success: true,
        data: {
          totalProcessed: items.length,
          successCount,
          skippedCount,
          errorCount: errors.length,
          errors,
        },
      };
    },
    {
      body: t.Object({
        items: t.Array(
          t.Object({
            username: t.Optional(t.String()),
            nim: t.Optional(t.String()),
            fullName: t.Optional(t.String()),
            name: t.Optional(t.String()),
            nama: t.Optional(t.String()),
            password: t.Optional(t.String()),
            role: t.Optional(t.String()),
            gender: t.Optional(t.String()),
            faculty: t.Optional(t.Nullable(t.String())),
            fakultas: t.Optional(t.Nullable(t.String())),
            prodi: t.Optional(t.Nullable(t.String())),
            characterClass: t.Optional(t.String()),
            characterTitle: t.Optional(t.String()),
            characterTier: t.Optional(t.Number()),
            unlockedTitles: t.Optional(t.Array(t.String())),
            avatarUrl: t.Optional(t.Nullable(t.String())),
            teamCode: t.Optional(t.String()),
            teamName: t.Optional(t.String()),
            teamId: t.Optional(t.String()),
            kelompok: t.Optional(t.String()),
            team: t.Optional(t.String()),
            buddyRole: t.Optional(t.String()),
          })
        ),
        defaultPassword: t.Optional(t.String()),
        defaultRole: t.Optional(t.String()),
      }),
    }
  )

  // POST /api/users/batch-assign-team — Batch assign multiple participants/buddies to a team
  .post(
    "/batch-assign-team",
    async ({ body }: { body: any }) => {
      const { userIds, teamId, buddyRole } = body;

      if (!userIds || userIds.length === 0) {
        return { success: true, message: "No users provided" };
      }

      // Remove existing team memberships for these users
      await db.delete(teamMembers).where(inArray(teamMembers.userId, userIds));

      // If teamId is specified, assign all to this team
      if (teamId) {
        const valuesToInsert = userIds.map((userId) => ({
          teamId,
          userId,
          buddyRole: (buddyRole as any) || null,
        }));
        await db.insert(teamMembers).values(valuesToInsert);
      }

      return {
        success: true,
        data: {
          affectedUsers: userIds.length,
          teamId: teamId || null,
        },
      };
    },
    {
      body: t.Object({
        userIds: t.Array(t.String()),
        teamId: t.Optional(t.Nullable(t.String())),
        buddyRole: t.Optional(t.Nullable(t.String())),
      }),
    }
  )

  // POST /api/users/batch-delete — Delete multiple users and their relations in cascade
  .post(
    "/batch-delete",
    async ({ body, set }: { body: any; set: any }) => {
      const { userIds } = body;
      if (!userIds || userIds.length === 0) {
        return { success: true, count: 0 };
      }
      const count = await deleteUsersCascade(userIds);
      return { success: true, message: `${count} pengguna berhasil dihapus`, count };
    },
    {
      body: t.Object({
        userIds: t.Array(t.String()),
      }),
    }
  )

  // POST /api/users/batch-status — Batch update status (ACTIVE / INACTIVE)
  .post(
    "/batch-status",
    async ({ body, set }: { body: any; set: any }) => {
      const { userIds, status } = body;
      if (!userIds || userIds.length === 0) {
        return { success: true, count: 0 };
      }
      await db.update(users).set({ status: status as any, updatedAt: new Date() }).where(inArray(users.id, userIds));
      return { success: true, message: `Status ${userIds.length} pengguna berhasil diperbarui`, count: userIds.length };
    },
    {
      body: t.Object({
        userIds: t.Array(t.String()),
        status: t.String(),
      }),
    }
  )

  // POST /api/users/batch-reset-password — Batch reset password for users
  .post(
    "/batch-reset-password",
    async ({ body, set }: { body: any; set: any }) => {
      const { userIds, password = "genius2026" } = body;
      if (!userIds || userIds.length === 0) {
        return { success: true, count: 0 };
      }
      const passwordHash = await hashPassword(password);
      await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(inArray(users.id, userIds));
      return { success: true, message: `Password ${userIds.length} pengguna berhasil di-reset`, count: userIds.length };
    },
    {
      body: t.Object({
        userIds: t.Array(t.String()),
        password: t.Optional(t.String()),
      }),
    }
  )

  // POST /api/users/:id/reset-password — Quick password reset
  .post(
    "/:id/reset-password",
    async ({ params, body, set }: { params: any; body: any; set: any }) => {
      const newPassword = body.password || "genius2026";
      const passwordHash = await hashPassword(newPassword);

      const [user] = await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, params.id))
        .returning({ id: users.id, username: users.username });

      if (!user) {
        set.status = 404;
        return { success: false, error: { code: "NOT_FOUND", message: "User not found" } };
      }

      return { success: true, message: `Password for ${user.username} reset successfully` };
    },
    {
      body: t.Object({
        password: t.Optional(t.String({ minLength: 4 })),
      }),
    }
  )

  // POST /api/users/:id/assign-buddy — Assign / Reassign a Buddy to a specific team
  .post(
    "/:id/assign-buddy",
    async ({ params, body, set }: { params: any; body: any; set: any }) => {
      const { teamId, buddyRole = "PRIMARY" } = body;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, params.id))
        .limit(1);

      if (!user) {
        set.status = 404;
        return { success: false, error: { code: "NOT_FOUND", message: "Buddy user not found" } };
      }

      // 1 Buddy = 1 Team Rule: Remove any prior team assignment
      await db.delete(teamMembers).where(eq(teamMembers.userId, params.id));

      if (teamId) {
        // Check maximum 3 buddies per team
        const currentBuddies = await db
          .select()
          .from(teamMembers)
          .innerJoin(users, eq(teamMembers.userId, users.id))
          .where(and(eq(teamMembers.teamId, teamId), eq(users.role, "BUDDY")));

        if (currentBuddies.length >= 3) {
          set.status = 400;
          return {
            success: false,
            error: {
              code: "MAX_BUDDIES_REACHED",
              message: "Tim ini sudah memiliki batas maksimum 3 Buddy.",
            },
          };
        }

        // Insert new assignment
        await db.insert(teamMembers).values({
          teamId,
          userId: params.id,
          buddyRole: buddyRole as any,
        });
      }

      return {
        success: true,
        data: {
          buddyId: params.id,
          teamId: teamId || null,
          buddyRole: teamId ? buddyRole : null,
        },
      };
    },
    {
      body: t.Object({
        teamId: t.Optional(t.Nullable(t.String())),
        buddyRole: t.Optional(t.String()),
      }),
    }
  )

  // PUT /api/users/:id — Update user
  .put(
    "/:id",
    async ({ params, body, set }: { params: any; body: any; set: any }) => {
      try {
        const updates: Record<string, unknown> = {
          updatedAt: new Date(),
        };
        if (body.fullName) updates.fullName = body.fullName;
        if (body.role) updates.role = body.role;
        if (body.status) updates.status = body.status;
        if (body.gender !== undefined) updates.gender = body.gender;
        if (body.faculty !== undefined) updates.faculty = body.faculty ? String(body.faculty).trim() : null;
        if (body.fakultas !== undefined) updates.faculty = body.fakultas ? String(body.fakultas).trim() : null;
        if (body.prodi !== undefined) updates.prodi = body.prodi ? String(body.prodi).trim() : null;
        if (body.characterClass !== undefined) updates.characterClass = body.characterClass;
        if (body.characterTitle !== undefined) updates.characterTitle = body.characterTitle;
        if (body.characterTier !== undefined) updates.characterTier = body.characterTier;
        if (body.unlockedTitles !== undefined) updates.unlockedTitles = body.unlockedTitles;
        if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl;
        if (body.password && String(body.password).trim().length >= 4) {
          updates.passwordHash = await hashPassword(String(body.password).trim());
        }

        const [user] = await db
          .update(users)
          .set(updates)
          .where(eq(users.id, params.id))
          .returning({
            id: users.id,
            username: users.username,
            fullName: users.fullName,
            role: users.role,
            status: users.status,
            gender: users.gender,
            faculty: users.faculty,
            prodi: users.prodi,
            characterClass: users.characterClass,
            characterTitle: users.characterTitle,
            characterTier: users.characterTier,
            unlockedTitles: users.unlockedTitles,
            avatarUrl: users.avatarUrl,
          });

        if (!user) {
          set.status = 404;
          return { success: false, error: { code: "NOT_FOUND", message: "User not found" } };
        }

        // Update team if provided
        if (body.teamId !== undefined || body.kelompok !== undefined || body.teamCode !== undefined) {
          await db.delete(teamMembers).where(eq(teamMembers.userId, params.id));
          const rawTeam = (body.teamId || body.kelompok || body.teamCode || "").toString().trim();
          if (rawTeam) {
            let targetTeamId: string | null = null;
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawTeam);
            if (isUuid) {
              const [t] = await db.select({ id: teams.id }).from(teams).where(eq(teams.id, rawTeam)).limit(1);
              if (t) targetTeamId = t.id;
            } else {
              const [t] = await db
                .select({ id: teams.id })
                .from(teams)
                .where(or(ilike(teams.code, rawTeam), ilike(teams.name, rawTeam)))
                .limit(1);
              if (t) targetTeamId = t.id;
            }

            if (targetTeamId) {
              await db.insert(teamMembers).values({
                teamId: targetTeamId,
                userId: params.id,
                buddyRole: (body.buddyRole as any) || (user.role === "BUDDY" ? "PRIMARY" : null),
              });
            }
          }
        }

        return { success: true, data: user };
      } catch (err: any) {
        console.error("[PUT /api/users/:id Error]:", err);
        set.status = 500;
        return { success: false, error: { code: "UPDATE_USER_ERROR", message: err.message || "Gagal memperbarui pengguna" } };
      }
    },
    {
      body: t.Object({
        fullName: t.Optional(t.String()),
        role: t.Optional(t.String()),
        status: t.Optional(t.String()),
        password: t.Optional(t.String()),
        gender: t.Optional(t.String()),
        faculty: t.Optional(t.Nullable(t.String())),
        fakultas: t.Optional(t.Nullable(t.String())),
        prodi: t.Optional(t.Nullable(t.String())),
        characterClass: t.Optional(t.String()),
        characterTitle: t.Optional(t.String()),
        characterTier: t.Optional(t.Number()),
        unlockedTitles: t.Optional(t.Array(t.String())),
        avatarUrl: t.Optional(t.Nullable(t.String())),
        teamId: t.Optional(t.Nullable(t.String())),
        buddyRole: t.Optional(t.Nullable(t.String())),
      }),
    }
  )

  // POST /api/users/:id/award-title — Award a title & optionally upgrade character tier
  .post(
    "/:id/award-title",
    async ({ params, body, set }: { params: any; body: any; set: any }) => {
      const { title, upgradeTier } = body;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, params.id))
        .limit(1);

      if (!user) {
        set.status = 404;
        return { success: false, error: { code: "NOT_FOUND", message: "User not found" } };
      }

      const currentTitles = (user.unlockedTitles as string[]) || ["Novice Adventurer"];
      const newTitles = Array.from(new Set([...currentTitles, title]));

      const updates: Record<string, any> = {
        unlockedTitles: newTitles,
        characterTitle: title,
        updatedAt: new Date(),
      };

      if (upgradeTier !== undefined) {
        updates.characterTier = upgradeTier;
      }

      const [updated] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, params.id))
        .returning({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          characterClass: users.characterClass,
          characterTitle: users.characterTitle,
          characterTier: users.characterTier,
          unlockedTitles: users.unlockedTitles,
        });

      return {
        success: true,
        message: `Gelar '${title}' berhasil disematkan kepada ${updated.fullName}!`,
        data: updated,
      };
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        upgradeTier: t.Optional(t.Number()),
      }),
    }
  )

  // DELETE /api/users/:id — Delete user with all cascading relations
  .delete("/:id", async ({ params, set }) => {
    const count = await deleteUsersCascade([params.id]);

    if (count === 0) {
      set.status = 404;
      return { success: false, error: { code: "NOT_FOUND", message: "User not found" } };
    }

    return { success: true, data: { id: params.id } };
  });

