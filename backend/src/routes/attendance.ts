import { Elysia, t } from "elysia";
import { db } from "../db";
import { attendances, attendanceSessions, users, teams, teamMembers, scoreTransactions } from "../db/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import { broadcastLeaderboardUpdate, broadcastAdminEvent, broadcastAttendanceEvent, broadcastXpCelebration } from "../realtime";
import { getSystemSettings } from "./system";

function generateSecureSessionToken(type: string = "CHECK_IN"): string {
  const randomSuffix = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `UNU-PRESENSI-${type}-${randomSuffix}`;
}

async function getOrCreateDefaultSessions() {
  const existing = await db.select().from(attendanceSessions).limit(1);
  if (existing.length === 0) {
    const [s1] = await db
      .insert(attendanceSessions)
      .values({
        title: "Presensi Masuk Pagi",
        description: "Presensi gerbang kedatangan pagi mahasiswa baru PKKMB UNU 2026",
        type: "CHECK_IN",
        isActive: true,
        qrToken: generateSecureSessionToken("CHECK_IN"),
        xpReward: 100,
        allowLate: true,
        lateTime: "07:30",
      })
      .returning();

    await db
      .insert(attendanceSessions)
      .values({
        title: "Presensi Kepulangan Sore",
        description: "Presensi kepulangan sore hari setelah seluruh rangkaian acara",
        type: "CHECK_OUT",
        isActive: false,
        qrToken: generateSecureSessionToken("CHECK_OUT"),
        xpReward: 50,
        allowLate: true,
        lateTime: "17:00",
      });

    return [s1];
  }
  return existing;
}

