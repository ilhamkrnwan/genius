import { Elysia, t } from "elysia";
import { db } from "../db";
import { ormawaBooths, ormawaScans, ormawaInterests, users, teams, teamMembers, scoreTransactions, floors } from "../db/schema";
import { eq, and, sql, desc, or, ilike, inArray } from "drizzle-orm";
import { authMiddleware, requireAdmin, requireOrmawaOrAdmin, requireUser } from "../middleware/auth";
import { broadcastLeaderboardUpdate, broadcastAdminEvent } from "../realtime";
import {
  normalizeInstagramUsername,
  ORMAWA_INTEREST_XP,
  ORMAWA_STAMP_XP,
  validateOrmawaLogoDataUrl,
} from "../domain/ormawa";

function normalizeWhatsappNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

function parseMabaQrIdentifier(raw: string): string {
  const value = raw.trim();
  const match = value.match(/^GENIUS-MABA(?::|-)([A-Za-z0-9._-]+)$/i);
  return (match?.[1] || value).trim();
}

export const ormawaRoutes = new Elysia({
  prefix: "/api/ormawa",
  detail: {
    tags: ["Ormawa & UKM Expo"],
  },
})
  .use(authMiddleware)

  // GET /api/ormawa/booths — Ambil daftar seluruh stan UKM & Ormawa (dengan jumlah pengunjung & QR code)
  .get(
    "/booths",
    async ({ query }) => {
      const category = query.category;
      const includeInactive = query.includeInactive === "true";

      // Subquery untuk menghitung total pengunjung per stan
      const visitorCountSubquery = db
        .select({
          boothId: ormawaScans.boothId,
          visitorCount: sql<number>`count(${ormawaScans.id})`.as("visitor_count"),
        })
        .from(ormawaScans)
        .groupBy(ormawaScans.boothId)
        .as("sq_visitors");

      let q = db
        .select({
          id: ormawaBooths.id,
          code: ormawaBooths.code,
          name: ormawaBooths.name,
          shortName: ormawaBooths.shortName,
          category: ormawaBooths.category,
          floorId: ormawaBooths.floorId,
          floorNumber: floors.number,
          floorName: floors.name,
          boothNumber: ormawaBooths.boothNumber,
          tagline: ormawaBooths.tagline,
          description: ormawaBooths.description,
          activities: ormawaBooths.activities,
          requirements: ormawaBooths.requirements,
          stampInstructions: ormawaBooths.stampInstructions,
          qrCode: ormawaBooths.qrCode,
          xpReward: ormawaBooths.xpReward,
          badgeIcon: ormawaBooths.badgeIcon,
          badgeColor: ormawaBooths.badgeColor,
          contactPerson: ormawaBooths.contactPerson,
          contactPhone: ormawaBooths.contactPhone,
          instagram: ormawaBooths.instagram,
          logoUrl: ormawaBooths.logoUrl,
          isActive: ormawaBooths.isActive,
          visitorCount: sql<number>`COALESCE(${visitorCountSubquery.visitorCount}, 0)`.as("visitor_count"),
          createdAt: ormawaBooths.createdAt,
        })
        .from(ormawaBooths)
        .leftJoin(floors, eq(ormawaBooths.floorId, floors.id))
        .leftJoin(visitorCountSubquery, eq(ormawaBooths.id, visitorCountSubquery.boothId))
        .$dynamic();

      const conditions = [];
      if (!includeInactive) {
        conditions.push(eq(ormawaBooths.isActive, true));
      }
      if (category) {
        conditions.push(eq(ormawaBooths.category, category));
      }

      if (conditions.length > 0) {
        q = q.where(and(...conditions));
      }

      const list = await q.orderBy(floors.number, ormawaBooths.boothNumber, ormawaBooths.name);

      return {
        success: true,
        data: list.map((item) => ({
          ...item,
          visitorCount: Number(item.visitorCount || 0),
        })),
      };
    },
    {
      detail: {
        summary: "Katalog seluruh stan UKM & Ormawa Expo",
        description: "Menampilkan daftar stan UKM aktif di lantai 3-5 lengkap dengan kategori, QR code token, dan jumlah kunjungan maba.",
      },
      query: t.Object({
        category: t.Optional(t.String()),
        includeInactive: t.Optional(t.String()),
      }),
    }
  )

  // GET /api/ormawa/booths/:id — Detail satu stan spesifik
  .get(
    "/booths/:id",
    async ({ params, set }) => {
      const [booth] = await db
        .select({
          id: ormawaBooths.id,
          code: ormawaBooths.code,
          name: ormawaBooths.name,
          shortName: ormawaBooths.shortName,
          category: ormawaBooths.category,
          floorId: ormawaBooths.floorId,
          floorNumber: floors.number,
          floorName: floors.name,
          boothNumber: ormawaBooths.boothNumber,
          tagline: ormawaBooths.tagline,
          description: ormawaBooths.description,
          activities: ormawaBooths.activities,
          requirements: ormawaBooths.requirements,
          stampInstructions: ormawaBooths.stampInstructions,
          qrCode: ormawaBooths.qrCode,
          xpReward: ormawaBooths.xpReward,
          badgeIcon: ormawaBooths.badgeIcon,
          badgeColor: ormawaBooths.badgeColor,
          contactPerson: ormawaBooths.contactPerson,
          contactPhone: ormawaBooths.contactPhone,
          instagram: ormawaBooths.instagram,
          logoUrl: ormawaBooths.logoUrl,
          isActive: ormawaBooths.isActive,
          createdAt: ormawaBooths.createdAt,
        })
        .from(ormawaBooths)
        .leftJoin(floors, eq(ormawaBooths.floorId, floors.id))
        .where(eq(ormawaBooths.id, params.id))
        .limit(1);

      if (!booth) {
        set.status = 404;
        return { success: false, error: { code: "NOT_FOUND", message: "Stan Ormawa tidak ditemukan" } };
      }

      const [visitors] = await db
        .select({ count: sql<number>`count(*)` })
        .from(ormawaScans)
        .where(eq(ormawaScans.boothId, params.id));

      return {
        success: true,
        data: {
          ...booth,
          visitorCount: Number(visitors?.count || 0),
        },
      };
    },
    {
      params: t.Object({ id: t.String() }),
    }
  )

  // GET /api/ormawa/my-booth — PIC ambil data stannya sendiri (atau Admin memilih stan)
  .get(
    "/my-booth",
    async ({ user, set, query }: any) => {
      if (user?.role !== "ORMAWA_PIC" && user?.role !== "ADMIN") {
        set.status = 403;
        return { success: false, error: { code: "FORBIDDEN", message: "Hanya PIC Ormawa atau Admin yang dapat mengakses" } };
      }

      let boothCondition;
      if (user?.role === "ADMIN" && query?.boothId) {
        const isBoothIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.boothId);
        boothCondition = isBoothIdUuid ? eq(ormawaBooths.id, query.boothId) : eq(ormawaBooths.code, query.boothId);
      } else if (user?.role === "ADMIN") {
        boothCondition = eq(ormawaBooths.isActive, true);
      } else {
        boothCondition = eq(ormawaBooths.picUserId, user.userId);
      }

      const [booth] = await db
        .select({
          id: ormawaBooths.id,
          code: ormawaBooths.code,
          name: ormawaBooths.name,
          shortName: ormawaBooths.shortName,
          category: ormawaBooths.category,
          floorId: ormawaBooths.floorId,
          qrCode: ormawaBooths.qrCode,
          floorNumber: floors.number,
          floorName: floors.name,
          boothNumber: ormawaBooths.boothNumber,
          tagline: ormawaBooths.tagline,
          description: ormawaBooths.description,
          activities: ormawaBooths.activities,
          requirements: ormawaBooths.requirements,
          stampInstructions: ormawaBooths.stampInstructions,
          xpReward: ormawaBooths.xpReward,
          badgeIcon: ormawaBooths.badgeIcon,
          badgeColor: ormawaBooths.badgeColor,
          contactPerson: ormawaBooths.contactPerson,
          contactPhone: ormawaBooths.contactPhone,
          instagram: ormawaBooths.instagram,
          logoUrl: ormawaBooths.logoUrl,
          isActive: ormawaBooths.isActive,
        })
        .from(ormawaBooths)
        .leftJoin(floors, eq(ormawaBooths.floorId, floors.id))
        .where(boothCondition)
        .limit(1);

      // Ambil daftar seluruh stan aktif jika ADMIN agar bisa berpindah stan di scanner
      let allBooths: any[] = [];
      if (user?.role === "ADMIN") {
        allBooths = await db
          .select({
            id: ormawaBooths.id,
            name: ormawaBooths.name,
            code: ormawaBooths.code,
            category: ormawaBooths.category,
            floorNumber: floors.number,
          })
          .from(ormawaBooths)
          .leftJoin(floors, eq(ormawaBooths.floorId, floors.id))
          .where(eq(ormawaBooths.isActive, true))
          .orderBy(floors.number, ormawaBooths.name);
      }

      if (!booth) {
        set.status = 404;
        return { success: false, error: { code: "NOT_FOUND", message: "Stan tidak ditemukan untuk akun ini" } };
      }

      return { success: true, data: { ...booth, allBooths } };
    },
    {
      detail: { summary: "Data stan PIC Ormawa atau Admin yang sedang login" },
      query: t.Optional(t.Object({
        boothId: t.Optional(t.String()),
      })),
    }
  )

  // PUT /api/ormawa/my-booth — PIC memperbarui konten kartu stan miliknya.
  .put(
    "/my-booth",
    async ({ body, user, set }: any) => {
      if (user?.role !== "ORMAWA_PIC") {
        set.status = 403;
        return { success: false, error: { code: "FORBIDDEN", message: "Hanya PIC Ormawa yang dapat mengubah profil stan" } };
      }

      const updates: Record<string, unknown> = {};
      const textFields = [
        "name", "shortName", "category", "boothNumber", "tagline", "description",
        "contactPerson", "contactPhone", "instagram", "logoUrl",
      ];
      for (const field of textFields) {
        if (body[field] !== undefined) {
          const value = typeof body[field] === "string" ? body[field].trim() : body[field];
          updates[field] = value || null;
        }
      }
      if (Array.isArray(body.activities)) updates.activities = body.activities.map((item: string) => item.trim()).filter(Boolean);
      if (Array.isArray(body.requirements)) updates.requirements = body.requirements.map((item: string) => item.trim()).filter(Boolean);
      if (Array.isArray(body.stampInstructions)) updates.stampInstructions = body.stampInstructions.map((item: string) => item.trim()).filter(Boolean);

      if (body.logoUrl !== undefined) {
        const logoError = validateOrmawaLogoDataUrl(body.logoUrl);
        if (logoError) {
          set.status = 400;
          return { success: false, error: { code: "INVALID_LOGO", message: logoError } };
        }
      }

      if (Object.keys(updates).length === 0) {
        set.status = 400;
        return { success: false, error: { code: "NO_CHANGES", message: "Tidak ada perubahan profil yang dikirim" } };
      }

      const [updated] = await db
        .update(ormawaBooths)
        .set(updates)
        .where(eq(ormawaBooths.picUserId, user.userId))
        .returning();

      if (!updated) {
        set.status = 404;
        return { success: false, error: { code: "NOT_FOUND", message: "Stan tidak ditemukan untuk akun PIC ini" } };
      }

      broadcastAdminEvent("ORMAWA_BOOTH_UPDATED", { boothId: updated.id, name: updated.name });
      return { success: true, message: "Informasi stan berhasil diperbarui", data: updated };
    },
    {
      use: requireOrmawaOrAdmin,
      body: t.Object({
        name: t.Optional(t.String({ minLength: 2 })),
        shortName: t.Optional(t.Nullable(t.String())),
        category: t.Optional(t.String({ minLength: 2 })),
        boothNumber: t.Optional(t.Nullable(t.String())),
        tagline: t.Optional(t.Nullable(t.String())),
        description: t.Optional(t.Nullable(t.String())),
        activities: t.Optional(t.Array(t.String())),
        requirements: t.Optional(t.Array(t.String())),
        stampInstructions: t.Optional(t.Array(t.String())),
        contactPerson: t.Optional(t.Nullable(t.String())),
        contactPhone: t.Optional(t.Nullable(t.String())),
        instagram: t.Optional(t.Nullable(t.String())),
        logoUrl: t.Optional(t.Nullable(t.String())),
      }),
      detail: { summary: "PIC mengubah informasi kartu stan miliknya" },
    }
  )

  // GET /api/ormawa/booths/:id/visitors — Rekap daftar siapa saja maba yang absen/scan stan ini
  .get(
    "/booths/:id/visitors",
    async ({ params, user, set }) => {
      const [booth] = await db
        .select({ id: ormawaBooths.id, name: ormawaBooths.name, code: ormawaBooths.code, picUserId: ormawaBooths.picUserId })
        .from(ormawaBooths)
        .where(eq(ormawaBooths.id, params.id))
        .limit(1);

      if (!booth) {
        set.status = 404;
        return { success: false, error: { code: "NOT_FOUND", message: "Stan Ormawa tidak ditemukan" } };
      }

      if (user?.role === "ORMAWA_PIC" && booth.picUserId !== user.userId) {
        set.status = 403;
        return { success: false, error: { code: "FORBIDDEN", message: "PIC hanya dapat melihat pengunjung stan miliknya" } };
      }

      const attendees = await db
        .select({
          scanId: ormawaScans.id,
          participantId: ormawaScans.participantId,
          fullName: users.fullName,
          username: users.username, // NIM
          avatarUrl: users.avatarUrl,
          gender: users.gender,
          characterClass: users.characterClass,
          characterTier: users.characterTier,
          teamId: teams.id,
          teamName: teams.name,
          teamCode: teams.code,
          xpEarned: ormawaScans.xpEarned,
          scannedAt: ormawaScans.scannedAt,
        })
        .from(ormawaScans)
        .innerJoin(users, eq(ormawaScans.participantId, users.id))
        .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
        .leftJoin(teams, eq(teamMembers.teamId, teams.id))
        .where(eq(ormawaScans.boothId, params.id))
        .orderBy(desc(ormawaScans.scannedAt));

      return {
        success: true,
        data: {
          booth,
          totalAttendees: attendees.length,
          attendees,
        },
      };
    },
    {
      use: requireOrmawaOrAdmin,
      detail: {
        summary: "Daftar mahasiswa yang hadir / absen di stan spesifik",
        description: "Menampilkan daftar seluruh mahasiswa (Nama, NIM, Tim, Waktu Scan, XP) yang telah mengunjungi stan ini.",
      },
      params: t.Object({ id: t.String() }),
    }
  )

  // GET /api/ormawa/visitors — Rekap arus log absensi seluruh stan Ormawa Expo
  .get(
    "/visitors",
    async ({ query }) => {
      const limit = Number(query.limit) || 100;

      const scans = await db
        .select({
          scanId: ormawaScans.id,
          participantId: ormawaScans.participantId,
          fullName: users.fullName,
          username: users.username, // NIM
          avatarUrl: users.avatarUrl,
          gender: users.gender,
          teamName: teams.name,
          boothId: ormawaBooths.id,
          boothName: ormawaBooths.name,
          boothCode: ormawaBooths.code,
          category: ormawaBooths.category,
          boothNumber: ormawaBooths.boothNumber,
          xpEarned: ormawaScans.xpEarned,
          scannedAt: ormawaScans.scannedAt,
        })
        .from(ormawaScans)
        .innerJoin(users, eq(ormawaScans.participantId, users.id))
        .innerJoin(ormawaBooths, eq(ormawaScans.boothId, ormawaBooths.id))
        .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
        .leftJoin(teams, eq(teamMembers.teamId, teams.id))
        .orderBy(desc(ormawaScans.scannedAt))
        .limit(limit);

      const [totalVisits] = await db
        .select({ total: sql<number>`count(*)` })
        .from(ormawaScans);

      return {
        success: true,
        data: {
          totalVisits: Number(totalVisits?.total || 0),
          scans,
        },
      };
    },
    {
      use: requireAdmin,
      detail: {
        summary: "Rekapitulasi log seluruh kunjungan mahasiswa ke stan expo",
      },
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
    }
  )

  // POST /api/ormawa/booths — Admin buat stan Ormawa baru
  .post(
    "/booths",
    async ({ body, user, set }: any) => {
      const code = body.code.toUpperCase().trim();
      const qrCode = (body.qrCode || `ORMAWA-QR-${code.replace(/[^A-Z0-9]/g, "-")}-UNU2026`).trim();

      const [existing] = await db
        .select({ id: ormawaBooths.id })
        .from(ormawaBooths)
        .where(or(eq(ormawaBooths.code, code), eq(ormawaBooths.qrCode, qrCode)))
        .limit(1);

      if (existing) {
        set.status = 409;
        return {
          success: false,
          error: { code: "CODE_EXISTS", message: "Kode stan atau QR Code stan sudah digunakan!" },
        };
      }

      const logoError = validateOrmawaLogoDataUrl(body.logoUrl);
      if (logoError) {
        set.status = 400;
        return { success: false, error: { code: "INVALID_LOGO", message: logoError } };
      }

      const [newBooth] = await db
        .insert(ormawaBooths)
        .values({
          code,
          name: body.name.trim(),
          shortName: body.shortName ? body.shortName.trim() : null,
          category: body.category.trim(),
          floorId: body.floorId || null,
          boothNumber: body.boothNumber ? body.boothNumber.trim() : null,
          tagline: body.tagline ? body.tagline.trim() : null,
          description: body.description ? body.description.trim() : null,
          activities: body.activities || [],
          requirements: body.requirements || [],
          stampInstructions: body.stampInstructions || [],
          qrCode,
          xpReward: body.xpReward ?? ORMAWA_STAMP_XP,
          badgeIcon: body.badgeIcon || "Shield",
          badgeColor: body.badgeColor || "#16a34a",
          contactPerson: body.contactPerson ? body.contactPerson.trim() : null,
          contactPhone: body.contactPhone ? body.contactPhone.trim() : null,
          instagram: body.instagram ? body.instagram.trim() : null,
          logoUrl: body.logoUrl ? body.logoUrl.trim() : null,
          isActive: body.isActive !== undefined ? body.isActive : true,
        })
        .returning();

      broadcastAdminEvent("ORMAWA_BOOTH_CREATED", {
        boothId: newBooth.id,
        name: newBooth.name,
        code: newBooth.code,
      });

      return {
        success: true,
        message: `Stan Ormawa '${newBooth.name}' berhasil ditambahkan!`,
        data: newBooth,
      };
    },
    {
      use: requireAdmin,
      detail: {
        summary: "Buat stan Ormawa / UKM baru (Admin Only)",
      },
      body: t.Object({
        code: t.String({ minLength: 2 }),
        name: t.String({ minLength: 2 }),
        shortName: t.Optional(t.Nullable(t.String())),
        category: t.String({ minLength: 2 }),
        floorId: t.Optional(t.Nullable(t.String())),
        boothNumber: t.Optional(t.Nullable(t.String())),
        tagline: t.Optional(t.Nullable(t.String())),
        description: t.Optional(t.Nullable(t.String())),
        activities: t.Optional(t.Array(t.String())),
        requirements: t.Optional(t.Array(t.String())),
        stampInstructions: t.Optional(t.Array(t.String())),
        qrCode: t.Optional(t.Nullable(t.String())),
        xpReward: t.Optional(t.Number()),
        badgeIcon: t.Optional(t.Nullable(t.String())),
        badgeColor: t.Optional(t.Nullable(t.String())),
        contactPerson: t.Optional(t.Nullable(t.String())),
        contactPhone: t.Optional(t.Nullable(t.String())),
        instagram: t.Optional(t.Nullable(t.String())),
        logoUrl: t.Optional(t.Nullable(t.String())),
        isActive: t.Optional(t.Boolean()),
      }),
    }
  )

  // PUT /api/ormawa/booths/:id — Admin perbarui data stan Ormawa
  .put(
    "/booths/:id",
    async ({ params, body, set }: any) => {
      const updates: Record<string, any> = {};
      if (body.name) updates.name = body.name.trim();
      if (body.shortName !== undefined) updates.shortName = body.shortName ? body.shortName.trim() : null;
      if (body.category) updates.category = body.category.trim();
      if (body.floorId !== undefined) updates.floorId = body.floorId || null;
      if (body.boothNumber !== undefined) updates.boothNumber = body.boothNumber ? body.boothNumber.trim() : null;
      if (body.tagline !== undefined) updates.tagline = body.tagline ? body.tagline.trim() : null;
      if (body.description !== undefined) updates.description = body.description ? body.description.trim() : null;
      if (body.activities !== undefined) updates.activities = body.activities.map((item: string) => item.trim()).filter(Boolean);
      if (body.requirements !== undefined) updates.requirements = body.requirements.map((item: string) => item.trim()).filter(Boolean);
      if (body.stampInstructions !== undefined) updates.stampInstructions = body.stampInstructions.map((item: string) => item.trim()).filter(Boolean);
      if (body.qrCode) updates.qrCode = body.qrCode.trim();
      if (body.xpReward !== undefined) updates.xpReward = body.xpReward;
      if (body.badgeIcon !== undefined) updates.badgeIcon = body.badgeIcon;
      if (body.badgeColor !== undefined) updates.badgeColor = body.badgeColor;
      if (body.contactPerson !== undefined) updates.contactPerson = body.contactPerson ? body.contactPerson.trim() : null;
      if (body.contactPhone !== undefined) updates.contactPhone = body.contactPhone ? body.contactPhone.trim() : null;
      if (body.instagram !== undefined) updates.instagram = body.instagram ? body.instagram.trim() : null;
      if (body.logoUrl !== undefined) {
        const logoError = validateOrmawaLogoDataUrl(body.logoUrl);
        if (logoError) {
          set.status = 400;
          return { success: false, error: { code: "INVALID_LOGO", message: logoError } };
        }
        updates.logoUrl = body.logoUrl ? body.logoUrl.trim() : null;
      }
      if (body.isActive !== undefined) updates.isActive = body.isActive;

      const [updated] = await db
        .update(ormawaBooths)
        .set(updates)
        .where(eq(ormawaBooths.id, params.id))
        .returning();

      if (!updated) {
        set.status = 404;
        return { success: false, error: { code: "NOT_FOUND", message: "Stan Ormawa tidak ditemukan" } };
      }

      broadcastAdminEvent("ORMAWA_BOOTH_UPDATED", {
        boothId: updated.id,
        name: updated.name,
      });

      return {
        success: true,
        message: `Stan '${updated.name}' berhasil diperbarui!`,
        data: updated,
      };
    },
    {
      use: requireAdmin,
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.Optional(t.String()),
        shortName: t.Optional(t.Nullable(t.String())),
        category: t.Optional(t.String()),
        floorId: t.Optional(t.Nullable(t.String())),
        boothNumber: t.Optional(t.Nullable(t.String())),
        tagline: t.Optional(t.Nullable(t.String())),
        description: t.Optional(t.Nullable(t.String())),
        activities: t.Optional(t.Array(t.String())),
        requirements: t.Optional(t.Array(t.String())),
        stampInstructions: t.Optional(t.Array(t.String())),
        qrCode: t.Optional(t.String()),
        xpReward: t.Optional(t.Number()),
        badgeIcon: t.Optional(t.Nullable(t.String())),
        badgeColor: t.Optional(t.Nullable(t.String())),
        contactPerson: t.Optional(t.Nullable(t.String())),
        contactPhone: t.Optional(t.Nullable(t.String())),
        instagram: t.Optional(t.Nullable(t.String())),
        logoUrl: t.Optional(t.Nullable(t.String())),
        isActive: t.Optional(t.Boolean()),
      }),
    }
  )

  // DELETE /api/ormawa/booths/:id — Admin hapus stan Ormawa
  .delete(
    "/booths/:id",
    async ({ params, set }) => {
      // Hapus riwayat scan terkait stan ini lebih dulu
      await db.delete(ormawaScans).where(eq(ormawaScans.boothId, params.id));

      const [deleted] = await db
        .delete(ormawaBooths)
        .where(eq(ormawaBooths.id, params.id))
        .returning({ id: ormawaBooths.id, name: ormawaBooths.name });

      if (!deleted) {
        set.status = 404;
        return { success: false, error: { code: "NOT_FOUND", message: "Stan Ormawa tidak ditemukan" } };
      }

      broadcastAdminEvent("ORMAWA_BOOTH_DELETED", { boothId: deleted.id });

      return {
        success: true,
        message: `Stan '${deleted.name}' berhasil dihapus.`,
        data: deleted,
      };
    },
    {
      use: requireAdmin,
      params: t.Object({ id: t.String() }),
    }
  )

  // POST /api/ormawa/booths/batch-delete — Admin hapus banyak stan Ormawa
  .post(
    "/booths/batch-delete",
    async ({ body, set }: any) => {
      const boothIds = body.boothIds;
      if (!boothIds || boothIds.length === 0) {
        set.status = 400;
        return { success: false, error: { code: "INVALID_INPUT", message: "Daftar ID stan tidak boleh kosong" } };
      }

      await db.delete(ormawaScans).where(inArray(ormawaScans.boothId, boothIds));
      const deleted = await db
        .delete(ormawaBooths)
        .where(inArray(ormawaBooths.id, boothIds))
        .returning({ id: ormawaBooths.id });

      broadcastAdminEvent("ORMAWA_BOOTH_DELETED", { boothIds });

      return {
        success: true,
        message: `${deleted.length} stan ormawa berhasil dihapus.`,
        data: { deletedCount: deleted.length },
      };
    },
    {
      use: requireAdmin,
      body: t.Object({
        boothIds: t.Array(t.String()),
      }),
    }
  )

  // POST /api/ormawa/booths/batch-status — Admin aktif/nonaktifkan banyak stan
  .post(
    "/booths/batch-status",
    async ({ body, set }: any) => {
      const { boothIds, isActive } = body;
      if (!boothIds || boothIds.length === 0) {
        set.status = 400;
        return { success: false, error: { code: "INVALID_INPUT", message: "Daftar ID stan tidak boleh kosong" } };
      }

      const updated = await db
        .update(ormawaBooths)
        .set({ isActive })
        .where(inArray(ormawaBooths.id, boothIds))
        .returning({ id: ormawaBooths.id });

      broadcastAdminEvent("ORMAWA_BOOTH_UPDATED", { boothIds, isActive });

      return {
        success: true,
        message: `${updated.length} stan ormawa berhasil ${isActive ? "diaktifkan" : "dinonaktifkan"}.`,
        data: { updatedCount: updated.length },
      };
    },
    {
      use: requireAdmin,
      body: t.Object({
        boothIds: t.Array(t.String()),
        isActive: t.Boolean(),
      }),
    }
  )

  // POST /api/ormawa/scan — Mahasiswa scan QR stan UKM (+XP)
  .post(
    "/scan",
    async ({ body, user, set }: any) => {
      const participantId = body.participantId || user?.userId;
      const qrCode = (body.qrCode || (body as any).qrToken || "").trim();

      if (!qrCode) {
        set.status = 400;
        return { success: false, error: { code: "MISSING_QR", message: "QR Code stan UKM wajib disertakan" } };
      }

      if (!participantId) {
        set.status = 400;
        return { success: false, error: { code: "MISSING_PARTICIPANT", message: "ID Peserta wajib disertakan" } };
      }

      // 1. Cari booth berdasarkan QR Code, code, atau id (fleksibel & case-insensitive)
      const isBoothUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(qrCode);
      const boothMatchConditions = [
        ilike(ormawaBooths.qrCode, qrCode),
        ilike(ormawaBooths.code, qrCode),
      ];
      if (isBoothUuid) {
        boothMatchConditions.push(eq(ormawaBooths.id, qrCode));
      }

      const [booth] = await db
        .select()
        .from(ormawaBooths)
        .where(
          and(
            eq(ormawaBooths.isActive, true),
            or(...boothMatchConditions)
          )
        )
        .limit(1);

      if (!booth) {
        set.status = 404;
        return {
          success: false,
          error: {
            code: "BOOTH_NOT_FOUND",
            message: "QR Code stan UKM tidak valid atau stan sedang tidak aktif.",
          },
        };
      }

      // 2. Cek apakah sudah pernah scan stan ini (anti-duplicate scan)
      const [existingScan] = await db
        .select()
        .from(ormawaScans)
        .where(and(eq(ormawaScans.participantId, participantId), eq(ormawaScans.boothId, booth.id)))
        .limit(1);

      if (existingScan) {
        set.status = 400;
        return {
          success: false,
          error: {
            code: "ALREADY_SCANNED",
            message: `Anda sudah pernah mengunjungi stan ${booth.name} sebelumnya!`,
          },
        };
      }

      // 3. Hitung kunjungan sebelumnya untuk informasi progres. Jumlah stan tidak dibatasi.
      const [scanCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(ormawaScans)
        .where(eq(ormawaScans.participantId, participantId));

      const previousScanCount = Number(scanCountResult?.count || 0);
      const xpEarned = booth.xpReward ?? ORMAWA_STAMP_XP;

      // 4. Cari regu mahasiswa untuk pembukuan scoreTransactions
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

      // 5. Catat log kunjungan
      const [newScan] = await db
        .insert(ormawaScans)
        .values({
          participantId,
          boothId: booth.id,
          xpEarned,
        })
        .returning();

      // 6. Injeksi transaksi skor jika berhak mendapatkan XP
      if (xpEarned > 0 && targetTeamId) {
        await db.insert(scoreTransactions).values({
          participantId,
          teamId: targetTeamId,
          amount: xpEarned,
          sourceType: "BONUS",
          sourceId: booth.id,
          reason: `Kunjungan Stan Ormawa: ${booth.name}`,
          createdBy: user?.userId || participantId,
        });

        broadcastLeaderboardUpdate({
          type: "ORMAWA_BOOTH_SCANNED",
          participantId,
          teamId: targetTeamId,
          boothName: booth.name,
          xpEarned,
        });
      }

      broadcastAdminEvent("ORMAWA_VISIT_RECORDED", {
        participantId,
        boothName: booth.name,
        totalVisited: previousScanCount + 1,
      });

      const message = `Selamat! Stamp ${booth.name} berhasil dicatat. Anda memperoleh +${xpEarned} XP Ormawa dan lencana stan!`;

      return {
        success: true,
        message,
        data: {
          scan: newScan,
          booth: {
            id: booth.id,
            name: booth.name,
            code: booth.code,
            category: booth.category,
          },
          xpEarned,
          totalScanned: previousScanCount + 1,
        },
      };
    },
    {
      detail: {
        summary: "Catat stamp kunjungan stan Ormawa",
        description: "Mencatat kunjungan stan ke profil digital, memberikan reward XP Ormawa, dan mencegah scan ganda.",
      },
      body: t.Object({
        participantId: t.Optional(t.String()),
        qrCode: t.Optional(t.String()),
        qrToken: t.Optional(t.String()),
      }),
    }
  )

  // GET /api/ormawa/progress/:participantId — Ringkasan XP Ormawa dan XP total
  .get(
    "/progress/:participantId",
    async ({ params }) => {
      const { participantId } = params;

      const visits = await db
        .select({
          id: ormawaScans.id,
          scannedAt: ormawaScans.scannedAt,
          xpEarned: ormawaScans.xpEarned,
          boothId: ormawaBooths.id,
          boothName: ormawaBooths.name,
          boothCode: ormawaBooths.code,
          category: ormawaBooths.category,
          boothNumber: ormawaBooths.boothNumber,
          instagram: ormawaBooths.instagram,
        })
        .from(ormawaScans)
        .innerJoin(ormawaBooths, eq(ormawaScans.boothId, ormawaBooths.id))
        .where(eq(ormawaScans.participantId, participantId))
        .orderBy(desc(ormawaScans.scannedAt));

      const [interestSummary] = await db
        .select({
          count: sql<number>`count(*)`,
          xp: sql<number>`COALESCE(SUM(${ormawaInterests.xpBonusEarned}), 0)`,
        })
        .from(ormawaInterests)
        .where(eq(ormawaInterests.participantId, participantId));

      const [scoreSummary] = await db
        .select({ total: sql<number>`COALESCE(SUM(${scoreTransactions.amount}), 0)` })
        .from(scoreTransactions)
        .where(eq(scoreTransactions.participantId, participantId));

      const stampXp = visits.reduce((acc, visit) => acc + Number(visit.xpEarned || 0), 0);
      const interestXp = Number(interestSummary?.xp || 0);

      return {
        success: true,
        data: {
          participantId,
          totalVisits: visits.length,
          totalInterests: Number(interestSummary?.count || 0),
          stampXp,
          interestXp,
          ormawaXp: stampXp + interestXp,
          totalXp: Number(scoreSummary?.total || 0),
          visits,
        },
      };
    },
    {
      detail: {
        summary: "Ringkasan progres Ormawa mahasiswa",
        description: "Menampilkan stamp kunjungan, lencana stan, XP Ormawa, dan XP total peserta.",
      },
      params: t.Object({
        participantId: t.String(),
      }),
    }
  )

  // GET /api/ormawa/my-interests/:participantId — Ambil daftar minat ormawa
  .get(
    "/my-interests/:participantId",
    async ({ params }) => {
      const { participantId } = params;
      const interests = await db
        .select({
          id: ormawaInterests.id,
          createdAt: ormawaInterests.createdAt,
          boothId: ormawaBooths.id,
          boothName: ormawaBooths.name,
          category: ormawaBooths.category,
        })
        .from(ormawaInterests)
        .innerJoin(ormawaBooths, eq(ormawaInterests.boothId, ormawaBooths.id))
        .where(eq(ormawaInterests.participantId, participantId))
        .orderBy(desc(ormawaInterests.createdAt));

      return {
        success: true,
        data: {
          participantId,
          totalInterests: interests.length,
          interests,
        },
      };
    },
    {
      detail: {
        summary: "Daftar minat stan UKM mahasiswa",
      },
      params: t.Object({
        participantId: t.String(),
      }),
    }
  )

  // POST /api/ormawa/scan-maba — PIC Ormawa atau Admin scan QR maba
  .post(
    "/scan-maba",
    async ({ body, user, set }: any) => {
      const { mabaNim, mabaQrToken, boothId } = body;

      const identifier = parseMabaQrIdentifier(mabaQrToken || mabaNim || "");
      if (!identifier) {
        set.status = 400;
        return { success: false, error: { code: "BAD_REQUEST", message: "mabaNim atau mabaQrToken diperlukan" } };
      }

      // 1. Cari maba berdasarkan NIM (username) atau ID peserta
      const isMabaUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      const userCondition = isMabaUuid
        ? or(eq(users.username, identifier), eq(users.id, identifier))
        : eq(users.username, identifier);

      const [maba] = await db
        .select()
        .from(users)
        .where(userCondition)
        .limit(1);

      if (!maba) {
        set.status = 404;
        return {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Mahasiswa dengan NIM / ID '${identifier}' tidak ditemukan di database.`,
          },
        };
      }

      if (maba.role !== "PARTICIPANT") {
        set.status = 400;
        return { success: false, error: { code: "INVALID_PARTICIPANT", message: "QR tersebut bukan milik mahasiswa baru" } };
      }

      // 2. Cari booth berdasarkan picUserId yang login atau boothId jika ADMIN
      let booth;
      if (user?.role === "ADMIN" && boothId) {
        const isBoothIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(boothId);
        const condition = isBoothIdUuid ? eq(ormawaBooths.id, boothId) : eq(ormawaBooths.code, boothId);
        const [found] = await db.select().from(ormawaBooths).where(condition).limit(1);
        booth = found;
      } else if (user?.role === "ADMIN") {
        const [found] = await db.select().from(ormawaBooths).where(eq(ormawaBooths.isActive, true)).limit(1);
        booth = found;
      } else {
        const [found] = await db.select().from(ormawaBooths).where(and(
          eq(ormawaBooths.picUserId, user?.userId!),
          eq(ormawaBooths.isActive, true),
        )).limit(1);
        booth = found;
      }

      if (!booth) {
        set.status = 403;
        return {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Akun Anda tidak terhubung dengan stan manapun. Hubungi Super Admin.",
          },
        };
      }

      // 3. Cek duplikat
      const [existingScan] = await db
        .select({ id: ormawaScans.id })
        .from(ormawaScans)
        .where(and(eq(ormawaScans.participantId, maba.id), eq(ormawaScans.boothId, booth.id)))
        .limit(1);

      if (existingScan) {
        set.status = 409;
        return {
          success: false,
          error: { code: "ALREADY_SCANNED", message: `Mahasiswa ${maba.fullName} sudah pernah mendapat stamp dari stan ini.` },
          data: { xpEarned: 0 },
        };
      }

      // 4. Hitung jumlah stamp sebelumnya; jumlah stan dapat berubah dan tidak dibatasi.
      const [scanCountRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(ormawaScans)
        .where(eq(ormawaScans.participantId, maba.id));
      
      const previousScanCount = Number(scanCountRow?.count || 0);
      const xpEarned = booth.xpReward ?? ORMAWA_STAMP_XP;

      // 5. Insert scan
      const [newScan] = await db.insert(ormawaScans).values({
        participantId: maba.id,
        boothId: booth.id,
        xpEarned,
      }).onConflictDoNothing().returning();

      if (!newScan) {
        set.status = 409;
        return {
          success: false,
          error: { code: "ALREADY_SCANNED", message: `Mahasiswa ${maba.fullName} sudah pernah mendapat stamp dari stan ini.` },
        };
      }

      // 6. Tambah transaksi score
      let targetTeamId = null;
      const [mabaMembership] = await db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.userId, maba.id))
        .limit(1);
      if (mabaMembership) targetTeamId = mabaMembership.teamId;

      if (xpEarned > 0 && targetTeamId) {
        await db.insert(scoreTransactions).values({
          participantId: maba.id,
          teamId: targetTeamId,
          amount: xpEarned,
          sourceType: "BONUS",
          sourceId: booth.id,
          reason: `Kunjungan Stan Ormawa: ${booth.name}`,
          createdBy: user?.userId,
        });
        broadcastLeaderboardUpdate({
          type: "ORMAWA_BOOTH_SCANNED",
          participantId: maba.id,
          teamId: targetTeamId,
          boothName: booth.name,
          xpEarned,
        });
      }

      broadcastAdminEvent("ORMAWA_VISIT_RECORDED", {
        participantId: maba.id,
        boothName: booth.name,
        totalVisited: previousScanCount + 1,
      });

      return {
        success: true,
        message: `Stamp ${maba.fullName} berhasil dicatat di ${booth.name}! +${xpEarned} XP Ormawa.`,
        data: {
          maba: {
            id: maba.id,
            fullName: maba.fullName,
            username: maba.username,
          },
          booth: {
            id: booth.id,
            name: booth.name,
            code: booth.code,
          },
          xpEarned,
          totalScanned: previousScanCount + 1,
        },
      };
    },
    {
      use: requireOrmawaOrAdmin,
      detail: { summary: "PIC Ormawa atau Admin scan QR maba" },
      body: t.Object({
        mabaNim: t.Optional(t.String()),
        mabaQrToken: t.Optional(t.String()),
        boothId: t.Optional(t.String()),
      }),
    }
  )

  // POST /api/ormawa/interest — Maba berminat gabung
  .post(
    "/interest",
    async ({ body, user, set }: any) => {
      const { boothId, phoneNumber, instagramUsername: rawInstagramUsername, motivation, experience } = body;
      const participantId = user?.userId!;
      const whatsappNumber = normalizeWhatsappNumber(phoneNumber);
      if (!whatsappNumber || whatsappNumber.length < 9 || whatsappNumber.length > 15) {
        set.status = 400;
        return { success: false, error: { code: "INVALID_PHONE", message: "Nomor WhatsApp tidak valid" } };
      }
      const instagramUsername = normalizeInstagramUsername(rawInstagramUsername);
      if (!instagramUsername) {
        set.status = 400;
        return { success: false, error: { code: "INVALID_INSTAGRAM", message: "Username Instagram tidak valid. Tulis tanpa tanda @." } };
      }

      // 1. Cek booth ada
      const [booth] = await db.select({ id: ormawaBooths.id, name: ormawaBooths.name }).from(ormawaBooths).where(eq(ormawaBooths.id, boothId)).limit(1);
      if (!booth) {
        set.status = 404;
        return { success: false, error: { code: "NOT_FOUND", message: "Stan tidak ditemukan" } };
      }

      // 2. Cek duplikat
      const [existingInterest] = await db.select({ id: ormawaInterests.id }).from(ormawaInterests)
        .where(and(eq(ormawaInterests.participantId, participantId), eq(ormawaInterests.boothId, boothId))).limit(1);
      if (existingInterest) {
        return { success: false, error: { code: "ALREADY_INTERESTED", message: "Anda sudah menyatakan minat pada ormawa ini." } };
      }

      // 3. Hitung minat sebelumnya untuk ringkasan; bonus diberikan per Ormawa yang unik.
      const [interestCountRow] = await db.select({ count: sql<number>`count(*)` }).from(ormawaInterests).where(eq(ormawaInterests.participantId, participantId));
      const previousCount = Number(interestCountRow?.count || 0);
      const xpBonusEarned = ORMAWA_INTEREST_XP;

      // 4. Insert
      const [newInterest] = await db.insert(ormawaInterests).values({
        participantId,
        boothId,
        phoneNumber: phoneNumber.trim(),
        instagramUsername,
        motivation,
        experience,
        xpBonusEarned,
      }).returning();

      // 5. Tambah XP bonus
      if (xpBonusEarned > 0) {
        const [mabaMembership] = await db.select({ teamId: teamMembers.teamId }).from(teamMembers).where(eq(teamMembers.userId, participantId)).limit(1);
        if (mabaMembership) {
          await db.insert(scoreTransactions).values({
            participantId,
            teamId: mabaMembership.teamId,
            amount: xpBonusEarned,
            sourceType: "BONUS",
            reason: `Pendaftaran Minat Ormawa: ${booth.name}`,
            createdBy: participantId,
          });
          broadcastLeaderboardUpdate({
            type: "ORMAWA_INTEREST_REGISTERED",
            participantId,
            teamId: mabaMembership.teamId,
            boothName: booth.name,
            xpEarned: xpBonusEarned,
          });
        }
      }

      return {
        success: true,
        message: `Minat bergabung ke ${booth.name} berhasil dicatat!`,
        data: { interest: newInterest, xpBonusEarned, totalInterests: previousCount + 1 },
      };
    },
    {
      use: requireUser,
      detail: { summary: "Maba menyatakan minat bergabung" },
      body: t.Object({
        boothId: t.String(),
        phoneNumber: t.String(),
        instagramUsername: t.String(),
        motivation: t.Optional(t.String()),
        experience: t.Optional(t.String()),
      }),
    }
  )

  // GET /api/ormawa/booths/:id/interests — Admin/PIC lihat pendaftar minat
  .get(
    "/booths/:id/interests",
    async ({ params, user, set }) => {
      const [booth] = await db.select({
        id: ormawaBooths.id,
        name: ormawaBooths.name,
        picUserId: ormawaBooths.picUserId,
      }).from(ormawaBooths).where(eq(ormawaBooths.id, params.id)).limit(1);

      if (!booth) {
        set.status = 404;
        return { success: false, error: { code: "NOT_FOUND", message: "Stan tidak ditemukan" } };
      }
      if (user?.role === "ORMAWA_PIC" && booth.picUserId !== user.userId) {
        set.status = 403;
        return { success: false, error: { code: "FORBIDDEN", message: "PIC hanya dapat melihat peminat stan miliknya" } };
      }

      const interests = await db
        .select({
          id: ormawaInterests.id,
          participantId: ormawaInterests.participantId,
          fullName: users.fullName,
          username: users.username,
          phoneNumber: ormawaInterests.phoneNumber,
          instagramUsername: ormawaInterests.instagramUsername,
          motivation: ormawaInterests.motivation,
          experience: ormawaInterests.experience,
          xpBonusEarned: ormawaInterests.xpBonusEarned,
          createdAt: ormawaInterests.createdAt,
        })
        .from(ormawaInterests)
        .innerJoin(users, eq(ormawaInterests.participantId, users.id))
        .where(eq(ormawaInterests.boothId, params.id))
        .orderBy(desc(ormawaInterests.createdAt));

      return {
        success: true,
        data: {
          boothId: params.id,
          boothName: booth.name,
          totalInterests: interests.length,
          interests: interests.map((interest) => {
            const number = normalizeWhatsappNumber(interest.phoneNumber);
            return {
              ...interest,
              whatsappNumber: number,
              whatsappUrl: number ? `https://wa.me/${number}` : null,
              instagramUrl: interest.instagramUsername ? `https://instagram.com/${interest.instagramUsername}` : null,
            };
          }),
        },
      };
    },
    {
      use: requireOrmawaOrAdmin,
      detail: { summary: "Daftar mahasiswa yang berminat pada stan" },
      params: t.Object({ id: t.String() }),
    }
  )

  // GET /api/ormawa/admin/stats — Rekap kunjungan stan UKM untuk panitia
  .get(
    "/admin/stats",
    async () => {
      const stats = await db
        .select({
          boothId: ormawaBooths.id,
          boothName: ormawaBooths.name,
          category: ormawaBooths.category,
          visitorCount: sql<number>`count(${ormawaScans.id})`,
        })
        .from(ormawaBooths)
        .leftJoin(ormawaScans, eq(ormawaBooths.id, ormawaScans.boothId))
        .groupBy(ormawaBooths.id, ormawaBooths.name, ormawaBooths.category)
        .orderBy(desc(sql`count(${ormawaScans.id})`));

      const [totalVisits] = await db
        .select({ total: sql<number>`count(*)` })
        .from(ormawaScans);

      return {
        success: true,
        data: {
          totalVisits: Number(totalVisits?.total || 0),
          booths: stats.map((s) => ({
            ...s,
            visitorCount: Number(s.visitorCount),
          })),
        },
      };
    },
    {
      detail: {
        summary: "Statistik popularitas stan UKM Expo panitia",
        description: "Menampilkan jumlah kunjungan maba ke masing-masing stan UKM untuk evaluasi panitia.",
      },
    }
  );