export const attendanceRoutes = new Elysia({
  prefix: "/api/attendance",
  detail: {
    tags: ["Attendance & Presensi Gate"],
  },
})
  .use(authMiddleware)

  // GET /api/attendance/active-session — Ambil sesi presensi yang sedang aktif (qrToken hanya untuk panitia/admin)
  .get(
    "/active-session",
    async ({ user }) => {
      await getOrCreateDefaultSessions();
      const [active] = await db
        .select()
        .from(attendanceSessions)
        .where(eq(attendanceSessions.isActive, true))
        .limit(1);

      if (!active) {
        return {
          success: true,
          data: null,
        };
      }

      // CRITICAL: Sembunyikan qrToken dari peserta/maba agar tidak bisa dibypass tanpa scan QR fisik gerbang
      const isStaff = user && (user.role === "ADMIN" || user.role === "BUDDY");
      const safeSession = {
        id: active.id,
        title: active.title,
        description: active.description,
        type: active.type,
        isActive: active.isActive,
        xpReward: active.xpReward,
        allowLate: active.allowLate,
        lateTime: active.lateTime,
        startTime: active.startTime,
        endTime: active.endTime,
        createdAt: active.createdAt,
        updatedAt: active.updatedAt,
        ...(isStaff ? { qrToken: active.qrToken } : {}),
      };

      return {
        success: true,
        data: safeSession,
      };
    },
    {
      detail: {
        summary: "Ambil sesi presensi aktif untuk scanner maba & proyektor gate",
        description: "Mengembalikan status sesi presensi aktif. qrToken hanya disertakan jika diakses oleh Panitia/Admin.",
      },
    }
  )

  // GET /api/attendance/sessions — Ambil daftar seluruh sesi presensi (Admin & Panitia)
  .get(
    "/sessions",
    async ({ user, set }) => {
      await getOrCreateDefaultSessions();
      const list = await db
        .select()
        .from(attendanceSessions)
        .orderBy(desc(attendanceSessions.createdAt));

      const isStaff = user && (user.role === "ADMIN" || user.role === "BUDDY");
      const safeList = list.map((s) => {
        if (isStaff) return s;
        const { qrToken, ...rest } = s;
        return rest;
      });

      return {
        success: true,
        data: safeList,
      };
    },
    {
      detail: {
        summary: "Daftar semua sesi presensi (Admin)",
      },
    }
  )

  // POST /api/attendance/sessions — Buat sesi presensi baru
  .post(
    "/sessions",
    async ({ body, user, set }) => {
      if (!user || user.role !== "ADMIN") {
        set.status = 403;
        return { success: false, error: { code: "FORBIDDEN", message: "Hanya Admin yang dapat membuat sesi presensi baru" } };
      }

      const {
        title,
        description,
        type = "CHECK_IN",
        qrToken,
        xpReward = type === "CHECK_IN" ? 100 : 50,
        allowLate = true,
        lateTime = "07:30",
        isActive = false,
      } = body;

      const finalQrToken =
        qrToken?.trim() ||
        generateSecureSessionToken(type);

      if (isActive) {
        await db.update(attendanceSessions).set({ isActive: false });
      }

      const [newSession] = await db
        .insert(attendanceSessions)
        .values({
          title,
          description,
          type,
          qrToken: finalQrToken,
          xpReward,
          allowLate,
          lateTime,
          isActive,
        })
        .returning();

      broadcastAdminEvent("ATTENDANCE_SESSION_CREATED", { session: newSession });

      return {
        success: true,
        message: "Sesi presensi berhasil dibuat!",
        data: newSession,
      };
    },
    {
      detail: {
        summary: "Buat sesi presensi baru (Admin)",
      },
      body: t.Object({
        title: t.String({ minLength: 3 }),
        description: t.Optional(t.String()),
        type: t.Optional(t.String()),
        qrToken: t.Optional(t.String()),
        xpReward: t.Optional(t.Number()),
        allowLate: t.Optional(t.Boolean()),
        lateTime: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
    }
  )

  // PUT /api/attendance/sessions/:id/activate — Aktifkan sesi presensi tertentu
  .put(
    "/sessions/:id/activate",
    async ({ params, user, set }) => {
      if (!user || user.role !== "ADMIN") {
        set.status = 403;
        return { success: false, error: { code: "FORBIDDEN", message: "Hanya Admin yang dapat mengaktifkan sesi presensi" } };
      }

      const { id } = params;

      // 1. Nonaktifkan semua sesi lainnya
      await db.update(attendanceSessions).set({ isActive: false });

      // 2. Aktifkan sesi terpilih
      const [updated] = await db
        .update(attendanceSessions)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(attendanceSessions.id, id))
        .returning();

      if (!updated) {
        set.status = 404;
        return { success: false, error: { code: "SESSION_NOT_FOUND", message: "Sesi presensi tidak ditemukan" } };
      }

      broadcastAdminEvent("ATTENDANCE_SESSION_ACTIVATED", { session: updated });

      return {
        success: true,
        message: `Sesi "${updated.title}" (${updated.type}) berhasil diaktifkan!`,
        data: updated,
      };
    },
    {
      detail: {
        summary: "Aktifkan sesi presensi (Admin)",
      },
      params: t.Object({ id: t.String() }),
    }
  )

  // PUT /api/attendance/sessions/:id/deactivate — Tutup / nonaktifkan sesi presensi
  .put(
    "/sessions/:id/deactivate",
    async ({ params, user, set }) => {
      if (!user || user.role !== "ADMIN") {
        set.status = 403;
        return { success: false, error: { code: "FORBIDDEN", message: "Hanya Admin yang dapat menonaktifkan sesi presensi" } };
      }

      const { id } = params;

      const [updated] = await db
        .update(attendanceSessions)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(attendanceSessions.id, id))
        .returning();

      if (!updated) {
        set.status = 404;
        return { success: false, error: { code: "SESSION_NOT_FOUND", message: "Sesi presensi tidak ditemukan" } };
      }

      broadcastAdminEvent("ATTENDANCE_SESSION_DEACTIVATED", { session: updated });

      return {
        success: true,
        message: `Sesi "${updated.title}" berhasil dinonaktifkan (Gerbang Ditutup).`,
        data: updated,
      };
    },
    {
      detail: {
        summary: "Nonaktifkan sesi presensi (Admin)",
      },
      params: t.Object({ id: t.String() }),
    }
  )

  // PUT /api/attendance/sessions/:id — Edit detail sesi presensi
  .put(
    "/sessions/:id",
    async ({ params, body, user, set }) => {
      if (!user || user.role !== "ADMIN") {
        set.status = 403;
        return { success: false, error: { code: "FORBIDDEN", message: "Hanya Admin yang dapat mengubah sesi presensi" } };
      }

      const { id } = params;
      const [updated] = await db
        .update(attendanceSessions)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(attendanceSessions.id, id))
        .returning();

      if (!updated) {
        set.status = 404;
        return { success: false, error: { code: "SESSION_NOT_FOUND", message: "Sesi presensi tidak ditemukan" } };
      }

      return {
        success: true,
        message: "Sesi presensi berhasil diperbarui!",
        data: updated,
      };
    },
    {
      detail: {
        summary: "Update sesi presensi (Admin)",
      },
      params: t.Object({ id: t.String() }),
      body: t.Object({
        title: t.Optional(t.String()),
        description: t.Optional(t.String()),
        type: t.Optional(t.String()),
        qrToken: t.Optional(t.String()),
        xpReward: t.Optional(t.Number()),
        allowLate: t.Optional(t.Boolean()),
        lateTime: t.Optional(t.String()),
      }),
    }
  )

  // DELETE /api/attendance/sessions/:id — Hapus sesi presensi
  .delete(
    "/sessions/:id",
    async ({ params, user, set }) => {
      if (!user || user.role !== "ADMIN") {
        set.status = 403;
        return { success: false, error: { code: "FORBIDDEN", message: "Hanya Admin yang dapat menghapus sesi presensi" } };
      }

      const { id } = params;
      await db.delete(attendanceSessions).where(eq(attendanceSessions.id, id));
      return {
        success: true,
        message: "Sesi presensi berhasil dihapus.",
      };
    },
    {
      detail: {
        summary: "Hapus sesi presensi (Admin)",
      },
      params: t.Object({ id: t.String() }),
    }
  )

  // POST /api/attendance/scan — Universal Flexible Scan (Otomatis mendeteksi Sesi Aktif Check-In / Check-Out)
  .post(
    "/scan",
    async ({ body, user, set }) => {
      let rawParticipant = (body.participantId || user?.userId || "").trim();
      let rawQrToken = (body.qrToken || "").trim();

      // Mendukung jika QR hasil scan berupa JSON format: { "userId": "...", "qrToken": "..." } atau sejenisnya
      if (rawParticipant.startsWith("{") && rawParticipant.endsWith("}")) {
        try {
          const parsed = JSON.parse(rawParticipant);
          if (parsed.participantId || parsed.userId || parsed.nim || parsed.username) {
            rawParticipant = parsed.participantId || parsed.userId || parsed.nim || parsed.username;
          }
          if (parsed.qrToken || parsed.token) {
            rawQrToken = parsed.qrToken || parsed.token;
          }
        } catch {
          // ignore json parse error
        }
      }

      if (rawQrToken.startsWith("{") && rawQrToken.endsWith("}")) {
        try {
          const parsed = JSON.parse(rawQrToken);
          if (parsed.qrToken || parsed.token) {
            rawQrToken = parsed.qrToken || parsed.token;
          }
          if (!rawParticipant && (parsed.participantId || parsed.userId || parsed.nim || parsed.username)) {
            rawParticipant = parsed.participantId || parsed.userId || parsed.nim || parsed.username;
          }
        } catch {
          // ignore json parse error
        }
      }

      // 1. Ambil sesi presensi yang sedang aktif
      await getOrCreateDefaultSessions();
      const [activeSession] = await db
        .select()
        .from(attendanceSessions)
        .where(eq(attendanceSessions.isActive, true))
        .limit(1);

      if (!activeSession) {
        set.status = 400;
        return {
          success: false,
          error: {
            code: "NO_ACTIVE_SESSION",
            message: "Gerbang presensi sedang tidak dibuka oleh panitia. Silakan aktifkan sesi presensi di menu Presensi.",
          },
        };
      }

      const isStaff = user && (user.role === "ADMIN" || user.role === "BUDDY");

      // Hanya panitia/admin yang memindai badge maba yang boleh menggunakan token sesi aktif secara otomatis
      if (!rawQrToken && isStaff && activeSession) {
        rawQrToken = activeSession.qrToken;
      }

      if (!rawQrToken) {
        set.status = 400;
        return {
          success: false,
          error: {
            code: "MISSING_QR_TOKEN",
            message: "Token QR presensi wajib dipindai langsung dari proyektor/banner gerbang resmi.",
          },
        };
      }

      const participantId = rawParticipant;
      if (!participantId) {
        set.status = 400;
        return { success: false, error: { code: "MISSING_PARTICIPANT", message: "ID atau NIM Mahasiswa wajib disertakan" } };
      }

      // 2. Verifikasi peserta (Bisa berupa UUID atau NIM/username)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(participantId);
      let participant: { id: string; fullName: string; role: string; username?: string } | undefined = undefined;

      if (isUuid) {
        const [found] = await db
          .select({
            id: users.id,
            username: users.username,
            fullName: users.fullName,
            role: users.role,
          })
          .from(users)
          .where(eq(users.id, participantId))
          .limit(1);
        participant = found;
      } else {
        const [found] = await db
          .select({
            id: users.id,
            username: users.username,
            fullName: users.fullName,
            role: users.role,
          })
          .from(users)
          .where(eq(users.username, participantId))
          .limit(1);
        participant = found;
      }

      if (!participant) {
        set.status = 404;
        return { success: false, error: { code: "USER_NOT_FOUND", message: `Data mahasiswa "${participantId}" tidak ditemukan dalam sistem.` } };
      }

      const verifiedUserId = participant.id;

      // 3. Cari kelompok peserta untuk update leaderboard
      const [membership] = await db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.userId, verifiedUserId))
        .limit(1);

      let targetTeamId = membership?.teamId;
      if (!targetTeamId) {
        const [defaultTeam] = await db.select({ id: teams.id }).from(teams).limit(1);
        if (defaultTeam) targetTeamId = defaultTeam.id;
      }

      // 4. Validasi ketat kecocokan token QR (Mendukung dynamic time-based salt e.g. BASE-SALT)
      const inputToken = rawQrToken.trim().toUpperCase();
      const baseToken = activeSession.qrToken.trim().toUpperCase();
      const isValid =
        inputToken === baseToken ||
        inputToken.startsWith(baseToken + "-");

      if (!isValid) {
        set.status = 400;
        return {
          success: false,
          error: {
            code: "INVALID_QR_TOKEN",
            message: "Kode QR presensi tidak valid atau telah kedaluwarsa. Pastikan memindai QR resmi yang ditampilkan di gerbang.",
          },
        };
      }

      // 5. Cek apakah mahasiswa sudah presensi pada sesi ini
      const [alreadyAttended] = await db
        .select()
        .from(attendances)
        .where(and(eq(attendances.participantId, verifiedUserId), eq(attendances.sessionId, activeSession.id)))
        .limit(1);

      if (alreadyAttended) {
        set.status = 400;
        return {
          success: false,
          error: {
            code: "ALREADY_ATTENDED",
            message: `Mahasiswa ${participant.fullName} sudah tercatat melakukan presensi pada sesi "${activeSession.title}".`,
          },
        };
      }

      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const baseXp = activeSession.xpReward || (activeSession.type === "CHECK_IN" ? 100 : 50);
      let xpAwarded = baseXp;
      let attendanceRecord;

      if (activeSession.type === "CHECK_IN") {
        // Evaluasi keterlambatan
        let isLate = false;
        if (activeSession.allowLate && activeSession.lateTime) {
          const [limitH, limitM] = activeSession.lateTime.split(":").map(Number);
          const currentH = now.getHours();
          const currentM = now.getMinutes();
          isLate = currentH > (limitH || 7) || (currentH === (limitH || 7) && currentM > (limitM || 30));
        }
        const checkInStatus = isLate ? "LATE" : "ON_TIME";
        // Jika terlambat, memperoleh separuh XP (50%)
        xpAwarded = checkInStatus === "LATE" ? Math.floor(baseXp / 2) : baseXp;

        [attendanceRecord] = await db
          .insert(attendances)
          .values({
            participantId: verifiedUserId,
            sessionId: activeSession.id,
            day: 1,
            date: dateStr,
            checkInAt: now,
            checkInStatus,
            checkInQrToken: rawQrToken,
            xpAwarded,
          })
          .returning();

        // Transaksi XP
        if (targetTeamId) {
          await db.insert(scoreTransactions).values({
            participantId: verifiedUserId,
            teamId: targetTeamId,
            amount: xpAwarded,
            sourceType: "BONUS",
            reason: `${activeSession.title} (${checkInStatus === "ON_TIME" ? "Tepat Waktu" : "Terlambat"})`,
            createdBy: user?.userId || verifiedUserId,
          });
        }

        // Hitung total XP akumulatif peserta terkini
        const [totalRow] = await db
          .select({ total: sql<number>`COALESCE(SUM(${scoreTransactions.amount}), 0)` })
          .from(scoreTransactions)
          .where(eq(scoreTransactions.participantId, verifiedUserId));
        const currentTotalXp = Number(totalRow?.total || 0);

        broadcastLeaderboardUpdate({
          type: "ATTENDANCE_CHECK_IN",
          participantId: verifiedUserId,
          teamId: targetTeamId,
          status: checkInStatus,
          xpAwarded,
        });

        broadcastAdminEvent("ATTENDANCE_CHECK_IN", {
          participantId: verifiedUserId,
          participantName: participant.fullName,
          sessionTitle: activeSession.title,
          checkInStatus,
          time: now.toISOString(),
        });

        return {
          success: true,
          message: `Presensi Masuk "${activeSession.title}" berhasil! Mahasiswa memperoleh +${xpAwarded} XP (${checkInStatus === "ON_TIME" ? "Tepat Waktu" : "Terlambat"}).`,
          data: {
            ...attendanceRecord,
            participant: {
              id: participant.id,
              fullName: participant.fullName,
              username: participant.username,
            },
            xpAwarded,
            totalXp: currentTotalXp,
            checkInStatus,
            session: activeSession,
          },
        };
      } else {
        // Tipe CHECK_OUT (Kepulangan)
        [attendanceRecord] = await db
          .insert(attendances)
          .values({
            participantId: verifiedUserId,
            sessionId: activeSession.id,
            day: 1,
            date: dateStr,
            checkOutAt: now,
            checkOutQrToken: rawQrToken,
            xpAwarded,
          })
          .returning();

        // Transaksi XP
        if (targetTeamId) {
          await db.insert(scoreTransactions).values({
            participantId: verifiedUserId,
            teamId: targetTeamId,
            amount: xpAwarded,
            sourceType: "BONUS",
            reason: `${activeSession.title} (Check-Out Kepulangan)`,
            createdBy: user?.userId || verifiedUserId,
          });
        }

        // Hitung total XP akumulatif peserta terkini
        const [totalRow] = await db
          .select({ total: sql<number>`COALESCE(SUM(${scoreTransactions.amount}), 0)` })
          .from(scoreTransactions)
          .where(eq(scoreTransactions.participantId, verifiedUserId));
        const currentTotalXp = Number(totalRow?.total || 0);

        broadcastLeaderboardUpdate({
          type: "ATTENDANCE_CHECK_OUT",
          participantId: verifiedUserId,
          teamId: targetTeamId,
          xpAwarded,
        });

        broadcastAdminEvent("ATTENDANCE_CHECK_OUT", {
          participantId: verifiedUserId,
          participantName: participant.fullName,
          sessionTitle: activeSession.title,
          time: now.toISOString(),
        });

        return {
          success: true,
          message: `Presensi Pulang "${activeSession.title}" berhasil! Mahasiswa memperoleh bonus kepulangan +${xpAwarded} XP.`,
          data: {
            ...attendanceRecord,
            participant: {
              id: participant.id,
              fullName: participant.fullName,
              username: participant.username,
            },
            xpAwarded,
            totalXp: currentTotalXp,
            checkInStatus: "CHECKED_OUT",
            session: activeSession,
          },
        };
      }
    },
    {
      detail: {
        summary: "Universal Flexible Scan (Check-in/Check-out otomatis sesuai Sesi Aktif)",
      },
      body: t.Object({
        qrToken: t.Optional(t.String()),
        participantId: t.Optional(t.String()),
      }),
    }
  )

  // POST /api/attendance/check-in — Mahasiswa scan QR kedatangan pagi / Buddy presensi masuk manual
  .post(
    "/check-in",
    async ({ body, user, set }) => {
      const participantId = body.participantId || user?.userId;
      const { day, qrToken, status: customStatus } = body;

      const systemSettings = getSystemSettings();
      if (Number(day) !== systemSettings.activeDay && user?.role !== "ADMIN") {
        set.status = 403;
        return {
          success: false,
          error: {
            code: "DAY_INACTIVE",
            message: `Presensi Hari ${day} terkunci. Sistem saat ini berjalan pada Hari ${systemSettings.activeDay}.`,
          },
        };
      }

      if (!participantId) {
        set.status = 400;
        return { success: false, error: { code: "MISSING_PARTICIPANT", message: "ID Peserta wajib disertakan" } };
      }

      // 1. Verifikasi eksistensi pengguna
      const [participant] = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, participantId))
        .limit(1);

      if (!participant) {
        set.status = 404;
        return { success: false, error: { code: "USER_NOT_FOUND", message: "Data mahasiswa tidak ditemukan" } };
      }

      // 2. Cari kelompok peserta (jika ada) untuk update leaderboard regu
      const [membership] = await db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.userId, participantId))
        .limit(1);

      let targetTeamId = membership?.teamId;
      if (!targetTeamId) {
        const [defaultTeam] = await db.select({ id: teams.id }).from(teams).limit(1);
        if (defaultTeam) targetTeamId = defaultTeam.id;
      }

      // 3. Validasi token QR gerbang (Panitia/Buddy bebas token atau token manual)
      const isStaff = user && (user.role === "ADMIN" || user.role === "BUDDY");
      const effectiveToken = qrToken?.trim() || (isStaff ? `MANUAL-BUDDY-H${day}` : "");
      const upperToken = effectiveToken.toUpperCase();
      const isValidToken =
        isStaff ||
        upperToken.includes("PRESENSI") ||
        upperToken.includes(`H${day}`) ||
        upperToken.startsWith("QR-PRESENSI") ||
        upperToken.includes("GATE") ||
        upperToken.includes("BUDDY") ||
        upperToken.includes("MANUAL");

      if (!isValidToken) {
        set.status = 400;
        return {
          success: false,
          error: {
            code: "INVALID_QR_TOKEN",
            message: `Token QR tidak valid untuk presensi Hari ${day}. Pastikan memindai QR resmi di gerbang.`,
          },
        };
      }

      // 4. Cek apakah mahasiswa sudah presensi pada hari ini
      const [existing] = await db
        .select()
        .from(attendances)
        .where(and(eq(attendances.participantId, participantId), eq(attendances.day, day)))
        .limit(1);

      if (existing?.checkInAt) {
        set.status = 400;
        return {
          success: false,
          error: {
            code: "ALREADY_CHECKED_IN",
            message: `Mahasiswa sudah melakukan presensi masuk pada Hari ke-${day}.`,
          },
        };
      }

      // 5. Kalkulasi status ketepatan waktu (Batas standar: 07:30 WIB atau override manual oleh Buddy)
      const now = new Date();
      let checkInStatus: "ON_TIME" | "LATE" = "ON_TIME";
      if (customStatus === "LATE" || customStatus === "ON_TIME") {
        checkInStatus = customStatus;
      } else {
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const isLate = hours > 7 || (hours === 7 && minutes > 30);
        checkInStatus = isLate ? "LATE" : "ON_TIME";
      }

      const xpAwarded = checkInStatus === "LATE" ? 50 : 100;
      const dateStr = now.toISOString().split("T")[0];

      // 6. Simpan atau perbarui record attendances
      let attendanceRecord;
      if (existing) {
        [attendanceRecord] = await db
          .update(attendances)
          .set({
            checkInAt: now,
            checkInStatus,
            checkInQrToken: effectiveToken,
            xpAwarded: (existing.xpAwarded || 0) + xpAwarded,
          })
          .where(eq(attendances.id, existing.id))
          .returning();
      } else {
        [attendanceRecord] = await db
          .insert(attendances)
          .values({
            participantId,
            day,
            date: dateStr,
            checkInAt: now,
            checkInStatus,
            checkInQrToken: effectiveToken,
            xpAwarded,
          })
          .returning();
      }

      // 7. Catat transaksi skor XP ke ledger
      if (targetTeamId) {
        await db.insert(scoreTransactions).values({
          participantId,
          teamId: targetTeamId,
          amount: xpAwarded,
          sourceType: "BONUS",
          reason: `Presensi Masuk Hari ${day} (${checkInStatus === "ON_TIME" ? "Tepat Waktu" : "Terlambat"})`,
          createdBy: user?.userId || participantId,
        });
      }

      // 8. Hitung total XP akumulatif peserta terkini
      const [totalRow] = await db
        .select({ total: sql<number>`COALESCE(SUM(${scoreTransactions.amount}), 0)` })
        .from(scoreTransactions)
        .where(eq(scoreTransactions.participantId, participantId));
      const currentTotalXp = Number(totalRow?.total || 0);

      // 9. Broadcast pembaruan live skor ke WebSocket
      broadcastAttendanceEvent("ATTENDANCE_CHECK_IN", {
        participantId,
        teamId: targetTeamId,
        day,
        status: checkInStatus,
        xpAwarded,
        totalXp: currentTotalXp,
      });

      // Cari nama buddy/giver jika ada
      let checkInGiverName = "Game Master Buddy";
      let checkInGiverRole = "Buddy Pendamping";
      if (user?.userId) {
        const [giver] = await db
          .select({ fullName: users.fullName, role: users.role })
          .from(users)
          .where(eq(users.id, user.userId))
          .limit(1);
        if (giver?.fullName) checkInGiverName = giver.fullName;
        if (giver?.role === "ADMIN") checkInGiverRole = "Admin Pusat";
      }

      broadcastXpCelebration(participantId, {
        type: "ATTENDANCE_IN",
        title: `Presensi Masuk Hari ${day}`,
        giverName: checkInGiverName,
        giverRole: checkInGiverRole,
        xp: xpAwarded,
        totalXp: currentTotalXp,
        message: `Presensi masuk ${checkInStatus === "ON_TIME" ? "Tepat Waktu" : "Terlambat"} berhasil dicatat!`,
        icon: "CheckCircle",
      });

      broadcastLeaderboardUpdate({
        type: "ATTENDANCE_CHECK_IN",
        participantId,
        teamId: targetTeamId,
        day,
        status: checkInStatus,
        xpAwarded,
      });

      broadcastAdminEvent("ATTENDANCE_CHECK_IN", {
        participantId,
        participantName: participant.fullName,
        day,
        checkInStatus,
        xpAwarded,
        totalXp: currentTotalXp,
        time: now.toISOString(),
      });

      return {
        success: true,
        message: `Presensi masuk Hari ${day} berhasil! Anda memperoleh +${xpAwarded} XP (${checkInStatus === "ON_TIME" ? "Tepat Waktu" : "Terlambat"}).`,
        data: {
          ...attendanceRecord,
          totalXp: currentTotalXp,
          xpAwarded,
          checkInStatus,
        },
      };
    },
    {
      detail: {
        summary: "Check-in presensi gerbang pagi (Anti-Titip Absen +100 XP)",
        description: "Validasi token QR gerbang pagi, mencegah presensi ganda di hari yang sama, menghitung status ON_TIME / LATE, serta menginjeksi +100 XP ke leaderboard.",
      },
      body: t.Object({
        participantId: t.Optional(t.String()),
        day: t.Number({ minimum: 1, maximum: 3 }),
        qrToken: t.Optional(t.String()),
        status: t.Optional(t.String()),
      }),
    }
  )

  // POST /api/attendance/check-out — Mahasiswa scan QR kepulangan sore / Buddy presensi pulang manual
  .post(
    "/check-out",
    async ({ body, user, set }) => {
      const participantId = body.participantId || user?.userId;
      const { day, qrToken } = body;

      const systemSettings = getSystemSettings();
      if (Number(day) !== systemSettings.activeDay && user?.role !== "ADMIN") {
        set.status = 403;
        return {
          success: false,
          error: {
            code: "DAY_INACTIVE",
            message: `Presensi Pulang Hari ${day} terkunci. Sistem saat ini berjalan pada Hari ${systemSettings.activeDay}.`,
          },
        };
      }

      if (!participantId) {
        set.status = 400;
        return { success: false, error: { code: "MISSING_PARTICIPANT", message: "ID Peserta wajib disertakan" } };
      }

      // 1. Verifikasi eksistensi pengguna
      const [participant] = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, participantId))
        .limit(1);

      if (!participant) {
        set.status = 404;
        return { success: false, error: { code: "USER_NOT_FOUND", message: "Data mahasiswa tidak ditemukan" } };
      }

      // 2. Ambil kelompok
      const [membership] = await db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.userId, participantId))
        .limit(1);

      let targetTeamId = membership?.teamId;
      if (!targetTeamId) {
        const [defaultTeam] = await db.select({ id: teams.id }).from(teams).limit(1);
        if (defaultTeam) targetTeamId = defaultTeam.id;
      }

      // 3. Cek riwayat presensi masuk
      const isStaff = user && (user.role === "ADMIN" || user.role === "BUDDY");
      let [existing] = await db
        .select()
        .from(attendances)
        .where(and(eq(attendances.participantId, participantId), eq(attendances.day, day)))
        .limit(1);

      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];

      if (!existing || !existing.checkInAt) {
        set.status = 400;
        return {
          success: false,
          error: {
            code: "NOT_CHECKED_IN",
            message: `Mahasiswa belum melakukan presensi masuk pada Hari ke-${day}. Silakan lakukan presensi masuk (Hadir atau Telat) terlebih dahulu.`,
          },
        };
      }

      if (existing.checkOutAt) {
        set.status = 400;
        return {
          success: false,
          error: {
            code: "ALREADY_CHECKED_OUT",
            message: `Mahasiswa sudah melakukan presensi pulang pada Hari ke-${day}.`,
          },
        };
      }

      // 4. Validasi token QR gerbang kepulangan
      const effectiveToken = qrToken?.trim() || (isStaff ? `MANUAL-BUDDY-PULANG-H${day}` : "");
      const upperToken = effectiveToken.toUpperCase();
      const isValidToken =
        isStaff ||
        upperToken.includes("PRESENSI") ||
        upperToken.includes(`H${day}`) ||
        upperToken.includes("CHECKOUT") ||
        upperToken.includes("PULANG") ||
        upperToken.includes("BUDDY") ||
        upperToken.includes("MANUAL") ||
        upperToken.startsWith("QR-PRESENSI");

      if (!isValidToken) {
        set.status = 400;
        return {
          success: false,
          error: {
            code: "INVALID_QR_TOKEN",
            message: `Token QR tidak valid untuk presensi pulang Hari ${day}. Pastikan memindai QR resmi di gerbang kepulangan.`,
          },
        };
      }

      const xpAwarded = 50;

      // 5. Update waktu pulang & xpAwarded
      const [updatedRecord] = await db
        .update(attendances)
        .set({
          checkOutAt: now,
          checkOutQrToken: effectiveToken,
          xpAwarded: (existing.xpAwarded || 0) + xpAwarded,
        })
        .where(eq(attendances.id, existing.id))
        .returning();

      // 6. Catat transaksi skor +50 XP
      if (targetTeamId) {
        await db.insert(scoreTransactions).values({
          participantId,
          teamId: targetTeamId,
          amount: xpAwarded,
          sourceType: "BONUS",
          reason: `Presensi Pulang Hari ${day}`,
          createdBy: user?.userId || participantId,
        });
      }

      // 7. Hitung total XP akumulatif peserta terkini
      const [totalRow] = await db
        .select({ total: sql<number>`COALESCE(SUM(${scoreTransactions.amount}), 0)` })
        .from(scoreTransactions)
        .where(eq(scoreTransactions.participantId, participantId));
      const currentTotalXp = Number(totalRow?.total || 0);

      // 8. Broadcast live update
      broadcastAttendanceEvent("ATTENDANCE_CHECK_OUT", {
        participantId,
        teamId: targetTeamId,
        day,
        xpAwarded,
        totalXp: currentTotalXp,
      });

      // Cari nama buddy/giver jika ada
      let checkOutGiverName = "Game Master Buddy";
      let checkOutGiverRole = "Buddy Pendamping";
      if (user?.userId) {
        const [giver] = await db
          .select({ fullName: users.fullName, role: users.role })
          .from(users)
          .where(eq(users.id, user.userId))
          .limit(1);
        if (giver?.fullName) checkOutGiverName = giver.fullName;
        if (giver?.role === "ADMIN") checkOutGiverRole = "Admin Pusat";
      }

      broadcastXpCelebration(participantId, {
        type: "ATTENDANCE_OUT",
        title: `Presensi Pulang Hari ${day}`,
        giverName: checkOutGiverName,
        giverRole: checkOutGiverRole,
        xp: xpAwarded,
        totalXp: currentTotalXp,
        message: `Presensi pulang & evaluasi hari ke-${day} berhasil dicatat!`,
        icon: "CheckCircle",
      });

      broadcastLeaderboardUpdate({
        type: "ATTENDANCE_CHECK_OUT",
        participantId,
        teamId: targetTeamId,
        day,
        xpAwarded,
      });

      broadcastAdminEvent("ATTENDANCE_CHECK_OUT", {
        participantId,
        participantName: participant.fullName,
        day,
        xpAwarded,
        totalXp: currentTotalXp,
        time: now.toISOString(),
      });

      return {
        success: true,
        message: `Presensi pulang Hari ${day} berhasil! Mahasiswa memperoleh bonus kepulangan +${xpAwarded} XP.`,
        data: {
          ...updatedRecord,
          totalXp: currentTotalXp,
          xpAwarded,
        },
      };
    },
    {
      detail: {
        summary: "Check-out presensi kepulangan sore (+50 XP)",
        description: "Mencatat waktu kepulangan mahasiswa dan memberikan bonus presensi kepulangan +50 XP.",
      },
      body: t.Object({
        participantId: t.Optional(t.String()),
        day: t.Number({ minimum: 1, maximum: 3 }),
        qrToken: t.Optional(t.String()),
      }),
    }
  )

  // GET /api/attendance/status/:participantId — Cek status presensi seluruh hari atau hari tertentu
  .get(
    "/status/:participantId",
    async ({ params, query }) => {
      const { participantId } = params;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(participantId);

      let resolvedUserId = participantId;
      if (!isUuid) {
        const [u] = await db.select({ id: users.id }).from(users).where(eq(users.username, participantId)).limit(1);
        if (u) resolvedUserId = u.id;
      }

      const records = await db
        .select()
        .from(attendances)
        .where(eq(attendances.participantId, resolvedUserId));

      const daysMap: Record<number, any> = {};
      for (const d of [1, 2, 3]) {
        const found = records.find((r) => r.day === d);
        if (found) {
          daysMap[d] = {
            ...found,
            hasCheckedIn: !!found.checkInAt,
            hasCheckedOut: !!found.checkOutAt,
          };
        } else {
          daysMap[d] = {
            day: d,
            hasCheckedIn: false,
            hasCheckedOut: false,
            checkInAt: null,
            checkOutAt: null,
            checkInStatus: "ABSENT",
            reflectionSubmitted: false,
            xpAwarded: 0,
          };
        }
      }

      if (query.day) {
        const day = Number(query.day);
        const record = daysMap[day];
        return {
          success: true,
          data: record,
        };
      }

      return {
        success: true,
        data: {
          days: daysMap,
          records,
        },
      };
    },
    {
      detail: {
        summary: "Cek status presensi harian mahasiswa",
        description: "Mengembalikan detail status presensi masuk dan pulang mahasiswa pada hari yang diminta atau seluruh hari.",
      },
      params: t.Object({ participantId: t.String() }),
      query: t.Object({ day: t.Optional(t.String()) }),
    }
  )

  // GET /api/attendance/recap — Rekapitulasi kehadiran untuk admin & buddy
  .get(
    "/recap",
    async ({ query, user }) => {
      await getOrCreateDefaultSessions();
      const activeSession = (await db.select().from(attendanceSessions).where(eq(attendanceSessions.isActive, true)).limit(1))[0] || null;
      const allSessions = await db.select().from(attendanceSessions).orderBy(desc(attendanceSessions.createdAt));

      const isStaff = user && (user.role === "ADMIN" || user.role === "BUDDY");
      const sanitizeSession = (s: any) => {
        if (!s) return s;
        if (isStaff) return s;
        const { qrToken, ...rest } = s;
        return rest;
      };

      const day = query.day ? Number(query.day) : 1;
      const targetSessionId = query.sessionId || null;

      // Filter condition: jika query.sessionId diberikan secara eksplisit, gunakan targetSessionId. Jika tidak, filter berdasarkan day!
      const filterCondition = targetSessionId
        ? eq(attendances.sessionId, targetSessionId)
        : eq(attendances.day, day);

      // Agregasi jumlah status check-in
      const stats = await db
        .select({
          status: attendances.checkInStatus,
          count: sql<number>`count(*)`,
        })
        .from(attendances)
        .where(filterCondition)
        .groupBy(attendances.checkInStatus);

      // Hitung total maba yang sudah checkout pulang
      const checkedOutCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(attendances)
        .where(and(filterCondition, sql`${attendances.checkOutAt} IS NOT NULL`));
      const totalCheckedOut = Number(checkedOutCount[0]?.count || 0);

      // Daftar presensi terakhir
      const list = await db
        .select({
          id: attendances.id,
          participantId: attendances.participantId,
          sessionId: attendances.sessionId,
          fullName: users.fullName,
          username: users.username,
          characterClass: users.characterClass,
          day: attendances.day,
          checkInAt: attendances.checkInAt,
          checkInStatus: attendances.checkInStatus,
          checkOutAt: attendances.checkOutAt,
          xpAwarded: attendances.xpAwarded,
          reflectionSubmitted: attendances.reflectionSubmitted,
          teamName: teams.name,
        })
        .from(attendances)
        .innerJoin(users, eq(attendances.participantId, users.id))
        .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
        .leftJoin(teams, eq(teamMembers.teamId, teams.id))
        .where(filterCondition)
        .orderBy(desc(attendances.checkInAt), desc(attendances.checkOutAt), desc(attendances.createdAt))
        .limit(300);

      const totalCheckedIn = list.length;
      const onTimeCount = stats.find((s) => s.status === "ON_TIME")?.count || 0;
      const lateCount = stats.find((s) => s.status === "LATE")?.count || 0;

      const currentSessionInfo = targetSessionId
        ? allSessions.find((s) => s.id === targetSessionId) || activeSession
        : activeSession;

      return {
        success: true,
        data: {
          day,
          sessionId: targetSessionId,
          activeSession: sanitizeSession(activeSession),
          currentSession: sanitizeSession(currentSessionInfo),
          sessions: allSessions.map(sanitizeSession),
          summary: {
            totalCheckedIn: Number(totalCheckedIn),
            totalCheckedOut,
            onTime: Number(onTimeCount),
            late: Number(lateCount),
          },
          attendees: list,
        },
      };
    },
    {
      detail: {
        summary: "Rekapitulasi kehadiran panitia & buddy per sesi aktif atau per hari",
        description: "Menghasilkan statistik jumlah kehadiran (tepat waktu, terlambat, checkout) dan daftar mahasiswa yang telah hadir.",
      },
      query: t.Object({
        day: t.Optional(t.String()),
        sessionId: t.Optional(t.String()),
      }),
    }
  )

  // POST /api/attendance/batch-check-in — Batch check-in for participants
  .post(
    "/batch-check-in",
    async ({ body, user }) => {
      const { participantIds, day = 1, sessionId, status = "ON_TIME" } = body;
      if (!participantIds || participantIds.length === 0) {
        return { success: true, count: 0 };
      }

      // Cari sesi jika ada
      let session;
      if (sessionId) {
        [session] = await db.select().from(attendanceSessions).where(eq(attendanceSessions.id, sessionId)).limit(1);
      } else {
        [session] = await db.select().from(attendanceSessions).where(eq(attendanceSessions.isActive, true)).limit(1);
      }

      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const xpAwarded = status === "LATE" ? 50 : (session?.xpReward || 100);
      const targetSessionId = session?.id || sessionId || null;

      for (const participantId of participantIds) {
        const queryCondition = targetSessionId
          ? and(eq(attendances.participantId, participantId), eq(attendances.sessionId, targetSessionId))
          : and(eq(attendances.participantId, participantId), eq(attendances.day, day));

        const [existing] = await db
          .select()
          .from(attendances)
          .where(queryCondition)
          .limit(1);

        const hadCheckedIn = Boolean(existing?.checkInAt);

        if (existing) {
          await db
            .update(attendances)
            .set({
              checkInAt: existing.checkInAt || now,
              checkInStatus: status as any,
              xpAwarded: (existing.xpAwarded || 0) + (hadCheckedIn ? 0 : xpAwarded),
            })
            .where(eq(attendances.id, existing.id));
        } else {
          await db.insert(attendances).values({
            participantId,
            sessionId: targetSessionId,
            day,
            date: dateStr,
            checkInAt: now,
            checkInStatus: status as any,
            xpAwarded,
          });
        }

        // Catat XP ke ledger jika baru pertama kali check-in
        if (!hadCheckedIn) {
          const [membership] = await db
            .select({ teamId: teamMembers.teamId })
            .from(teamMembers)
            .where(eq(teamMembers.userId, participantId))
            .limit(1);

          let teamId = membership?.teamId;
          if (!teamId) {
            const [defaultTeam] = await db.select({ id: teams.id }).from(teams).limit(1);
            if (defaultTeam) teamId = defaultTeam.id;
          }

          if (teamId) {
            await db.insert(scoreTransactions).values({
              participantId,
              teamId,
              amount: xpAwarded,
              sourceType: "BONUS",
              reason: `Presensi Masuk Hari ${day} (${status === "ON_TIME" ? "Tepat Waktu" : "Terlambat"})`,
              createdBy: user?.userId || participantId,
            });

            broadcastLeaderboardUpdate({
              type: "ATTENDANCE_CHECK_IN",
              participantId,
              teamId,
              day,
              status,
              xpAwarded,
            });
          }
        }
      }

      broadcastAdminEvent("ATTENDANCE_BATCH_CHECK_IN", {
        count: participantIds.length,
        day,
        status,
        time: now.toISOString(),
      });

      return {
        success: true,
        message: `Presensi masuk ${participantIds.length} mahasiswa berhasil dicatat (${status === "ON_TIME" ? "Tepat Waktu" : "Terlambat"})`,
        count: participantIds.length,
      };
    },
    {
      body: t.Object({
        participantIds: t.Array(t.String()),
        day: t.Optional(t.Number()),
        sessionId: t.Optional(t.String()),
        status: t.Optional(t.String()),
      }),
    }
  )

  // POST /api/attendance/batch-check-out — Batch check-out for participants
  .post(
    "/batch-check-out",
    async ({ body, user }) => {
      const { participantIds, day = 1, sessionId } = body;
      if (!participantIds || participantIds.length === 0) {
        return { success: true, count: 0 };
      }
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const xpAwarded = 50;

      for (const participantId of participantIds) {
        const condition = sessionId
          ? and(eq(attendances.participantId, participantId), eq(attendances.sessionId, sessionId))
          : and(eq(attendances.participantId, participantId), eq(attendances.day, day));

        let [existing] = await db
          .select()
          .from(attendances)
          .where(condition)
          .limit(1);

        // Jika belum check-in sama sekali, auto-checkin dulu
        if (!existing || !existing.checkInAt) {
          if (existing) {
            [existing] = await db
              .update(attendances)
              .set({
                checkInAt: now,
                checkInStatus: "ON_TIME",
                checkOutAt: now,
                xpAwarded: (existing.xpAwarded || 0) + 150,
              })
              .where(eq(attendances.id, existing.id))
              .returning();
          } else {
            [existing] = await db
              .insert(attendances)
              .values({
                participantId,
                day,
                date: dateStr,
                checkInAt: now,
                checkInStatus: "ON_TIME",
                checkOutAt: now,
                xpAwarded: 150,
              })
              .returning();
          }

          const [membership] = await db
            .select({ teamId: teamMembers.teamId })
            .from(teamMembers)
            .where(eq(teamMembers.userId, participantId))
            .limit(1);

          let teamId = membership?.teamId;
          if (!teamId) {
            const [defaultTeam] = await db.select({ id: teams.id }).from(teams).limit(1);
            if (defaultTeam) teamId = defaultTeam.id;
          }

          if (teamId) {
            await db.insert(scoreTransactions).values({
              participantId,
              teamId,
              amount: 100,
              sourceType: "BONUS",
              reason: `Presensi Masuk Hari ${day} (Auto Check-In)`,
              createdBy: user?.userId || participantId,
            });
            await db.insert(scoreTransactions).values({
              participantId,
              teamId,
              amount: 50,
              sourceType: "BONUS",
              reason: `Presensi Pulang Hari ${day}`,
              createdBy: user?.userId || participantId,
            });
          }
        } else if (!existing.checkOutAt) {
          // Hanya jika belum check-out
          await db
            .update(attendances)
            .set({
              checkOutAt: now,
              xpAwarded: (existing.xpAwarded || 0) + xpAwarded,
            })
            .where(eq(attendances.id, existing.id));

          const [membership] = await db
            .select({ teamId: teamMembers.teamId })
            .from(teamMembers)
            .where(eq(teamMembers.userId, participantId))
            .limit(1);

          let teamId = membership?.teamId;
          if (!teamId) {
            const [defaultTeam] = await db.select({ id: teams.id }).from(teams).limit(1);
            if (defaultTeam) teamId = defaultTeam.id;
          }

          if (teamId) {
            await db.insert(scoreTransactions).values({
              participantId,
              teamId,
              amount: xpAwarded,
              sourceType: "BONUS",
              reason: `Presensi Pulang Hari ${day}`,
              createdBy: user?.userId || participantId,
            });
          }
        }

        broadcastLeaderboardUpdate({
          type: "ATTENDANCE_CHECK_OUT",
          participantId,
          day,
          xpAwarded,
        });
      }

      broadcastAdminEvent("ATTENDANCE_BATCH_CHECK_OUT", {
        count: participantIds.length,
        day,
        time: now.toISOString(),
      });

      return {
        success: true,
        message: `Check-out kepulangan ${participantIds.length} mahasiswa berhasil dicatat`,
        count: participantIds.length,
      };
    },
    {
      body: t.Object({
        participantIds: t.Array(t.String()),
        day: t.Optional(t.Number()),
        sessionId: t.Optional(t.String()),
      }),
    }
  )

  // POST /api/attendance/batch-reset — Batch reset attendance for participants
  .post(
    "/batch-reset",
    async ({ body }) => {
      const { participantIds, day = 1, sessionId } = body;
      if (!participantIds || participantIds.length === 0) {
        return { success: true, count: 0 };
      }

      const condition = sessionId
        ? and(inArray(attendances.participantId, participantIds), eq(attendances.sessionId, sessionId))
        : and(inArray(attendances.participantId, participantIds), eq(attendances.day, day));

      await db
        .delete(attendances)
        .where(condition);

      return {
        success: true,
        message: `Data presensi ${participantIds.length} mahasiswa berhasil di-reset`,
        count: participantIds.length,
      };
    },
    {
      body: t.Object({
        participantIds: t.Array(t.String()),
        day: t.Optional(t.Number()),
        sessionId: t.Optional(t.String()),
      }),
    }
  );
